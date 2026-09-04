const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Nullable — only present for authProvider: 'email'.
    // OAuth accounts (google/zoho) have no password.
    passwordHash: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'zoho'],
      required: true,
      default: 'email',
    },
    // Nullable provider-specific IDs
    googleId: { type: String, default: null },
    zohoId: { type: String, default: null },

    emailVerified: {
      type: Boolean,
      default: false,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumSince: {
      type: Date,
      default: null,
    },
    freeSessionsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ─── Indexes ───
// email uniqueness is handled by the unique: true on the field
// Compound index for OAuth lookups
userSchema.index({ authProvider: 1, googleId: 1 }, { sparse: true });
userSchema.index({ authProvider: 1, zohoId: 1 }, { sparse: true });

// ─── Never return sensitive fields in JSON ───
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
