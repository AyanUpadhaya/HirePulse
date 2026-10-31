import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "application_submitted",
        "application_status_changed",
        "new_message",
        "job_recommendation",
        "candidate_recommendation",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    resourceType: { type: String, enum: ["job", "application", "conversation", "recommendation", "none"], default: "none" },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    deduplicationKey: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index(
  { recipient: 1, deduplicationKey: 1 },
  { unique: true, partialFilterExpression: { deduplicationKey: { $type: "string" } } }
);

export default mongoose.model("Notification", notificationSchema);
