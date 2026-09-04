/**
 * VaaniTutor — Phase 5 Rigorous Verification Test Suite
 * 
 * Spec Section 6.2, 6.3, 6.6, 6.7, 6.9a, 6.9b, 7, 10 & 12
 * 
 * Verifies:
 * 1. Official Sarvam Bulbul v3 WebSocket Streaming TTS (hi-IN & kn-IN) via POST /api/practice/speak.
 * 2. Spec Section 6.2 Matrix: English fallback to OpenAI vs Indic clean failure (no unauthorized substitution).
 * 3. 3-Activity Resumable Session Lifecycle (Speak -> Game -> Quiz) with zero-button reload resume.
 * 4. Conversational AI Tutor turn-cap gating (Free maxTurns=1 vs Premium maxTurns=5).
 * 5. Turn-Level Resume (reloading on turn 3 lands on turn 3).
 * 6. Daily Streak calculation (increment on consecutive day, reset on missed day).
 * 7. Sequential Roadmap Day Unlock gated on 3-activity completion.
 * 8. Two-Account Strict Data Isolation.
 */

const axios = require('axios');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');
const OtpCode = require('./src/models/OtpCode');
const UserLanguage = require('./src/models/UserLanguage');
const Roadmap = require('./src/models/Roadmap');
const DailySession = require('./src/models/DailySession');
const PracticeSession = require('./src/models/PracticeSession');
const jwt = require('jsonwebtoken');
const config = require('./src/config/env');

const NODE_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:8000';

async function registerAndVerifyUser(name, email, password, isPremium = false) {
  await User.deleteOne({ email });
  await OtpCode.deleteMany({ email });

  const user = await User.create({
    name,
    email,
    passwordHash: 'hashed_pw',
    authProvider: 'email',
    emailVerified: true,
    isPremium: Boolean(isPremium),
    premiumSince: isPremium ? new Date() : null,
  });

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token, user };
}

async function setupUserWithRoadmap(name, email, languageCode = 'kn-IN', isPremium = false) {
  const { token, user } = await registerAndVerifyUser(name, email, 'Password123!', isPremium);

  await UserLanguage.create({
    userId: user._id,
    languageCode,
    startLevel: 'Basic',
    level: 'Basic',
    goalDurationDays: 30,
    status: 'active',
  });

  const weeks = [];
  let dayCounter = 1;
  for (let w = 1; w <= 4; w++) {
    const days = [];
    for (let d = 1; d <= 7; d++) {
      days.push({
        dayNumber: dayCounter,
        topic: `Day ${dayCounter} Conversational Practice`,
        targetPhrases: [`ನಮಸ್ಕಾರ ದಿನ ${dayCounter}`, `ಹೇಗಿದ್ದೀರಿ ದಿನ ${dayCounter}`],
        grammarFocus: 'Basic Verb Agreement',
        promptText: `ನಮಸ್ಕಾರ ದಿನ ${dayCounter}`,
        translationEnglish: `Hello Day ${dayCounter}`,
        scenario: `Checking into hotel scenario ${dayCounter}`,
        quiz: [
          {
            question: `What is the greeting for Day ${dayCounter}?`,
            options: [`ನಮಸ್ಕಾರ ದಿನ ${dayCounter}`, 'ವಿದಾಯ', 'ಶುಭರಾತ್ರಿ', 'ಯಾವುದೂ ಅಲ್ಲ'],
            correctAnswerIndex: 0,
          },
        ],
        completedAt: null,
      });
      dayCounter++;
    }
    weeks.push({ weekNumber: w, theme: `Theme Week ${w}`, days });
  }

  const roadmap = await Roadmap.create({
    userId: user._id,
    languageCode,
    totalDays: 28,
    generatedBy: 'test-suite',
    weeks,
  });

  return { token, user, roadmap };
}

