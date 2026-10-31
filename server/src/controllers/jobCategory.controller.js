import Job from "../models/Job.js";
import JobCategory from "../models/JobCategory.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const slugify = (value) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export const listJobCategories = asyncHandler(async (req, res) => {
  const filter = req.user?.role === "admin" && req.query.includeInactive === "true"
    ? {}
    : { isActive: true };
  const categories = await JobCategory.find(filter).sort("name").lean();
  const counts = await Job.aggregate([
    {
      $match: {
        status: "published",
        category: { $in: categories.map(({ _id }) => _id) },
        $or: [
          { applicationDeadline: null },
          { applicationDeadline: { $exists: false } },
          { applicationDeadline: { $gte: new Date() } },
        ],
      },
    },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countByCategory = new Map(counts.map(({ _id, count }) => [String(_id), count]));
  res.json({
    success: true,
    data: categories.map((category) => ({
      ...category,
      publishedJobsCount: countByCategory.get(String(category._id)) || 0,
    })),
  });
});

export const getJobCategory = asyncHandler(async (req, res) => {
  const category = await JobCategory.findById(req.params.id);
  if (!category || (!category.isActive && req.user?.role !== "admin")) {
    throw new ApiError(404, "Job category not found");
  }
  res.json({ success: true, data: category });
});

export const createJobCategory = asyncHandler(async (req, res) => {
  const slug = req.body.slug || slugify(req.body.name);
  if (!slug) throw new ApiError(400, "Category name must contain letters or numbers");
  const category = await JobCategory.create({
    ...req.body,
    slug,
  });
  res.status(201).json({ success: true, data: category });
});

export const updateJobCategory = asyncHandler(async (req, res) => {
  const category = req.resource;
  const updates = { ...req.body };
  if (updates.name && !updates.slug) {
    updates.slug = slugify(updates.name);
    if (!updates.slug) throw new ApiError(400, "Category name must contain letters or numbers");
  }
  Object.assign(category, updates);
  await category.save();
  res.json({ success: true, data: category });
});

export const deleteJobCategory = asyncHandler(async (req, res) => {
  if (await Job.exists({ category: req.resource._id })) {
    throw new ApiError(409, "This category is assigned to jobs. Deactivate it instead.");
  }
  await req.resource.deleteOne();
  res.json({ success: true, data: null });
});
