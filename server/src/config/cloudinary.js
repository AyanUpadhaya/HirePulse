import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

export const getCloudinary = () => {
  if (!env.isCloudinaryConfigured) {
    throw new ApiError(503, "Resume uploads are not configured");
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  return cloudinary;
};
