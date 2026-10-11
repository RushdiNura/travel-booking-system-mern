import { useNavigate } from 'react-router-dom';
import { Plane } from 'lucide-react';

const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDuration = (mins) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

export default function FlightCard({ flight, travelers = 1 }) {
  const navigate = useNavigate();
  const cabin = flight.selectedCabin;

  const selectFlight = () => {
    navigate('/checkout', {
      state: {
        bookingType: 'flight',
        travelerCount: travelers,
        currency: flight.currency,
        priceEstimate: cabin.price * travelers,
        summary: {
          title: `${flight.origin?.code} → ${flight.destination?.code}`,
          subtitle: `${flight.airline?.name} ${flight.flightNumber} · ${fmtTime(flight.departureTime)} · ${cabin.cabin.replace('_', ' ')}`,
        },
        bookingFields: {
          flightId: flight._id,
          cabin: cabin.cabin,
          tripType: 'one_way',
        },
      },
    });
  };

  return (
    <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-800 text-indigo-900 dark:text-ivory">
          <Plane className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-indigo-900 dark:text-ivory">
            {flight.airline?.name} · {flight.flightNumber}
          </p>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted dark:text-indigo-300 tabular-nums">
            <span>{fmtTime(flight.departureTime)}</span>
            <span className="text-border dark:text-indigo-700">—</span>
            <span>{fmtTime(flight.arrivalTime)}</span>
            <span className="text-xs">({fmtDuration(flight.durationMinutes)})</span>
          </div>
          <p className="mt-0.5 text-xs text-muted dark:text-indigo-300">
            {flight.origin?.code} → {flight.destination?.code} ·{' '}
            {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-display text-xl text-indigo-900 dark:text-ivory tabular-nums">
          {flight.currency} {cabin?.price?.toFixed(0)}
        </p>
        <button onClick={selectFlight} className="btn-accent">
          Select
        </button>
      </div>
    </div>
  );
}
