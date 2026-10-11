import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useMyBooking } from '../lib/queries.js';
import { Skeleton, ErrorState, Badge } from '../components/ui/Surfaces.jsx';

function useCountdown(targetIso) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(targetIso).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemainingMs(new Date(targetIso).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return remainingMs;
}

const formatCountdown = (ms) => {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function BookingHold() {
  const { id } = useParams();
  const { data: booking, isLoading, isError, refetch } = useMyBooking(id);
  const remainingMs = useCountdown(booking?.holdExpiresAt || new Date().toISOString());

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mt-4 h-40 w-full max-w-lg" />
      </div>
    );
  }
  if (isError || !booking) {
    return <div className="container-page py-16"><ErrorState description="Couldn't load this booking." onRetry={refetch} /></div>;
  }

  const isExpired = booking.status === 'EXPIRED' || remainingMs <= 0;

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 text-gold">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-wide">Inventory reserved</span>
        </div>
        <h1 className="mt-2 font-display text-2xl text-indigo-900 dark:text-ivory">Booking {booking.bookingReference}</h1>
        <div className="horizon-rule mt-3" />

        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted dark:text-indigo-300">Status</span>
            <Badge variant={isExpired ? 'error' : 'warning'}>{isExpired ? 'Expired' : booking.status.replace('_', ' ')}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-muted dark:text-indigo-300">Payment</span>
            <Badge variant="neutral">{booking.paymentStatus}</Badge>
          </div>

          {!isExpired && (
            <div className="mt-4 flex items-center gap-2 rounded bg-gold/10 px-3 py-2 text-sm text-indigo-900 dark:text-ivory">
              <Clock className="h-4 w-4 text-gold" />
              Hold expires in <span className="font-medium tabular-nums">{formatCountdown(remainingMs)}</span>
            </div>
          )}

          <div className="mt-5 border-t border-border dark:border-indigo-800 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted dark:text-indigo-300">Base price</span>
              <span className="tabular-nums text-indigo-900 dark:text-ivory">{booking.pricing.currency} {booking.pricing.basePrice.toFixed(2)}</span>
            </div>
            {booking.pricing.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted dark:text-indigo-300">Discount</span>
                <span className="tabular-nums text-success">−{booking.pricing.currency} {booking.pricing.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted dark:text-indigo-300">Taxes</span>
              <span className="tabular-nums text-indigo-900 dark:text-ivory">{booking.pricing.currency} {booking.pricing.taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted dark:text-indigo-300">Fees</span>
              <span className="tabular-nums text-indigo-900 dark:text-ivory">{booking.pricing.currency} {booking.pricing.fees.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border dark:border-indigo-800 pt-2 font-display text-lg text-indigo-900 dark:text-ivory">
              <span>Total</span>
              <span className="tabular-nums">{booking.pricing.currency} {booking.pricing.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {isExpired ? (
          <p className="mt-5 text-sm text-muted dark:text-indigo-300">
            This hold expired and the inventory was released. <Link to="/" className="text-indigo-900 dark:text-ivory underline">Start a new search</Link>.
          </p>
        ) : (
          <Link to={`/bookings/${booking._id}/pay`} className="btn-accent mt-5 w-full">
            Proceed to payment
          </Link>
        )}
      </div>
    </div>
  );
}
