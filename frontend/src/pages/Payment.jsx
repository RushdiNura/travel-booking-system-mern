import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useMyBooking, useCreatePaymentIntent } from '../lib/queries.js';
import { getStripe } from '../lib/stripe.js';
import StripePaymentForm from '../components/payment/StripePaymentForm.jsx';
import { Skeleton, ErrorState } from '../components/ui/Surfaces.jsx';

export default function Payment() {
  const { id } = useParams();
  const { data: booking, isLoading: loadingBooking, isError, refetch } = useMyBooking(id);
  const { mutate: createIntent, isPending: creatingIntent } = useCreatePaymentIntent();
  const [intentData, setIntentData] = useState(null);
  const [intentError, setIntentError] = useState('');

  useEffect(() => {
    if (booking && booking.status === 'PAYMENT_PENDING' && !intentData && !intentError) {
      createIntent(booking._id, {
        onSuccess: setIntentData,
        onError: (err) => setIntentError(err.response?.data?.message || 'Could not start payment for this booking.'),
      });
    }
  }, [booking, intentData, intentError, createIntent]);

  if (loadingBooking) {
    return <div className="container-page py-16"><Skeleton className="h-72 w-full max-w-lg" /></div>;
  }
  if (isError || !booking) {
    return <div className="container-page py-16"><ErrorState description="Couldn't load this booking." onRetry={refetch} /></div>;
  }

  if (booking.status !== 'PAYMENT_PENDING') {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
          <h1 className="mt-3 font-display text-xl text-indigo-900 dark:text-ivory">This booking isn't awaiting payment</h1>
          <p className="mt-2 text-sm text-muted dark:text-indigo-300">Its current status is {booking.status.replace('_', ' ')}.</p>
          <Link to={`/bookings/${booking._id}/hold`} className="btn-outline mt-5 inline-flex">View booking</Link>
        </div>
      </div>
    );
  }

  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-warning" />
          <h1 className="mt-3 font-display text-xl text-indigo-900 dark:text-ivory">Payments aren't configured yet</h1>
          <p className="mt-2 text-sm text-muted dark:text-indigo-300">
            Set <code className="rounded bg-indigo-50 dark:bg-indigo-800 px-1.5 py-0.5 text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> in the
            frontend's <code className="rounded bg-indigo-50 dark:bg-indigo-800 px-1.5 py-0.5 text-xs">.env</code> to enable checkout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Payment</h1>
      <div className="horizon-rule mt-3" />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {intentError && (
            <div role="alert" className="rounded border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {intentError}
            </div>
          )}
          {(creatingIntent || !intentData) && !intentError && (
            <div className="flex items-center gap-2 text-sm text-muted dark:text-indigo-300">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure payment...
            </div>
          )}
          {intentData?.clientSecret && (
            <Elements
              stripe={getStripe()}
              options={{ clientSecret: intentData.clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#0B1E3D' } } }}
            >
              <StripePaymentForm bookingId={booking._id} returnPath={`/bookings/${booking._id}/confirmation`} />
            </Elements>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-border dark:border-indigo-800 bg-surface dark:bg-indigo-900 p-5 shadow-elevated">
          <p className="text-sm text-muted dark:text-indigo-300">Booking reference</p>
          <p className="font-medium text-indigo-900 dark:text-ivory">{booking.bookingReference}</p>
          <div className="mt-4 border-t border-border dark:border-indigo-800 pt-4">
            <div className="flex justify-between font-display text-lg text-indigo-900 dark:text-ivory">
              <span>Total due</span>
              <span className="tabular-nums">{booking.pricing.currency} {booking.pricing.total.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
