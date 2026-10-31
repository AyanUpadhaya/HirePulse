import { Router } from "express";
import {
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "../controllers/company.controller.js";
import { authorize, protect } from "../middleware/auth.js";
import { ownerOrAdmin } from "../middleware/ownership.js";
import { validate, validateId } from "../middleware/validate.js";
import Company from "../models/Company.js";
import { ROLES } from "../models/User.js";
import { companySchema, companyUpdateSchema } from "../validators/index.js";

const router = Router();
router.param("id", validateId);

router.get("/", listCompanies);
router.post("/", protect, authorize(ROLES.RECRUITER, ROLES.ADMIN), validate(companySchema), createCompany);
router.get("/:id", getCompany);
router.patch("/:id", protect, ownerOrAdmin(Company, "createdBy"), validate(companyUpdateSchema), updateCompany);
router.delete("/:id", protect, ownerOrAdmin(Company, "createdBy"), deleteCompany);

export default router;
