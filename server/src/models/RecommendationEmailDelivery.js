import mongoose from "mongoose";

const recommendationEmailDeliverySchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    digestDate: { type: String, required: true },
    status: { type: String, enum: ["sending", "sent", "failed"], required: true },
    claimToken: { type: String, required: true },
    lockedAt: { type: Date, required: true },
    sentAt: { type: Date, default: null },
    jobIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    error: { type: String, maxlength: 1000, default: null },
  },
  { timestamps: true },
);

recommendationEmailDeliverySchema.index({ recipient: 1, digestDate: 1 }, { unique: true });

export default mongoose.model("RecommendationEmailDelivery", recommendationEmailDeliverySchema);
