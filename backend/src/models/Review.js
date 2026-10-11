import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },

    targetType: { type: String, enum: ['hotel', 'package', 'destination'], required: true },
    // Exactly one of these is set, matching targetType.
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelPackage' },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination' },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 120 },
    comment: { type: String, required: true, maxlength: 2000 },

    isModerated: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }, // admin moderation
    moderationNote: { type: String },
  },
  { timestamps: true }
);

// One review per booking — hard-enforced at the database level, not just
// in application code, so a race condition can't create duplicates.
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ hotel: 1, isHidden: 1 });
reviewSchema.index({ package: 1, isHidden: 1 });

export const Review = mongoose.model('Review', reviewSchema);
