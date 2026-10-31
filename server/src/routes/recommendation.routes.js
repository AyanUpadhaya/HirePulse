import { Router } from "express";
import {
  generateCandidateRecommendations,
  generateJobRecommendations,
  updateRecommendation,
} from "../controllers/recommendation.controller.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate, validateId } from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import { recommendationUpdateSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);
router.use(protect);

router.post("/jobs/generate", authorize(ROLES.APPLICANT), generateJobRecommendations);
router.post("/candidates/generate", authorize(ROLES.RECRUITER, ROLES.ADMIN), generateCandidateRecommendations);
router.patch("/:id", validate(recommendationUpdateSchema), updateRecommendation);

export default router;
