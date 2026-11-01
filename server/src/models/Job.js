export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"];
export const WORK_MODES = ["onsite", "remote", "hybrid"];
export const SALARY_PERIODS = ["monthly", "yearly", "hourly"];
export const JOB_STATUSES = ["draft", "published", "paused", "closed", "archived"];

//updaated job model
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobCategory",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180, index: true },
    description: { type: String, required: true, trim: true, maxlength: 20000 },
    requiredSkills: [{ type: String, trim: true, lowercase: true }],
    minExperienceYears: { type: Number, min: 0, default: 0 },
    employmentType: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      required: true,
    },
    workMode: {
      type: String,
      enum: WORK_MODES,
      required: true,
    },
    location: { type: String, trim: true },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    salaryPeriod: { type: String, enum: SALARY_PERIODS, default: "monthly" },
    currency: { type: String, trim: true, uppercase: true, default: "USD" },
    applicationDeadline: { type: Date, index: true },
    vacancies: { type: Number, min: 1, default: 1 },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    isAiGeneratedDescription: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, publishedAt: -1 });
jobSchema.index({ requiredSkills: 1, workMode: 1, employmentType: 1 });

export default mongoose.model("Job", jobSchema);
