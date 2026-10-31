import { z } from "zod";
import { APPLICATION_STATUSES } from "../models/Application.js";
import { EMPLOYMENT_TYPES, JOB_STATUSES, WORK_MODES } from "../models/Job.js";
import { ROLES } from "../models/User.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password needs a letter")
  .regex(/[0-9]/, "Password needs a number");

const experienceSchema = z.object({
  company: z.string().trim().max(160).optional(),
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  current: z.boolean().optional(),
});

const educationSchema = z.object({
  institution: z.string().trim().max(160).optional(),
  qualification: z.string().trim().max(160).optional(),
  fieldOfStudy: z.string().trim().max(160).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().email(),
  password,
  role: z.enum([ROLES.APPLICANT, ROLES.RECRUITER]).default(ROLES.APPLICANT),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().length(64),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
}).refine((value) => value.currentPassword !== value.newPassword, {
  message: "New password must be different from the current password",
  path: ["newPassword"],
});

export const accountUpdateSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  avatar: z.string().trim().max(2000).url().nullable().optional(),
  currentPassword: z.string().min(1).optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "currentPassword"), {
  message: "Provide at least one account update",
});

export const jobSchema = z.object({
  company: objectId,
  category: objectId,
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(20000),
  requiredSkills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  minExperienceYears: z.number().min(0).max(80).default(0),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  location: z.string().trim().max(160).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  currency: z.string().trim().length(3).default("USD"),
  applicationDeadline: z.coerce.date().optional(),
  vacancies: z.number().int().min(1).max(10000).default(1),
  status: z.enum(JOB_STATUSES).default("draft"),
  isAiGeneratedDescription: z.boolean().default(false),
});
export const jobUpdateSchema = jobSchema.partial().extend({
  publishedAt: z.never().optional(),
  closedAt: z.never().optional(),
});

export const applySchema = z.object({
  coverLetter: z.string().trim().max(5000).optional().default(""),
  resume: z.string().trim().url().max(2000).optional(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
  note: z.string().trim().max(1000).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  avatar: z.string().trim().max(2000).nullable().optional(),
  currentPassword: z.string().min(1).optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
});

export const companySchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional(),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]).optional(),
  headquarters: z.string().trim().max(160).optional(),
  logo: z.string().trim().max(2000).nullable().optional(),
});
export const companyUpdateSchema = companySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one company update",
);

export const jobCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).optional(),
  description: z.string().trim().max(500).optional().default(""),
  isActive: z.boolean().optional().default(true),
});
export const jobCategoryUpdateSchema = jobCategorySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Provide at least one category update",
);

export const applicantProfileSchema = z.object({
  headline: z.string().trim().max(160).optional(),
  summary: z.string().trim().max(3000).optional(),
  location: z.string().trim().max(160).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(100).optional(),
  experience: z.array(experienceSchema).max(50).optional(),
  education: z.array(educationSchema).max(50).optional(),
  resume: z.string().trim().url().max(2000).nullable().optional(),
  preferredJobTitles: z.array(z.string().trim().max(160)).max(30).optional(),
  preferredLocations: z.array(z.string().trim().max(160)).max(30).optional(),
  preferredEmploymentTypes: z.array(z.enum(EMPLOYMENT_TYPES)).max(5).optional(),
  preferredWorkModes: z.array(z.enum(WORK_MODES)).max(3).optional(),
  expectedSalaryMin: z.number().min(0).optional(),
  expectedSalaryMax: z.number().min(0).optional(),
  currency: z.string().trim().length(3).optional(),
  isDiscoverable: z.boolean().optional(),
  emailJobRecommendations: z.boolean().optional(),
});

export const recruiterProfileSchema = z.object({
  jobTitle: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  company: objectId.nullable().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const messageSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

export const conversationSchema = z.object({
  recipient: objectId,
  job: objectId.optional(),
  application: objectId.optional(),
}).refine((value) => !(value.job && value.application), "Choose a job or an application, not both");

export const notificationReadSchema = z.object({ isRead: z.boolean().default(true) });

export const recommendationUpdateSchema = z.object({
  isViewed: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one recommendation update");

export const aiJobDescriptionSchema = z.object({
  title: z.string().trim().min(3).max(180),
  requiredSkills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  minExperienceYears: z.number().min(0).max(80).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  location: z.string().trim().max(160).optional(),
  additionalContext: z.string().trim().max(2000).optional(),
});

export const aiJobMatchSchema = z.object({
  jobId: objectId,
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required to send profile and job details for AI analysis" }),
  }),
});
