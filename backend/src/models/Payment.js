import mongoose from 'mongoose';

/**
 * Stores only what's needed to reconcile with the payment provider.
 * Never store PAN, CVV, or PIN — Stripe's Payment Element handles card
 * data entirely client-side and returns only tokenized references.
 */
const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: { type: String, enum: ["stripe"], default: "stripe" },
    providerPaymentIntentId: { type: String }, // Stripe PaymentIntent id (indexed below, unique + sparse)
    providerChargeId: { type: String },

    amount: { type: Number, required: true, min: 0 }, // in the currency's smallest unit is handled at provider layer; this is decimal amount
    currency: { type: String, required: true, default: "USD" },

    status: {
      type: String,
      enum: [
        "REQUIRES_PAYMENT",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
      default: "REQUIRES_PAYMENT",
      index: true,
    },

    refunds: [
      {
        refundId: String,
        amount: Number,
        reason: String,
        status: { type: String, enum: ["pending", "succeeded", "failed"] },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Raw webhook events referencing this payment, for audit/debugging.
    // Only ids + types are stored, never full card-adjacent payloads.
    events: [
      {
        eventId: String,
        type: String,
        receivedAt: { type: Date, default: Date.now },
      },
    ],

    failureReason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

paymentSchema.index({ providerPaymentIntentId: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model('Payment', paymentSchema);
