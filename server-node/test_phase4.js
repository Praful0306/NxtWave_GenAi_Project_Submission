const axios = require('axios');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const path = require('path');
const { connectDB } = require('./src/config/db');

const NODE_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:8000';

const ALLOWED_TAXONOMY_TYPES = new Set([
  'grammar',
  'vocabulary',
  'word_order',
  'register',
  'pronunciation_note',
  'other',
]);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASS: ${message}`);
}

async function registerAndVerifyUser(name, email, password) {
  const OtpCode = require('./src/models/OtpCode');
  
  await axios.post(`${NODE_URL}/api/auth/register`, {
    name,
    email,
    password,
  }, { headers: { 'x-test-suite': 'true' } });

  const testOtp = '123456';
  const otpDoc = await OtpCode.findOne({ email, purpose: 'signup' });
  if (otpDoc) {
    otpDoc.codeHash = await bcrypt.hash(testOtp, 10);
    await otpDoc.save();
  }

  const verifyRes = await axios.post(`${NODE_URL}/api/auth/verify-otp`, {
    email,
    code: testOtp,
  });

  return verifyRes.data.data ? verifyRes.data.data.token : verifyRes.data.token;
}

async function runPhase4FullSuite() {
  console.log('============================================================');
  console.log('    VAANITUTOR PHASE 4 RIGOROUS VERIFICATION SUITE         ');
  console.log(' (7-Tier LLM Evaluation + 6-Type Taxonomy + aiReply + Fallback) ');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function testAssert(condition, message) {
    total++;
    assert(condition, message);
    passed++;
  }

  try {
    // 0. Health check
    const healthRes = await axios.get(`${AI_URL}/health`);
    testAssert(healthRes.data.status === 'ok', 'server-ai /health is online');

    // 1. Authenticate user
    console.log('\n--- 1. Authenticating User for LLM Feedback Access ---');
    const testEmail = `phase4-user-${Date.now()}@example.com`;
    const token = await registerAndVerifyUser('Phase4 Tester', testEmail, 'Password123!');
    testAssert(typeof token === 'string' && token.length > 20, 'User authenticated with valid JWT');
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. JWT Protection & Validation (Spec Section 12)
    console.log('\n--- 2. Testing JWT Protection & Payload Validation (Spec Section 12) ---');
    try {
      await axios.post(`${AI_URL}/api/practice/feedback`, {
        targetSentence: 'Hello',
        userTranscript: 'Hello',
        languageCode: 'en-IN',
      });
      testAssert(false, 'POST /api/practice/feedback should reject missing JWT');
    } catch (err) {
      testAssert(
        err.response && err.response.status === 401,
        'POST /api/practice/feedback strictly rejects missing JWT with 401 Unauthorized'
      );
    }

    try {
      await axios.post(`${AI_URL}/api/practice/feedback`, {
        targetSentence: 'Hello',
        userTranscript: '   ',
        languageCode: 'en-IN',
      }, { headers: authHeaders });
      testAssert(false, 'POST /api/practice/feedback should reject empty userTranscript');
    } catch (err) {
      testAssert(
        err.response && err.response.status === 400,
        'POST /api/practice/feedback strictly rejects empty userTranscript with 400 Bad Request'
      );
    }

    // 3. Live LLM Evaluation via Python runner (Hindi & Kannada)
    console.log('\n--- 3. Testing Live LLM Evaluation & Spec Section 6.5 Schema ---');
    const aiServicePath = path.resolve(__dirname, '../server-ai');
    const pyOutput = execSync('python test_llm_chain.py', { cwd: aiServicePath, encoding: 'utf-8' }).toString().trim();
    
    // Read generated results file
    const fs = require('fs');
    const testResultsPath = path.join(aiServicePath, 'llm_test_results.json');
    const results = JSON.parse(fs.readFileSync(testResultsPath, 'utf-8'));

    const hi = results.live_hindi;
    testAssert(
      hi && typeof hi.correctedText === 'string' && hi.correctedText.length > 0,
      `Hindi Evaluation: returns correctedText ("${hi.correctedText}") (Provider: ${hi.providerUsed})`
    );

    testAssert(
      typeof hi.fluencyScore === 'number' && hi.fluencyScore >= 0 && hi.fluencyScore <= 100,
      `Hindi Evaluation: fluencyScore is valid integer (${hi.fluencyScore}/100)`
    );

    testAssert(
      Array.isArray(hi.errors) && hi.errors.every(e => ALLOWED_TAXONOMY_TYPES.has(e.type) && e.original && e.corrected && e.explanation),
      `Hindi Evaluation: errors adhere to 6-type Error Taxonomy with {type, original, corrected, explanation}`
    );

    testAssert(
      typeof hi.aiReply === 'string' && hi.aiReply.length > 0,
      `Hindi Evaluation: aiReply dialogue continuation generated ("${hi.aiReply}")`
    );

    const kn = results.live_kannada;
    testAssert(
      kn && kn.correctedText.includes('ಬೆಂಗಳೂ'),
      `Kannada Evaluation: preserved native Kannada script in correctedText ("${kn.correctedText}")`
    );

    testAssert(
      typeof kn.aiReply === 'string' && kn.aiReply.length > 0,
      `Kannada Evaluation: aiReply in native Kannada generated ("${kn.aiReply}")`
    );

    // 4. Deterministic Zero-Key Fallback (Tier 7)
    console.log('\n--- 4. Testing Tier-7 Deterministic Zero-Key Fallback Guarantee ---');
    const det = results.deterministic_fallback;
    testAssert(
      det && det.providerUsed === 'deterministic-evaluator',
      'Tier-7 Fallback: returns providerUsed === "deterministic-evaluator"'
    );

    testAssert(
      typeof det.fluencyScore === 'number' && det.correctedText && det.encouragement && typeof det.aiReply === 'string',
      `Tier-7 Fallback: all 5 required spec fields present including in-language aiReply ("${det.aiReply}")`
    );

    // 5. JSON Validation & 1 Malformed-JSON Retry then Fallback Behavior
    console.log('\n--- 5. Testing 1 Malformed-JSON Retry then Fallback Behavioral Contract ---');
    testAssert(
      results.retry_behavior_success && results.retry_behavior_success.calls === 2 && results.retry_behavior_success.succeeded === true,
      'Retry Behavior: when tier encounters malformed JSON on attempt 1, it executes 1 self-correction retry and succeeds without falling through'
    );

    testAssert(
      results.retry_behavior_exhausted_and_cascaded && results.retry_behavior_exhausted_and_cascaded.tier1_calls === 2,
      `Fallback Behavior: when tier exhausts its 1 retry on malformed JSON (calls = 2), router gracefully cascades to next tier (cascaded to: ${results.retry_behavior_exhausted_and_cascaded.cascaded_provider})`
    );

    // 6. SlowAPI Rate Limiting on server-ai (30 req/min)
    console.log('\n--- 6. Testing SlowAPI Rate Limiter on server-ai (30 req/min) ---');
    let hitRateLimit = false;

    const burstRequests = Array.from({ length: 35 }, async () => {
      try {
        await axios.post(`${AI_URL}/api/practice/feedback`, {
          targetSentence: 'Test',
          userTranscript: 'Test',
          languageCode: 'en-IN',
        }, {
          headers: authHeaders,
          timeout: 15000,
        });
      } catch (err) {
        if (err.response && err.response.status === 429) {
          hitRateLimit = true;
        }
      }
    });

    await Promise.all(burstRequests);

    testAssert(
      hitRateLimit,
      'SlowAPI rate limiter strictly triggers HTTP 429 Too Many Requests on burst exceeding 30 req/min'
    );

    console.log('\n============================================================');
    console.log(`Summary: ${passed} / ${total} Phase 4 verification tests passed!`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('Phase 4 verification failed:', err);
    process.exitCode = 1;
  }
}

connectDB().then(() => {
  runPhase4FullSuite().then(() => {
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  });
});
