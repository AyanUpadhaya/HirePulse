import 'dotenv/config';

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';
const cookieSameSite = process.env.COOKIE_SAMESITE || 'lax';

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryResumeFolder: process.env.CLOUDINARY_RESUME_FOLDER || 'job-marketplace/resumes',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  emailFrom: process.env.EMAIL_FROM,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  openRouterApiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
  openRouterTimeoutMs: Math.min(
    Math.max(Number.parseInt(process.env.OPENROUTER_TIMEOUT_MS, 10) || 30000, 1000),
    120000,
  ),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  recommendationEmailCron: process.env.RECOMMENDATION_EMAIL_CRON || '0 0 * * *',
  appTimezone: process.env.APP_TIMEZONE || 'Asia/Dhaka',
  recommendationEmailMaxJobs: Math.min(
    Math.max(Number.parseInt(process.env.RECOMMENDATION_EMAIL_MAX_JOBS, 10) || 5, 1),
    10,
  ),
  recommendationEmailMinScore: Math.min(
    Math.max(Number.parseInt(process.env.RECOMMENDATION_EMAIL_MIN_SCORE, 10) || 40, 0),
    100,
  ),
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpires: process.env.ACCESS_TOKEN_EXPIRES || '20m',
  refreshDays: Number(process.env.REFRESH_TOKEN_DAYS) || 7,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  cookieSameSite,
  cookieSecure: isProd || cookieSameSite === 'none',
  trustProxy: process.env.TRUST_PROXY === 'true',
  isCloudinaryConfigured: Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
      && process.env.CLOUDINARY_API_KEY
      && process.env.CLOUDINARY_API_SECRET,
  ),
  isEmailConfigured: Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_USER
      && process.env.SMTP_PASSWORD
      && process.env.EMAIL_FROM,
  ),
  isOpenRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
};
