import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    institution: { type: String, trim: true },
    qualification: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startDate: Date,
    endDate: Date,
  },
  { _id: true }
);

const applicantProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    headline: { type: String, trim: true, maxlength: 160 },
    summary: { type: String, trim: true, maxlength: 3000 },
    location: { type: String, trim: true },
    skills: [{ type: String, trim: true, lowercase: true }],
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    resume: { type: String, trim: true, default: null },
    preferredJobTitles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    preferredEmploymentTypes: [{
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "freelance"],
    }],
    preferredWorkModes: [{ type: String, enum: ["onsite", "remote", "hybrid"] }],
    expectedSalaryMin: { type: Number, min: 0 },
    expectedSalaryMax: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: "USD" },
    isDiscoverable: { type: Boolean, default: true, index: true },
    emailJobRecommendations: { type: Boolean, default: false, index: true },
    profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

applicantProfileSchema.index({ skills: 1, location: 1 });

export default mongoose.model("ApplicantProfile", applicantProfileSchema);
