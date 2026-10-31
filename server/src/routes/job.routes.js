import { Router } from "express";
import {
  applyToJob,
  jobApplications,
} from "../controllers/application.controller.js";
import {
  createJob,
  deleteJob,
  getJob,
  listJobs,
  myJobs,
  updateJob,
} from "../controllers/job.controller.js";
import { authorize, optionalAuth, protect } from "../middleware/auth.js";
import { ownerOrAdmin } from "../middleware/ownership.js";
import { validate, validateId } from "../middleware/validate.js";
import Job from "../models/Job.js";
import { ROLES } from "../models/User.js";
import { applySchema, jobSchema, jobUpdateSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);

router.get("/", optionalAuth, listJobs);
router.get("/mine", protect, authorize(ROLES.RECRUITER, ROLES.ADMIN), myJobs);
router.post("/", protect, authorize(ROLES.RECRUITER, ROLES.ADMIN), validate(jobSchema), createJob);
router.get("/:id", optionalAuth, getJob);
router.patch("/:id", protect, ownerOrAdmin(Job, "createdBy"), validate(jobUpdateSchema), updateJob);
router.delete("/:id", protect, ownerOrAdmin(Job, "createdBy"), deleteJob);
router.post("/:id/apply", protect, authorize(ROLES.APPLICANT), validate(applySchema), applyToJob);
router.post("/:id/applications", protect, authorize(ROLES.APPLICANT), validate(applySchema), applyToJob);
router.get("/:id/applications", protect, authorize(ROLES.RECRUITER, ROLES.ADMIN), jobApplications);

export default router;
