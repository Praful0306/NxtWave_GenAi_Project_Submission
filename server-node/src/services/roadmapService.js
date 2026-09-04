const UserLanguage = require('../models/UserLanguage');
const Roadmap = require('../models/Roadmap');
const UserLanguageStats = require('../models/UserLanguageStats');
const { generateRoadmapFromAI } = require('../clients/aiServiceClient');

/**
 * Generate a new roadmap and enroll the user in the language.
 * Spec Section 3 #2 & Section 10 Phase 2.
 */
async function generateRoadmap(userId, { languageCode, level = 'Basic', goalDurationDays = 30 }) {
  if (!languageCode) {
    const error = new Error('languageCode is required');
    error.statusCode = 400;
    throw error;
  }

  const duration = parseInt(goalDurationDays, 10) || 30;

  // 1. Call server-ai internal generator
  const aiRoadmap = await generateRoadmapFromAI(languageCode, level, duration);

  // 2. Find or create UserLanguage enrollment
  let userLang = await UserLanguage.findOne({ userId, languageCode });
  if (userLang) {
    userLang.level = level;
    userLang.startLevel = level;
    userLang.goalDurationDays = duration;
    userLang.status = 'active';
    await userLang.save();
  } else {
    userLang = await UserLanguage.create({
      userId,
      languageCode,
      startLevel: level,
      level,
      goalDurationDays: duration,
      status: 'active',
    });
  }

  // 3. Ensure UserLanguageStats initialized
  await UserLanguageStats.findOneAndUpdate(
    { userId, languageCode },
    { $setOnInsert: { totalPracticeTimeMs: 0, totalSessionsCompleted: 0 } },
    { upsert: true }
  );

  // 4. Save or replace active Roadmap for this language
  let roadmap = await Roadmap.findOne({ userId, languageCode });
  if (roadmap) {
    roadmap.startLevel = level;
    roadmap.totalDays = duration;
    roadmap.generatedBy = aiRoadmap.generatedBy || 'sarvam-m';
    roadmap.weeks = aiRoadmap.weeks;
    roadmap.startedAt = new Date();
    await roadmap.save();
  } else {
    roadmap = await Roadmap.create({
      userId,
      languageCode,
      startLevel: level,
      totalDays: duration,
      generatedBy: aiRoadmap.generatedBy || 'sarvam-m',
      weeks: aiRoadmap.weeks,
      regenerationCount: 0,
    });
  }

  return {
    userLanguage: userLang,
    roadmap,
  };
}

/**
 * Get active roadmap for user and language.
 */
async function getRoadmap(userId, languageCode) {
  const roadmap = await Roadmap.findOne({ userId, languageCode });
  if (!roadmap) {
    const error = new Error(`No active roadmap found for language: ${languageCode}`);
    error.statusCode = 404;
    throw error;
  }

  const userLang = await UserLanguage.findOne({ userId, languageCode });

  return {
    userLanguage: userLang,
    roadmap,
  };
}

/**
 * Regenerate roadmap when user edits level or goal duration in Settings.
 * Spec Section 6.8:
 * - Does not wipe cumulative practice history or stats.
 * - Recalculates remaining days based on new goal.
 * - Increments regenerationCount.
 */
async function regenerateRoadmap(userId, languageCode, { newLevel, newGoalDurationDays }) {
  const userLang = await UserLanguage.findOne({ userId, languageCode });
  if (!userLang) {
    const error = new Error(`Language enrollment not found for ${languageCode}`);
    error.statusCode = 404;
    throw error;
  }

  const level = newLevel || userLang.level;
  const duration = parseInt(newGoalDurationDays, 10) || userLang.goalDurationDays;

  // Generate new roadmap from server-ai
  const aiRoadmap = await generateRoadmapFromAI(languageCode, level, duration);

  // Update UserLanguage
  userLang.level = level;
  userLang.goalDurationDays = duration;
  await userLang.save();

  // Update Roadmap record with incremented regenerationCount
  let roadmap = await Roadmap.findOne({ userId, languageCode });
  if (!roadmap) {
    roadmap = new Roadmap({ userId, languageCode });
  }

  roadmap.startLevel = level;
  roadmap.totalDays = duration;
  roadmap.generatedBy = aiRoadmap.generatedBy || 'sarvam-m';
  roadmap.weeks = aiRoadmap.weeks;
  roadmap.regenerationCount = (roadmap.regenerationCount || 0) + 1;
  await roadmap.save();

  return {
    message: 'Roadmap regenerated successfully',
    userLanguage: userLang,
    roadmap,
  };
}

module.exports = {
  generateRoadmap,
  getRoadmap,
  regenerateRoadmap,
};
