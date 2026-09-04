const mongoose = require('mongoose');

const PracticeSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dailySessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailySession',
      index: true,
    },
    languageCode: {
      type: String,
      required: true,
      trim: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    turnIndex: {
      type: Number,
      default: 0,
    },
    targetSentence: {
      type: String,
      default: '',
    },
    userTranscript: {
      type: String,
      required: true,
    },
    correctedText: {
      type: String,
      default: '',
    },
    aiReplyText: {
      type: String,
      default: '',
    },
    errors: [
      {
        type: {
          type: String,
          enum: ['grammar', 'vocabulary', 'word_order', 'register', 'pronunciation_note', 'other'],
          required: true,
        },
        original: { type: String, required: true },
        corrected: { type: String, required: true },
        explanation: { type: String, required: true },
      },
    ],
    fluencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    encouragement: {
      type: String,
      default: '',
    },
    providerUsed: {
      type: String,
      default: 'unknown',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PracticeSession', PracticeSessionSchema);
