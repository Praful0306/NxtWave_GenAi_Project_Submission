const axios = require('axios');
const FormData = require('form-data');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const path = require('path');

const NODE_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:8000';

function createValidWavBuffer(durationSec = 2, sampleRate = 16000) {
  const numSamples = sampleRate * durationSec;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // 440Hz sine tone
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 16000;
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
  }
  return buffer;
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
    purpose: 'signup',
  }, { headers: { 'x-test-suite': 'true' } });

  return verifyRes.data.token;
}

async function runPhase3FullSuite() {
  console.log('============================================================');
  console.log('    VAANITUTOR PHASE 3 RIGOROUS VERIFICATION SUITE         ');
  console.log(' (Real Sarvam AI + Real Groq Whisper + Fallback + SlowAPI)  ');
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
    const wavBuffer = createValidWavBuffer(2);

    // ─── 1. Health check ───
    const aiHealth = await axios.get(`${AI_URL}/health`);
    assert(aiHealth.status === 200, 'server-ai /health is online');

    // ─── 2. Authenticate User ───
    console.log('\n--- 1. Authenticating User for STT Access ---');
    const userEmail = `phase3-real-${Date.now()}@example.com`;
    const userToken = await registerAndVerifyUser('Real STT Tester', userEmail, 'StrongPassword123!');
    const authHeaders = { Authorization: `Bearer ${userToken}` };
    assert(!!userToken, 'User authenticated with valid JWT for STT access');

    // ─── 3. HTTP Security & Validation Tests (Spec Section 12) ───
    console.log('\n--- 2. Testing JWT Protection & Payload Validation (Spec Section 12) ---');
    try {
      const dummyForm = new FormData();
      dummyForm.append('audio', wavBuffer, { filename: 'test.wav', contentType: 'audio/wav' });
      dummyForm.append('languageCode', 'kn-IN');
      await axios.post(`${AI_URL}/api/practice/transcribe`, dummyForm, { headers: dummyForm.getHeaders() });
      assert(false, 'STT endpoint should reject unauthenticated call');
    } catch (err) {
      assert(
        err.response && err.response.status === 401,
        'POST /api/practice/transcribe strictly rejects missing JWT with 401 Unauthorized'
      );
    }

    try {
      const invalidMimeForm = new FormData();
      invalidMimeForm.append('audio', Buffer.from('Not audio'), { filename: 'doc.txt', contentType: 'text/plain' });
      invalidMimeForm.append('languageCode', 'kn-IN');
      await axios.post(`${AI_URL}/api/practice/transcribe`, invalidMimeForm, {
        headers: { ...invalidMimeForm.getHeaders(), ...authHeaders },
      });
      assert(false, 'STT endpoint should reject text/plain MIME');
    } catch (err) {
      assert(
        err.response && err.response.status === 415,
        'POST /api/practice/transcribe strictly rejects invalid MIME with 415 Unsupported Media Type'
      );
    }

    try {
      const largeBuffer = Buffer.alloc(16 * 1024 * 1024); // 16MB > 15MB cap
      const largeForm = new FormData();
      largeForm.append('audio', largeBuffer, { filename: 'large.wav', contentType: 'audio/wav' });
      largeForm.append('languageCode', 'kn-IN');
      await axios.post(`${AI_URL}/api/practice/transcribe`, largeForm, {
        headers: { ...largeForm.getHeaders(), ...authHeaders },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      assert(false, 'STT endpoint should reject > 15MB file');
    } catch (err) {
      assert(
        err.response && err.response.status === 413,
        'POST /api/practice/transcribe strictly rejects audio > 15MB with 413 Payload Too Large'
      );
    }

    // ─── 4. Real Live Sarvam AI STT Execution & Native Script Verification ───
    console.log('\n--- 3. Testing Real Live Sarvam AI STT & Native Script Preservation ---');
    const aiServicePath = path.resolve(__dirname, '../server-ai');

    const nativeOutput = execSync('python test_native_scripts.py', { cwd: aiServicePath, encoding: 'utf-8' }).toString().trim();
    const nativeData = JSON.parse(nativeOutput);

    assert(
      nativeData.hindi &&
      nativeData.hindi.providerUsed === 'sarvam-saarika' &&
      nativeData.hindi.transcript.includes('नमस्ते') &&
      nativeData.hindi.languageCode === 'hi-IN',
      `Hindi STT preserved native Devanagari script: "${nativeData.hindi.transcript}" (Provider: ${nativeData.hindi.providerUsed})`
    );

    assert(
      nativeData.kannada &&
      nativeData.kannada.providerUsed === 'sarvam-saarika' &&
      nativeData.kannada.transcript.includes('ನಮಸ್ಕಾರ') &&
      nativeData.kannada.languageCode === 'kn-IN',
      `Kannada STT preserved native Kannada script: "${nativeData.kannada.transcript}" (Provider: ${nativeData.kannada.providerUsed})`
    );

    // ─── 5. Real Live Groq Whisper STT & Fallback Chain ───
    console.log('\n--- 4. Testing Real Live Groq Whisper STT Execution & Fallback Chain ---');
    const pyOutput = execSync('python test_groq_direct.py', { cwd: aiServicePath }).toString().trim();
    const parsedPy = JSON.parse(pyOutput);

    assert(
      parsedPy.primary_sarvam &&
      parsedPy.primary_sarvam.providerUsed === 'sarvam-saarika',
      `Primary Routing: When Sarvam is valid, STT router tries Sarvam FIRST (Provider: ${parsedPy.primary_sarvam.providerUsed})`
    );

    assert(
      parsedPy.groq_direct &&
      parsedPy.groq_direct.providerUsed === 'groq-whisper' &&
      typeof parsedPy.groq_direct.confidence === 'number' &&
      parsedPy.groq_direct.languageCode === 'en-IN',
      `Groq Whisper STT answered live (Provider: ${parsedPy.groq_direct.providerUsed}, Model: whisper-large-v3)`
    );

    assert(
      parsedPy.fallback_zia &&
      parsedPy.fallback_zia.providerUsed === 'zoho-zia' &&
      typeof parsedPy.fallback_zia.confidence === 'number' &&
      parsedPy.fallback_zia.languageCode === 'en-IN',
      `Tier-1 Fallback: When Sarvam is bypassed/fails, router cascades to Zoho Zia (Provider: ${parsedPy.fallback_zia.providerUsed})`
    );

    assert(
      parsedPy.fallback_groq &&
      parsedPy.fallback_groq.providerUsed === 'groq-whisper' &&
      typeof parsedPy.fallback_groq.confidence === 'number' &&
      parsedPy.fallback_groq.languageCode === 'en-IN',
      `Cascading Fallback: When Sarvam and Zia both fail, router cascades to Groq Whisper (Provider: ${parsedPy.fallback_groq.providerUsed})`
    );

    // ─── 6. SlowAPI Rate Limiting on server-ai (30 req/min) ───
    console.log('\n--- 5. Testing SlowAPI Rate Limiter on server-ai (30 req/min) ---');
    let hitRateLimit = false;

    const burstRequests = Array.from({ length: 35 }, async () => {
      try {
        await axios.post(`${AI_URL}/api/practice/feedback`, {}, {
          headers: authHeaders,
          timeout: 4000,
        });
      } catch (err) {
        if (err.response && err.response.status === 429) {
          hitRateLimit = true;
        }
      }
    });

    await Promise.all(burstRequests);

    assert(
      hitRateLimit,
      'SlowAPI rate limiter strictly triggers HTTP 429 Too Many Requests on burst exceeding 30 req/min'
    );

    console.log('\n============================================================');
    console.log(`Summary: ${passed} / ${total} Phase 3 verification tests passed!`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('Phase 3 verification failed:', err);
    process.exitCode = 1;
  }
}

// Connect to DB for test OTP helper
const { connectDB } = require('./src/config/db');
connectDB().then(() => {
  runPhase3FullSuite().then(() => {
    setTimeout(() => process.exit(process.exitCode || 0), 500);
  });
});
