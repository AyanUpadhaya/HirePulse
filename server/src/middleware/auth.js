import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
};

const authenticate = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.accessSecret);
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid token');
  }
  // Load fresh user so role changes / deletions take effect immediately
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') throw new ApiError(401, 'User is no longer active');
  return user;
};

export const protect = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  if (!token) throw new ApiError(401, 'Not authenticated');
  req.user = await authenticate(token);
  next();
});

// Attaches req.user when a valid token is present, otherwise continues anonymously
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  if (token) {
    try {
      req.user = await authenticate(token);
    } catch {
      /* treat as anonymous */
    }
  }
  next();
});

// Role-based access control: authorize('admin', 'client')
export const authorize =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'You do not have permission to do this'));
