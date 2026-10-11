import { Users, ClipboardList, DollarSign, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAdminOverview } from '../../lib/adminQueries.js';
import { Skeleton, ErrorState } from '../../components/ui/Surfaces.jsx';

const CARDS = [
  { key: 'totalUsers', label: 'Total users', icon: Users, format: (v) => v },
  { key: 'totalBookings', label: 'Total bookings', icon: ClipboardList, format: (v) => v },
  { key: 'totalRevenue', label: 'Revenue (paid)', icon: DollarSign, format: (v) => `$${v.toFixed(2)}` },
  { key: 'confirmedBookings', label: 'Confirmed', icon: CheckCircle2, format: (v) => v },
  { key: 'cancelledBookings', label: 'Cancelled', icon: XCircle, format: (v) => v },
  { key: 'pendingPayments', label: 'Pending payment', icon: Clock, format: (v) => v },
];

export default function AdminOverview() {
  const { data, isLoading, isError, refetch } = useAdminOverview();

  if (isLoading) return <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (isError) return <ErrorState description="Couldn't load overview stats." onRetry={refetch} />;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {CARDS.map((card) => (
        <div key={card.key} className="card p-5">
          <div className="flex items-center gap-2 text-muted dark:text-indigo-300">
            <card.icon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">{card.label}</span>
          </div>
          <p className="mt-2 font-display text-2xl text-indigo-900 dark:text-ivory tabular-nums">{card.format(data[card.key])}</p>
        </div>
      ))}
    </div>
  );
}
