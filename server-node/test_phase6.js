/**
 * VaaniTutor — Phase 6 Rigorous Automated Test Suite
 * (Progress Analytics, UserLanguageStats Persistence, Adaptive Difficulty Engine & Multi-User Isolation)
 * Aligned strictly with Spec (6).md Sections 3, 5, 6.8, 7, 8.1, 9 and 10.
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const assert = require('assert');

const NODE_URL = 'http://127.0.0.1:5000';
const JWT_SECRET = 'vaanitutor-development-jwt-secret-key-32chars';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaanitutor';

// Import Models
const User = require('./src/models/User');
const UserLanguage = require('./src/models/UserLanguage');
const Roadmap = require('./src/models/Roadmap');
const DailySession = require('./src/models/DailySession');
const PracticeSession = require('./src/models/PracticeSession');
const UserLanguageStats = require('./src/models/UserLanguageStats');

async function setupTestUser(name, email, languageCode = 'kn-IN', startLevel = 'Basic') {
  const user = await User.create({
    name,
    email,
    passwordHash: 'dummy-hash',
    authProvider: 'email',
    emailVerified: true,
    isPremium: false,
    freeSessionsUsed: 0,
  });

  const token = jwt.sign(
    { userId: user._id.toString(), id: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const userLanguage = await UserLanguage.create({
    userId: user._id,
    languageCode,
    startLevel,
    level: startLevel,
    status: 'active',
    sessionsCount: 0,
    currentStreak: 0,
    longestStreak: 0,
  });


  // Create initial roadmap
  const weeks = [];
  let dayCounter = 1;
  for (let w = 1; w <= 4; w++) {
    const days = [];
    for (let d = 1; d <= 7; d++) {
      days.push({
        dayNumber: dayCounter,
        topic: `Day ${dayCounter} Practice`,
        targetPhrases: [`ನಮಸ್ಕಾರ ದಿನ ${dayCounter}`],
        grammarFocus: 'Basic Verb Agreement',
        promptText: `ನಮಸ್ಕಾರ ದಿನ ${dayCounter}`,
        translationEnglish: `Hello Day ${dayCounter}`,
        scenario: `Hotel scenario ${dayCounter}`,
        quiz: [
          {
            question: `Question for Day ${dayCounter}?`,
            options: [`ಆಯ್ಕೆ ${dayCounter}`, 'ಆಯ್ಕೆ ೨', 'ಆಯ್ಕೆ ೩', 'ಯಾವುದೂ ಅಲ್ಲ'],
            correctAnswerIndex: 0,
          },
        ],
        completedAt: null,
      });
      dayCounter++;
    }
    weeks.push({ weekNumber: w, theme: `Theme ${w}`, days });
  }

  const roadmap = await Roadmap.create({
    userId: user._id,
    languageCode,
    totalDays: 28,
    generatedBy: 'test-suite',
    weeks,
  });

  return { token, user, userLanguage, roadmap };
}

async function runPhase6TestSuite() {
  console.log('============================================================');
  console.log('    VAANITUTOR PHASE 6 RIGOROUS VERIFICATION SUITE         ');
  console.log(' (Progress Analytics, Stats Persistence, Adaptive Engine)  ');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function testAssert(condition, message) {
    total++;
    assert(condition, message);
    console.log(`✅ PASS: ${message}`);
    passed++;
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    // 0. Health checks
    const nodeHealth = await axios.get(`${NODE_URL}/api/health`);
    testAssert(nodeHealth.status === 200 && nodeHealth.data.status === 'ok', 'server-node /api/health is online');

    // ─── 1. Testing GET /api/progress/:languageCode & Initial Baseline ───
    console.log('\n--- 1. Testing GET /api/progress/:languageCode & Baseline State ---');
    const userA = await setupTestUser('Learner Alpha', `alpha-${Date.now()}@vaanitutor.test`, 'kn-IN', 'Basic');
    const authHeadersA = { Authorization: `Bearer ${userA.token}` };


    // 1a. Unauthorized access rejected
    try {
      await axios.get(`${NODE_URL}/api/progress/kn-IN`);
      testAssert(false, 'Expected 401 on missing JWT');
    } catch (e) {
      testAssert(e.response && e.response.status === 401, 'GET /api/progress strictly rejects missing JWT with 401 Unauthorized');
    }

    // 1b. Initial fetch for freshly created user language
    const initProgRes = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(initProgRes.status === 200 && initProgRes.data.success === true, 'GET /api/progress/kn-IN returns 200 OK');
    testAssert(initProgRes.data.data.stats.avgFluencyScore === 0, 'Initial avgFluencyScore is 0 before practice');
    testAssert(Array.isArray(initProgRes.data.data.fluencyTrend) && initProgRes.data.data.fluencyTrend.length === 0, 'Initial fluencyTrend array is empty');
    testAssert(initProgRes.data.data.language.level === 'Basic', 'Initial language level matches user level (Basic)');

    // ─── 2. Testing Practice Session Recording & UserLanguageStats Aggregation ───
    console.log('\n--- 2. Testing Practice Recording & UserLanguageStats Aggregation ---');

    // Simulate 3 practice sessions with known fluency scores and 6-type errors
    // Session 1: Fluency 70, Errors: grammar + vocabulary
    await axios.post(
      `${NODE_URL}/api/practice/session/kn-IN/speak-turn`,
      {
        targetSentence: 'ನಮಸ್ಕಾರ ದಿನ 1',
        userTranscript: 'ನಮಸ್ಕಾರ ದಿನ ಒಂದು',
        correctedText: 'ನಮಸ್ಕಾರ ದಿನ 1',
        aiReplyText: null,
        errors: [
          { type: 'grammar', original: 'ಒಂದು', corrected: '1', explanation: 'Use standard digit format' },
          { type: 'vocabulary', original: 'ದಿನ', corrected: 'ದಿನಾಂಕ', explanation: 'Appropriate word choice' },
        ],
        fluencyScore: 70,
        encouragement: 'Good start!',
        providerUsed: 'sarvam-saarika',
      },
      { headers: authHeadersA }
    );

    let progAfterS1 = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(progAfterS1.data.data.stats.avgFluencyScore === 70, 'Session 1: avgFluencyScore correctly set to 70');
    testAssert(progAfterS1.data.data.stats.errorTypeBreakdown.grammar === 1, 'Session 1: grammar error count = 1');
    testAssert(progAfterS1.data.data.stats.errorTypeBreakdown.vocabulary === 1, 'Session 1: vocabulary error count = 1');
    testAssert(progAfterS1.data.data.fluencyTrend.length === 1, 'Session 1: fluencyTrend has 1 data point');

    // Complete Day 1 session (Game -> Quiz) so we can proceed to Day 2
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed', timeTakenMs: 12000 }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // Session 2: Fluency 80, Errors: word_order
    await axios.post(
      `${NODE_URL}/api/practice/session/kn-IN/speak-turn`,
      {
        targetSentence: 'ನಮಸ್ಕಾರ ದಿನ 2',
        userTranscript: 'ದಿನ 2 ನಮಸ್ಕಾರ',
        correctedText: 'ನಮಸ್ಕಾರ ದಿನ 2',
        aiReplyText: null,
        errors: [
          { type: 'word_order', original: 'ದಿನ 2 ನಮಸ್ಕಾರ', corrected: 'ನಮಸ್ಕಾರ ದಿನ 2', explanation: 'Order greeting first' },
        ],
        fluencyScore: 80,
        encouragement: 'Much better phrasing!',
        providerUsed: 'sarvam-saarika',
      },
      { headers: authHeadersA }
    );

    let progAfterS2 = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(progAfterS2.data.data.stats.avgFluencyScore === 75, 'Session 2: avgFluencyScore updated to (70+80)/2 = 75.0');
    testAssert(progAfterS2.data.data.stats.errorTypeBreakdown.word_order === 1, 'Session 2: word_order error count = 1');
    testAssert(progAfterS2.data.data.fluencyTrend.length === 2, 'Session 2: fluencyTrend has 2 data points');

    // Complete Day 2 session (Game -> Quiz)
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed', timeTakenMs: 10000 }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // ─── 3. Testing Adaptive Difficulty Engine & Real UserLanguage.level Mutation ───
    console.log('\n--- 3. Testing Adaptive Difficulty Engine (Real Level Mutation) ---');

    // Upgrade to Premium to unlock 3rd and subsequent sessions (Spec Section 6.10)
    await User.findByIdAndUpdate(userA.user._id, { isPremium: true });

    // Upgrade test: User Alpha completes Session 3 with High Fluency (96)
    // Rolling 3-session average: (70 + 80 + 96) / 3 = 82.0 (below 85 threshold)
    await axios.post(
      `${NODE_URL}/api/practice/session/kn-IN/speak-turn`,
      {
        targetSentence: 'ನಮಸ್ಕಾರ ದಿನ 3',
        userTranscript: 'ನಮಸ್ಕಾರ ದಿನ ಮೂರು',
        correctedText: 'ನಮಸ್ಕಾರ ದಿನ 3',
        aiReplyText: null,
        errors: [],
        fluencyScore: 96,
        encouragement: 'Flawless execution!',
        providerUsed: 'sarvam-saarika',
      },
      { headers: authHeadersA }
    );

    let progAfterS3 = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(progAfterS3.data.data.stats.avgFluencyScore === 82, 'Session 3: cumulative avgFluencyScore = (70+80+96)/3 = 82.0');
    testAssert(progAfterS3.data.data.adaptiveStatus.rollingAvg === 82, 'Adaptive engine: rolling 3-session average = 82.0%');
    testAssert(progAfterS3.data.data.language.level === 'Basic', 'Adaptive threshold: 82.0 < 85, level remains Basic');

    // Complete Day 3 session
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed', timeTakenMs: 9000 }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // Session 4: User Alpha completes Session 4 with Fluency 95
    // Recent 3 sessions are: S2 (80), S3 (96), S4 (95) -> Rolling average = (80 + 96 + 95) / 3 = 90.3 >= 85
    await axios.post(
      `${NODE_URL}/api/practice/session/kn-IN/speak-turn`,
      {
        targetSentence: 'ನಮಸ್ಕಾರ ದಿನ 4',
        userTranscript: 'ನಮಸ್ಕಾರ ದಿನ ನಾಲ್ಕು',
        correctedText: 'ನಮಸ್ಕಾರ ದಿನ 4',
        aiReplyText: null,
        errors: [],
        fluencyScore: 95,
        encouragement: 'Outstanding consistency!',
        providerUsed: 'sarvam-saarika',
      },
      { headers: authHeadersA }
    );



    let progAfterS4 = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(progAfterS4.data.data.adaptiveStatus.rollingAvg === 90.3, 'Adaptive engine: rolling 3-session average = 90.3% (>= 85 threshold)');
    testAssert(progAfterS4.data.data.language.level === 'Intermediate', 'Adaptive mutation: UserLanguages.level actively upgraded from "Basic" to "Intermediate" in MongoDB');

    // Verify database document directly
    let directUserLang = await UserLanguage.findOne({ userId: userA.user._id, languageCode: 'kn-IN' });
    testAssert(directUserLang.level === 'Intermediate', 'Database verification: UserLanguage.level is persisted as "Intermediate"');

    // Complete Day 4 session
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed', timeTakenMs: 8000 }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // Session 5 (Window Divergence Verification): User Alpha completes Session 5 with Fluency 90
    // Total sessions: S1 (70), S2 (80), S3 (96), S4 (95), S5 (90)
    // Cumulative avgFluencyScore: (70 + 80 + 96 + 95 + 90) / 5 = 86.2%
    // True rolling window (last 3: S3=96, S4=95, S5=90): (96 + 95 + 90) / 3 = 93.7%
    await axios.post(
      `${NODE_URL}/api/practice/session/kn-IN/speak-turn`,
      {
        targetSentence: 'ನಮಸ್ಕಾರ ದಿನ 5',
        userTranscript: 'ನಮಸ್ಕಾರ ದಿನ ಐದು',
        correctedText: 'ನಮಸ್ಕಾರ ದಿನ 5',
        aiReplyText: null,
        errors: [],
        fluencyScore: 90,
        encouragement: 'Great job!',
        providerUsed: 'sarvam-saarika',
      },
      { headers: authHeadersA }
    );

    let progAfterS5 = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(progAfterS5.data.data.stats.avgFluencyScore === 86.2, 'Window Divergence: cumulative avgFluencyScore = (70+80+96+95+90)/5 = 86.2%');
    testAssert(progAfterS5.data.data.adaptiveStatus.rollingAvg === 93.7, 'Window Divergence: rolling 3-session window = (96+95+90)/3 = 93.7% (proves windowing diverges from cumulative)');

    // Complete Day 5 session
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed', timeTakenMs: 8000 }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // ─── 3b. Testing Adaptive Downgrade Path (<60%) & Floor Boundary Guard ───
    console.log('\n--- 3b. Testing Adaptive Downgrade Path (<60%) & Floor Boundary ---');

    // Simulate 3 consecutive low scores (S6=40, S7=45, S8=50)
    // S6: 40
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/speak-turn`, { targetSentence: 'ದಿನ 6', userTranscript: 'ತಪ್ಪು 6', correctedText: 'ದಿನ 6', errors: [{ type: 'grammar', original: 'ತಪ್ಪು 6', corrected: 'ದಿನ 6', explanation: 'Grammar issue' }], fluencyScore: 40 }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed' }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // S7: 45
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/speak-turn`, { targetSentence: 'ದಿನ 7', userTranscript: 'ತಪ್ಪು 7', correctedText: 'ದಿನ 7', errors: [{ type: 'vocabulary', original: 'ತಪ್ಪು 7', corrected: 'ದಿನ 7', explanation: 'Vocab issue' }], fluencyScore: 45 }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed' }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // S8: 50 -> Last 3 rolling window = (40 + 45 + 50) / 3 = 45.0% < 60% threshold
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/speak-turn`, { targetSentence: 'ದಿನ 8', userTranscript: 'ತಪ್ಪು 8', correctedText: 'ದಿನ 8', errors: [{ type: 'word_order', original: 'ತಪ್ಪು 8', corrected: 'ದಿನ 8', explanation: 'Word order issue' }], fluencyScore: 50 }, { headers: authHeadersA });

    let progAfterS8 = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(progAfterS8.data.data.adaptiveStatus.rollingAvg === 45, 'Adaptive Downgrade: rolling 3-session average = 45.0% (< 60 threshold)');
    testAssert(progAfterS8.data.data.language.level === 'Basic', 'Adaptive Downgrade: UserLanguages.level actively downgraded from "Intermediate" to "Basic" in MongoDB');

    directUserLang = await UserLanguage.findOne({ userId: userA.user._id, languageCode: 'kn-IN' });
    testAssert(directUserLang.level === 'Basic', 'Database verification: UserLanguage.level is downgraded and persisted as "Basic"');

    // Complete Day 8 session
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { result: 'passed' }, { headers: authHeadersA });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { answers: [{ questionIndex: 0, selectedAnswerIndex: 0, isCorrect: true }] }, { headers: authHeadersA });

    // S9: Floor Boundary Guard Test — User Alpha at Basic scores 35 (<60%)
    // Rolling avg = (45 + 50 + 35) / 3 = 43.3% < 60%
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/speak-turn`, { targetSentence: 'ದಿನ 9', userTranscript: 'ತಪ್ಪು 9', correctedText: 'ದಿನ 9', errors: [], fluencyScore: 35 }, { headers: authHeadersA });

    let progAfterS9 = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(progAfterS9.data.data.language.level === 'Basic', 'Floor Boundary Guard: User at "Basic" scoring < 60% strictly holds at "Basic" without underflow');
    directUserLang = await UserLanguage.findOne({ userId: userA.user._id, languageCode: 'kn-IN' });
    testAssert(directUserLang.level === 'Basic', 'Database verification: UserLanguage.level floor is strictly maintained as "Basic"');


    // ─── 4. Testing Roadmap Regeneration Invariance (Spec Section 6.8 & 7) ───
    console.log('\n--- 4. Testing Roadmap Regeneration Invariance (Stats Persistence) ---');

    // Regenerate Kannada roadmap for User Alpha (e.g. changing level or goal duration)
    const regenRes = await axios.post(
      `${NODE_URL}/api/roadmap/kn-IN/regenerate`,
      {
        newLevel: 'Intermediate',
        newGoalDurationDays: 30,
      },
      { headers: authHeadersA }
    );
    testAssert(regenRes.status === 200 && regenRes.data.roadmap, 'POST /api/roadmap/kn-IN/regenerate succeeded');


    // Fetch progress analytics post-regeneration
    const postRegenProg = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersA });
    testAssert(
      postRegenProg.data.data.stats.avgFluencyScore === 66.8,
      'Regeneration Invariance: UserLanguageStats avgFluencyScore survives regeneration completely intact (66.8%)'
    );
    testAssert(
      postRegenProg.data.data.stats.errorTypeBreakdown.grammar === 2 &&
      postRegenProg.data.data.stats.errorTypeBreakdown.vocabulary === 2 &&
      postRegenProg.data.data.stats.errorTypeBreakdown.word_order === 2,
      'Regeneration Invariance: errorTypeBreakdown counts survive roadmap regeneration intact (2 grammar, 2 vocab, 2 word_order)'
    );
    testAssert(
      postRegenProg.data.data.fluencyTrend.length === 9,
      'Regeneration Invariance: historical PracticeSessions fluencyTrend survives regeneration (9 sessions intact)'
    );


    // ─── 5. Testing Two-Account Strict Data Isolation ───
    console.log('\n--- 5. Testing Two-Account Strict Data Isolation ---');
    const userB = await setupTestUser('Learner Beta', `beta-${Date.now()}@vaanitutor.test`, 'kn-IN', 'Basic');
    const authHeadersB = { Authorization: `Bearer ${userB.token}` };

    const progB = await axios.get(`${NODE_URL}/api/progress/kn-IN`, { headers: authHeadersB });
    testAssert(progB.data.data.stats.avgFluencyScore === 0, 'Isolation: User B avgFluencyScore is strictly 0 (unpolluted by User A)');
    testAssert(progB.data.data.fluencyTrend.length === 0, 'Isolation: User B fluencyTrend is strictly empty (unpolluted by User A)');
    testAssert(progB.data.data.language.level === 'Basic', 'Isolation: User B level is Basic (unaffected by User A upgrading to Intermediate)');
    testAssert(
      progB.data.data.stats.errorTypeBreakdown.grammar === 0 &&
      progB.data.data.stats.errorTypeBreakdown.vocabulary === 0,
      'Isolation: User B error counts are strictly 0'
    );


    console.log('\n============================================================');
    console.log(`Summary: ${passed} / ${total} Phase 6 verification tests passed!`);
    console.log('============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Phase 6 Test Suite Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runPhase6TestSuite();
