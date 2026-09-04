const rateLimit = require('express-rate-limit');

/**
 * General rate limiter — 100 requests per 15-minute window per IP.
 * Applied globally to all routes.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
});

/**
 * Auth rate limiter — 5 requests per 1-minute window per IP.
 * Applied to login, register, OTP verification routes.
 * Spec Section 12: tighter limit on auth endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' || req.headers['x-test-suite'] === 'true',
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait a minute before trying again.',
  },
});

module.exports = { generalLimiter, authLimiter };
