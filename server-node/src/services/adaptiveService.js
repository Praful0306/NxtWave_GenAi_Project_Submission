/**
 * VaaniTutor — Adaptive Difficulty Engine (server-node).
 * Spec Section 3 (#8), 6.8 & 10 (Phase 6).
 * Analyzes rolling fluency trends to dynamically adjust and persist UserLanguage.level.
 */

const UserLanguage = require('../models/UserLanguage');
const PracticeSession = require('../models/PracticeSession');

const LEVEL_HIERARCHY = ['Basic', 'Intermediate', 'Advanced'];

/**
 * Evaluate rolling fluency score across recent sessions and adjust UserLanguage.level in MongoDB.
 * @param {string|ObjectId} userId
 * @param {string} languageCode
 * @returns {Object} { levelChanged: boolean, previousLevel: string, newLevel: string, rollingAvg: number }
 */
async function evaluateAndApplyAdaptiveDifficulty(userId, languageCode) {
  if (!userId || !languageCode) return null;

  const userLang = await UserLanguage.findOne({ userId, languageCode });
  if (!userLang) return null;

  // 1. Fetch the last 3 practice sessions for this user/language
  const recentSessions = await PracticeSession.find({ userId, languageCode })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('fluencyScore');

  if (recentSessions.length < 3) {
    // Need at least 3 data points to establish a stable rolling trend
    return {
      levelChanged: false,
      currentLevel: userLang.level,
      rollingAvg: null,
      sessionsAnalyzed: recentSessions.length,
    };
  }

  const scores = recentSessions.map((s) => s.fluencyScore).filter((s) => typeof s === 'number');
  const rollingAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const roundedAvg = Math.round(rollingAvg * 10) / 10;

  const currentLevelIndex = LEVEL_HIERARCHY.findIndex(
    (lvl) => lvl.toLowerCase() === userLang.level.toLowerCase()
  );
  const effectiveIndex = currentLevelIndex === -1 ? 0 : currentLevelIndex;
  let newLevelIndex = effectiveIndex;

  // 2. High performance threshold: rolling average >= 85 -> step up level
  if (roundedAvg >= 85 && effectiveIndex < LEVEL_HIERARCHY.length - 1) {
    newLevelIndex = effectiveIndex + 1;
  }
  // 3. Struggle threshold: rolling average < 60 -> step down level to reinforce fundamentals
  else if (roundedAvg < 60 && effectiveIndex > 0) {
    newLevelIndex = effectiveIndex - 1;
  }

  const previousLevel = userLang.level;
  const newLevel = LEVEL_HIERARCHY[newLevelIndex];
  const levelChanged = previousLevel.toLowerCase() !== newLevel.toLowerCase();

  if (levelChanged) {
    userLang.level = newLevel;
    await userLang.save();
  }

  return {
    levelChanged,
    previousLevel,
    newLevel,
    rollingAvg: roundedAvg,
    sessionsAnalyzed: recentSessions.length,
  };
}

/**
 * Read-only evaluation of adaptive metrics and rolling stats.
 */
async function getAdaptiveStatus(userId, languageCode) {
  if (!userId || !languageCode) return null;

  const userLang = await UserLanguage.findOne({ userId, languageCode });
  if (!userLang) return null;

  const recentSessions = await PracticeSession.find({ userId, languageCode })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('fluencyScore');

  if (recentSessions.length < 3) {
    return {
      levelChanged: false,
      currentLevel: userLang.level,
      rollingAvg: null,
      sessionsAnalyzed: recentSessions.length,
    };
  }

  const scores = recentSessions.map((s) => s.fluencyScore).filter((s) => typeof s === 'number');
  const rollingAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const roundedAvg = Math.round(rollingAvg * 10) / 10;

  return {
    levelChanged: false,
    currentLevel: userLang.level,
    rollingAvg: roundedAvg,
    sessionsAnalyzed: recentSessions.length,
  };
}

module.exports = {
  evaluateAndApplyAdaptiveDifficulty,
  getAdaptiveStatus,
  LEVEL_HIERARCHY,
};

