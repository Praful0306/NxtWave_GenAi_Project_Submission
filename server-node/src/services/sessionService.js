const DailySession = require('../models/DailySession');
const PracticeSession = require('../models/PracticeSession');
const UserLanguage = require('../models/UserLanguage');
const UserLanguageStats = require('../models/UserLanguageStats');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');

/**
 * Format Date to YYYY-MM-DD string in UTC/local calendar day
 */
function getCalendarDateString(date = new Date()) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Check if dateA is the day before dateB
 */
function isConsecutiveDay(previousDateStr, currentDateStr) {
  if (!previousDateStr) return false;
  const prev = new Date(previousDateStr);
  const curr = new Date(currentDateStr);
  const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Get or initialize today's DailySession for a user and language.
 * Enforces free session cap: if !user.isPremium and freeSessionsUsed >= 2, throws 402 Payment Required.
 */
async function getOrCreateDailySession(userId, languageCode) {
  // 1. Fetch User and Roadmap
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const roadmap = await Roadmap.findOne({ userId, languageCode });
  if (!roadmap) {
    const error = new Error(`No roadmap found for language ${languageCode}`);
    error.status = 404;
    throw error;
  }

  // 2. Determine current unlocked day number
  let activeDay = null;
  let activeDayNumber = 1;

  for (const week of roadmap.weeks) {
    for (const day of week.days) {
      if (!day.completedAt) {
        activeDay = day;
        activeDayNumber = day.dayNumber;
        break;
      }
    }
    if (activeDay) break;
  }

  // If all days completed, fallback to the last day
  if (!activeDay) {
    const lastWeek = roadmap.weeks[roadmap.weeks.length - 1];
    activeDay = lastWeek.days[lastWeek.days.length - 1];
    activeDayNumber = activeDay.dayNumber;
  }

  // 3. Find existing DailySession for this day
  let dailySession = await DailySession.findOne({
    userId,
    languageCode,
    dayNumber: activeDayNumber,
  });

  if (!dailySession) {
    // Check free session cap on starting a new session (Spec Section 6.10)
    if (!user.isPremium && user.freeSessionsUsed >= 2) {
      const error = new Error('Free session limit reached (2 free sessions). Premium subscription required.');
      error.status = 402;
      error.code = 'PAYMENT_REQUIRED';
      throw error;
    }

    // Create new DailySession
    dailySession = new DailySession({
      userId,
      languageCode,
      dayNumber: activeDayNumber,
      status: 'in_progress',
      currentActivityIndex: 0,
      speakTurnIndex: 0,
    });
    await dailySession.save();

    // Increment freeSessionsUsed for non-premium user on new session creation
    if (!user.isPremium) {
      user.freeSessionsUsed += 1;
      await user.save();
    }
  }

  const maxTurns = user.isPremium ? 5 : 1;

  return {
    dailySession,
    roadmapDay: activeDay,
    currentActivityIndex: dailySession.currentActivityIndex,
    speakTurnIndex: dailySession.speakTurnIndex,
    maxTurns,
    isPremium: user.isPremium,
  };
}

/**
 * Record a Speak turn / exchange and update conversational state.
 * Spec Section 6.9b:
 * maxTurns = 1 for free tier, maxTurns = 5 for Premium.
 */
async function recordSpeakTurn(userId, languageCode, turnData) {
  const {
    targetSentence,
    userTranscript,
    correctedText,
    aiReplyText,
    errors = [],
    fluencyScore = 0,
    encouragement = '',
    providerUsed = 'unknown',
  } = turnData;

  const sessionInfo = await getOrCreateDailySession(userId, languageCode);
  const { dailySession, maxTurns } = sessionInfo;

  // Check turn cap gating
  if (dailySession.speakTurnIndex >= maxTurns) {
    const error = new Error(`Maximum turns reached for Speak activity (${maxTurns} turns).`);
    error.status = 400;
    throw error;
  }

  // Create PracticeSession record
  const practiceSession = new PracticeSession({
    userId,
    dailySessionId: dailySession._id,
    languageCode,
    dayNumber: dailySession.dayNumber,
    turnIndex: dailySession.speakTurnIndex,
    targetSentence,
    userTranscript,
    correctedText,
    aiReplyText,
    errors,
    fluencyScore,
    encouragement,
    providerUsed,
  });
  await practiceSession.save();

  // Update UserLanguageStats & evaluate adaptive difficulty
  try {
    const statsService = require('./statsService');
    const adaptiveService = require('./adaptiveService');
    await statsService.updateStatsAfterPractice(userId, languageCode, { fluencyScore, errors });
    await adaptiveService.evaluateAndApplyAdaptiveDifficulty(userId, languageCode);
  } catch (statsErr) {
    console.error('[sessionService] Stats update warning:', statsErr);
  }

  // Increment speakTurnIndex
  dailySession.speakTurnIndex += 1;

  // If reached maxTurns, advance currentActivityIndex to 1 (Game)
  if (dailySession.speakTurnIndex >= maxTurns) {
    dailySession.currentActivityIndex = 1;
  }
  await dailySession.save();

  return {
    practiceSession,
    dailySession,
    speakTurnIndex: dailySession.speakTurnIndex,
    currentActivityIndex: dailySession.currentActivityIndex,
    isSpeakComplete: dailySession.currentActivityIndex >= 1,
  };
}


/**
 * Record Word-Order Game result and advance to Quiz activity (Spec Section 6.9a).
 */
async function recordGameResult(userId, languageCode, gameData) {
  const { correct = true, attempts = 1, timeTakenSec = 0 } = gameData;
  const sessionInfo = await getOrCreateDailySession(userId, languageCode);
  const { dailySession } = sessionInfo;

  dailySession.gameResult = {
    completed: true,
    correct: Boolean(correct),
    attempts: Number(attempts) || 1,
    timeTakenSec: Number(timeTakenSec) || 0,
  };
  dailySession.currentActivityIndex = 2; // Advance to Quiz
  await dailySession.save();

  return {
    dailySession,
    currentActivityIndex: dailySession.currentActivityIndex,
  };
}

/**
 * Record Quiz result, complete DailySession, calculate streak, and unlock next roadmap day.
 */
async function recordQuizResult(userId, languageCode, quizData) {
  const { answers = [], score = 0, totalQuestions = 0 } = quizData;
  const sessionInfo = await getOrCreateDailySession(userId, languageCode);
  const { dailySession } = sessionInfo;

  dailySession.quizResult = {
    answers,
    score: Number(score) || 0,
    totalQuestions: Number(totalQuestions) || answers.length,
  };
  dailySession.currentActivityIndex = 3; // Completed
  dailySession.status = 'completed';
  dailySession.completedAt = new Date();
  await dailySession.save();

  // 1. Mark roadmap day as completed (unlocking sequential next day)
  const roadmap = await Roadmap.findOne({ userId, languageCode });
  if (roadmap) {
    for (const week of roadmap.weeks) {
      for (const day of week.days) {
        if (day.dayNumber === dailySession.dayNumber) {
          day.completedAt = new Date();
          break;
        }
      }
    }
    await roadmap.save();
  }

  // 2. Update UserLanguage streak and sessions count (Spec Section 7)
  const userLang = await UserLanguage.findOne({ userId, languageCode });
  if (userLang) {
    userLang.sessionsCount += 1;
    userLang.lastPracticedAt = new Date();

    const todayStr = getCalendarDateString();
    if (!userLang.lastStreakDate) {
      // First credited session
      userLang.currentStreak = 1;
      userLang.lastStreakDate = todayStr;
    } else if (userLang.lastStreakDate === todayStr) {
      // Already practiced today; keep current streak
    } else if (isConsecutiveDay(userLang.lastStreakDate, todayStr)) {
      // Consecutive day practice: increment streak
      userLang.currentStreak += 1;
      userLang.lastStreakDate = todayStr;
    } else {
      // Missed day: reset streak to 1
      userLang.currentStreak = 1;
      userLang.lastStreakDate = todayStr;
    }

    if (userLang.currentStreak > userLang.longestStreak) {
      userLang.longestStreak = userLang.currentStreak;
    }

    await userLang.save();
  }

  // 3. Update UserLanguageStats
  const stats = await UserLanguageStats.findOne({ userId, languageCode });
  if (stats) {
    stats.totalSessionsCompleted += 1;
    await stats.save();
  }

  return {
    dailySession,
    currentActivityIndex: dailySession.currentActivityIndex,
    status: dailySession.status,
    streak: userLang ? userLang.currentStreak : 1,
    longestStreak: userLang ? userLang.longestStreak : 1,
    completedAt: dailySession.completedAt,
  };
}

module.exports = {
  getOrCreateDailySession,
  recordSpeakTurn,
  recordGameResult,
  recordQuizResult,
};
