import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    country: { type: String, required: true },
    countryCode: { type: String, uppercase: true, maxlength: 2 },
    region: { type: String }, // e.g. "East Africa", "Southeast Asia"
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },
    images: [{ type: String }],
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    highlights: [{ type: String }], // e.g. "UNESCO World Heritage", "Coral reefs"
    bestTimeToVisit: { type: String },
    averageTemperatureC: { type: Number },
    currency: { type: String },
    timezone: { type: String },
    popularityScore: { type: Number, default: 0, index: true },
    isFeatured: { type: Boolean, default: false },
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
  },
  { timestamps: true }
);

destinationSchema.index({ name: 'text', country: 'text', description: 'text' });

export const Destination = mongoose.model('Destination', destinationSchema);
