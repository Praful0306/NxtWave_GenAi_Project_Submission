const mongoose = require('mongoose');

const userLanguageStatsSchema = new mongoose.Schema(
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
    },
    avgFluencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    errorTypeBreakdown: {
      grammar: { type: Number, default: 0 },
      vocabulary: { type: Number, default: 0 },
      word_order: { type: Number, default: 0 },
      register: { type: Number, default: 0 },
      pronunciation_note: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userLanguageStatsSchema.index({ userId: 1, languageCode: 1 }, { unique: true });

module.exports = mongoose.model('UserLanguageStats', userLanguageStatsSchema);