async function runPhase5TestSuite() {
  console.log('============================================================');
  console.log('    VAANITUTOR PHASE 5 RIGOROUS VERIFICATION SUITE         ');
  console.log(' (WebSocket TTS Streaming + 3-Activity Sessions + Streak)   ');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function testAssert(condition, message) {
    total++;
    assert(condition, message);
    passed++;
    console.log(`✅ PASS: ${message}`);
  }

  try {
    // 0. Health checks
    const nodeHealth = await axios.get(`${NODE_URL}/api/health`);
    testAssert(nodeHealth.data.status === 'ok', 'server-node /api/health is online');

    const aiHealth = await axios.get(`${AI_URL}/health`);
    testAssert(aiHealth.data.status === 'ok', 'server-ai /health is online');

    // 1. Live TTS Synthesis Endpoint & Binary Stream Validation (Spec Section 6.2, 6.3 & 8.2)
    console.log('\n--- 1. Testing Official POST /api/practice/speak Binary Stream Endpoint ---');
    const authUser = await registerAndVerifyUser('TTS Tester', `tts-tester-${Date.now()}@example.com`, 'Password123!');
    const authHeaders = { Authorization: `Bearer ${authUser.token}` };

    // 1a. JWT Protection
    try {
      await axios.post(`${AI_URL}/api/practice/speak`, {
        text: 'नमस्ते',
        languageCode: 'hi-IN',
      });
      testAssert(false, 'POST /api/practice/speak should reject missing JWT');
    } catch (err) {
      testAssert(
        err.response && err.response.status === 401,
        'POST /api/practice/speak strictly rejects missing JWT with 401 Unauthorized'
      );
    }

    // 1b. Empty text validation
    try {
      await axios.post(`${AI_URL}/api/practice/speak`, {
        text: '   ',
        languageCode: 'hi-IN',
      }, { headers: authHeaders });
      testAssert(false, 'POST /api/practice/speak should reject empty text');
    } catch (err) {
      testAssert(
        err.response && err.response.status === 400,
        'POST /api/practice/speak strictly rejects empty text with 400 Bad Request'
      );
    }

    // 1c. Hindi Binary Audio Stream via POST /api/practice/speak
    const hiSpeakRes = await axios.post(`${AI_URL}/api/practice/speak`, {
      text: 'नमस्ते, आप कैसे हैं?',
      languageCode: 'hi-IN',
      speaker: 'kavya',
    }, {
      headers: authHeaders,
      responseType: 'arraybuffer',
    });

    const hiAudioBuffer = Buffer.from(hiSpeakRes.data);
    const hiProvider = hiSpeakRes.headers['x-provider-used'];
    testAssert(
      hiSpeakRes.status === 200 && hiAudioBuffer.length > 5000,
      `Hindi TTS Stream: returned binary audio stream (${hiAudioBuffer.length} bytes, Provider: ${hiProvider})`
    );
    testAssert(
      hiProvider === 'sarvam-bulbul-v3-ws',
      `Hindi Provider: confirmed official WebSocket streaming provider ("${hiProvider}")`
    );

    // 1d. Kannada Binary Audio Stream via POST /api/practice/speak
    const knSpeakRes = await axios.post(`${AI_URL}/api/practice/speak`, {
      text: 'ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ.',
      languageCode: 'kn-IN',
      speaker: 'kavya',
    }, {
      headers: authHeaders,
      responseType: 'arraybuffer',
    });

    const knAudioBuffer = Buffer.from(knSpeakRes.data);
    const knProvider = knSpeakRes.headers['x-provider-used'];
    testAssert(
      knSpeakRes.status === 200 && knAudioBuffer.length > 5000,
      `Kannada TTS Stream: returned binary audio stream (${knAudioBuffer.length} bytes, Provider: ${knProvider})`
    );

    // 1e. Spec Section 6.2 Matrix Validation (Python Suite Runner)
    console.log('\n--- 2. Testing WebSocket Streaming Protocol & Spec Section 6.2 Fallback Matrix ---');
    const aiServicePath = path.resolve(__dirname, '../server-ai');
    execSync('python test_tts_chain.py', { cwd: aiServicePath, encoding: 'utf-8' });
    const ttsResultsPath = path.join(aiServicePath, 'tts_test_results.json');
    const ttsResults = JSON.parse(fs.readFileSync(ttsResultsPath, 'utf-8'));

    testAssert(
      ttsResults.live_hindi_ws && ttsResults.live_hindi_ws.provider === 'sarvam-bulbul-v3-ws',
      'Hindi WebSocket Protocol: confirmed wss://api.sarvam.ai/text-to-speech/ws frame streaming'
    );
    testAssert(
      ttsResults.live_kannada_ws && ttsResults.live_kannada_ws.provider === 'sarvam-bulbul-v3-ws',
      'Kannada WebSocket Protocol: confirmed wss://api.sarvam.ai/text-to-speech/ws frame streaming'
    );
    testAssert(
      ttsResults.english_fallback && ttsResults.english_fallback.attempted_fallback === true,
      'Spec 6.2 Matrix (English): when Sarvam fails, English correctly cascades to Tier 2 OpenAI TTS'
    );
    testAssert(
      ttsResults.indic_no_fallback && ttsResults.indic_no_fallback.correctly_rejected_without_unauthorized_substitution === true,
      'Spec 6.2 Matrix (Indic): when Sarvam fails on Indic language, router strictly fails clean with no unauthorized model substitution'
    );

    // 3. Resumable 3-Activity Session Lifecycle (Spec Section 6.9a)
    console.log('\n--- 3. Testing 3-Activity Resumable Session Lifecycle (Speak -> Game -> Quiz) ---');
    const userA = await setupUserWithRoadmap('User Alpha', `user-alpha-${Date.now()}@example.com`, 'kn-IN', false);
    const userAHeaders = { Authorization: `Bearer ${userA.token}` };

    // 3a. Initial Session Fetch -> Activity 0 (Speak)
    const initSessionRes = await axios.get(`${NODE_URL}/api/practice/session/kn-IN`, { headers: userAHeaders });
    testAssert(
      initSessionRes.data.success && initSessionRes.data.data.currentActivityIndex === 0,
      'Session Init: opens on Activity 0 (Speak) for new day'
    );
    testAssert(
      initSessionRes.data.data.maxTurns === 1,
      'Free Tier: strictly gated to maxTurns === 1'
    );

    // 3b. Complete Speak Activity (Turn 1)
    const speakTurnRes = await axios.post(`${NODE_URL}/api/practice/session/kn-IN/speak-turn`, {
      targetSentence: 'ನಮಸ್ಕಾರ ದಿನ 1',
      userTranscript: 'ನಮಸ್ಕಾರ ದಿನ 1',
      correctedText: 'ನಮಸ್ಕಾರ ದಿನ 1',
      aiReplyText: 'ಹೇಗಿದ್ದೀರಿ?',
      errors: [],
      fluencyScore: 90,
      encouragement: 'Great job!',
      providerUsed: 'groq-llama',
    }, { headers: userAHeaders });

    testAssert(
      speakTurnRes.data.data.speakTurnIndex === 1 && speakTurnRes.data.data.currentActivityIndex === 1,
      'Speak Complete: reaching maxTurns (1) advances currentActivityIndex to 1 (Game)'
    );

    // 3c. Resume Check: Reload mid-session without doing Game
    const reloadGameRes = await axios.get(`${NODE_URL}/api/practice/session/kn-IN`, { headers: userAHeaders });
    testAssert(
      reloadGameRes.data.data.currentActivityIndex === 1,
      'Zero-Button Resume: page reload mid-session lands back on Activity 1 (Game), not Speak or Quiz'
    );

    // 3d. Complete Game Activity
    const gameRes = await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, {
      completed: true,
      correct: true,
      attempts: 1,
      timeTakenSec: 12,
    }, { headers: userAHeaders });

    testAssert(
      gameRes.data.data.currentActivityIndex === 2,
      'Game Complete: submitting word order advances currentActivityIndex to 2 (Quiz)'
    );

    // 3e. Resume Check: Reload mid-Quiz
    const reloadQuizRes = await axios.get(`${NODE_URL}/api/practice/session/kn-IN`, { headers: userAHeaders });
    testAssert(
      reloadQuizRes.data.data.currentActivityIndex === 2,
      'Zero-Button Resume: page reload mid-session lands back on Activity 2 (Quiz)'
    );

    // 3f. Complete Quiz & Session Completion + Sequential Unlock
    const quizRes = await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, {
      answers: [{ questionIndex: 0, selected: 0, correct: 0, isRight: true }],
      score: 100,
      totalQuestions: 1,
    }, { headers: userAHeaders });

    testAssert(
      quizRes.data.data.currentActivityIndex === 3 && quizRes.data.data.status === 'completed',
      'Quiz Complete: completing quiz sets DailySession status to "completed" and currentActivityIndex to 3'
    );

    const updatedRoadmap = await Roadmap.findOne({ userId: userA.user._id, languageCode: 'kn-IN' });
    const day1 = updatedRoadmap.weeks[0].days[0];
    const day2 = updatedRoadmap.weeks[0].days[1];
    testAssert(
      day1.completedAt !== null && day2.completedAt === null,
      'Sequential Unlock: Day 1 marked completedAt, sequentially unlocking Day 2 practice'
    );

    // 4. Conversational AI Tutor & Turn-Level Resume (Spec Section 6.9b)
    console.log('\n--- 4. Testing Conversational AI Tutor & Turn-Level Resume ---');
    const premiumUser = await setupUserWithRoadmap('User Premium', `user-premium-${Date.now()}@example.com`, 'hi-IN', true);
    const premiumHeaders = { Authorization: `Bearer ${premiumUser.token}` };

    const premInitRes = await axios.get(`${NODE_URL}/api/practice/session/hi-IN`, { headers: premiumHeaders });
    testAssert(
      premInitRes.data.data.maxTurns === 5 && premInitRes.data.data.isPremium === true,
      'Premium Tier: unlocks conversational roleplay depth with maxTurns === 5'
    );

    // Execute Turn 1
    await axios.post(`${NODE_URL}/api/practice/session/hi-IN/speak-turn`, {
      targetSentence: 'नमस्ते',
      userTranscript: 'नमस्ते',
      correctedText: 'नमस्ते',
      aiReplyText: 'आप कैसे हैं?',
      providerUsed: 'groq-llama',
    }, { headers: premiumHeaders });

    // Execute Turn 2
    await axios.post(`${NODE_URL}/api/practice/session/hi-IN/speak-turn`, {
      targetSentence: 'मैं ठीक हूँ',
      userTranscript: 'मैं ठीक हूँ',
      correctedText: 'मैं ठीक हूँ',
      aiReplyText: 'आज क्या योजना है?',
      providerUsed: 'groq-llama',
    }, { headers: premiumHeaders });

    // Execute Turn 3
    const turn3Res = await axios.post(`${NODE_URL}/api/practice/session/hi-IN/speak-turn`, {
      targetSentence: 'मैं पढ़ाई करूँगा',
      userTranscript: 'मैं पढ़ाई करूँगा',
      correctedText: 'मैं पढ़ाई करूँगा',
      aiReplyText: 'बहुत बढ़िया!',
      providerUsed: 'groq-llama',
    }, { headers: premiumHeaders });

    testAssert(
      turn3Res.data.data.speakTurnIndex === 3 && turn3Res.data.data.currentActivityIndex === 0,
      'Multi-Turn Progress: turn 3 of 5 recorded without premature advance to Game'
    );

    // Turn-level resume: reload session
    const reloadTurnRes = await axios.get(`${NODE_URL}/api/practice/session/hi-IN`, { headers: premiumHeaders });
    testAssert(
      reloadTurnRes.data.data.speakTurnIndex === 3 && reloadTurnRes.data.data.currentActivityIndex === 0,
      'Turn-Level Resume: reloading mid-roleplay lands on turn 3 of 5, not turn 1'
    );

    // 5. Daily Streak Engine (Spec Section 7)
    console.log('\n--- 5. Testing Daily Streak Engine (Calendar-Day Increments & Resets) ---');
    const userLang = await UserLanguage.findOne({ userId: userA.user._id, languageCode: 'kn-IN' });
    testAssert(
      userLang.currentStreak === 1 && userLang.longestStreak === 1,
      'Daily Streak: first completed session sets currentStreak = 1 and longestStreak = 1'
    );

    // Simulate consecutive day practice
    userLang.lastStreakDate = '2026-09-03'; // Yesterday
    await userLang.save();

    // Complete Day 2 session
    const day2SessionRes = await axios.get(`${NODE_URL}/api/practice/session/kn-IN`, { headers: userAHeaders });
    testAssert(day2SessionRes.data.data.roadmapDay.dayNumber === 2, 'Next Day Session: loads Day 2 roadmap content');

    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/speak-turn`, {
      targetSentence: 'ದಿನ 2',
      userTranscript: 'ದಿನ 2',
    }, { headers: userAHeaders });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { completed: true }, { headers: userAHeaders });
    const day2Quiz = await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { score: 100 }, { headers: userAHeaders });

    testAssert(
      day2Quiz.data.data.streak === 2 && day2Quiz.data.data.longestStreak === 2,
      'Daily Streak: consecutive calendar day practice increments currentStreak to 2'
    );

    // 5b. 402 Paywall Gate on 3rd Free Session (Spec Section 6.10)
    try {
      await axios.get(`${NODE_URL}/api/practice/session/kn-IN`, { headers: userAHeaders });
      testAssert(false, 'Day 3 should trigger 402 Payment Required for free user with 2 free sessions used');
    } catch (err) {
      testAssert(
        err.response && err.response.status === 402 && err.response.data.code === 'PAYMENT_REQUIRED',
        'Free Session Gate: attempting 3rd session strictly throws HTTP 402 Payment Required'
      );
    }

    // Upgrade User A to Premium to continue multi-day streak reset test
    userA.user.isPremium = true;
    userA.user.premiumSince = new Date();
    await userA.user.save();

    // Simulate missed day (> 1 day ago)
    const refreshedLang = await UserLanguage.findOne({ userId: userA.user._id, languageCode: 'kn-IN' });
    refreshedLang.lastStreakDate = '2026-08-30'; // 5 days ago
    await refreshedLang.save();

    // Complete Day 3 session
    await axios.get(`${NODE_URL}/api/practice/session/kn-IN`, { headers: userAHeaders });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/speak-turn`, { targetSentence: 'ದಿನ 3', userTranscript: 'ದಿನ 3' }, { headers: userAHeaders });
    await axios.post(`${NODE_URL}/api/practice/session/kn-IN/game`, { completed: true }, { headers: userAHeaders });
    const day3Quiz = await axios.post(`${NODE_URL}/api/practice/session/kn-IN/quiz`, { score: 100 }, { headers: userAHeaders });

    testAssert(
      day3Quiz.data.data.streak === 1 && day3Quiz.data.data.longestStreak === 2,
      'Daily Streak: missed calendar day resets currentStreak to 1 while preserving longestStreak (2)'
    );

    // 6. Two-Account Strict Data Isolation (Spec Section 6.6)
    console.log('\n--- 6. Testing Two-Account Strict Data Isolation ---');
    const userB = await setupUserWithRoadmap('User Beta', `user-beta-${Date.now()}@example.com`, 'kn-IN', false);
    const userBHeaders = { Authorization: `Bearer ${userB.token}` };

    const userBSession = await axios.get(`${NODE_URL}/api/practice/session/kn-IN`, { headers: userBHeaders });
    testAssert(
      userBSession.data.data.roadmapDay.dayNumber === 1 && userBSession.data.data.currentActivityIndex === 0,
      'Isolation: User B starts on Day 1 Activity 0 completely unaffected by User A completing Days 1, 2, 3'
    );

    const userBLang = await UserLanguage.findOne({ userId: userB.user._id, languageCode: 'kn-IN' });
    testAssert(
      userBLang.currentStreak === 0 && userBLang.sessionsCount === 0,
      'Isolation: User B streak and session counts are strictly 0 and unpolluted by User A'
    );

    console.log('\n============================================================');
    console.log(`Summary: ${passed} / ${total} Phase 5 verification tests passed!`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ Phase 5 verification failed:', err.response?.data || err.message);
    process.exitCode = 1;
  }
}

connectDB().then(() => {
  runPhase5TestSuite().then(() => {
    setTimeout(() => process.exit(process.exitCode || 0), 1000);
  });
});
