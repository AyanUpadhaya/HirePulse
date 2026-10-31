import Application from "../models/Application.js";
import ApplicantProfile from "../models/ApplicantProfile.js";
import Job from "../models/Job.js";
import Notification from "../models/Notification.js";
import { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "published" || (job.applicationDeadline && job.applicationDeadline < new Date())) {
    throw new ApiError(400, "This job is no longer accepting applications");
  }
  if (String(job.createdBy) === String(req.user._id)) throw new ApiError(400, "You cannot apply to your own job");
  if (await Application.exists({ job: job._id, applicant: req.user._id })) {
    throw new ApiError(409, "You have already applied to this job");
  }

  const profile = await ApplicantProfile.findOne({ user: req.user._id }).select("resume");
  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    company: job.company,
    coverLetter: req.body.coverLetter,
    resume: req.body.resume || profile?.resume?.toString(),
    statusHistory: [{ status: "submitted", changedBy: req.user._id }],
  });
  await Notification.create({
    recipient: job.createdBy,
    type: "application_submitted",
    title: "New job application",
    message: `${req.user.name} applied for ${job.title}.`,
    resourceType: "application",
    resourceId: application._id,
    deduplicationKey: `application:${application._id}:submitted`,
  });
  res.status(201).json({ success: true, data: application });
});

export const myApplications = asyncHandler(async (req, res) => {
  const items = await Application.find({ applicant: req.user._id })
    .sort("-submittedAt")
    .populate("job", "title company category location workMode employmentType status applicationDeadline")
    .populate("company", "name logo");
  res.json({ success: true, data: items });
});

export const jobApplications = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  if (req.user.role !== ROLES.ADMIN && String(job.createdBy) !== String(req.user._id)) {
    throw new ApiError(403, "Only the job owner or an admin can view applicants");
  }
  const items = await Application.find({ job: job._id })
    .sort("-submittedAt")
    .populate("applicant", "name email avatar");
  const profiles = await ApplicantProfile.find({ user: { $in: items.map(({ applicant }) => applicant._id) } })
    .select("-emailJobRecommendations");
  const profileByUser = new Map(profiles.map((profile) => [String(profile.user), profile]));
  res.json({
    success: true,
    data: items.map((item) => ({
      ...item.toObject(),
      applicantProfile: profileByUser.get(String(item.applicant._id)) || null,
    })),
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate("job", "createdBy title");
  if (!application) throw new ApiError(404, "Application not found");
  if (req.user.role !== ROLES.ADMIN && String(application.job.createdBy) !== String(req.user._id)) {
    throw new ApiError(403, "Only the job owner or an admin can update this application");
  }
  const nextStatus = req.body.status;
  if (["withdrawn", "submitted"].includes(nextStatus)) {
    throw new ApiError(400, "This status cannot be set by a recruiter");
  }
  if (["withdrawn", "hired", "rejected"].includes(application.status)) {
    throw new ApiError(409, "This application is already closed");
  }
  const allowedNext = {
    submitted: ["reviewing", "shortlisted", "rejected"],
    reviewing: ["shortlisted", "interviewing", "rejected"],
    shortlisted: ["interviewing", "offered", "rejected"],
    interviewing: ["offered", "rejected"],
    offered: ["hired", "rejected"],
  };
  if (!allowedNext[application.status]?.includes(nextStatus)) {
    throw new ApiError(400, `Cannot change application status from ${application.status} to ${nextStatus}`);
  }
  application.status = nextStatus;
  application.statusHistory.push({
    status: nextStatus,
    changedBy: req.user._id,
    note: req.body.note,
  });
  await application.save();
  await Notification.create({
    recipient: application.applicant,
    type: "application_status_changed",
    title: "Application status updated",
    message: `Your application for ${application.job.title} is now ${nextStatus}.`,
    resourceType: "application",
    resourceId: application._id,
    deduplicationKey: `application:${application._id}:status:${application.statusHistory.length}`,
  });
  res.json({ success: true, data: application });
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({ _id: req.params.id, applicant: req.user._id })
    .populate("job", "createdBy title");
  if (!application) throw new ApiError(404, "Application not found");
  if (["withdrawn", "hired", "rejected"].includes(application.status)) {
    throw new ApiError(409, "This application can no longer be withdrawn");
  }
  application.status = "withdrawn";
  application.withdrawnAt = new Date();
  application.statusHistory.push({ status: "withdrawn", changedBy: req.user._id });
  await application.save();
  await Notification.create({
    recipient: application.job.createdBy,
    type: "application_status_changed",
    title: "Application withdrawn",
    message: `${req.user.name} withdrew their application for ${application.job.title}.`,
    resourceType: "application",
    resourceId: application._id,
    deduplicationKey: `application:${application._id}:withdrawn`,
  });
  res.json({ success: true, data: application });
});
