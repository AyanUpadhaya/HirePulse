import cron from "node-cron";
import crypto from "node:crypto";
import ApplicantProfile from "../models/ApplicantProfile.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import MatchResult from "../models/MatchResult.js";
import Recommendation from "../models/Recommendation.js";
import RecommendationEmailDelivery from "../models/RecommendationEmailDelivery.js";
import { ROLES } from "../models/User.js";
import { env } from "../config/env.js";
import { buildJobRecommendationsEmail } from "../templates/jobRecommendationsEmail.js";
import { sendEmail } from "../services/email.service.js";
import { scoreApplicantJobMatch } from "../services/recommendationMatching.js";

const getLocalDate = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const sendWithRetry = async (email) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await sendEmail(email);
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** attempt)));
    }
  }
  return undefined;
};

const claimDigest = async (recipient, digestDate, jobIds) => {
  const now = new Date();
  const staleLock = new Date(now.getTime() - 30 * 60 * 1000);
  const claimToken = crypto.randomUUID();
  const existing = await RecommendationEmailDelivery.findOne({ recipient, digestDate });

  if (!existing) {
    try {
      await RecommendationEmailDelivery.create({
        recipient,
        digestDate,
        status: "sending",
        claimToken,
        lockedAt: now,
        jobIds,
      });
      return claimToken;
    } catch (error) {
      if (error.code === 11000) return null;
      throw error;
    }
  }
  if (existing.status === "sent") return null;
  if (existing.status === "sending" && existing.lockedAt > staleLock) return null;

  const claimed = await RecommendationEmailDelivery.findOneAndUpdate(
    {
      _id: existing._id,
      $or: [
        { status: "failed" },
        { status: "sending", lockedAt: { $lte: staleLock } },
      ],
    },
    {
      $set: { status: "sending", claimToken, lockedAt: now, jobIds, error: null },
      $unset: { sentAt: 1 },
    },
    { new: true },
  );
  return claimed ? claimToken : null;
};

const sendApplicantDigest = async (profile, jobs, digestDate) => {
  const appliedJobIds = new Set(
    (await Application.distinct("job", { applicant: profile.user._id })).map(String),
  );
  const dismissedJobIds = new Set(
    (await Recommendation.distinct("job", {
      recipient: profile.user._id,
      type: "job_for_applicant",
      isDismissed: true,
      job: { $in: jobs.map(({ _id }) => _id) },
    })).map(String),
  );
  const matches = jobs
    .filter((job) => !appliedJobIds.has(String(job._id)))
    .filter((job) => !dismissedJobIds.has(String(job._id)))
    .map((job) => ({ job, match: scoreApplicantJobMatch(profile, job) }))
    .filter(({ match }) => match.score >= env.recommendationEmailMinScore)
    .sort((left, right) => right.match.score - left.match.score)
    .slice(0, env.recommendationEmailMaxJobs);

  if (!matches.length) return false;
  const claimToken = await claimDigest(profile.user._id, digestDate, matches.map(({ job }) => job._id));
  if (!claimToken) return false;

  try {
    await Promise.all(matches.map(({ job, match }) => Promise.all([
      MatchResult.findOneAndUpdate(
        { job: job._id, applicant: profile.user._id },
        { $set: { ...match, job: job._id, applicant: profile.user._id, calculatedAt: new Date() } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      ),
      Recommendation.findOneAndUpdate(
        {
          recipient: profile.user._id,
          type: "job_for_applicant",
          job: job._id,
          applicant: profile.user._id,
        },
        {
          $set: { matchScore: match.score, reason: match.explanation, generatedAt: new Date() },
          $setOnInsert: { isViewed: false, isDismissed: false },
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      ),
    ])));
    const email = buildJobRecommendationsEmail({
      applicantName: profile.user.name,
      jobs: matches,
      frontendUrl: env.frontendUrl,
    });
    await sendWithRetry({
      to: profile.user.email,
      ...email,
    });
    await RecommendationEmailDelivery.updateOne(
      { recipient: profile.user._id, digestDate, claimToken },
      { $set: { status: "sent", sentAt: new Date(), error: null } },
    );
    return true;
  } catch (error) {
    await RecommendationEmailDelivery.updateOne(
      { recipient: profile.user._id, digestDate, claimToken },
      { $set: { status: "failed", error: error.message.slice(0, 1000) } },
    );
    console.error(`Job recommendation email failed for applicant ${profile.user._id}:`, error);
    return false;
  }
};

export const runRecommendationEmailDigest = async (now = new Date()) => {
  if (!env.isEmailConfigured) {
    console.warn("Recommendation email digest skipped: SMTP is not configured.");
    return { sent: 0, skipped: 0 };
  }

  const publishedSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const jobs = await Job.find({
    status: "published",
    publishedAt: { $gte: publishedSince, $lte: now },
    $or: [
      { applicationDeadline: null },
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gte: now } },
    ],
  })
    .sort({ publishedAt: -1 })
    .limit(1000)
    .populate("company", "name")
    .populate("category", "name");
  if (!jobs.length) {
    console.info("Recommendation email digest: no recently published jobs.");
    return { sent: 0, skipped: 0 };
  }

  const profiles = await ApplicantProfile.find({ emailJobRecommendations: true })
    .populate({
      path: "user",
      match: { role: ROLES.APPLICANT, status: "active" },
      select: "name email role status",
    })
    .select("user skills experience preferredLocations preferredWorkModes expectedSalaryMin expectedSalaryMax expectedSalaryPeriod currency emailJobRecommendations");
  const digestDate = getLocalDate(now, env.appTimezone);
  let nextProfile = 0;
  let sent = 0;
  let skipped = 0;
  const worker = async () => {
    while (nextProfile < profiles.length) {
      const profile = profiles[nextProfile];
      nextProfile += 1;
      if (!profile.user?.email) {
        skipped += 1;
        continue;
      }
      if (await sendApplicantDigest(profile, jobs, digestDate)) sent += 1;
      else skipped += 1;
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, profiles.length) }, worker));
  console.info(`Recommendation email digest completed for ${digestDate}: sent ${sent}, skipped ${skipped}.`);
  return { sent, skipped };
};

export const startRecommendationEmailScheduler = () => {
  if (!env.isEmailConfigured) {
    console.warn("Recommendation email scheduler disabled: configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM.");
    return null;
  }
  if (!cron.validate(env.recommendationEmailCron)) {
    throw new Error(`Invalid RECOMMENDATION_EMAIL_CRON: ${env.recommendationEmailCron}`);
  }
  const task = cron.schedule(
    env.recommendationEmailCron,
    () => runRecommendationEmailDigest().catch((error) => {
      console.error("Recommendation email digest job failed:", error);
    }),
    { timezone: env.appTimezone },
  );
  console.info(`Recommendation email digest scheduled (${env.recommendationEmailCron}, ${env.appTimezone}).`);
  return task;
};
