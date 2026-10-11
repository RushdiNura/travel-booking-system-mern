import mongoose from 'mongoose';
import crypto from 'crypto';

// Human-friendly booking reference, e.g. "AER-7F3K9Q2". Avoids ambiguous
// characters (0/O, 1/I/L) since this is read aloud/typed by customers.
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateReferenceSuffix(length = 7) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  }
  return out;
}

const travelerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date },
    passportNumber: { type: String },
    nationality: { type: String },
    type: { type: String, enum: ['adult', 'child', 'infant'], default: 'adult' },
    // For hotel-only bookings this is just "guest" metadata; kept flat
    // rather than a separate schema so one traveler list serves all
    // booking types.
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    basePrice: { type: Number, required: true, min: 0 },
    taxes: { type: Number, required: true, min: 0, default: 0 },
    fees: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    couponCode: { type: String },
  },
  { _id: false }
);

const cancellationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['NOT_ELIGIBLE', 'REQUESTED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED'],
      default: 'NOT_ELIGIBLE',
    },
    reason: { type: String },
    requestedAt: { type: Date },
    cancelledAt: { type: Date },
    refundAmount: { type: Number },
    refundId: { type: String }, // Stripe refund id
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      index: true,
      default: () => `AER-${generateReferenceSuffix()}`,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    bookingType: { type: String, enum: ['flight', 'hotel', 'package'], required: true },

    // Only the field matching bookingType is populated.
    flight: {
      flightRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' },
      cabin: { type: String, enum: ['economy', 'premium_economy', 'business', 'first'] },
      seatsBooked: { type: Number },
      tripType: { type: String, enum: ['one_way', 'round_trip'] },
      returnFlightRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' },
    },
    hotel: {
      hotelRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
      roomTypeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType' },
      roomsBooked: { type: Number },
      checkIn: { type: String }, // 'YYYY-MM-DD'
      checkOut: { type: String },
      nights: { type: Number },
    },
    package: {
      packageRef: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelPackage' },
      departureDateId: { type: mongoose.Schema.Types.ObjectId },
      startDate: { type: String },
      travelerSlots: { type: Number },
    },

    travelers: { type: [travelerSchema], validate: (v) => v.length > 0 },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },

    pricing: { type: pricingSchema, required: true },

    // Booking status is deliberately separate from payment status.
    status: {
      type: String,
      enum: ['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'UNPAID',
      index: true,
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // Inventory hold expiry — a background job releases inventory and
    // marks the booking EXPIRED if payment hasn't landed by this time.
    holdExpiresAt: { type: Date, index: true },

    cancellation: { type: cancellationSchema, default: () => ({}) },

    specialRequests: { type: String, maxlength: 500 },
    notes: { type: String }, // internal/admin notes

    reviewedAt: { type: Date }, // set once a review has been submitted for this booking
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, status: 1, createdAt: -1 });
bookingSchema.index({ status: 1, holdExpiresAt: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
