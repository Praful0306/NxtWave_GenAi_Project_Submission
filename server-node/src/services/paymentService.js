const crypto = require('crypto');
let Razorpay = null;
try {
  Razorpay = require('razorpay');
} catch (_e) {
  // SDK not present in some environments, fallback gracefully
}
const config = require('../config/env');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Initialize Razorpay SDK instance if keys and SDK are available
let razorpayInstance = null;
if (Razorpay && config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn('Could not initialize Razorpay SDK instance:', err.message);
  }
}

/**
 * Helper to get or create a Razorpay instance dynamically (e.g. if keys are injected in tests)
 */
function getRazorpayInstance() {
  if (Razorpay && config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
    if (!razorpayInstance || razorpayInstance.key_id !== config.RAZORPAY_KEY_ID) {
      try {
        razorpayInstance = new Razorpay({
          key_id: config.RAZORPAY_KEY_ID,
          key_secret: config.RAZORPAY_KEY_SECRET,
        });
      } catch (e) {
        console.warn('Failed to dynamically create Razorpay instance:', e.message);
      }
    }
    return razorpayInstance;
  }
  return null;
}

/**
 * Create a new Razorpay order server-side.
 * Price is ALWAYS set by server config, never from client request.
 * Spec Section 6.10.
 */
async function createOrder(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (user.isPremium) {
    const error = new Error('User is already a Premium member');
    error.status = 400;
    throw error;
  }

  const amount = config.PREMIUM_AMOUNT_PAISE; // Fixed server-side amount (e.g. 29900 = ₹299)
  const currency = 'INR';
  const receipt = `rcpt_${userId.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;

  let razorpayOrderId;

  const rzp = getRazorpayInstance();
  if (rzp) {
    try {
      const order = await rzp.orders.create({
        amount,
        currency,
        receipt,
        notes: {
          userId: userId.toString(),
          userEmail: user.email,
        },
      });
      razorpayOrderId = order.id;
    } catch (err) {
      // Never invent an order id here. Checkout would open against an order
      // Razorpay has no record of and die with a generic "Payment Failed",
      // which reads as a broken app rather than a misconfigured gateway.
      console.error('Razorpay order creation failed:', err?.error?.description || err.message);
      const error = new Error(
        'Could not reach the payment gateway. Please try again in a moment.'
      );
      error.status = 502;
      throw error;
    }
  } else {
    // No Razorpay credentials at all — offline/local development. Flag it
    // explicitly so the client can say so instead of opening a checkout that
    // cannot possibly succeed.
    const error = new Error(
      'Payments are not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
    );
    error.status = 503;
    error.code = 'GATEWAY_NOT_CONFIGURED';
    throw error;
  }

  // Create Payment record with 'created' status
  const payment = new Payment({
    userId,
    razorpayOrderId,
    amount,
    currency,
    status: 'created',
  });
  await payment.save();

  return {
    orderId: razorpayOrderId,
    amount,
    currency,
    razorpayKeyId: config.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  };
}

/**
 * Verify client payment via HMAC-SHA256 signature check.
 * Recomputes HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET) and compares.
 * Spec Section 6.10 step 4.
 */
async function verifyPayment(userId, { orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) {
    const error = new Error('Missing payment verification parameters: orderId, paymentId, and signature are required');
    error.status = 400;
    throw error;
  }

  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  if (!payment) {
    const error = new Error('Payment record not found for this order');
    error.status = 404;
    throw error;
  }

  if (payment.userId.toString() !== userId.toString()) {
    const error = new Error('Unauthorized payment verification: order does not belong to this user');
    error.status = 403;
    throw error;
  }

  if (payment.status === 'captured') {
    return {
      success: true,
      isPremium: true,
      message: 'Payment already verified and captured',
      payment,
    };
  }

  const secret = config.RAZORPAY_KEY_SECRET || 'test_secret_for_hmac_verification';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const actualBuf = Buffer.from(signature, 'utf8');

  const isValid =
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!isValid) {
    const error = new Error('Invalid payment signature. Verification failed.');
    error.status = 400;
    throw error;
  }

  // Signature is authentic — capture payment and activate user premium status
  payment.razorpayPaymentId = paymentId;
  payment.status = 'captured';
  payment.capturedAt = new Date();
  await payment.save();

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isPremium: true,
      premiumSince: new Date(),
    },
    { new: true }
  );

  return {
    success: true,
    isPremium: user.isPremium,
    premiumSince: user.premiumSince,
    payment,
  };
}

/**
 * Authoritative Webhook handler with X-Razorpay-Signature verification.
 * Spec Section 6.10 step 5.
 */
async function processWebhook(rawBody, signatureHeader) {
  if (!rawBody || !signatureHeader) {
    const error = new Error('Missing webhook body or signature header');
    error.status = 400;
    throw error;
  }

  const secret = config.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf8');
  const actualBuf = Buffer.from(signatureHeader, 'utf8');

  const isValid =
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!isValid) {
    const error = new Error('Invalid webhook signature');
    error.status = 400;
    throw error;
  }

  let eventPayload;
  try {
    eventPayload = JSON.parse(rawBody.toString('utf8'));
  } catch (_e) {
    const error = new Error('Malformed webhook JSON payload');
    error.status = 400;
    throw error;
  }

  const event = eventPayload.event;

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = eventPayload?.payload?.payment?.entity;
    const orderEntity = eventPayload?.payload?.order?.entity;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    if (orderId) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment) {
        payment.status = 'captured';
        if (paymentId) payment.razorpayPaymentId = paymentId;
        payment.capturedAt = payment.capturedAt || new Date();
        await payment.save();

        await User.findByIdAndUpdate(payment.userId, {
          isPremium: true,
          premiumSince: new Date(),
        });
      }
    }
  } else if (event === 'payment.failed') {
    const paymentEntity = eventPayload?.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    if (orderId) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment && payment.status !== 'captured') {
        payment.status = 'failed';
        if (paymentEntity?.id) payment.razorpayPaymentId = paymentEntity.id;
        await payment.save();
      }
    }
  }

  return { received: true, event };
}

/**
 * Get payment history for a user (Settings.jsx purchase history).
 */
async function getPaymentHistory(userId) {
  return Payment.find({ userId }).sort({ createdAt: -1 });
}

module.exports = {
  createOrder,
  verifyPayment,
  processWebhook,
  getPaymentHistory,
};
