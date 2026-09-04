const bcrypt = require('bcryptjs');
const OtpCode = require('../models/OtpCode');
const { sendOtpEmail } = require('./emailService');

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

/**
 * Generate a 6-digit OTP, bcrypt-hash it, store in OtpCodes collection,
 * and send via email. Enforces 1/60s resend limit.
 *
 * @param {string} userId   - User._id
 * @param {string} email    - User's email
 * @param {string} purpose  - 'signup' | 'password_reset'
 */
async function generateAndSendOtp(userId, email, purpose) {
  // ─── Resend cooldown check ───
  const recent = await OtpCode.findOne({
    email,
    purpose,
    createdAt: { $gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
  });

  if (recent) {
    const waitSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000
    );
    const error = new Error(`Please wait ${waitSeconds} seconds before requesting a new code`);
    error.statusCode = 429;
    throw error;
  }

  // ─── Delete any existing OTPs for this email+purpose ───
  await OtpCode.deleteMany({ email, purpose });

  // ─── Generate 6-digit OTP ───
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  // ─── Hash before storage (raw code never touches the DB) ───
  const codeHash = await bcrypt.hash(otp, 10);

  // ─── Store ───
  await OtpCode.create({
    userId,
    email,
    codeHash,
    purpose,
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  // ─── Send email (non-blocking: failure doesn't prevent OTP storage) ───
  await sendOtpEmail(email, otp, purpose);

  return { sent: true };
}

/**
 * Verify a 6-digit OTP against the stored hash.
 * Enforces 5-attempt cap, deletes on success.
 *
 * @param {string} email   - User's email
 * @param {string} code    - The 6-digit code the user entered
 * @param {string} purpose - 'signup' | 'password_reset'
 * @returns {{ valid: boolean, userId: string }}
 */
async function verifyOtp(email, code, purpose) {
  const otpDoc = await OtpCode.findOne({
    email,
    purpose,
    expiresAt: { $gt: new Date() }, // not expired
  });

  if (!otpDoc) {
    const error = new Error('No valid OTP found. It may have expired — please request a new one.');
    error.statusCode = 400;
    throw error;
  }

  // ─── Attempt cap ───
  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await OtpCode.deleteOne({ _id: otpDoc._id });
    const error = new Error('Too many attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  // ─── Compare hash ───
  const isMatch = await bcrypt.compare(code, otpDoc.codeHash);

  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = MAX_ATTEMPTS - otpDoc.attempts;
    const error = new Error(
      `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    );
    error.statusCode = 400;
    throw error;
  }

  // ─── Success: delete the OTP document ───
  const userId = otpDoc.userId;
  await OtpCode.deleteOne({ _id: otpDoc._id });

  return { valid: true, userId };
}

module.exports = { generateAndSendOtp, verifyOtp };
