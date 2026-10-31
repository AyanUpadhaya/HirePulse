import ApplicantProfile from "../models/ApplicantProfile.js";
import Job from "../models/Job.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateJobDescription, generateJobMatchInsights } from "../services/openRouter.service.js";

const limitText = (value, maxLength) => (value ? value.slice(0, maxLength) : "");

export const createJobDescriptionDraft = asyncHandler(async (req, res) => {
  const result = await generateJobDescription(req.body);
  res.json({ success: true, data: result });
});

export const createJobMatchInsights = asyncHandler(async (req, res) => {
  const [profile, job] = await Promise.all([
    ApplicantProfile.findOne({ user: req.user._id })
      .select("headline summary location skills experience.title experience.description education.qualification education.fieldOfStudy")
      .lean(),
    Job.findOne({
      _id: req.body.jobId,
      status: "published",
      $or: [{ applicationDeadline: null }, { applicationDeadline: { $exists: false } }, { applicationDeadline: { $gte: new Date() } }],
    })
      .select("title description requiredSkills minExperienceYears employmentType workMode location")
      .lean(),
  ]);

  if (!profile) throw new ApiError(400, "Complete your applicant profile before requesting match insights");
  if (!job) throw new ApiError(404, "Job not found");

  const profileInput = {
    headline: limitText(profile.headline, 160),
    summary: limitText(profile.summary, 3000),
    location: limitText(profile.location, 160),
    skills: (profile.skills || []).slice(0, 50).map((skill) => limitText(skill, 60)),
    experience: (profile.experience || []).slice(0, 20).map((item) => ({
      title: limitText(item.title, 160),
      description: limitText(item.description, 1000),
    })),
    education: (profile.education || []).slice(0, 20).map((item) => ({
      qualification: limitText(item.qualification, 160),
      fieldOfStudy: limitText(item.fieldOfStudy, 160),
    })),
  };
  const hasProfileDetails = Boolean(
    profileInput.headline
      || profileInput.summary
      || profileInput.skills.length
      || profileInput.experience.some((item) => item.title || item.description)
      || profileInput.education.some((item) => item.qualification || item.fieldOfStudy),
  );
  if (!hasProfileDetails) {
    throw new ApiError(400, "Add profile details, skills, experience, or education before requesting match insights");
  }

  const jobInput = {
    title: limitText(job.title, 180),
    description: limitText(job.description, 10000),
    requiredSkills: (job.requiredSkills || []).slice(0, 50).map((skill) => limitText(skill, 60)),
    minExperienceYears: job.minExperienceYears,
    employmentType: job.employmentType,
    workMode: job.workMode,
    location: limitText(job.location, 160),
  };
  const result = await generateJobMatchInsights(profileInput, jobInput);
  res.json({
    success: true,
    data: {
      ...result,
      disclaimer: "AI-generated guidance may be inaccurate. Review it before using it in your application.",
    },
  });
});
