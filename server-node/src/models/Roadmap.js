const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true, min: 0, max: 5 },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    topic: { type: String, required: true },
    targetPhrases: [{ type: String, required: true }],
    grammarFocus: { type: String, default: '' },
    promptText: { type: String, required: true },
    translationEnglish: { type: String, default: '' },
    scenario: { type: String, default: '' },
    // Each day has a 2-4 question multiple choice quiz generated alongside the roadmap
    quiz: [quizQuestionSchema],
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

const weekSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true },
    theme: { type: String, required: true },
    days: [daySchema],
  },
  { _id: true }
);

const roadmapSchema = new mongoose.Schema(
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
    startLevel: {
      type: String,
      enum: ['Basic', 'Intermediate', 'Advanced'],
      required: true,
      default: 'Basic',
    },
    totalDays: {
      type: Number,
      required: true,
      default: 30,
    },
    generatedBy: {
      type: String,
      default: 'sarvam-m',
      // 'sarvam-m' | 'glm-4.7-flash' | 'gemini' | 'groq' | 'deterministic-fallback'
    },
    regenerationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    weeks: [weekSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for user language roadmap lookup
roadmapSchema.index({ userId: 1, languageCode: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
