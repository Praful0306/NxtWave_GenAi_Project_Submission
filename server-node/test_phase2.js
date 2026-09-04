const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const config = require('./src/config/env');

const NODE_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:8000';
const INTERNAL_KEY = config.INTERNAL_SERVICE_KEY;

// Attach test bypass header so auth limiter doesn't slow down automated suites
axios.defaults.headers.common['x-test-suite'] = 'true';

async function registerAndVerifyUser(name, email, password) {
  const OtpCode = require('./src/models/OtpCode');
  
  await axios.post(`${NODE_URL}/api/auth/register`, {
    name,
    email,
    password,
  });

  const testOtp = '123456';
  const otpDoc = await OtpCode.findOne({ email, purpose: 'signup' });
  if (otpDoc) {
    otpDoc.codeHash = await bcrypt.hash(testOtp, 10);
    await otpDoc.save();
  }

  const verifyRes = await axios.post(`${NODE_URL}/api/auth/verify-otp`, {
    email,
    code: testOtp,
    purpose: 'signup',
  });

  return verifyRes.data.token;
}

async function runPhase2Tests() {
  console.log('============================================================');
  console.log('          VAANITUTOR PHASE 2 RIGOROUS TEST SUITE           ');
  console.log('  (Onboarding, Multi-Language Invariants, Full Regeneration) ');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, label) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${label}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${label}`);
      process.exitCode = 1;
    }
  }

  try {
    // ─── 1. Health checks ───
    const nodeHealth = await axios.get(`${NODE_URL}/api/health`);
    assert(nodeHealth.status === 200, 'server-node /api/health is online');

    const aiHealth = await axios.get(`${AI_URL}/health`);
    assert(aiHealth.status === 200, 'server-ai /health is online');

    // ─── 2. Test server-ai internal roadmap endpoint directly ───
    console.log('\n--- 1. Testing server-ai Internal Roadmap Generation ---');
    try {
      await axios.post(`${AI_URL}/internal/generate-roadmap`, {
        languageCode: 'kn-IN',
        level: 'Basic',
        totalDays: 7,
      });
      assert(false, 'server-ai /internal/generate-roadmap rejects call without X-Internal-Key');
    } catch (err) {
      assert(
        err.response && (err.response.status === 401 || err.response.status === 403),
        'server-ai /internal/generate-roadmap rejects unauthorized call without internal key'
      );
    }

    const aiRoadmapRes = await axios.post(
      `${AI_URL}/internal/generate-roadmap`,
      {
        languageCode: 'kn-IN',
        level: 'Basic',
        totalDays: 14,
      },
      {
        headers: { 'X-Internal-Key': INTERNAL_KEY },
      }
    );

    assert(
      aiRoadmapRes.status === 200 &&
      aiRoadmapRes.data.languageCode === 'kn-IN' &&
      Array.isArray(aiRoadmapRes.data.weeks) &&
      aiRoadmapRes.data.weeks.length > 0,
      'server-ai generates structured week-by-week curriculum with X-Internal-Key'
    );

    // Verify daily quiz exists in AI-generated roadmap
    const firstDay = aiRoadmapRes.data.weeks[0].days[0];
    assert(
      firstDay &&
      Array.isArray(firstDay.quiz) &&
      firstDay.quiz.length > 0 &&
      firstDay.quiz[0].question &&
      Array.isArray(firstDay.quiz[0].options) &&
      typeof firstDay.quiz[0].correctAnswerIndex === 'number',
      'Daily curriculum includes structured multiple-choice quiz questions per day (Spec Section 6.5)'
    );

    // ─── 3. Register & verify User A ───
    console.log('\n--- 2. Registering User A for Onboarding & Roadmap ---');
    const userAEmail = `onboarding-test-${Date.now()}@example.com`;
    const userAToken = await registerAndVerifyUser('Priya Sharma', userAEmail, 'StrongPassword123!');
    const authHeadersA = { headers: { Authorization: `Bearer ${userAToken}` } };

    assert(!!userAToken, 'User A registered, OTP verified, and issued JWT');

    // ─── 4. User A Onboarding: 3 questions for Kannada (kn-IN) ───
    console.log('\n--- 3. Testing 3-Question Onboarding for Language 1 (Kannada) ---');
    const genRoadmapRes = await axios.post(
      `${NODE_URL}/api/roadmap/generate`,
      {
        languageCode: 'kn-IN',
        level: 'Basic',
        goalDurationDays: 30,
      },
      authHeadersA
    );

    assert(
      genRoadmapRes.status === 201 &&
      genRoadmapRes.data.userLanguage.languageCode === 'kn-IN' &&
      genRoadmapRes.data.userLanguage.level === 'Basic' &&
      genRoadmapRes.data.roadmap.weeks.length > 0,
      'POST /api/roadmap/generate completes 3-question onboarding & creates Kannada roadmap'
    );

    // ─── 5. User A Multi-Language: Add second language (Hindi hi-IN) ───
    console.log('\n--- 4. Testing Multi-Language Simultaneous Learning (Hindi) ---');
    const genHindiRes = await axios.post(
      `${NODE_URL}/api/roadmap/generate`,
      {
        languageCode: 'hi-IN',
        level: 'Intermediate',
        goalDurationDays: 14,
      },
      authHeadersA
    );

    assert(
      genHindiRes.status === 201 &&
      genHindiRes.data.userLanguage.languageCode === 'hi-IN' &&
      genHindiRes.data.userLanguage.level === 'Intermediate' &&
      genHindiRes.data.roadmap.totalDays === 14,
      'User can enroll in second independent language (Hindi, Intermediate, 14 days)'
    );

    // Snapshot Hindi before Kannada regeneration
    const hindiBeforeRes = await axios.get(`${NODE_URL}/api/roadmap/hi-IN`, authHeadersA);
    const hindiRoadmapBefore = JSON.stringify(hindiBeforeRes.data.roadmap.weeks);
    const hindiLangBefore = {
      level: hindiBeforeRes.data.userLanguage.level,
      goalDays: hindiBeforeRes.data.userLanguage.goalDurationDays,
      regenerationCount: hindiBeforeRes.data.roadmap.regenerationCount || 0,
    };

    // ─── 6. GET /api/languages: List active languages for dashboard ───
    console.log('\n--- 5. Testing Multi-Language Dashboard Summary ---');
    const languagesRes = await axios.get(`${NODE_URL}/api/languages`, authHeadersA);
    assert(
      languagesRes.status === 200 &&
      languagesRes.data.length === 2 &&
      languagesRes.data.some((l) => l.languageCode === 'kn-IN') &&
      languagesRes.data.some((l) => l.languageCode === 'hi-IN'),
      'GET /api/languages returns all active enrolled languages with progress summaries'
    );

    // ─── 7. GET /api/roadmap/:languageCode ───
    console.log('\n--- 6. Testing Roadmap Retrieval ---');
    const knRoadmapRes = await axios.get(`${NODE_URL}/api/roadmap/kn-IN`, authHeadersA);
    assert(
      knRoadmapRes.status === 200 &&
      knRoadmapRes.data.roadmap.languageCode === 'kn-IN' &&
      knRoadmapRes.data.userLanguage.goalDurationDays === 30,
      'GET /api/roadmap/:languageCode returns full active Kannada roadmap'
    );

    // ─── 8. Roadmap Regeneration & Invariants (Spec Section 6.8) ───
    console.log('\n--- 7. Testing Roadmap Regeneration & Cross-Language Invariants ---');
    const regenRes = await axios.post(
      `${NODE_URL}/api/roadmap/kn-IN/regenerate`,
      {
        newLevel: 'Intermediate',
        newGoalDurationDays: 21,
      },
      authHeadersA
    );

    assert(
      regenRes.status === 200 &&
      regenRes.data.userLanguage.level === 'Intermediate' &&
      regenRes.data.userLanguage.goalDurationDays === 21 &&
      regenRes.data.roadmap.startLevel === 'Intermediate' &&
      regenRes.data.roadmap.totalDays === 21 &&
      regenRes.data.roadmap.regenerationCount === 1,
      'POST /api/roadmap/:languageCode/regenerate updates Kannada level, duration (21 days) & increments regenerationCount'
    );

    // Invariant Check 1: Verify all days in regenerated Kannada roadmap are reset to Day 1
    // Spec Section 7: Unlock state is computed, never stored.
    const regenWeeks = regenRes.data.roadmap.weeks;
    let allCompletedNull = true;
    let noUnlockedAtInSchema = true;

    regenWeeks.forEach((w) => {
      w.days.forEach((d) => {
        if (d.completedAt !== null) allCompletedNull = false;
        if (d.unlockedAt !== undefined) noUnlockedAtInSchema = false; // Must NOT be in DB schema
      });
    });

    assert(
      allCompletedNull && noUnlockedAtInSchema,
      'Regeneration strictly restarts day-by-day plan at Day 1 (all completedAt: null, unlocked state purely computed per Spec Section 7)'
    );

    // Invariant Check 2: Verify Hindi (Language B) is 100% UNTOUCHED by Kannada regeneration
    const hindiAfterRes = await axios.get(`${NODE_URL}/api/roadmap/hi-IN`, authHeadersA);
    const hindiRoadmapAfter = JSON.stringify(hindiAfterRes.data.roadmap.weeks);
    const hindiLangAfter = {
      level: hindiAfterRes.data.userLanguage.level,
      goalDays: hindiAfterRes.data.userLanguage.goalDurationDays,
      regenerationCount: hindiAfterRes.data.roadmap.regenerationCount || 0,
    };

    assert(
      hindiLangAfter.level === hindiLangBefore.level &&
      hindiLangAfter.goalDays === hindiLangBefore.goalDays &&
      hindiLangAfter.regenerationCount === hindiLangBefore.regenerationCount &&
      hindiRoadmapAfter === hindiRoadmapBefore,
      'Cross-Language Invariant: Regenerating Kannada left Hindi roadmap, level, goal, and regenerationCount 100% UNTOUCHED'
    );

    // ─── 9. User Isolation Check ───
    console.log('\n--- 8. Testing Cross-User Multi-Language Isolation ---');
    const userBEmail = `onboarding-userb-${Date.now()}@example.com`;
    const userBToken = await registerAndVerifyUser('Rahul Varma', userBEmail, 'StrongPassword123!');
    const authHeadersB = { headers: { Authorization: `Bearer ${userBToken}` } };

    const userBLanguages = await axios.get(`${NODE_URL}/api/languages`, authHeadersB);
    assert(
      userBLanguages.data.length === 0,
      'New User B starts with 0 enrolled languages (no leakage from User A)'
    );

    try {
      await axios.get(`${NODE_URL}/api/roadmap/kn-IN`, authHeadersB);
      assert(false, 'User B should not access User A Kannada roadmap');
    } catch (err) {
      assert(
        err.response && err.response.status === 404,
        'User B correctly receives 404 for User A Kannada roadmap'
      );
    }

    console.log('\n============================================================');
    console.log(`Summary: ${passed} / ${total} Phase 2 tests passed!`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  }
}

// Connect to DB for test OTP helper
const { connectDB } = require('./src/config/db');
connectDB().then(() => {
  runPhase2Tests().then(() => {
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  });
});
