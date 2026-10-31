import { z } from "zod";

export const employmentTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

export const workModes = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export const jobStatuses = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(180, "Title cannot exceed 180 characters"),
    category: z.string().min(1, "Please select a category"),
    company: z.string().min(1, "Please select a company"),
    employmentType: z.enum(
      ["full_time", "part_time", "contract", "internship", "freelance"],
      { errorMap: () => ({ message: "Select an employment type" }) }
    ),
    workMode: z.enum(["onsite", "remote", "hybrid"], {
      errorMap: () => ({ message: "Select a work mode" }),
    }),
    location: z.string().trim().optional(),
    description: z.string().trim().min(10, "Job description must be at least 10 characters"),
    requiredSkills: z.array(z.string()).default([]),
    minExperienceYears: z.coerce.number().min(0, "Years cannot be negative").default(0),
    salaryMin: z.coerce.number().min(0, "Salary cannot be negative").optional(),
    salaryMax: z.coerce.number().min(0, "Salary cannot be negative").optional(),
    currency: z.string().trim().default("USD"),
    applicationDeadline: z.string().optional().nullable(),
    vacancies: z.coerce.number().min(1, "Vacancies must be at least 1").default(1),
    status: z.enum(["draft", "published", "paused", "closed", "archived"]).default("draft"),
    isAiGeneratedDescription: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.salaryMin != null && data.salaryMax != null) {
        return data.salaryMin <= data.salaryMax;
      }
      return true;
    },
    {
      message: "Minimum salary cannot exceed maximum salary",
      path: ["salaryMax"],
    }
  );

export const applyJobSchema = z.object({
  coverLetter: z.string().trim().max(3000, "Cover letter too long").optional(),
  resume: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

