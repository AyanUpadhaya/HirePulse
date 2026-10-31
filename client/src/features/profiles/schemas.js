import { z } from "zod";

export const experienceItemSchema = z.object({
  company: z.string().trim().min(1, "Company is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional(),
  current: z.boolean().default(false),
});

export const educationItemSchema = z.object({
  institution: z.string().trim().min(1, "Institution is required"),
  qualification: z.string().trim().min(1, "Qualification is required"),
  fieldOfStudy: z.string().trim().min(1, "Field of study is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional(),
});

export const applicantProfileSchema = z.object({
  headline: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  location: z.string().trim().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  resume: z.string().url().optional().or(z.literal("")),
  preferredJobTitles: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  preferredEmploymentTypes: z.array(z.string()).default([]),
  preferredWorkModes: z.array(z.string()).default([]),
  expectedSalaryMin: z.coerce.number().min(0).optional(),
  expectedSalaryMax: z.coerce.number().min(0).optional(),
  currency: z.string().default("USD"),
  isDiscoverable: z.boolean().default(true),
  emailJobRecommendations: z.boolean().default(false),
});

export const recruiterProfileSchema = z.object({
  jobTitle: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  company: z.string().nullable().optional(),
  onboardingCompleted: z.boolean().default(false),
});

