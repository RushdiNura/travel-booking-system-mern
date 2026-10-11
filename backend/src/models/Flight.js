import mongoose from 'mongoose';

// Each cabin class is sold and held independently — this is what lets the
// booking layer do atomic seat decrements without touching other classes.
const cabinClassSchema = new mongoose.Schema(
  {
    cabin: {
      type: String,
      enum: ['economy', 'premium_economy', 'business', 'first'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 0 },
    availableSeats: { type: Number, required: true, min: 0 },
    heldSeats: { type: Number, default: 0, min: 0 }, // temporarily reserved, unpaid
    baggageAllowanceKg: { type: Number, default: 20 },
    cabinBaggageKg: { type: Number, default: 7 },
    refundable: { type: Boolean, default: false },
    changeFee: { type: Number, default: 0 },
  },
  { _id: false }
);

const airportSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, maxlength: 4 }, // IATA
    city: { type: String, required: true },
    name: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const flightSchema = new mongoose.Schema(
  {
    airline: {
      name: { type: String, required: true },
      code: { type: String, required: true, uppercase: true }, // e.g. "AL"
      logo: { type: String, default: '' },
    },
    flightNumber: { type: String, required: true, trim: true },

    origin: { type: airportSchema, required: true },
    destination: { type: airportSchema, required: true },

    departureTime: { type: Date, required: true, index: true },
    arrivalTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },

    stops: { type: Number, default: 0, min: 0 },
    layovers: [
      {
        airportCode: String,
        city: String,
        durationMinutes: Number,
      },
    ],

    aircraft: { type: String },
    cabinClasses: {
      type: [cabinClassSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },

    currency: { type: String, default: 'USD' },

    status: {
      type: String,
      enum: ['scheduled', 'delayed', 'cancelled', 'completed'],
      default: 'scheduled',
    },
    isActive: { type: Boolean, default: true }, // admin can deactivate without deleting

    // Where this record originated — supports the provider abstraction:
    // 'internal' = managed inventory in MongoDB; anything else names a
    // real external supplier once one is integrated.
    source: { type: String, default: 'internal' },
  },
  { timestamps: true }
);

flightSchema.index({ 'origin.code': 1, 'destination.code': 1, departureTime: 1 });
flightSchema.index({ isActive: 1, status: 1 });

flightSchema.virtual('lowestPrice').get(function lowestPrice() {
  if (!this.cabinClasses?.length) return null;
  return Math.min(...this.cabinClasses.map((c) => c.price));
});
flightSchema.set('toJSON', { virtuals: true });

export const Flight = mongoose.model('Flight', flightSchema);
