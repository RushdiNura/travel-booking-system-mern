import mongoose from 'mongoose';

const itineraryItemSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, min: 1 },
    time: { type: String }, // free-text like "09:00" or "Morning"
    type: {
      type: String,
      enum: ['flight', 'hotel', 'activity', 'meal', 'transport', 'note'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    coordinates: { lat: Number, lng: Number },
    linkedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    order: { type: Number, default: 0 }, // manual sort within the day
  },
  { timestamps: true }
);

const itinerarySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },
    startDate: { type: String }, // 'YYYY-MM-DD'
    endDate: { type: String },
    items: [itineraryItemSchema],
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

itinerarySchema.index({ user: 1, createdAt: -1 });

export const Itinerary = mongoose.model('Itinerary', itinerarySchema);
