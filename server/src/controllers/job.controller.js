import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import JobCategory from "../models/JobCategory.js";
import RecruiterProfile from "../models/RecruiterProfile.js";
import { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const queryString = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);
const pagination = (query, defaultLimit = 10) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || defaultLimit, 1), 50);
  return { page, limit };
};

export const listJobs = asyncHandler(async (req, res) => {
  const { page, limit } = pagination(req.query);
  const filter = {};
  const status = queryString(req.query.status);

  if (req.user?.role === ROLES.ADMIN && status && status !== "all") {
    filter.status = status;
  } else {
    filter.status = "published";
    filter.$and = [{
      $or: [
        { applicationDeadline: null },
        { applicationDeadline: { $exists: false } },
        { applicationDeadline: { $gte: new Date() } },
      ],
    }];
  }

  const employmentType = queryString(req.query.employmentType);
  const workMode = queryString(req.query.workMode);
  const location = queryString(req.query.location);
  const companyId = queryString(req.query.company);
  const categoryValue = queryString(req.query.category);
  const search = queryString(req.query.q);
  if (employmentType) filter.employmentType = employmentType;
  if (workMode) filter.workMode = workMode;
  if (location) filter.location = new RegExp(escapeRegex(location), "i");
  if (companyId) filter.company = companyId;
  if (categoryValue) {
    const category = await JobCategory.findOne({
      $or: [
        ...( /^[a-f\d]{24}$/i.test(categoryValue) ? [{ _id: categoryValue }] : []),
        { slug: categoryValue.toLowerCase() },
      ],
      isActive: true,
    }).select("_id");
    if (!category) {
      return res.json({ success: true, data: { items: [], total: 0, page, pages: 1 } });
    }
    filter.category = category._id;
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    const [matchingCompanies, matchingCategories] = await Promise.all([
      Company.find({ name: rx }).distinct("_id"),
      JobCategory.find({ name: rx, isActive: true }).distinct("_id"),
    ]);
    filter.$or = [
      { title: rx },
      { description: rx },
      { requiredSkills: rx },
      { company: { $in: matchingCompanies } },
      { category: { $in: matchingCategories } },
    ];
  }

  const [items, total] = await Promise.all([
    Job.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("company", "name logo industry headquarters")
      .populate("category", "name slug"),
    Job.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const myJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id })
    .sort("-createdAt")
    .populate("company", "name logo")
    .populate("category", "name slug");
  const counts = await Application.aggregate([
    { $match: { job: { $in: jobs.map((job) => job._id) } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
  ]);
  const countByJob = new Map(counts.map(({ _id, count }) => [String(_id), count]));
  res.json({
    success: true,
    data: jobs.map((job) => ({ ...job.toObject(), applicationsCount: countByJob.get(String(job._id)) || 0 })),
  });
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("company", "name description website industry companySize headquarters logo")
    .populate("category", "name slug description");
  if (!job) throw new ApiError(404, "Job not found");
  const canViewPrivate = req.user?.role === ROLES.ADMIN
    || String(job.createdBy) === String(req.user?._id);
  if ((job.status !== "published" || (job.applicationDeadline && job.applicationDeadline < new Date())) && !canViewPrivate) {
    throw new ApiError(404, "Job not found");
  }
  res.json({ success: true, data: job });
});

export const createJob = asyncHandler(async (req, res) => {
  const [company, category] = await Promise.all([
    Company.findById(req.body.company),
    JobCategory.findOne({ _id: req.body.category, isActive: true }),
  ]);
  if (!company) throw new ApiError(404, "Company not found");
  if (!category) throw new ApiError(400, "Select an active job category");
  if (req.user.role !== ROLES.ADMIN) {
    const profile = await RecruiterProfile.findOne({ user: req.user._id });
    if (!profile || (String(company.createdBy) !== String(req.user._id)
      && String(profile.company) !== String(company._id))) {
      throw new ApiError(403, "You can only create jobs for your company");
    }
  }

  const input = { ...req.body };
  if (input.salaryMin !== undefined && input.salaryMax !== undefined && input.salaryMin > input.salaryMax) {
    throw new ApiError(400, "Minimum salary cannot exceed maximum salary");
  }
  if (input.applicationDeadline && input.applicationDeadline <= new Date() && input.status === "published") {
    throw new ApiError(400, "A published job must have a future application deadline");
  }
  const now = new Date();
  const job = await Job.create({
    ...input,
    createdBy: req.user._id,
    publishedAt: input.status === "published" ? now : null,
  });
  res.status(201).json({ success: true, data: job });
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = req.resource;
  const updates = req.body;
  const wasPublished = job.status === "published";
  if (updates.company && String(updates.company) !== String(job.company)) {
    const company = await Company.findById(updates.company);
    if (!company) throw new ApiError(404, "Company not found");
    const profile = await RecruiterProfile.findOne({ user: req.user._id });
    if (req.user.role !== ROLES.ADMIN && String(company.createdBy) !== String(req.user._id)
      && String(profile?.company) !== String(company._id)) {
      throw new ApiError(403, "You can only assign jobs to your company");
    }
  }
  if (updates.category && String(updates.category) !== String(job.category)) {
    const category = await JobCategory.findOne({ _id: updates.category, isActive: true });
    if (!category) throw new ApiError(400, "Select an active job category");
  }
  const salaryMin = updates.salaryMin ?? job.salaryMin;
  const salaryMax = updates.salaryMax ?? job.salaryMax;
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
    throw new ApiError(400, "Minimum salary cannot exceed maximum salary");
  }
  const deadline = updates.applicationDeadline ?? job.applicationDeadline;
  if (updates.status === "published" && deadline && deadline <= new Date()) {
    throw new ApiError(400, "A published job must have a future application deadline");
  }

  Object.assign(job, updates);
  if (updates.status === "published" && !wasPublished) job.publishedAt = new Date();
  if (updates.status === "closed" || updates.status === "archived") job.closedAt = new Date();
  if (updates.status === "published" || updates.status === "paused" || updates.status === "draft") job.closedAt = null;
  await job.save();
  res.json({ success: true, data: job });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = req.resource;
  if (await Application.exists({ job: job._id })) {
    job.status = "archived";
    job.closedAt = new Date();
    await job.save();
    return res.json({ success: true, data: job });
  }
  await job.deleteOne();
  res.json({ success: true, data: null });
});
