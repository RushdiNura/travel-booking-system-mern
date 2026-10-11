import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

/**
 * Loaded lazily and cached — loadStripe() should only be called once per
 * publishable key. If VITE_STRIPE_PUBLISHABLE_KEY isn't set, this
 * resolves to null and the Payment page shows a clear "not configured"
 * state instead of a cryptic Stripe.js error.
 */
export function getStripe() {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}
