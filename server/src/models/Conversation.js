import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    type: { type: String, enum: ["direct", "job_related"], default: "direct" },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    lastMessageAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
