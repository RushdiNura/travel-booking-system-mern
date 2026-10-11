import { Coupon } from '../models/Coupon.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';

// Kept as named constants rather than magic numbers, and easy to move to
// env/config later if pricing needs to vary by market.
export const TAX_RATE = 0.08; // 8% flat tax, applied to the discounted subtotal
export const SERVICE_FEE = 15; // flat per-booking service fee, in the booking's currency

/**
 * Computes the authoritative price breakdown from a base price the server
 * itself derived from inventory (never from client input). Optionally
 * applies a coupon, validated server-side.
 */
export function buildPricing({ basePrice, currency, coupon }) {
  let discount = 0;

  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discount = basePrice * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount != null) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, basePrice); // never discount below zero
  }

  const taxableAmount = basePrice - discount;
  const taxes = Math.round(taxableAmount * TAX_RATE * 100) / 100;
  const fees = SERVICE_FEE;
  const total = Math.round((taxableAmount + taxes + fees) * 100) / 100;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    taxes,
    fees,
    discount: Math.round(discount * 100) / 100,
    total,
    currency,
    ...(coupon ? { couponCode: coupon.code } : {}),
  };
}

/**
 * Validates a coupon code server-side against every rule the model
 * defines — expiry, usage caps, minimum booking value, applicability,
 * and a per-user redemption limit. Throws ApiError on any violation so
 * the caller can surface a clear message rather than silently ignoring it.
 */
export async function validateCoupon({ code, userId, bookingType, basePrice, session }) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase() }).session(session);
  if (!coupon) throw ApiError.badRequest('Coupon code not found');
  if (!coupon.isCurrentlyValid()) throw ApiError.badRequest('This coupon is expired or no longer active');
  if (!coupon.applicableTo.includes(bookingType)) {
    throw ApiError.badRequest(`This coupon does not apply to ${bookingType} bookings`);
  }
  if (basePrice < coupon.minBookingValue) {
    throw ApiError.badRequest(`This coupon requires a minimum booking value of ${coupon.minBookingValue}`);
  }

  const userRedemptions = await Booking.countDocuments({
    user: userId,
    'pricing.couponCode': coupon.code,
    status: { $in: ['CONFIRMED', 'COMPLETED', 'PAYMENT_PENDING', 'PENDING'] },
  }).session(session);

  if (userRedemptions >= coupon.perUserLimit) {
    throw ApiError.badRequest('You have already used this coupon the maximum number of times');
  }

  return coupon;
}
