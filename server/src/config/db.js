import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(env.mongoUri).then((connection) => {
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return connection;
  });
  try {
    return await connectionPromise;
  } finally {
    connectionPromise = null;
  }
};
