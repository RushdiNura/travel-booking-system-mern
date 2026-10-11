import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String },

    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 }, // percentage (0-100) or fixed amount

    applicableTo: {
      type: [String],
      enum: ['flight', 'hotel', 'package'],
      default: ['flight', 'hotel', 'package'],
    },

    minBookingValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number }, // caps percentage discounts

    usageLimit: { type: Number }, // total redemptions allowed, undefined = unlimited
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },

    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isCurrentlyValid = function isCurrentlyValid() {
  const now = new Date();
  return (
    this.isActive &&
    this.validFrom <= now &&
    this.validUntil >= now &&
    (this.usageLimit == null || this.usageCount < this.usageLimit)
  );
};

export const Coupon = mongoose.model('Coupon', couponSchema);
