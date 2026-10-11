import mongoose from 'mongoose';

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    meals: [{ type: String, enum: ['breakfast', 'lunch', 'dinner'] }],
    activities: [{ type: String }],
  },
  { _id: false }
);

const departureDateSchema = new mongoose.Schema(
  {
    startDate: { type: String, required: true }, // 'YYYY-MM-DD'
    totalSlots: { type: Number, required: true, min: 0 },
    heldSlots: { type: Number, default: 0, min: 0 },
    bookedSlots: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },

    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 220 },
    images: [{ type: String }],

    durationDays: { type: Number, required: true },
    durationNights: { type: Number, required: true },

    price: { type: Number, required: true, min: 0 }, // per traveler
    currency: { type: String, default: 'USD' },

    maxTravelersPerBooking: { type: Number, default: 8 },

    included: [{ type: String }],
    notIncluded: [{ type: String }],

    accommodation: {
      description: String,
      hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    },
    transportation: [{ type: String }], // e.g. "Round-trip flights", "Airport transfers"
    mealsPlan: { type: String }, // e.g. "Breakfast daily, 2 dinners"

    itinerary: [itineraryDaySchema],

    departureDates: [departureDateSchema],

    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

packageSchema.index({ title: 'text', description: 'text' });
packageSchema.index({ destination: 1, isActive: 1 });

export const TravelPackage = mongoose.model('TravelPackage', packageSchema);
