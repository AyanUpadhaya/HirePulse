import { Router } from "express";
import { createJobDescriptionDraft, createJobMatchInsights } from "../controllers/ai.controller.js";
import { authorize, protect } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import { aiJobDescriptionSchema, aiJobMatchSchema } from "../validators/index.js";

const router = Router();

router.use(protect, aiLimiter);
router.post(
  "/job-description",
  authorize(ROLES.RECRUITER, ROLES.ADMIN),
  validate(aiJobDescriptionSchema),
  createJobDescriptionDraft,
);
router.post(
  "/job-match-insights",
  authorize(ROLES.APPLICANT),
  validate(aiJobMatchSchema),
  createJobMatchInsights,
);

export default router;
