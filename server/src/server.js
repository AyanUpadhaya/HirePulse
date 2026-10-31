import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { startRecommendationEmailScheduler } from './jobs/recommendationEmail.job.js';

connectDB()
  .then(() => {
    startRecommendationEmailScheduler();
    app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
