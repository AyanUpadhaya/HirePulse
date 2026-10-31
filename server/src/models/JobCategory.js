import mongoose from "mongoose";

const jobCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

jobCategorySchema.index({ slug: 1 }, { unique: true });
jobCategorySchema.index({ name: 1 });

export default mongoose.model("JobCategory", jobCategorySchema);
