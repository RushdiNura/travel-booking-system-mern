import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },

    propertyType: {
      type: String,
      enum: ['hotel', 'resort', 'boutique', 'apartment', 'villa', 'hostel', 'lodge'],
      default: 'hotel',
    },
    starRating: { type: Number, min: 1, max: 5 },

    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 220 },
    images: [{ type: String }],

    address: {
      line1: String,
      city: { type: String, required: true },
      country: { type: String, required: true },
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    amenities: [{ type: String }], // e.g. "Free WiFi", "Pool", "Spa", "Airport shuttle"
    breakfastIncluded: { type: Boolean, default: false },
    freeCancellation: { type: Boolean, default: false },

    checkInTime: { type: String, default: '15:00' },
    checkOutTime: { type: String, default: '11:00' },

    policies: {
      cancellationPolicy: { type: String, default: 'Free cancellation up to 48 hours before check-in.' },
      childPolicy: { type: String },
      petPolicy: { type: String },
    },

    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },

    nearbyAttractions: [
      {
        name: String,
        distanceKm: Number,
        coordinates: { lat: Number, lng: Number },
      },
    ],

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    source: { type: String, default: 'internal' },
  },
  { timestamps: true }
);

hotelSchema.index({ name: 'text', 'address.city': 'text', description: 'text' });
hotelSchema.index({ destination: 1, isActive: 1 });
hotelSchema.index({ ratingAverage: -1 });

export const Hotel = mongoose.model('Hotel', hotelSchema);
