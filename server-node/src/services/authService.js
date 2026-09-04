const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { generateAndSendOtp } = require('./otpService');

const BCRYPT_COST = 12;

/**
 * Register a new user with email + password.
 * Does NOT issue a JWT — the user must verify their email first.
 */
async function register(name, email, password) {
  // ─── Check if email already exists ───
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // ─── Hash password (bcrypt cost 12) ───
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  // ─── Create user (unverified) ───
  const user = await User.create({
    name,
    email,
    passwordHash,
    authProvider: 'email',
    emailVerified: false,
  });

  // ─── Send verification OTP ───
  await generateAndSendOtp(user._id, email, 'signup');

  return { userId: user._id, email: user.email };
}

/**
 * Log in with email + password.
 * Rejects if the email is unverified (must complete OTP flow first).
 */
async function login(email, password) {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // ─── Only email-auth accounts can log in with password ───
  if (user.authProvider !== 'email') {
    const error = new Error(
      `This account uses ${user.authProvider} sign-in. Please use the "${user.authProvider}" button.`
    );
    error.statusCode = 400;
    throw error;
  }

  // ─── Must be verified ───
  if (!user.emailVerified) {
    const error = new Error('Please verify your email before logging in');
    error.statusCode = 403;
    error.code = 'EMAIL_NOT_VERIFIED';
    throw error;
  }

  // ─── Check password ───
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // ─── Update last login ───
  user.lastLogin = new Date();
  await user.save();

  // ─── Issue JWT ───
  const token = issueJwt(user._id, user.email);

  return { token, user: user.toSafeJSON() };
}

/**
 * Issue a JWT with 7-day expiry.
 * server-node is the SOLE JWT issuer (spec Section 4).
 */
function issueJwt(userId, email) {
  return jwt.sign(
    { userId: userId.toString(), email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRY }
  );
}

/**
 * Get the current user's profile (safe — no passwordHash).
 */
async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeJSON();
}

/**
 * Update profile fields (name, themePreference).
 */
async function updateProfile(userId, updates) {
  const allowedFields = ['name', 'themePreference'];
  const safeUpdates = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      safeUpdates[key] = updates[key];
    }
  }

  const user = await User.findByIdAndUpdate(userId, safeUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user.toSafeJSON();
}

/**
 * Mark a user's email as verified (called after OTP verification).
 */
async function markEmailVerified(userId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { emailVerified: true },
    { new: true }
  );
  return user;
}

module.exports = {
  register,
  login,
  issueJwt,
  getProfile,
  updateProfile,
  markEmailVerified,
};
