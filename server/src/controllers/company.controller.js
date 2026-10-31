import Company from "../models/Company.js";
import Job from "../models/Job.js";
import RecruiterProfile from "../models/RecruiterProfile.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCompanies = asyncHandler(async (_req, res) => {
  const items = await Company.find().sort("name").select("name description website industry companySize headquarters logo");
  res.json({ success: true, data: items });
});

export const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create({ ...req.body, createdBy: req.user._id });
  await RecruiterProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { company: company._id } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.status(201).json({ success: true, data: company });
});

export const updateCompany = asyncHandler(async (req, res) => {
  Object.assign(req.resource, req.body);
  await req.resource.save();
  res.json({ success: true, data: req.resource });
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const company = req.resource;
  if (await Job.exists({ company: company._id })) {
    throw new ApiError(409, "Archive or remove this company's jobs before deleting it");
  }
  await RecruiterProfile.updateMany({ company: company._id }, { $set: { company: null } });
  await company.deleteOne();
  res.json({ success: true, data: null });
});

export const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id)
    .select("name description website industry companySize headquarters logo createdAt");
  if (!company) throw new ApiError(404, "Company not found");
  const jobs = await Job.find({ company: company._id, status: "published" })
    .sort("-publishedAt")
    .select("title location employmentType workMode publishedAt applicationDeadline");
  res.json({ success: true, data: { company, jobs } });
});
