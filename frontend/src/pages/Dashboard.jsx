import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Plane, LogOut } from "lucide-react";
import { useAuth } from '../context/AuthContext.jsx';
import {
  useMyBookings,
  useCancelBooking,
  useSavedDestinations,
  useUnsaveDestination,
  useUpdateProfile,
} from '../lib/queries.js';
import BookingRow from '../components/dashboard/BookingRow.jsx';
import ItineraryTab from '../components/dashboard/ItineraryTab.jsx';
import Button from '../components/ui/Button.jsx';
import { Skeleton, EmptyState, ErrorState } from '../components/ui/Surfaces.jsx';

const TABS = ['Bookings', 'Itineraries', 'Saved destinations', 'Profile'];

export default function Dashboard() {
  const { user, refreshSession, logout } = useAuth();
  const [tab, setTab] = useState('Bookings');

 const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Welcome back, {user?.name?.split(' ')[0]}</h1>
      <div className="horizon-rule mt-3" />

      <div className="mt-6 flex gap-1 border-b border-border dark:border-indigo-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium ${
              tab === t ? 'border-b-2 border-indigo-900 dark:border-gold text-indigo-900 dark:text-ivory' : 'text-muted dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-ivory'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Bookings' && <BookingsTab />}
        {tab === 'Itineraries' && <ItineraryTab />}
        {tab === 'Saved destinations' && <SavedDestinationsTab />}
        {tab === 'Profile' && <ProfileTab onUpdated={refreshSession} />}
      </div>
    </div>
  );
}

function BookingsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading, isError, refetch } = useMyBookings(statusFilter ? { status: statusFilter } : {});
  const { mutate: cancel, isPending: cancelling } = useCancelBooking();
  const qc = useQueryClient();

  const handleCancel = (id) => {
    if (!confirm('Cancel this booking? This cannot be undone.')) return;
    cancel(
      { id, reason: 'Cancelled by user from dashboard' },
      { onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }) }
    );
  };

  return (
    <div>
      <select className="input mb-4 max-w-[220px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All statuses</option>
        <option value="PAYMENT_PENDING">Payment pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="EXPIRED">Expired</option>
      </select>

      {isLoading && <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}
      {isError && <ErrorState description="Couldn't load your bookings." onRetry={refetch} />}
      {!isLoading && !isError && data?.data?.length === 0 && (
        <EmptyState icon={Plane} title="No bookings yet" description="Your trips will show up here once you book." action={<Link to="/" className="btn-accent">Start exploring</Link>} />
      )}
      {!isLoading && !isError && data?.data?.length > 0 && (
        <div className="space-y-3">
          {data.data.map((b) => (
            <BookingRow key={b._id} booking={b} onCancel={handleCancel} cancelling={cancelling} />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedDestinationsTab() {
  const { data, isLoading, isError, refetch } = useSavedDestinations();
  const { mutate: unsave } = useUnsaveDestination();
  const qc = useQueryClient();

  if (isLoading) return <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;
  if (isError) return <ErrorState description="Couldn't load saved destinations." onRetry={refetch} />;
  if (!data?.length) {
    return (
      <EmptyState
        icon={Heart}
        title="No saved destinations"
        description="Save destinations you're dreaming about to find them here later."
        action={<Link to="/destinations" className="btn-accent">Browse destinations</Link>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((dest) => (
        <div key={dest._id} className="card overflow-hidden">
          <div className="h-32 w-full bg-indigo-100 dark:bg-indigo-800">
            {dest.images?.[0] && <img src={dest.images[0]} alt={dest.name} className="h-full w-full object-cover" />}
          </div>
          <div className="p-4">
            <p className="flex items-center gap-1 font-display text-indigo-900 dark:text-ivory">
              <MapPin className="h-3.5 w-3.5 text-gold" /> {dest.name}
            </p>
            <div className="mt-3 flex gap-2">
              <Link to={`/destinations/${dest.slug}`} className="btn-outline flex-1 justify-center text-xs">View</Link>
              <button
                onClick={() => unsave(dest._id, { onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-destinations'] }) })}
                className="btn-ghost text-xs text-error hover:bg-error/5"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ onUpdated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [success, setSuccess] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSuccess(false);
    updateProfile(form, { onSuccess: () => { setSuccess(true); onUpdated(); } });
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      {success && (
        <div className="rounded border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
          Profile updated.
        </div>
      )}
      <div>
        <label className="label">Full name</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div>
        <label className="label">Phone</label>
        <input
          className="input"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" value={user?.email} disabled />
        <p className="mt-1 text-xs text-muted dark:text-indigo-300">
          Email changes aren't supported yet.
        </p>
      </div>
      <div>
        <label className="label">Loyalty tier</label>
        <p className="text-sm capitalize text-indigo-900 dark:text-ivory">
          {user?.loyalty?.tier} · {user?.loyalty?.pointsBalance} points
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent" loading={isPending}>
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
        </Button>
      </div>
    </form>
  );
}
