import rateLimit from 'express-rate-limit';

const make = (windowMinutes, limit, message, extra = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
    ...extra,
  });

// Applied to every /api route
export const apiLimiter = make(15, 300, 'Too many requests, please try again later.');

// Login / register: brute-force protection (successful logins are not counted)
export const authLimiter = make(15, 10, 'Too many attempts, please try again in 15 minutes.', {
  skipSuccessfulRequests: true,
});

// Silent token refresh happens often, so it gets its own, looser bucket
export const refreshLimiter = make(15, 60, 'Too many refresh attempts.');

export const aiLimiter = make(15, 10, 'Too many AI requests, please try again in 15 minutes.');
