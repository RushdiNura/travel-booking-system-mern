import mongoose from 'mongoose';

/**
 * Availability is tracked per calendar night rather than as one global
 * counter. A room booked for Jun 1–3 must not block a booking for Jun 5–7.
 * `nights` is a sparse map of ISO date (the night of stay, i.e. check-in
 * date of that night) -> { total, held, booked }. A date with no entry
 * inherits `defaultQuantity`.
 */
const nightAvailabilitySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    total: { type: Number, required: true, min: 0 },
    held: { type: Number, default: 0, min: 0 }, // unpaid, temporarily reserved
    booked: { type: Number, default: 0, min: 0 }, // confirmed, paid
  },
  { _id: false }
);

const roomTypeSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    name: { type: String, required: true }, // "Deluxe King Room"
    description: { type: String },
    images: [{ type: String }],

    capacity: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    beds: { type: String }, // "1 King bed" / "2 Twin beds"
    sizeSqm: { type: Number },

    amenities: [{ type: String }],

    basePrice: { type: Number, required: true, min: 0 }, // per night
    currency: { type: String, default: 'USD' },

    defaultQuantity: { type: Number, required: true, min: 0 }, // rooms of this type in the hotel
    nights: { type: [nightAvailabilitySchema], default: [] },

    cancellationPolicy: {
      type: String,
      default: 'Free cancellation up to 48 hours before check-in.',
    },
    refundable: { type: Boolean, default: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomTypeSchema.index({ hotel: 1, isActive: 1 });

/**
 * Returns { total, held, booked, available } for a given night, falling
 * back to defaultQuantity when no explicit entry exists yet.
 */
roomTypeSchema.methods.getNightAvailability = function getNightAvailability(dateStr) {
  const entry = this.nights.find((n) => n.date === dateStr);
  if (!entry) {
    return { date: dateStr, total: this.defaultQuantity, held: 0, booked: 0, available: this.defaultQuantity };
  }
  return {
    date: dateStr,
    total: entry.total,
    held: entry.held,
    booked: entry.booked,
    available: entry.total - entry.held - entry.booked,
  };
};

export const RoomType = mongoose.model('RoomType', roomTypeSchema);
