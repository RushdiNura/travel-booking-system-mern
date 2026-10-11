import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function StripePaymentForm({ bookingId, returnPath }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError('');

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe redirects here after payment methods that require it
        // (3D Secure, certain wallets); the confirmation page then polls
        // the booking for its webhook-confirmed status.
        return_url: `${window.location.origin}${returnPath}`,
      },
    });

    // confirmPayment only returns here on immediate failure (e.g. card
    // declined synchronously) — success cases redirect away entirely.
    if (confirmError) {
      setError(confirmError.message || 'Payment could not be completed. Please try a different method.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement />
      {error && (
        <div role="alert" className="rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          {error}
        </div>
      )}
      <Button type="submit" variant="accent" loading={submitting} disabled={!stripe} className="w-full">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Pay securely
      </Button>
      <p className="text-center text-xs text-muted dark:text-indigo-300">Payments are processed by Stripe. Your card details never touch Aerlume's servers.</p>
    </form>
  );
}
