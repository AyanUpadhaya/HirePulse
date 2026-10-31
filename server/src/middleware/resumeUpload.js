import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf" || !file.originalname.toLowerCase().endsWith(".pdf")) {
      callback(new ApiError(400, "Resume must be a PDF file"));
      return;
    }
    callback(null, true);
  },
});

export const uploadResumeFile = (req, res, next) => {
  upload.single("resume")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new ApiError(413, "Resume file must be 5 MB or smaller"));
        return;
      }
      next(new ApiError(400, "Invalid resume upload"));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};
