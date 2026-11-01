import User, { ROLES } from "../models/User.js";
import { getCloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "node:crypto";
import { Readable } from "node:stream";

const getImageType = (buffer) => {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (
    buffer.length >= 12
    && buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP"
  ) return "webp";
  return null;
};

const uploadAvatar = (cloudinary, file, userId, format) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      resource_type: "image",
      folder: env.cloudinaryAvatarFolder,
      public_id: `${userId}/${crypto.randomUUID()}`,
      overwrite: false,
      allowed_formats: ["jpg", "png", "webp"],
      format,
      transformation: [{ width: 512, height: 512, crop: "limit" }],
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      if (!result?.secure_url || !result.public_id) {
        reject(new Error("Cloudinary returned no profile photo URL"));
        return;
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    },
  );
  Readable.from([file.buffer]).pipe(stream);
});

const removeCloudinaryAvatar = async (publicId) => {
  if (!publicId) return;
  if (!env.isCloudinaryConfigured) {
    console.warn("Could not remove Cloudinary profile photo: Cloudinary is not configured.");
    return;
  }
  try {
    await getCloudinary().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (error) {
    console.error("Failed to remove Cloudinary profile photo:", error);
  }
};

export const uploadUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Select a profile photo to upload");
  const format = getImageType(req.file.buffer);
  if (!format) throw new ApiError(400, "The uploaded file is not a valid JPEG, PNG, or WebP image");

  const cloudinary = getCloudinary();
  let uploaded;
  try {
    uploaded = await uploadAvatar(cloudinary, req.file, req.user._id, format);
  } catch (error) {
    console.error("Cloudinary profile photo upload failed:", error);
    throw new ApiError(502, "Profile photo upload failed. Please try again.");
  }

  let user;
  let previousPublicId;
  try {
    user = await User.findById(req.user._id).select("+avatarPublicId");
    if (!user) throw new ApiError(404, "User not found");
    previousPublicId = user.avatarPublicId;
    user.avatar = uploaded.url;
    user.avatarPublicId = uploaded.publicId;
    await user.save();
  } catch (error) {
    await removeCloudinaryAvatar(uploaded.publicId);
    throw error;
  }

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await removeCloudinaryAvatar(previousPublicId);
  }
  res.json({ success: true, data: { user } });
});

export const removeUserAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+avatarPublicId");
  if (!user) throw new ApiError(404, "User not found");
  const previousPublicId = user.avatarPublicId;
  user.avatar = null;
  user.avatarPublicId = undefined;
  await user.save();
  await removeCloudinaryAvatar(previousPublicId);
  res.json({ success: true, data: { user } });
});

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
  const updates = req.body;
  if ((req.body.role !== undefined || req.body.status !== undefined) && !isAdmin) {
    throw new ApiError(403, "Only admins can change roles or account status");
  }
  if (String(target._id) === String(req.user._id)
    && (req.body.role !== undefined || req.body.status === "suspended" || req.body.status === "deleted")) {
    throw new ApiError(400, "You cannot change your own role or deactivate your account here");
  }
  if (updates.email && updates.email !== target.email) {
    if (!isAdmin || String(target._id) === String(req.user._id)) {
      throw new ApiError(403, "Users cannot change their email address");
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
