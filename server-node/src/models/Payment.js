const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true, // in paise, e.g. 29900 = ₹299
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
    },
    status: {
      type: String,
      enum: ['created', 'captured', 'failed'],
      default: 'created',
      required: true,
      index: true,
    },
    capturedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

paymentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
