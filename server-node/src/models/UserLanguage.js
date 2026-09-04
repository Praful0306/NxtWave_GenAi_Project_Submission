const mongoose = require('mongoose');

const userLanguageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    languageCode: {
      type: String,
      required: true,
      trim: true,
      // e.g. 'kn-IN', 'hi-IN', 'en-IN', 'ta-IN', etc.
    },
    startLevel: {
      type: String,
      enum: ['Basic', 'Intermediate', 'Advanced'],
      required: true,
      default: 'Basic',
    },
    level: {
      type: String,
      enum: ['Basic', 'Intermediate', 'Advanced'],
      required: true,
      default: 'Basic',
    },
    goalDurationDays: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
      max: 365,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    sessionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPracticedAt: {
      type: Date,
      default: null,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    // The calendar date last credited (YYYY-MM-DD or Date)
    // Incremented when a DailySessions completes on a new calendar date since this value
    lastStreakDate: {
      type: String, // 'YYYY-MM-DD'
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — one active enrollment per user per language
userLanguageSchema.index({ userId: 1, languageCode: 1 }, { unique: true });

module.exports = mongoose.model('UserLanguage', userLanguageSchema);
