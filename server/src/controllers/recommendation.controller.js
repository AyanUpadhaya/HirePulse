import ApplicantProfile from "../models/ApplicantProfile.js";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import MatchResult from "../models/MatchResult.js";
import Recommendation from "../models/Recommendation.js";
import { scoreApplicantJobMatch } from "../services/recommendationMatching.js";
import { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const saveMatch = async (profile, job, recipient, type, match) => {
  await MatchResult.findOneAndUpdate(
    { job: job._id, applicant: profile.user },
    { $set: { ...match, job: job._id, applicant: profile.user, calculatedAt: new Date() } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await Recommendation.findOneAndUpdate(
    { recipient, type, job: job._id, applicant: profile.user },
    {
      $set: { matchScore: match.score, reason: match.explanation, generatedAt: new Date() },
      $setOnInsert: { isViewed: false },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
};

export const generateJobRecommendations = asyncHandler(async (req, res) => {
  const profile = await ApplicantProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(400, "Complete your applicant profile to get job recommendations");
  const jobs = await Job.find({
    status: "published",
    $or: [{ applicationDeadline: null }, { applicationDeadline: { $exists: false } }, { applicationDeadline: { $gte: new Date() } }],
  }).limit(1000).populate("company", "name logo").populate("category", "name slug");
  const applications = await Application.find({ applicant: req.user._id }).select("job");
  const appliedJobIds = new Set(applications.map(({ job }) => String(job)));

  const scored = jobs
    .filter((job) => !appliedJobIds.has(String(job._id)))
    .map((job) => ({ job, match: scoreApplicantJobMatch(profile, job) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 100);
  await Promise.all(scored.map(({ job, match }) =>
    saveMatch(profile, job, req.user._id, "job_for_applicant", match)));
  const items = await Recommendation.find({
    recipient: req.user._id,
    type: "job_for_applicant",
    isDismissed: false,
    job: { $in: scored.map(({ job }) => job._id) },
  })
    .sort("-matchScore -generatedAt")
    .limit(50)
    .populate({
      path: "job",
      populate: [
        { path: "company", select: "name logo industry" },
        { path: "category", select: "name slug" },
      ],
    });
  res.json({ success: true, data: items });
});

export const generateCandidateRecommendations = asyncHandler(async (req, res) => {
  if (![ROLES.RECRUITER, ROLES.ADMIN].includes(req.user.role)) throw new ApiError(403, "Recruiters only");
  const jobFilter = req.user.role === ROLES.ADMIN ? { status: "published" } : { createdBy: req.user._id, status: "published" };
  const jobs = await Job.find(jobFilter).limit(100);
  const profiles = await ApplicantProfile.find({ isDiscoverable: true }).limit(500);
  const alreadyApplied = await Application.find({ job: { $in: jobs.map(({ _id }) => _id) } }).select("job applicant");
  const applied = new Set(alreadyApplied.map(({ job, applicant }) => `${job}:${applicant}`));
  const candidates = [];
  for (const job of jobs) {
    for (const profile of profiles) {
      if (applied.has(`${job._id}:${profile.user}`)) continue;
      const match = scoreApplicantJobMatch(profile, job);
      candidates.push({ job, profile, match });
    }
  }
  candidates.sort((a, b) => b.match.score - a.match.score);
  const top = candidates.slice(0, 200);
  await Promise.all(top.map(({ job, profile, match }) =>
    saveMatch(profile, job, req.user._id, "candidate_for_recruiter", match)));
  const items = await Recommendation.find({
    recipient: req.user._id,
    type: "candidate_for_recruiter",
    isDismissed: false,
    $or: top.map(({ job, profile }) => ({ job: job._id, applicant: profile.user })),
  })
    .sort("-matchScore -generatedAt")
    .limit(100)
    .populate({
      path: "job",
      select: "title company category location",
      populate: { path: "category", select: "name slug" },
    })
    .populate("applicant", "name avatar");
  res.json({ success: true, data: items });
});

export const updateRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await Recommendation.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!recommendation) throw new ApiError(404, "Recommendation not found");
  if (req.body.isViewed !== undefined) recommendation.isViewed = req.body.isViewed;
  if (req.body.isDismissed !== undefined) recommendation.isDismissed = req.body.isDismissed;
  await recommendation.save();
  res.json({ success: true, data: recommendation });
});
