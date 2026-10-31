import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { asyncHandler } from "./utils/asyncHandler.js";
import applicationRoutes from "./routes/application.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import communicationRoutes from "./routes/communication.routes.js";
import jobRoutes from "./routes/job.routes.js";
import jobCategoryRoutes from "./routes/jobCategory.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

if (env.trustProxy) app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
if (!env.isProd) app.use(morgan("dev"));

//home route
app.get("/", (_req, res) => {
  res.send("HirePulse Server is Running");
});

app.use("/api", apiLimiter);
app.use("/api", asyncHandler(async (_req, _res, next) => {
  await connectDB();
  next();
}));
app.get("/api/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok", database: "connected" } }),
);

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/job-categories", jobCategoryRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api", communicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
