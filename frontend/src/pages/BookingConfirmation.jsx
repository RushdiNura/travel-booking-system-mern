import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, Download } from 'lucide-react';
import { useState } from 'react';
import { useMyBooking } from '../lib/queries.js';
import { downloadBookingConfirmationPdf } from '../lib/downloadPdf.js';
import { Skeleton, ErrorState, Badge } from '../components/ui/Surfaces.jsx';

export default function BookingConfirmation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const redirectStatus = searchParams.get('redirect_status'); // Stripe's own hint, informational only

  // useMyBooking polls every 3s while status is PAYMENT_PENDING — the
  // webhook is what actually confirms the booking, and it can arrive a
  // moment after Stripe redirects the browser back here. We show a
  // "processing" state until the poll reflects CONFIRMED, rather than
  // trusting redirect_status (which is client-visible and never the
  // basis for confirming a booking).
  const { data: booking, isLoading, isError, refetch } = useMyBooking(id);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadBookingConfirmationPdf(booking._id, booking.bookingReference);
    } catch {
      setDownloadError("Couldn't generate the PDF right now — please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return <div className="container-page py-16"><Skeleton className="h-72 w-full max-w-lg" /></div>;
  }
  if (isError || !booking) {
    return <div className="container-page py-16"><ErrorState description="Couldn't load this booking." onRetry={refetch} /></div>;
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const isFailed = booking.paymentStatus === 'FAILED' && booking.status === 'PAYMENT_PENDING';

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-lg text-center">
        {isConfirmed && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h1 className="mt-4 font-display text-2xl text-indigo-900 dark:text-ivory">Booking confirmed</h1>
            <p className="mt-2 text-sm text-muted dark:text-indigo-300">
              Reference <span className="font-medium text-indigo-900 dark:text-ivory">{booking.bookingReference}</span> — a confirmation
              email is on its way.
            </p>
          </>
        )}

        {!isConfirmed && !isFailed && (
          <>
            <Clock className="mx-auto h-10 w-10 animate-pulse text-gold" />
            <h1 className="mt-4 font-display text-2xl text-indigo-900 dark:text-ivory">Confirming your payment</h1>
            <p className="mt-2 text-sm text-muted dark:text-indigo-300">
              This usually takes a few seconds. {redirectStatus === 'succeeded' && "Stripe reports your payment succeeded — we're finalizing the booking now."}
            </p>
          </>
        )}

        {isFailed && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-error" />
            <h1 className="mt-4 font-display text-2xl text-indigo-900 dark:text-ivory">Payment didn't go through</h1>
            <p className="mt-2 text-sm text-muted dark:text-indigo-300">Your hold is still active — you can try again before it expires.</p>
            <Link to={`/bookings/${booking._id}/pay`} className="btn-accent mt-5 inline-flex">Try payment again</Link>
          </>
        )}

        {isConfirmed && (
          <div className="card mt-8 p-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted dark:text-indigo-300">Booking status</span>
              <Badge variant="success">{booking.status}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted dark:text-indigo-300">Payment status</span>
              <Badge variant="success">{booking.paymentStatus}</Badge>
            </div>
            <div className="mt-4 flex justify-between border-t border-border dark:border-indigo-800 pt-4 font-display text-lg text-indigo-900 dark:text-ivory">
              <span>Total paid</span>
              <span className="tabular-nums">{booking.pricing.currency} {booking.pricing.total.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link to="/dashboard" className="btn-outline flex-1 justify-center">View my bookings</Link>
              <button onClick={handleDownload} disabled={downloading} className="btn-ghost flex-1 justify-center">
                <Download className="h-4 w-4" /> {downloading ? 'Preparing...' : 'Download PDF'}
              </button>
            </div>
            {downloadError && <p className="mt-2 text-xs text-error">{downloadError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
