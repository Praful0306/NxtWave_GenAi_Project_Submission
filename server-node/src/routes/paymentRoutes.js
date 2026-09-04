const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

/**
 * POST /api/payments/create-order
 * Create a new Razorpay order for Premium upgrade.
 * Spec Section 6.10 step 1 & Section 8.1.
 */
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const orderData = await paymentService.createOrder(req.user.userId);
    res.json({
      success: true,
      data: orderData,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to create payment order',
    });
  }
});

/**
 * POST /api/payments/verify
 * Verify payment signature from client Razorpay checkout completion.
 * Spec Section 6.10 step 4 & Section 8.1.
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const result = await paymentService.verifyPayment(req.user.userId, {
      orderId,
      paymentId,
      signature,
    });
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Payment verification failed',
    });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay webhook backstop with X-Razorpay-Signature verification.
 * Spec Section 6.10 step 5 & Section 8.1.
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    // Use req.rawBody preserved by body-parser verify hook, or stringified body as fallback
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const result = await paymentService.processWebhook(rawBody, signature);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(err.status || 400).json({
      success: false,
      error: err.message || 'Webhook processing failed',
    });
  }
});

/**
 * GET /api/payments/history
 * Fetch user's payment history for Settings.jsx.
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const history = await paymentService.getPaymentHistory(req.user.userId);
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Failed to retrieve payment history',
    });
  }
});

module.exports = router;
