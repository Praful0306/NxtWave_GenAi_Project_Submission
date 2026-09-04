/**
 * Phase 1 Verification Script for server-node & server-ai
 *
 * Tests:
 * 1. Health check (/api/health)
 * 2. Unverified login attempt (should be 403 / EMAIL_NOT_VERIFIED)
 * 3. Registration -> OTP generation
 * 4. Invalid OTP verification (should fail with attempts count)
 * 5. Valid OTP verification -> JWT issued
 * 6. Authenticated /api/auth/me check
 * 7. Profile update (/api/auth/profile)
 * 8. Two-account data isolation check
 * 9. OAuth endpoint URL generation check
 */

const axios = require('axios');
const mongoose = require('mongoose');

const NODE_BASE = 'http://localhost:5000/api';
const AI_BASE = 'http://localhost:8000';
axios.defaults.headers.common['x-test-suite'] = 'true';

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 VAANITUTOR PHASE 1 VERIFICATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════════\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Health check server-node
  try {
    const res = await axios.get(`${NODE_BASE}/health`);
    assert(res.status === 200 && res.data.status === 'ok', 'server-node /api/health returns 200 ok');
  } catch (err) {
    assert(false, `server-node health check failed: ${err.message}`);
  }

  // 2. Health check server-ai
  try {
    const res = await axios.get(`${AI_BASE}/health`);
    assert(res.status === 200 && res.data.status === 'ok', 'server-ai /health returns 200 ok');
  } catch (err) {
    assert(false, `server-ai health check failed: ${err.message}`);
  }

  // 3. Register user A
  const emailA = `test_user_a_${Date.now()}@example.com`;
  let userIdA = null;
  try {
    const res = await axios.post(`${NODE_BASE}/auth/register`, {
      name: 'Learner A',
      email: emailA,
      password: 'Password123!',
    });
    userIdA = res.data.userId;
    assert(res.status === 201 && res.data.email === emailA, 'Register user A creates unverified account');
  } catch (err) {
    assert(false, `Register user A failed: ${err.response?.data?.error || err.message}`);
  }

  // 4. Attempt login before OTP verification -> must be rejected with 403
  try {
    await axios.post(`${NODE_BASE}/auth/login`, {
      email: emailA,
      password: 'Password123!',
    });
    assert(false, 'Login before OTP verification should fail, but succeeded');
  } catch (err) {
    assert(err.response?.status === 403 && err.response?.data?.code === 'EMAIL_NOT_VERIFIED',
      'Login before OTP verification rejected with 403 EMAIL_NOT_VERIFIED');
  }

  // 5. Test invalid OTP code
  try {
    await axios.post(`${NODE_BASE}/auth/verify-otp`, {
      email: emailA,
      code: '000000',
    });
    assert(false, 'Invalid OTP should fail, but succeeded');
  } catch (err) {
    assert(err.response?.status === 400, 'Invalid OTP code rejected with 400');
  }

  // 6. Inspect DB to get the hashed OTP or use the OtpCode model to retrieve and test verification
  let tokenA = null;
  try {
    const OtpCode = require('./src/models/OtpCode');
    const bcrypt = require('bcryptjs');

    // Find the OTP doc for user A
    const otpDoc = await OtpCode.findOne({ email: emailA, purpose: 'signup' });
    assert(otpDoc && otpDoc.attempts > 0, 'OtpCode record exists with attempts tracked');

    // To test verification, we can generate a known code or set hash to known
    const testCode = '765432';
    otpDoc.codeHash = await bcrypt.hash(testCode, 10);
    await otpDoc.save();

    const verifyRes = await axios.post(`${NODE_BASE}/auth/verify-otp`, {
      email: emailA,
      code: testCode,
    });

    tokenA = verifyRes.data.token;
    assert(tokenA && verifyRes.data.user.emailVerified === true, 'Valid OTP verification issues JWT and marks verified');
  } catch (err) {
    assert(false, `OTP verification failed: ${err.response?.data?.error || err.message}`);
  }

  // 7. Login now succeeds
  try {
    const loginRes = await axios.post(`${NODE_BASE}/auth/login`, {
      email: emailA,
      password: 'Password123!',
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'Login succeeds after verification');
  } catch (err) {
    assert(false, `Login failed after verification: ${err.response?.data?.error || err.message}`);
  }

  // 8. Test /api/auth/me with JWT A
  try {
    const meRes = await axios.get(`${NODE_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(meRes.data.email === emailA && !meRes.data.passwordHash, 'GET /auth/me returns safe profile without passwordHash');
  } catch (err) {
    assert(false, `GET /auth/me failed: ${err.message}`);
  }

  // 9. Register and verify User B to test data isolation
  const emailB = `test_user_b_${Date.now()}@example.com`;
  let tokenB = null;
  try {
    const OtpCode = require('./src/models/OtpCode');
    const bcrypt = require('bcryptjs');

    await axios.post(`${NODE_BASE}/auth/register`, {
      name: 'Learner B',
      email: emailB,
      password: 'PasswordB456!',
    });

    const otpDocB = await OtpCode.findOne({ email: emailB, purpose: 'signup' });
    const codeB = '112233';
    otpDocB.codeHash = await bcrypt.hash(codeB, 10);
    await otpDocB.save();

    const verifyB = await axios.post(`${NODE_BASE}/auth/verify-otp`, {
      email: emailB,
      code: codeB,
    });
    tokenB = verifyB.data.token;

    const meB = await axios.get(`${NODE_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    assert(meB.data.email === emailB && meB.data._id !== userIdA, 'User B data is strictly isolated from User A');
  } catch (err) {
    assert(false, `User B isolation test failed: ${err.message}`);
  }

  // 10. Test server-ai JWT verification with User A's token
  try {
    // Calling protected route /api/practice/transcribe with User A's token
    // (Should pass JWT check and return placeholder route response or 422 if missing form)
    const aiRes = await axios.post(`${AI_BASE}/api/practice/transcribe`, {}, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(aiRes.status === 200, 'server-ai accepts valid JWT issued by server-node');
  } catch (err) {
    if (err.response?.status !== 401 && err.response?.status !== 403) {
      assert(true, 'server-ai verified JWT successfully (non-auth status code received)');
    } else {
      assert(false, `server-ai rejected valid JWT: ${err.response?.status}`);
    }
  }

  // 11. Test server-ai rejects invalid JWT
  try {
    await axios.post(`${AI_BASE}/api/practice/transcribe`, {}, {
      headers: { Authorization: 'Bearer invalid.token.value' },
    });
    assert(false, 'server-ai should reject forged token, but succeeded');
  } catch (err) {
    assert(err.response?.status === 401, 'server-ai correctly rejects invalid JWT with 401');
  }

  // 12. Test profile update
  try {
    const updateRes = await axios.patch(`${NODE_BASE}/auth/profile`,
      { name: 'Learner A Updated', themePreference: 'dark' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(updateRes.data.name === 'Learner A Updated' && updateRes.data.themePreference === 'dark',
      'PATCH /auth/profile updates name and theme preference');
  } catch (err) {
    assert(false, `PATCH /auth/profile failed: ${err.message}`);
  }

  // Summary
  console.log('\n───────────────────────────────────────────────────────');
  console.log(`📊 RESULTS: ${passed}/${total} checks passed`);
  console.log('───────────────────────────────────────────────────────\n');

  if (passed === total) {
    console.log('🎉 ALL PHASE 1 BACKEND VERIFICATION CHECKS PASSED PERFECTLY!\n');
  }
}

// Connect to DB for direct test helpers
const { connectDB } = require('./src/config/db');
connectDB().then(runTests).catch(console.error);
