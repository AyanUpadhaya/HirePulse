//updated model

import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160, index: true },
    description: { type: String, trim: true, maxlength: 5000 },
    website: { type: String, trim: true },
    industry: { type: String, trim: true, index: true },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    },
    headquarters: { type: String, trim: true },
    logo: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
