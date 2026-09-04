/**
 * test_phase7_direct.js
 * In-process direct verification suite for Phase 7:
 * - Payment Mongoose model & schema constraints
 * - Fixed server-side pricing & order creation
 * - HMAC-SHA256 signature verification & tamper rejection
 * - Authoritative Webhook processing with X-Razorpay-Signature verification
 * - Free-tier session gate (2 sessions) and post-upgrade unlock
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');

// Models
const User = require('./src/models/User');
const Payment = require('./src/models/Payment');
const Roadmap = require('./src/models/Roadmap');
const DailySession = require('./src/models/DailySession');
const UserLanguage = require('./src/models/UserLanguage');

// Services
const paymentService = require('./src/services/paymentService');
const sessionService = require('./src/services/sessionService');

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

async function runDirectTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 7 IN-DEPTH VERIFICATION SUITE');
  console.log('====================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const testSecret = config.RAZORPAY_KEY_SECRET || 'test_secret_for_hmac_verification';
  const testWebhookSecret = config.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

  // ----------------------------------------------------------------
  // TEST GROUP 1: Free Tier Session Limit & Gating
  // ----------------------------------------------------------------
  console.log('--- TEST GROUP 1: Free Tier Session Cap (2 Free Sessions) ---');

  const userAlpha = new User({
    name: 'Alpha Tester',
    email: `alpha_${timestamp}@test.com`,
    passwordHash: 'hashed_password_123',
    authProvider: 'email',
    isPremium: false,
    freeSessionsUsed: 0,
  });
  await userAlpha.save();
  assert(userAlpha.isPremium === false, 'User Alpha created with isPremium: false');
  assert(userAlpha.freeSessionsUsed === 0, 'User Alpha created with freeSessionsUsed: 0');

  // Create a Roadmap for Kannada
  const roadmapAlpha = new Roadmap({
    userId: userAlpha._id,
    languageCode: 'kn-IN',
    totalDays: 30,
    weeks: [
      {
        weekNumber: 1,
        theme: 'Greetings & Basics',
        days: [
          { dayNumber: 1, topic: 'Basic Greetings', promptText: 'ನಮಸ್ಕಾರ', targetPhrases: ['ನಮಸ್ಕಾರ'], completedAt: null },
          { dayNumber: 2, topic: 'Asking Well-being', promptText: 'ಹೇಗಿದ್ದೀರಾ', targetPhrases: ['ಹೇಗಿದ್ದೀರಾ'], completedAt: null },
          { dayNumber: 3, topic: 'Introductions', promptText: 'ನನ್ನ ಹೆಸರು', targetPhrases: ['ನನ್ನ ಹೆಸರು'], completedAt: null },
        ],
      },
    ],
  });
  await roadmapAlpha.save();

  // 1. First DailySession creation (Day 1)
  const session1 = await sessionService.getOrCreateDailySession(userAlpha._id, 'kn-IN');
  assert(session1.dayNumber === 1, 'Session 1 started at Day 1');
  const userAfterS1 = await User.findById(userAlpha._id);
  assert(userAfterS1.freeSessionsUsed === 1, 'freeSessionsUsed incremented to 1 on Day 1 session start');

  // Mark Day 1 complete
  roadmapAlpha.weeks[0].days[0].completedAt = new Date();
  await roadmapAlpha.save();

  // 2. Second DailySession creation (Day 2)
  const session2 = await sessionService.getOrCreateDailySession(userAlpha._id, 'kn-IN');
  assert(session2.dayNumber === 2, 'Session 2 started at Day 2');
  const userAfterS2 = await User.findById(userAlpha._id);
  assert(userAfterS2.freeSessionsUsed === 2, 'freeSessionsUsed incremented to 2 on Day 2 session start');

  // Mark Day 2 complete
  roadmapAlpha.weeks[0].days[1].completedAt = new Date();
  await roadmapAlpha.save();

  // 3. Third DailySession creation attempt (Day 3) -> MUST throw 402
  let hitPaywall = false;
  try {
    await sessionService.getOrCreateDailySession(userAlpha._id, 'kn-IN');
  } catch (err) {
    if (err.status === 402 && err.code === 'PAYMENT_REQUIRED') {
      hitPaywall = true;
      assert(err.message.includes('Free session limit reached'), '402 error message correctly explains 2 free session limit');
    }
  }
  assert(hitPaywall === true, 'Starting 3rd session triggers 402 PAYMENT_REQUIRED gate');

  // ----------------------------------------------------------------
  // TEST GROUP 2: Server-Side Fixed Pricing & Order Creation
  // ----------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Server-Side Fixed Pricing & Order Creation ---');

  const orderResult = await paymentService.createOrder(userAlpha._id);
  assert(orderResult.orderId.startsWith('order_'), 'Generated order ID with order_ prefix');
  assert(orderResult.amount === config.PREMIUM_AMOUNT_PAISE, `Order amount is strictly fixed to server config (${config.PREMIUM_AMOUNT_PAISE} paise = ₹${config.PREMIUM_AMOUNT_PAISE / 100})`);
  assert(orderResult.currency === 'INR', 'Currency is INR');

  // Verify MongoDB Payment Document
  const paymentDoc = await Payment.findOne({ razorpayOrderId: orderResult.orderId });
  assert(paymentDoc !== null, 'Payment document stored in database');
  assert(paymentDoc.userId.toString() === userAlpha._id.toString(), 'Payment document userId matches');
  assert(paymentDoc.amount === config.PREMIUM_AMOUNT_PAISE, 'Payment document amount matches server fixed price');
  assert(paymentDoc.status === 'created', 'Payment status is "created"');
  assert(paymentDoc.razorpayPaymentId === null, 'razorpayPaymentId is initially null');
  assert(paymentDoc.capturedAt === null, 'capturedAt is initially null');

  // ----------------------------------------------------------------
  // TEST GROUP 3: HMAC-SHA256 Signature Verification & Tamper Resistance
  // ----------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: HMAC-SHA256 Signature Verification & Security ---');

  const mockPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;

  // 1. Tampered Signature Check
  let tamperedCaught = false;
  try {
    await paymentService.verifyPayment(userAlpha._id, {
      orderId: orderResult.orderId,
      paymentId: mockPaymentId,
      signature: 'bad_tampered_signature_hex_1234567890abcdef',
    });
  } catch (err) {
    if (err.status === 400 && err.message.includes('Invalid payment signature')) {
      tamperedCaught = true;
    }
  }
  assert(tamperedCaught === true, 'Tampered HMAC signature rejected with 400 status');
  const userStillUnpaid = await User.findById(userAlpha._id);
  assert(userStillUnpaid.isPremium === false, 'User remains isPremium: false after failed verification');

  // 2. Cross-User Verification Attack (User Beta tries to verify User Alpha's order)
  const userBeta = new User({
    name: 'Beta Attacker',
    email: `beta_${timestamp}@test.com`,
    passwordHash: 'hashed_password_123',
    authProvider: 'email',
    isPremium: false,
  });
  await userBeta.save();

  const correctSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderResult.orderId}|${mockPaymentId}`)
    .digest('hex');

  let crossUserBlocked = false;
  try {
    await paymentService.verifyPayment(userBeta._id, {
      orderId: orderResult.orderId,
      paymentId: mockPaymentId,
      signature: correctSignature,
    });
  } catch (err) {
    if (err.status === 403) {
      crossUserBlocked = true;
    }
  }
  assert(crossUserBlocked === true, 'Cross-user order verification blocked with 403 Unauthorized');

  // 3. Authentic Verification by User Alpha
  const verifyResult = await paymentService.verifyPayment(userAlpha._id, {
    orderId: orderResult.orderId,
    paymentId: mockPaymentId,
    signature: correctSignature,
  });

  assert(verifyResult.success === true, 'Authentic signature verified successfully');
  assert(verifyResult.isPremium === true, 'Verification returns isPremium: true');

  // Direct database assertions
  const updatedUserAlpha = await User.findById(userAlpha._id);
  assert(updatedUserAlpha.isPremium === true, 'Database verified: User.isPremium is true');
  assert(updatedUserAlpha.premiumSince instanceof Date, 'Database verified: User.premiumSince is Date instance');

  const updatedPaymentDoc = await Payment.findOne({ razorpayOrderId: orderResult.orderId });
  assert(updatedPaymentDoc.status === 'captured', 'Database verified: Payment.status is "captured"');
  assert(updatedPaymentDoc.razorpayPaymentId === mockPaymentId, 'Database verified: Payment.razorpayPaymentId saved');
  assert(updatedPaymentDoc.capturedAt instanceof Date, 'Database verified: Payment.capturedAt is recorded');

  // ----------------------------------------------------------------
  // TEST GROUP 4: Authoritative Webhook Processing
  // ----------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Authoritative Webhook Processing ---');

  // Create User Gamma and order
  const userGamma = new User({
    name: 'Gamma Webhook User',
    email: `gamma_${timestamp}@test.com`,
    passwordHash: 'hashed_password_123',
    authProvider: 'email',
    isPremium: false,
  });
  await userGamma.save();

  const gammaOrder = await paymentService.createOrder(userGamma._id);
  const gammaPaymentId = `pay_webhook_${crypto.randomBytes(8).toString('hex')}`;

  const webhookBody = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: gammaPaymentId,
          order_id: gammaOrder.orderId,
          amount: config.PREMIUM_AMOUNT_PAISE,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });

  // 1. Bad Webhook Signature
  let badWebhookBlocked = false;
  try {
    await paymentService.processWebhook(Buffer.from(webhookBody), 'invalid_webhook_sig');
  } catch (err) {
    if (err.status === 400) {
      badWebhookBlocked = true;
    }
  }
  assert(badWebhookBlocked === true, 'Invalid webhook signature rejected with 400');

  // 2. Genuine Webhook Signature
  const validWebhookSig = crypto
    .createHmac('sha256', testWebhookSecret)
    .update(Buffer.from(webhookBody))
    .digest('hex');

  const webhookResult = await paymentService.processWebhook(Buffer.from(webhookBody), validWebhookSig);
  assert(webhookResult.received === true, 'Webhook acknowledged with received: true');
  assert(webhookResult.event === 'payment.captured', 'Webhook recognized payment.captured event');

  // Database verification for User Gamma
  const updatedUserGamma = await User.findById(userGamma._id);
  assert(updatedUserGamma.isPremium === true, 'Database verified: Webhook activated User Gamma isPremium: true');
  assert(updatedUserGamma.premiumSince instanceof Date, 'Database verified: Webhook recorded premiumSince');

  const gammaPaymentDoc = await Payment.findOne({ razorpayOrderId: gammaOrder.orderId });
  assert(gammaPaymentDoc.status === 'captured', 'Database verified: Webhook updated Payment status to "captured"');
  assert(gammaPaymentDoc.razorpayPaymentId === gammaPaymentId, 'Database verified: Webhook recorded razorpayPaymentId');

  // ----------------------------------------------------------------
  // TEST GROUP 5: Post-Upgrade Practice Unlock
  // ----------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Post-Upgrade Practice Unlock ---');

  // User Alpha now starts Day 3 session (previously threw 402)
  const session3 = await sessionService.getOrCreateDailySession(userAlpha._id, 'kn-IN');
  assert(session3.dayNumber === 3, 'Day 3 session created successfully for upgraded premium user');
  assert(session3.maxTurns === 5, 'Premium user gets maxTurns: 5 for multi-turn Speak roleplay (Spec Section 6.9b)');

  // ----------------------------------------------------------------
  // TEST GROUP 6: Payment History
  // ----------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Payment History for Settings.jsx ---');

  const history = await paymentService.getPaymentHistory(userAlpha._id);
  assert(Array.isArray(history), 'Payment history returned as array');
  assert(history.length === 1, 'Contains exactly 1 payment record for User Alpha');
  assert(history[0].status === 'captured', 'Payment record status is "captured"');
  assert(history[0].amount === config.PREMIUM_AMOUNT_PAISE, 'Payment record amount is accurate');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 7 TESTS PASSED WITH 100% SUCCESS!`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runDirectTests().catch((err) => {
  console.error('\n❌ Direct test execution error:', err);
  process.exit(1);
});
