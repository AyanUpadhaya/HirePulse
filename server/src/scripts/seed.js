import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import ApplicantProfile from "../models/ApplicantProfile.js";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import JobCategory from "../models/JobCategory.js";
import RecruiterProfile from "../models/RecruiterProfile.js";
import User from "../models/User.js";

await connectDB();

const jobCategories = [
  ["accounting-finance", "Accounting & Finance"],
  ["administration", "Administration"],
  ["architecture", "Architecture & Planning"],
  ["arts-design", "Arts, Design & Creative"],
  ["business-development", "Business Development"],
  ["customer-service", "Customer Service"],
  ["data-analytics", "Data & Analytics"],
  ["education", "Education & Training"],
  ["engineering", "Engineering"],
  ["environment-energy", "Environment & Energy"],
  ["human-resources", "Human Resources"],
  ["healthcare", "Healthcare & Medical"],
  ["hospitality-tourism", "Hospitality & Tourism"],
  ["legal", "Legal"],
  ["logistics-supply-chain", "Logistics & Supply Chain"],
  ["manufacturing", "Manufacturing"],
  ["marketing-communications", "Marketing & Communications"],
  ["media-content", "Media & Content"],
  ["nonprofit", "Nonprofit & Social Services"],
  ["operations", "Operations"],
  ["product-management", "Product Management"],
  ["project-management", "Project Management"],
  ["quality-assurance", "Quality Assurance"],
  ["real-estate", "Real Estate"],
  ["research-science", "Research & Science"],
  ["retail", "Retail"],
  ["sales", "Sales"],
  ["security", "Security"],
  ["software-development", "Software Development"],
  ["telecommunications", "Telecommunications"],
  ["transportation", "Transportation"],
  ["other", "Other"],
].map(([slug, name]) => ({
  slug: slug.trim(),
  name,
  description: `${name} job opportunities.`,
}));

await JobCategory.bulkWrite(
  jobCategories.map((category) => ({
    updateOne: {
      filter: { slug: category.slug },
      update: { $setOnInsert: category },
      upsert: true,
    },
  })),
);
const categoriesBySlug = new Map(
  (
    await JobCategory.find({
      slug: { $in: jobCategories.map(({ slug }) => slug) },
    })
  ).map((category) => [category.slug, category]),
);
await Job.updateMany(
  { category: null },
  { $set: { category: categoriesBySlug.get("other")._id } },
);

const upsertUser = async (data) => {
  const user = await User.findOne({ email: data.email });
  if (!user) return User.create(data);
  if (user.role === "client") {
    user.role = "recruiter";
    await user.save();
  }
  return user;
};

const admin = await upsertUser({
  name: "Admin",
  email: process.env.ADMIN_EMAIL || "admin@example.com",
  password: process.env.ADMIN_PASSWORD || "Admin12345",
  role: "admin",
});
const recruiter = await upsertUser({
  name: "Acme Recruiter",
  email: "client@example.com",
  password: "Client12345",
  role: "recruiter",
});
const applicant = await upsertUser({
  name: "Jane Applicant",
  email: "user@example.com",
  password: "User12345",
  role: "applicant",
});

let company = await Company.findOne({
  createdBy: recruiter._id,
  name: "Acme Corp",
});
if (!company)
  company = await Company.create({
    name: "Acme Corp",
    industry: "Technology",
    createdBy: recruiter._id,
  });
await RecruiterProfile.findOneAndUpdate(
  { user: recruiter._id },
  { $set: { company: company._id, onboardingCompleted: true } },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);
await ApplicantProfile.findOneAndUpdate(
  { user: applicant._id },
  {
    $setOnInsert: {
      headline: "Software Engineer",
      skills: ["react", "node.js", "mongodb"],
      location: "Remote",
    },
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

if (!(await Job.exists({ createdBy: recruiter._id }))) {
  await Job.create([
    {
      title: "Full-Stack Developer",
      description:
        "Build and maintain MERN applications for our customers. Great team, flexible hours.",
      company: company._id,
      category: categoriesBySlug.get("software-development")._id,
      createdBy: recruiter._id,
      location: "Remote",
      employmentType: "full_time",
      workMode: "remote",
      salaryMin: 60000,
      salaryMax: 80000,
      requiredSkills: ["React", "Node.js", "MongoDB"],
      status: "published",
      publishedAt: new Date(),
    },
    {
      title: "Junior Backend Engineer",
      description:
        "Work on REST APIs with Express and MongoDB. Mentorship provided.",
      company: company._id,
      category: categoriesBySlug.get("software-development")._id,
      createdBy: recruiter._id,
      location: "Dhaka",
      employmentType: "full_time",
      workMode: "onsite",
      requiredSkills: ["Express", "MongoDB"],
      status: "published",
      publishedAt: new Date(),
    },
  ]);
}

console.log(
  `Seeded. Admin: ${admin.email} | client@example.com / Client12345 | user@example.com / User12345`,
);
await mongoose.disconnect();
