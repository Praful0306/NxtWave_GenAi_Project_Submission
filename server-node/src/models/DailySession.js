const mongoose = require('mongoose');

const DailySessionSchema = new mongoose.Schema(
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
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    // 0 = Speak, 1 = Game, 2 = Quiz, 3 = Completed
    currentActivityIndex: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    // Turn-level resume within Speak activity (Spec Section 6.9b)
    speakTurnIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    gameResult: {
      completed: { type: Boolean, default: false },
      correct: { type: Boolean, default: false },
      attempts: { type: Number, default: 0 },
      timeTakenSec: { type: Number, default: 0 },
    },
    quizResult: {
      answers: { type: Array, default: [] },
      score: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index guaranteeing one daily session per user/language/day
DailySessionSchema.index({ userId: 1, languageCode: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model('DailySession', DailySessionSchema);
