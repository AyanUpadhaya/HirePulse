import { Router } from "express";
import {
  myApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "../controllers/application.controller.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate, validateId } from "../middleware/validate.js";
import { ROLES } from "../models/User.js";
import { applicationStatusSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);
router.use(protect);

router.get("/mine", authorize(ROLES.APPLICANT), myApplications);
router.patch("/:id/status", authorize(ROLES.RECRUITER, ROLES.ADMIN), validate(applicationStatusSchema), updateApplicationStatus);
router.post("/:id/withdraw", authorize(ROLES.APPLICANT), withdrawApplication);

export default router;
