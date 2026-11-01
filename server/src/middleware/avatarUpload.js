import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new ApiError(400, "Profile photo must be a JPEG, PNG, or WebP image"));
      return;
    }
    callback(null, true);
  },
});

export const uploadAvatarFile = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new ApiError(413, "Profile photo must be 5 MB or smaller"));
        return;
      }
      next(new ApiError(400, "Invalid profile photo upload"));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};
