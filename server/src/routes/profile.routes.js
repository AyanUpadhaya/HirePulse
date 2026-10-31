import { Router } from "express";
import {
  getApplicantProfile,
  getMyProfile,
  updateApplicantProfile,
  updateRecruiterProfile,
  uploadApplicantResume,
} from "../controllers/profile.controller.js";
import { authorize, protect } from "../middleware/auth.js";
import { uploadResumeFile } from "../middleware/resumeUpload.js";
import { validate, validateId } from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import { applicantProfileSchema, recruiterProfileSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);
router.use(protect);

router.get("/me", getMyProfile);
router.post("/applicant/resume", authorize(ROLES.APPLICANT), uploadResumeFile, uploadApplicantResume);
router.patch("/applicant", authorize(ROLES.APPLICANT), validate(applicantProfileSchema), updateApplicantProfile);
router.patch("/recruiter", authorize(ROLES.RECRUITER), validate(recruiterProfileSchema), updateRecruiterProfile);
router.get("/applicants/:id", authorize(ROLES.RECRUITER), getApplicantProfile);

export default router;
