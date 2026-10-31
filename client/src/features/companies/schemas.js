import { z } from "zod";

export const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

export const companySchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters"),
  description: z.string().trim().optional(),
  website: z
    .string()
    .trim()
    .url("Please enter a valid website URL")
    .optional()
    .or(z.literal("")),
  industry: z.string().trim().optional(),
  companySize: z.enum(
    ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    { errorMap: () => ({ message: "Select a company size" }) }
  ).optional(),
  headquarters: z.string().trim().optional(),
  logo: z
    .string()
    .trim()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
});

