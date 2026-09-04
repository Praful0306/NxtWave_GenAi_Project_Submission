/**
 * VaaniTutor — Statistics & Progress Service (server-node).
 * Spec Section 7, 8.1 & 10 (Phase 6).
 * Manages UserLanguageStats and dynamic fluency/error aggregations.
 */

const UserLanguageStats = require('../models/UserLanguageStats');
const PracticeSession = require('../models/PracticeSession');
const UserLanguage = require('../models/UserLanguage');

/**
 * Update UserLanguageStats after a practice evaluation is received.
 * @param {string|ObjectId} userId
 * @param {string} languageCode
 * @param {Object} assessment - Assessment result with { fluencyScore, errors }
 */
async function updateStatsAfterPractice(userId, languageCode, assessment) {
  if (!userId || !languageCode) return null;

  const fluency = typeof assessment?.fluencyScore === 'number' ? assessment.fluencyScore : null;
  const errors = Array.isArray(assessment?.errors) ? assessment.errors : [];

  let stats = await UserLanguageStats.findOne({ userId, languageCode });

  if (!stats) {
    stats = new UserLanguageStats({
      userId,
      languageCode,
      avgFluencyScore: fluency !== null ? fluency : 0,
      errorTypeBreakdown: {
        grammar: 0,
        vocabulary: 0,
        word_order: 0,
        register: 0,
        pronunciation_note: 0,
        other: 0,
      },
      lastUpdated: new Date(),
    });
  }

  // 1. Recalculate rolling average fluency across all practice sessions for accuracy
  if (fluency !== null) {
    const allSessions = await PracticeSession.find({ userId, languageCode }).select('fluencyScore');
    const validScores = allSessions.map((s) => s.fluencyScore).filter((s) => typeof s === 'number');
    if (validScores.length > 0) {
      const sum = validScores.reduce((acc, val) => acc + val, 0);
      stats.avgFluencyScore = Math.round((sum / validScores.length) * 10) / 10;
    } else {
      stats.avgFluencyScore = fluency;
    }
  }

  // 2. Increment matching error counts from the 6-type taxonomy
  errors.forEach((err) => {
    const errType = err.type || err.errorType;
    if (errType && stats.errorTypeBreakdown[errType] !== undefined) {
      stats.errorTypeBreakdown[errType] += 1;
    } else if (errType) {
      stats.errorTypeBreakdown.other += 1;
    }
  });

  stats.lastUpdated = new Date();
  await stats.save();

  return stats;
}

/**
 * Retrieve comprehensive progress and analytics data for a user language.
 * @param {string|ObjectId} userId
 * @param {string} languageCode
 */
async function getProgressData(userId, languageCode) {
  // 1. Fetch UserLanguage record for streak and current level
  const userLang = await UserLanguage.findOne({ userId, languageCode });
  if (!userLang) {
    return null;
  }

  // 2. Fetch UserLanguageStats (or create default if not yet practiced)
  let stats = await UserLanguageStats.findOne({ userId, languageCode });
  if (!stats) {
    stats = {
      avgFluencyScore: 0,
      errorTypeBreakdown: {
        grammar: 0,
        vocabulary: 0,
        word_order: 0,
        register: 0,
        pronunciation_note: 0,
        other: 0,
      },
      lastUpdated: new Date(),
    };
  }

  // 3. Compute dynamic fluency history / trend from PracticeSessions
  const practiceSessions = await PracticeSession.find({ userId, languageCode })
    .sort({ createdAt: 1 })
    .select('fluencyScore createdAt turnIndex promptText');

  const fluencyTrend = practiceSessions.map((ps, idx) => ({
    sessionIndex: idx + 1,
    date: ps.createdAt ? ps.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    fluencyScore: ps.fluencyScore || 0,
    turnIndex: ps.turnIndex || 0,
  }));

  return {
    stats: {
      avgFluencyScore: stats.avgFluencyScore,
      errorTypeBreakdown: stats.errorTypeBreakdown,
      lastUpdated: stats.lastUpdated,
    },
    fluencyTrend,
    language: {
      languageCode: userLang.languageCode,
      level: userLang.level,
      startLevel: userLang.startLevel,
      currentStreak: userLang.currentStreak || 0,
      longestStreak: userLang.longestStreak || 0,
      sessionsCount: userLang.sessionsCount || 0,
      lastPracticedAt: userLang.lastPracticedAt,
    },
  };
}

module.exports = {
  updateStatsAfterPractice,
  getProgressData,
};
