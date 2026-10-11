import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Hotel as HotelIcon, Map, X, Star, Download } from 'lucide-react';
import { Badge } from '../ui/Surfaces.jsx';
import { STATUS_VARIANT, PAYMENT_VARIANT, bookingTitle } from '../../lib/bookingDisplay.js';
import { downloadBookingConfirmationPdf } from '../../lib/downloadPdf.js';
import ReviewForm from '../reviews/ReviewForm.jsx';

const ICONS = { flight: Plane, hotel: HotelIcon, package: Map };

export default function BookingRow({ booking, onCancel, cancelling }) {
  const Icon = ICONS[booking.bookingType] || Plane;
  const canCancel = !['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(booking.status);
  const canReview = booking.status === 'COMPLETED' && !booking.reviewedAt && booking.bookingType !== 'flight';
  const canDownload = ['CONFIRMED', 'COMPLETED'].includes(booking.status);
  const [showReview, setShowReview] = useState(false);
  const [justReviewed, setJustReviewed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBookingConfirmationPdf(booking._id, booking.bookingReference);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-800 text-indigo-900 dark:text-ivory">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <Link to={`/bookings/${booking._id}/hold`} className="text-sm font-medium text-indigo-900 dark:text-ivory hover:underline">
              {bookingTitle(booking)}
            </Link>
            <p className="text-xs text-muted dark:text-indigo-300">{booking.bookingReference} · {new Date(booking.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_VARIANT[booking.status] || 'neutral'}>{booking.status.replace('_', ' ')}</Badge>
          <Badge variant={PAYMENT_VARIANT[booking.paymentStatus] || 'neutral'}>{booking.paymentStatus}</Badge>
          <span className="text-sm font-medium text-indigo-900 dark:text-ivory tabular-nums">
            {booking.pricing.currency} {booking.pricing.total.toFixed(2)}
          </span>
          {canDownload && (
            <button onClick={handleDownload} disabled={downloading} className="btn-ghost">
              <Download className="h-3.5 w-3.5" /> {downloading ? 'Preparing...' : 'PDF'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(booking._id)}
              disabled={cancelling}
              className="btn-ghost text-error hover:bg-error/5"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
          {canReview && !justReviewed && (
            <button onClick={() => setShowReview((s) => !s)} className="btn-ghost text-gold">
              <Star className="h-3.5 w-3.5" /> {showReview ? 'Cancel review' : 'Leave a review'}
            </button>
          )}
          {justReviewed && <span className="text-xs text-success">Thanks for your review!</span>}
        </div>
      </div>

      {canReview && showReview && !justReviewed && (
        <ReviewForm booking={booking} onDone={() => { setShowReview(false); setJustReviewed(true); }} />
      )}
    </div>
  );
}
