import mongoose from "mongoose";

const matchResultSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    breakdown: {
      requiredSkills: { type: Number, min: 0, max: 100, default: 0 },
      experience: { type: Number, min: 0, max: 100, default: 0 },
      locationAndWorkMode: { type: Number, min: 0, max: 100, default: 0 },
      salaryMin: { type: Number, min: 0, max: 100, default: 0 },
    },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    explanation: { type: String, maxlength: 2000 },
    algorithmVersion: { type: String, default: "v1" },
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

matchResultSchema.index({ job: 1, applicant: 1 }, { unique: true });
matchResultSchema.index({ job: 1, score: -1 });

export default mongoose.model("MatchResult", matchResultSchema);
