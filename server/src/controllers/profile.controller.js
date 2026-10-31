import ApplicantProfile from "../models/ApplicantProfile.js";
import Company from "../models/Company.js";
import RecruiterProfile from "../models/RecruiterProfile.js";
import User, { ROLES } from "../models/User.js";
import { getCloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "node:crypto";
import { Readable } from "node:stream";

const uploadResume = (cloudinary, file, userId) => new Promise((resolve, reject) => {
  const publicId = `${env.cloudinaryResumeFolder}/${userId}/${crypto.randomUUID()}.pdf`;
  const stream = cloudinary.uploader.upload_stream(
    { resource_type: "raw", public_id: publicId, overwrite: false },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      if (!result?.secure_url || !result.public_id) {
        reject(new Error("Cloudinary returned no resume URL"));
        return;
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    },
  );
  Readable.from([file.buffer]).pipe(stream);
});

const applicantCompletion = (profile) => {
  const checks = [
    Boolean(profile.headline),
    Boolean(profile.summary),
    Boolean(profile.location),
    profile.skills.length > 0,
    profile.experience.length > 0,
    profile.education.length > 0,
    Boolean(profile.resume),
    profile.preferredJobTitles.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

export const getMyProfile = asyncHandler(async (req, res) => {
  const Model = req.user.role === ROLES.APPLICANT ? ApplicantProfile : RecruiterProfile;
  const profile = await Model.findOne({ user: req.user._id }).populate(
    req.user.role === ROLES.RECRUITER ? "company" : "user",
    req.user.role === ROLES.RECRUITER ? "name logo industry website" : "name email avatar",
  );
  res.json({ success: true, data: profile });
});

export const updateApplicantProfile = asyncHandler(async (req, res) => {
  let profile = await ApplicantProfile.findOne({ user: req.user._id });
  if (!profile) profile = new ApplicantProfile({ user: req.user._id });
  Object.assign(profile, req.body);
  profile.profileCompletion = applicantCompletion(profile);
  await profile.save();
  await User.updateOne(
    { _id: req.user._id },
    { $set: { isProfileCompleted: profile.profileCompletion === 100 } },
  );
  res.json({ success: true, data: profile });
});

export const uploadApplicantResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Select a PDF resume to upload");
  if (req.file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new ApiError(400, "The uploaded file is not a valid PDF");
  }

  const cloudinary = getCloudinary();
  const uploaded = await uploadResume(cloudinary, req.file, req.user._id).catch((error) => {
    console.error("Cloudinary resume upload failed:", error);
    throw new ApiError(502, "Resume upload failed. Please try again.");
  });

  let profile = await ApplicantProfile.findOne({ user: req.user._id });
  if (!profile) profile = new ApplicantProfile({ user: req.user._id });
  profile.resume = uploaded.url;
  profile.profileCompletion = applicantCompletion(profile);
  try {
    await profile.save();
  } catch (error) {
    await cloudinary.uploader.destroy(uploaded.publicId, { resource_type: "raw" }).catch((cleanupError) => {
      console.error("Failed to remove unlinked Cloudinary resume:", cleanupError);
    });
    throw error;
  }
  await User.updateOne(
    { _id: req.user._id },
    { $set: { isProfileCompleted: profile.profileCompletion === 100 } },
  );
  res.status(201).json({ success: true, data: { resume: profile.resume, profile } });
});

export const updateRecruiterProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.company !== undefined && updates.company !== null) {
    const company = await Company.findById(updates.company);
    if (!company) throw new ApiError(404, "Company not found");
    if (String(company.createdBy) !== String(req.user._id)) {
      throw new ApiError(403, "You can only link your profile to a company you manage");
    }
  }
  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).populate("company", "name logo industry website");
  await User.updateOne(
    { _id: req.user._id },
    { $set: { isProfileCompleted: profile.onboardingCompleted } },
  );
  res.json({ success: true, data: profile });
});

export const getApplicantProfile = asyncHandler(async (req, res) => {
  const profile = await ApplicantProfile.findOne({ user: req.params.id, isDiscoverable: true })
    .select("user headline summary location skills experience education")
    .populate("user", "name avatar role status");
  if (!profile || profile.user?.role !== ROLES.APPLICANT || profile.user.status !== "active") {
    throw new ApiError(404, "Applicant profile not found");
  }
  res.json({
    success: true,
    data: {
      user: { _id: profile.user._id, name: profile.user.name, avatar: profile.user.avatar },
      headline: profile.headline,
      summary: profile.summary,
      location: profile.location,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
    },
  });
});
