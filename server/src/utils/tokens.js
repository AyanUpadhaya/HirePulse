import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.accessSecret, {
    expiresIn: env.accessExpires,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, env.refreshSecret, {
    expiresIn: `${env.refreshDays}d`,
  });

// Only a hash of the refresh token is stored in the DB
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
