import mongoose from "mongoose";

export const APPLICATION_STATUSES = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interviewing",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: { type: String, trim: true, maxlength: 1000 },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    resume: { type: String, trim: true },
    coverLetter: { type: String, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "submitted",
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    submittedAt: { type: Date, default: Date.now, index: true },
    withdrawnAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Prevent duplicate applications to the same job by the same applicant.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
