import { Router } from "express";
import {
  createJobCategory,
  deleteJobCategory,
  getJobCategory,
  listJobCategories,
  updateJobCategory,
} from "../controllers/jobCategory.controller.js";
import { authorize, optionalAuth, protect } from "../middleware/auth.js";
import { ownerOrAdmin } from "../middleware/ownership.js";
import { validate, validateId } from "../middleware/validate.js";
import JobCategory from "../models/JobCategory.js";
import { ROLES } from "../models/User.js";
import { jobCategorySchema, jobCategoryUpdateSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);

router.get("/", optionalAuth, listJobCategories);
router.get("/:id", optionalAuth, getJobCategory);
router.post("/", protect, authorize(ROLES.ADMIN), validate(jobCategorySchema), createJobCategory);
router.patch("/:id", protect, authorize(ROLES.ADMIN), ownerOrAdmin(JobCategory, "_id"), validate(jobCategoryUpdateSchema), updateJobCategory);
router.delete("/:id", protect, authorize(ROLES.ADMIN), ownerOrAdmin(JobCategory, "_id"), deleteJobCategory);

export default router;
