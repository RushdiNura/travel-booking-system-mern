import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminRevenue, useAdminBookingsOverTime, useAdminPopularDestinations, useAdminCancellationRate } from '../../lib/adminQueries.js';
import { Skeleton, ErrorState } from '../../components/ui/Surfaces.jsx';

export default function AdminAnalytics() {
  const revenue = useAdminRevenue(30);
  const bookings = useAdminBookingsOverTime(30);
  const popular = useAdminPopularDestinations();
  const cancellation = useAdminCancellationRate();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox label="Cancellation rate" value={cancellation.data ? `${cancellation.data.cancellationRatePercent}%` : '—'} />
        <StatBox label="Avg booking value" value={cancellation.data ? `$${cancellation.data.averageBookingValue.toFixed(2)}` : '—'} />
        <StatBox label="Total bookings (all time)" value={cancellation.data?.totalBookings ?? '—'} />
        <StatBox label="Cancelled (all time)" value={cancellation.data?.cancelledBookings ?? '—'} />
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">Revenue — last 30 days</h3>
        {revenue.isLoading && <Skeleton className="mt-4 h-64 w-full" />}
        {revenue.isError && <ErrorState description="Couldn't load revenue data." onRetry={revenue.refetch} />}
        {revenue.data && revenue.data.length === 0 && <p className="mt-4 text-sm text-muted dark:text-indigo-300">No paid bookings in this period yet.</p>}
        {revenue.data?.length > 0 && (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#0B1E3D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">Bookings — last 30 days</h3>
        {bookings.isLoading && <Skeleton className="mt-4 h-64 w-full" />}
        {bookings.data?.length > 0 && (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookings.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="confirmed" fill="#1E8E5A" />
                <Bar dataKey="cancelled" fill="#C0392B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">Most popular destinations</h3>
        {popular.isLoading && <Skeleton className="mt-4 h-48 w-full" />}
        {popular.data?.length === 0 && <p className="mt-4 text-sm text-muted dark:text-indigo-300">No confirmed hotel/package bookings yet.</p>}
        {popular.data?.length > 0 && (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popular.data.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D4" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="bookingCount" fill="#F4A340" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-muted dark:text-indigo-300">{label}</p>
      <p className="mt-1 font-display text-xl text-indigo-900 dark:text-ivory tabular-nums">{value}</p>
    </div>
  );
}
