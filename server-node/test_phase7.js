const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const config = require('./src/config/env');

const BASE_URL = 'http://localhost:5000/api';
const SECRET_KEY = 'test_secret_for_hmac_verification';
const WEBHOOK_SECRET = 'test_webhook_secret';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASS: ${message}`);
}

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('🚀 STARTING PHASE 7 PAYMENT & ENTITLEMENT TEST SUITE');
  console.log('====================================================\n');

  // Connect directly to Mongo for database verification
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaanitutor';
  await mongoose.connect(mongoUri);
  const User = require('./src/models/User');
  const Payment = require('./src/models/Payment');
  const Roadmap = require('./src/models/Roadmap');

  const timestamp = Date.now();

  // ----------------------------------------------------
  // SETUP: Create User Alpha & Roadmap
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: Free Tier Session Cap (2 Free Sessions) ---');
  
  const userAlphaEmail = `alpha_pay_${timestamp}@test.com`;
  const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'User Alpha',
    email: userAlphaEmail,
    password: 'Password123!',
  });
  const tokenAlpha = registerRes.data.token;
  const userAlphaId = registerRes.data.user.id;
  const authHeaders = { headers: { Authorization: `Bearer ${tokenAlpha}` } };

  // Generate roadmap for Kannada
  await axios.post(
    `${BASE_URL}/roadmap/generate`,
    { languageCode: 'kn-IN', startLevel: 'Basic', durationDays: 30 },
    authHeaders
  );

  // Check initial freeSessionsUsed is 0 and isPremium is false
  const userDoc1 = await User.findById(userAlphaId);
  assert(userDoc1.isPremium === false, 'User Alpha initially has isPremium = false');
  assert(userDoc1.freeSessionsUsed === 0, 'User Alpha initially has freeSessionsUsed = 0');

  // 1. Start Session 1
  const session1Res = await axios.get(`${BASE_URL}/practice/session/kn-IN`, authHeaders);
  assert(session1Res.data.success === true, 'Session 1 started successfully');
  const userDocAfterS1 = await User.findById(userAlphaId);
  assert(userDocAfterS1.freeSessionsUsed === 1, 'freeSessionsUsed incremented to 1 after starting Day 1');

  // Complete Session 1 (Speak -> Game -> Quiz)
  await axios.post(`${BASE_URL}/practice/session/kn-IN/speak-turn`, {
    transcript: 'ನಮಸ್ಕಾರ',
    sttProvider: 'sarvam',
    durationMs: 1500,
  }, authHeaders);
  await axios.post(`${BASE_URL}/practice/session/kn-IN/game`, {
    completed: true,
    correct: true,
    attempts: 1,
  }, authHeaders);
  await axios.post(`${BASE_URL}/practice/session/kn-IN/quiz`, {
    answers: [{ questionIndex: 0, selectedOption: 0, isCorrect: true }],
    score: 100,
  }, authHeaders);

  // 2. Start Session 2 (Day 2)
  const session2Res = await axios.get(`${BASE_URL}/practice/session/kn-IN`, authHeaders);
  assert(session2Res.data.success === true, 'Session 2 started successfully');
  const userDocAfterS2 = await User.findById(userAlphaId);
  assert(userDocAfterS2.freeSessionsUsed === 2, 'freeSessionsUsed incremented to 2 after starting Day 2');

  // Complete Session 2
  await axios.post(`${BASE_URL}/practice/session/kn-IN/speak-turn`, {
    transcript: 'ಹೇಗಿದ್ದೀರಾ',
    sttProvider: 'sarvam',
    durationMs: 1200,
  }, authHeaders);
  await axios.post(`${BASE_URL}/practice/session/kn-IN/game`, {
    completed: true,
    correct: true,
    attempts: 1,
  }, authHeaders);
  await axios.post(`${BASE_URL}/practice/session/kn-IN/quiz`, {
    answers: [{ questionIndex: 0, selectedOption: 0, isCorrect: true }],
    score: 100,
  }, authHeaders);

  // 3. Attempt to start Session 3 (Day 3) -> Must be blocked with 402
  let hitPaywall = false;
  try {
    await axios.get(`${BASE_URL}/practice/session/kn-IN`, authHeaders);
  } catch (err) {
    if (err.response && err.response.status === 402) {
      hitPaywall = true;
      assert(err.response.data.code === 'PAYMENT_REQUIRED', '402 response includes code: PAYMENT_REQUIRED');
      assert(err.response.data.error.includes('Free session limit reached'), '402 error message accurately describes limit');
    }
  }
  assert(hitPaywall === true, 'Starting 3rd session triggers 402 Payment Required gate');

  // ----------------------------------------------------
  // TEST GROUP 2: Server-Side Fixed Price & Order Creation
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: Server-Side Pricing & Order Creation ---');

  // Try to create order with client tampering payload (e.g. asking for ₹1 = 100 paise)
  const orderRes = await axios.post(
    `${BASE_URL}/payments/create-order`,
    { amount: 100 }, // malicious client attempt to specify price
    authHeaders
  );

  assert(orderRes.data.success === true, 'Order created successfully');
  const orderData = orderRes.data.data;
  assert(orderData.orderId.startsWith('order_'), 'Returned valid orderId');
  assert(orderData.amount === config.PREMIUM_AMOUNT_PAISE, `Client price tampering ignored — order amount is fixed to ${config.PREMIUM_AMOUNT_PAISE} paise`);
  assert(orderData.currency === 'INR', 'Currency is INR');

  // Verify Payment document in MongoDB
  const paymentDoc = await Payment.findOne({ razorpayOrderId: orderData.orderId });
  assert(paymentDoc !== null, 'Payment document stored in database');
  assert(paymentDoc.userId.toString() === userAlphaId, 'Payment document has correct userId');
  assert(paymentDoc.amount === config.PREMIUM_AMOUNT_PAISE, `Payment document amount is ${config.PREMIUM_AMOUNT_PAISE} paise`);
  assert(paymentDoc.status === 'created', 'Payment initial status is "created"');
  assert(paymentDoc.razorpayPaymentId === null, 'razorpayPaymentId is initially null');

  // ----------------------------------------------------
  // TEST GROUP 3: HMAC-SHA256 Verification & Tamper Resistance
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: HMAC-SHA256 Verification & Tamper Resistance ---');

  const fakePaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;

  // 1. Test Tampered Signature
  let tamperedRejected = false;
  try {
    await axios.post(
      `${BASE_URL}/payments/verify`,
      {
        orderId: orderData.orderId,
        paymentId: fakePaymentId,
        signature: 'invalid_tampered_signature_hex_string_1234567890',
      },
      authHeaders
    );
  } catch (err) {
    if (err.response && err.response.status === 400) {
      tamperedRejected = true;
      assert(err.response.data.error.includes('Invalid payment signature'), 'Tampered signature rejected with 400');
    }
  }
  assert(tamperedRejected === true, 'System rejected tampered signature');

  // Verify User Alpha remains non-premium after failed attempt
  const userStillFree = await User.findById(userAlphaId);
  assert(userStillFree.isPremium === false, 'User remains isPremium: false after rejected verification');

  // 2. Test Cross-User Verification Attack (User B trying to verify User Alpha's order)
  const userBetaEmail = `beta_pay_${timestamp}@test.com`;
  const registerBeta = await axios.post(`${BASE_URL}/auth/register`, {
    name: 'User Beta',
    email: userBetaEmail,
    password: 'Password123!',
  });
  const tokenBeta = registerBeta.data.token;
  const authBetaHeaders = { headers: { Authorization: `Bearer ${tokenBeta}` } };

  // Calculate signature using standard test secret
  const validSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${orderData.orderId}|${fakePaymentId}`)
    .digest('hex');

  let crossUserBlocked = false;
  try {
    await axios.post(
      `${BASE_URL}/payments/verify`,
      {
        orderId: orderData.orderId,
        paymentId: fakePaymentId,
        signature: validSignature,
      },
      authBetaHeaders
    );
  } catch (err) {
    if (err.response && err.response.status === 403) {
      crossUserBlocked = true;
      assert(err.response.data.error.includes('Unauthorized payment verification'), 'Cross-user order capture blocked with 403');
    }
  }
  assert(crossUserBlocked === true, 'User cannot verify an order belonging to another user');

  // 3. Authentic Verification by User Alpha
  const verifyRes = await axios.post(
    `${BASE_URL}/payments/verify`,
    {
      orderId: orderData.orderId,
      paymentId: fakePaymentId,
      signature: validSignature,
    },
    authHeaders
  );

  assert(verifyRes.data.success === true, 'Authentic payment signature verified successfully');
  assert(verifyRes.data.data.isPremium === true, 'Response confirms isPremium: true');

  // Database assertions for User Alpha and Payment
  const upgradedUser = await User.findById(userAlphaId);
  assert(upgradedUser.isPremium === true, 'Database verified: User.isPremium is true');
  assert(upgradedUser.premiumSince instanceof Date, 'Database verified: User.premiumSince is set');

  const capturedPayment = await Payment.findOne({ razorpayOrderId: orderData.orderId });
  assert(capturedPayment.status === 'captured', 'Database verified: Payment.status is "captured"');
  assert(capturedPayment.razorpayPaymentId === fakePaymentId, 'Database verified: Payment.razorpayPaymentId is saved');
  assert(capturedPayment.capturedAt instanceof Date, 'Database verified: Payment.capturedAt is recorded');

  // ----------------------------------------------------
  // TEST GROUP 4: Authoritative Webhook Processing
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: Authoritative Webhook Processing ---');

  // User Beta creates an order
  const betaOrderRes = await axios.post(
    `${BASE_URL}/payments/create-order`,
    {},
    authBetaHeaders
  );
  const betaOrderId = betaOrderRes.data.data.orderId;
  const betaPaymentId = `pay_webhook_${crypto.randomBytes(8).toString('hex')}`;

  const webhookPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: betaPaymentId,
          order_id: betaOrderId,
          amount: config.PREMIUM_AMOUNT_PAISE,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });

  // 1. Webhook with fake signature
  let fakeWebhookRejected = false;
  try {
    await axios.post(`${BASE_URL}/payments/webhook`, JSON.parse(webhookPayload), {
      headers: {
        'x-razorpay-signature': 'invalid_webhook_signature',
      },
    });
  } catch (err) {
    if (err.response && err.response.status === 400) {
      fakeWebhookRejected = true;
      assert(err.response.data.error.includes('Invalid webhook signature'), 'Fake webhook signature rejected with 400');
    }
  }
  assert(fakeWebhookRejected === true, 'Webhook rejects unauthenticated signature');

  // 2. Webhook with genuine HMAC signature
  const validWebhookSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(Buffer.from(webhookPayload))
    .digest('hex');

  const webhookRes = await axios.post(
    `${BASE_URL}/payments/webhook`,
    JSON.parse(webhookPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWebhookSig,
      },
    }
  );

  assert(webhookRes.data.success === true, 'Authentic webhook processed successfully');
  assert(webhookRes.data.data.event === 'payment.captured', 'Webhook recognized payment.captured event');

  // Verify User Beta is now premium in database
  const userBetaDoc = await User.findById(registerBeta.data.user.id);
  assert(userBetaDoc.isPremium === true, 'Database verified: Webhook activated User Beta isPremium: true');
  assert(userBetaDoc.premiumSince instanceof Date, 'Database verified: Webhook set User Beta premiumSince');

  const betaPaymentDoc = await Payment.findOne({ razorpayOrderId: betaOrderId });
  assert(betaPaymentDoc.status === 'captured', 'Database verified: Webhook set Payment status to "captured"');
  assert(betaPaymentDoc.razorpayPaymentId === betaPaymentId, 'Database verified: Webhook set Payment paymentId');

  // ----------------------------------------------------
  // TEST GROUP 5: Post-Upgrade Practice Unlock
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 5: Post-Upgrade Practice Unlock ---');

  // User Alpha attempts to resume/start Session 3 (previously blocked with 402)
  const unblockedSession3 = await axios.get(`${BASE_URL}/practice/session/kn-IN`, authHeaders);
  assert(unblockedSession3.data.success === true, 'Session 3 (Day 3) now opens without 402 error');
  assert(unblockedSession3.data.data.dayNumber === 3, 'Opened Day 3 session');
  assert(unblockedSession3.data.data.maxTurns === 5, 'Premium user receives maxTurns: 5 for Speak roleplay depth (Spec Section 6.9b)');

  // ----------------------------------------------------
  // TEST GROUP 6: Payment History Endpoint
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 6: Payment History (Settings.jsx) ---');

  const historyRes = await axios.get(`${BASE_URL}/payments/history`, authHeaders);
  assert(historyRes.data.success === true, 'Payment history endpoint returned 200');
  assert(Array.isArray(historyRes.data.data), 'History data is an array');
  assert(historyRes.data.data.length === 1, 'Contains 1 payment record for User Alpha');
  assert(historyRes.data.data[0].status === 'captured', 'History record status is captured');
  assert(historyRes.data.data[0].amount === config.PREMIUM_AMOUNT_PAISE, `History record amount matches config (${config.PREMIUM_AMOUNT_PAISE})`);

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 7 TESTS PASSED PERFECTLY!`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

runPhase7Tests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err.message);
  if (err.response) {
    console.error('API Response Data:', err.response.data);
  }
  process.exit(1);
});
