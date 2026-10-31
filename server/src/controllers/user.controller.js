import User, { ROLES } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const filter = {};
  if (["applicant", "recruiter", "admin"].includes(req.query.role)) filter.role = req.query.role;
  if (["active", "suspended", "deleted"].includes(req.query.status)) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    User.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, total, page, pages: Math.ceil(total / limit) || 1 } });
});

export const updateUser = asyncHandler(async (req, res) => {
  const target = req.resource;
  const isAdmin = req.user.role === ROLES.ADMIN;
  const { currentPassword, ...updates } = req.body;
  if ((req.body.role !== undefined || req.body.status !== undefined) && !isAdmin) {
    throw new ApiError(403, "Only admins can change roles or account status");
  }
  if (String(target._id) === String(req.user._id)
    && (req.body.role !== undefined || req.body.status === "suspended" || req.body.status === "deleted")) {
    throw new ApiError(400, "You cannot change your own role or deactivate your account here");
  }
  if (updates.email && updates.email !== target.email) {
    if (!isAdmin) {
      const userWithPassword = await User.findById(target._id).select("+password");
      if (!userWithPassword || !currentPassword || !(await userWithPassword.comparePassword(currentPassword))) {
        throw new ApiError(401, "Current password is required to change your email");
      }
    }
    if (await User.exists({ email: updates.email, _id: { $ne: target._id } })) {
      throw new ApiError(409, "Email already in use");
    }
  }
  Object.assign(target, updates);
  if (target.status !== "active") target.refreshTokens = [];
  await target.save();
  res.json({ success: true, data: target });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const target = req.resource;
  if (String(target._id) === String(req.user._id)) {
    target.status = "deleted";
    target.refreshTokens = [];
    await target.save();
    return res.json({ success: true, data: null });
  }
  if (req.user.role !== ROLES.ADMIN) throw new ApiError(403, "Only admins can deactivate another user");
  target.status = "deleted";
  target.refreshTokens = [];
  await target.save();
  res.json({ success: true, data: null });
});
