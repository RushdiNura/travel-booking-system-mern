import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCreateBooking } from '../lib/queries.js';
import TravelerForm from '../components/checkout/TravelerForm.jsx';
import Button from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/Surfaces.jsx';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selection = location.state;

  const [travelers, setTravelers] = useState(
    Array.from({ length: selection?.travelerCount || 1 }, () => ({ firstName: '', lastName: '', type: 'adult' }))
  );
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [serverError, setServerError] = useState('');

  const { mutate, isPending } = useCreateBooking();

  if (!selection) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={AlertCircle}
          title="Nothing to check out"
          description="Start from a flight, hotel, or package to begin a booking."
          action={<Link to="/" className="btn-accent">Browse trips</Link>}
        />
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    setServerError('');

    const payload = {
      bookingType: selection.bookingType,
      travelers,
      contactEmail,
      contactPhone,
      specialRequests,
      ...(couponCode ? { couponCode } : {}),
      ...selection.bookingFields,
    };

    mutate(payload, {
      onSuccess: (booking) => navigate(`/bookings/${booking._id}/hold`),
      onError: (err) => setServerError(err.response?.data?.message || 'Could not create this booking. Please try again.'),
    });
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Review & confirm</h1>
      <div className="horizon-rule mt-3" />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="space-y-8">
          {serverError && (
            <div role="alert" className="rounded border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              {serverError}
            </div>
          )}

          <div>
            <h2 className="font-display text-lg text-indigo-900 dark:text-ivory">Traveler details</h2>
            <div className="mt-4">
              <TravelerForm travelers={travelers} onChange={setTravelers} maxTravelers={selection.maxTravelers || 9} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-indigo-900 dark:text-ivory">Contact information</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Special requests (optional)</label>
            <textarea
              className="input"
              rows={3}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              maxLength={500}
            />
          </div>

          <div>
            <label className="label">Coupon code (optional)</label>
            <input className="input max-w-xs uppercase" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          </div>

          <Button type="submit" variant="accent" loading={isPending} className="w-full sm:w-auto">
            Reserve this booking
          </Button>
          <p className="flex items-start gap-2 text-xs text-muted dark:text-indigo-300">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            This reserves inventory temporarily. You'll have a limited window to complete payment before the hold
            expires and it's released back to availability.
          </p>
        </form>

        <aside className="h-fit rounded-lg border border-border dark:border-indigo-800 bg-surface dark:bg-indigo-900 p-5 shadow-elevated lg:sticky lg:top-24">
          <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">{selection.summary?.title}</h3>
          {selection.summary?.subtitle && <p className="mt-1 text-sm text-muted dark:text-indigo-300">{selection.summary.subtitle}</p>}
          <div className="mt-4 border-t border-border dark:border-indigo-800 pt-4 text-sm text-muted dark:text-indigo-300">
            <p>
              Estimated total: <span className="font-medium text-indigo-900 dark:text-ivory">
                {selection.currency} {selection.priceEstimate?.toFixed(2)}
              </span>
            </p>
            <p className="mt-1 text-xs">Final price — including taxes and fees — is confirmed by the server on the next step.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
