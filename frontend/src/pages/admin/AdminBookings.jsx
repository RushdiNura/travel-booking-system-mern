import { useState } from 'react';
import { useAdminBookings } from '../../lib/adminQueries.js';
import { Skeleton, ErrorState, Badge } from '../../components/ui/Surfaces.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { STATUS_VARIANT, PAYMENT_VARIANT } from '../../lib/bookingDisplay.js';

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useAdminBookings({ status: status || undefined, page });

  return (
    <div>
      <select className="input mb-4 max-w-[220px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
        <option value="">All statuses</option>
        <option value="PAYMENT_PENDING">Payment pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="EXPIRED">Expired</option>
      </select>

      {isLoading && <Skeleton className="h-96 w-full" />}
      {isError && <ErrorState description="Couldn't load bookings." onRetry={refetch} />}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border dark:border-indigo-800">
          <table className="w-full text-sm">
            <thead className="bg-ivory dark:bg-indigo-950 text-left text-xs uppercase tracking-wide text-muted dark:text-indigo-300">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((b) => (
                <tr key={b._id} className="border-t border-border dark:border-indigo-800">
                  <td className="px-4 py-3 font-medium text-indigo-900 dark:text-ivory">{b.bookingReference}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{b.user?.name} <br /><span className="text-xs">{b.user?.email}</span></td>
                  <td className="px-4 py-3 capitalize text-muted dark:text-indigo-300">{b.bookingType}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[b.status] || 'neutral'}>{b.status.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-3"><Badge variant={PAYMENT_VARIANT[b.paymentStatus] || 'neutral'}>{b.paymentStatus}</Badge></td>
                  <td className="px-4 py-3 tabular-nums text-indigo-900 dark:text-ivory">{b.pricing.currency} {b.pricing.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3">
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
