import mongoose from "mongoose";

const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    jobTitle: { type: String, trim: true },
    phone: { type: String, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null, index: true },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("RecruiterProfile", recruiterProfileSchema);
