import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = Object.freeze({
  APPLICANT: "applicant",
  RECRUITER: "recruiter",
  ADMIN: "admin",
});

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: "applicant",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
      index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    lastLoginAt: { type: Date, default: null },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    isProfileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
