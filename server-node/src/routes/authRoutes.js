const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const authService = require('../services/authService');
const otpService = require('../services/otpService');
const oauthService = require('../services/oauthService');
const User = require('../models/User');
const config = require('../config/env');

const router = express.Router();

// ─── Helper: handle validation errors ───
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return null;
}

// ═══════════════════════════════════════════════
// EMAIL + PASSWORD + OTP FLOW
// ═══════════════════════════════════════════════

/**
 * POST /api/auth/register
 * Create account (unverified) + send OTP. Does NOT issue JWT.
 */
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (1–100 chars)'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const valErr = handleValidation(req, res);
    if (valErr) return;

    try {
      const result = await authService.register(req.body.name, req.body.email, req.body.password);
      res.status(201).json({
        message: 'Account created. Please check your email for the verification code.',
        userId: result.userId,
        email: result.email,
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Verify the 6-digit OTP → mark email as verified → issue JWT.
 */
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit code required'),
  ],
  async (req, res) => {
    const valErr = handleValidation(req, res);
    if (valErr) return;

    try {
      const { userId } = await otpService.verifyOtp(req.body.email, req.body.code, 'signup');

      // Mark email as verified
      await authService.markEmailVerified(userId);

      // Now issue JWT (registration didn't — spec Section 4)
      const user = await User.findById(userId);
      user.lastLogin = new Date();
      await user.save();

      const token = authService.issueJwt(user._id, user.email);

      res.json({
        message: 'Email verified successfully',
        token,
        user: user.toSafeJSON(),
      });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/auth/resend-otp
 * Regenerate + resend OTP (1/60s cooldown enforced by otpService).
 */
router.post(
  '/resend-otp',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const valErr = handleValidation(req, res);
    if (valErr) return;

    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      await otpService.generateAndSendOtp(user._id, user.email, 'signup');
      res.json({ message: 'Verification code resent. Check your email.' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/auth/login
 * Email + password login. Rejects unverified accounts.
 */
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const valErr = handleValidation(req, res);
    if (valErr) return;

    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({
        error: err.message,
        code: err.code || undefined,
      });
    }
  }
);

// ═══════════════════════════════════════════════
// GOOGLE OAUTH (Section 6.11 — end-user sign-in)
// ═══════════════════════════════════════════════

/**
 * GET /api/auth/google
 * Redirect to Google's OAuth consent screen.
 */
router.get('/google', (req, res) => {
  try {
    const url = oauthService.getGoogleAuthUrl();
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate Google sign-in' });
  }
});

/**
 * GET /api/auth/google/callback
 * Google redirects here with auth code → exchange → JWT → redirect to frontend.
 */
router.get('/google/callback', async (req, res) => {
  const { code, error: oauthError } = req.query;

  if (oauthError || !code) {
    return res.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
  }

  try {
    const { token } = await oauthService.handleGoogleCallback(code);
    res.redirect(`${config.FRONTEND_URL}/oauth-callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
  }
});

// ═══════════════════════════════════════════════
// ZOHO OAUTH (Section 6.11 — end-user sign-in,
// NOT Catalyst service credential 6.4a)
// ═══════════════════════════════════════════════

/**
 * GET /api/auth/zoho
 * Redirect to Zoho's OAuth consent screen.
 */
router.get('/zoho', (req, res) => {
  try {
    const url = oauthService.getZohoAuthUrl();
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate Zoho sign-in' });
  }
});

/**
 * GET /api/auth/zoho/callback
 * Zoho redirects here with auth code → exchange → JWT → redirect to frontend.
 */
router.get('/zoho/callback', async (req, res) => {
  const { code, error: oauthError } = req.query;

  if (oauthError || !code) {
    return res.redirect(`${config.FRONTEND_URL}/login?error=zoho_auth_failed`);
  }

  try {
    const { token } = await oauthService.handleZohoCallback(code);
    res.redirect(`${config.FRONTEND_URL}/oauth-callback?token=${token}`);
  } catch (err) {
    console.error('Zoho OAuth error:', err.message);
    res.redirect(`${config.FRONTEND_URL}/login?error=zoho_auth_failed`);
  }
});

// ═══════════════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════════════

/**
 * POST /api/auth/forgot-password
 * Send a password reset OTP.
 */
router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const valErr = handleValidation(req, res);
    if (valErr) return;

    try {
      const user = await User.findOne({ email: req.body.email, authProvider: 'email' });

      // Always respond 200 to prevent email enumeration
      if (!user) {
        return res.json({ message: 'If an account exists, a reset code has been sent.' });
      }

      await otpService.generateAndSendOtp(user._id, user.email, 'password_reset');
      res.json({ message: 'If an account exists, a reset code has been sent.' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Verify reset OTP → update password.
 */
router.post(
  '/reset-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req, res) => {
    const valErr = handleValidation(req, res);
    if (valErr) return;

    try {
      const { userId } = await otpService.verifyOtp(
        req.body.email,
        req.body.code,
        'password_reset'
      );

      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(req.body.newPassword, 12);

      await User.findByIdAndUpdate(userId, { passwordHash });

      res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════
// PROFILE (authenticated)
// ═══════════════════════════════════════════════

/**
 * GET /api/auth/me
 * Get current user's profile.
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.userId);
    res.json(profile);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * PATCH /api/auth/profile
 * Update profile fields (name, themePreference).
 */
router.patch(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('themePreference').optional().isIn(['light', 'dark', 'system']),
  ],
  async (req, res) => {
    const valErr = handleValidation(req, res);
    if (valErr) return;

    try {
      const profile = await authService.updateProfile(req.user.userId, req.body);
      res.json(profile);
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  }
);

module.exports = router;
