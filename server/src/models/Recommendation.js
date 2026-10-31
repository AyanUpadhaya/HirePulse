import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["job_for_applicant", "candidate_for_recruiter"],
      required: true,
      index: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchScore: { type: Number, min: 0, max: 100, required: true },
    reason: { type: String, maxlength: 1000 },
    generatedAt: { type: Date, default: Date.now },
    isViewed: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recommendationSchema.index({ recipient: 1, type: 1, generatedAt: -1 });
recommendationSchema.index({ recipient: 1, type: 1, job: 1, applicant: 1 }, { unique: true });

export default mongoose.model("Recommendation", recommendationSchema);
