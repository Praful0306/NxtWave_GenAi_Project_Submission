const mongoose = require('mongoose');

const otpCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Bcrypt-hashed OTP — the raw 6-digit code is never stored
    codeHash: {
      type: String,
      required: true,
    },
    // 'signup' for email verification, 'password_reset' for forgot-password
    purpose: {
      type: String,
      enum: ['signup', 'password_reset'],
      required: true,
    },
    // Brute-force guard: max 5 attempts
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    // TTL-indexed: MongoDB automatically deletes expired documents
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ─── TTL index — MongoDB auto-deletes expired OTPs ───
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── Lookup index ───
otpCodeSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('OtpCode', otpCodeSchema);
