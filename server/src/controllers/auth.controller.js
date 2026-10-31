import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/tokens.js';

const COOKIE_NAME = 'refreshToken';
const cookieBase = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: '/api/auth', // cookie is only sent to auth routes
};

const setRefreshCookie = (res, token) =>
  res.cookie(COOKIE_NAME, token, { ...cookieBase, maxAge: env.refreshDays * 24 * 60 * 60 * 1000 });
const clearRefreshCookie = (res) => res.clearCookie(COOKIE_NAME, cookieBase);

/**
 * Issues a new refresh token (stored hashed, max 5 sessions per user),
 * sets it as an httpOnly cookie and returns a fresh 20-minute access token.
 */
const createSession = async (res, user, keep = []) => {
  const refreshToken = signRefreshToken(user);
  const now = new Date();
  const sessions = keep
    .filter((t) => t.expiresAt > now)
    .map((t) => ({ tokenHash: t.tokenHash, expiresAt: t.expiresAt }))
    .slice(-4);
  sessions.push({
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + env.refreshDays * 24 * 60 * 60 * 1000),
  });
  user.refreshTokens = sessions;
  await user.save();
  setRefreshCookie(res, refreshToken);
  return signAccessToken(user);
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({ name, email, password, role });
  const accessToken = await createSession(res, user);
  res.status(201).json({ success: true, data: { user, accessToken } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshTokens');
  if (user && user.status !== "active") throw new ApiError(403, "This account is not active");
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  const accessToken = await createSession(res, user, user.refreshTokens);
  res.json({ success: true, data: { user, accessToken } });
});

// Refresh-token rotation: every refresh invalidates the old token and issues a new one.
// A token that is valid but no longer stored means it was reused -> revoke all sessions.
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) throw new ApiError(401, 'No refresh token');

  let payload;
  try {
    payload = jwt.verify(token, env.refreshSecret);
  } catch {
    clearRefreshCookie(res);
    throw new ApiError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(payload.sub).select('+refreshTokens');
  if (!user || user.status !== "active") {
    clearRefreshCookie(res);
    throw new ApiError(401, 'User no longer exists');
  }

  const hash = hashToken(token);
  if (!user.refreshTokens.some((t) => t.tokenHash === hash)) {
    user.refreshTokens = [];
    await user.save();
    clearRefreshCookie(res);
    throw new ApiError(401, 'Refresh token reuse detected, please log in again');
  }

  const remaining = user.refreshTokens.filter((t) => t.tokenHash !== hash);
  const accessToken = await createSession(res, user, remaining);
  res.json({ success: true, data: { user, accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const { sub } = jwt.verify(token, env.refreshSecret);
      await User.updateOne({ _id: sub }, { $pull: { refreshTokens: { tokenHash: hashToken(token) } } });
    } catch {
      /* token already invalid, nothing to revoke */
    }
  }
  clearRefreshCookie(res);
  res.json({ success: true, data: null });
});

export const me = (req, res) => res.json({ success: true, data: { user: req.user } });
