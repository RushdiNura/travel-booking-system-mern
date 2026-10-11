import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAdminFlights, useCreateFlight, useDeactivateFlight } from '../../lib/adminQueries.js';
import { Skeleton, ErrorState, Badge } from '../../components/ui/Surfaces.jsx';
import Button from '../../components/ui/Button.jsx';

const emptyFlight = {
  airlineName: '', airlineCode: '', flightNumber: '',
  originCode: '', originCity: '', originName: '', originCountry: '',
  destCode: '', destCity: '', destName: '', destCountry: '',
  departureTime: '', arrivalTime: '', durationMinutes: 120, stops: 0,
  economyPrice: 200, economySeats: 100,
};

function toPayload(f) {
  return {
    airline: { name: f.airlineName, code: f.airlineCode },
    flightNumber: f.flightNumber,
    origin: { code: f.originCode.toUpperCase(), city: f.originCity, name: f.originName || f.originCity, country: f.originCountry },
    destination: { code: f.destCode.toUpperCase(), city: f.destCity, name: f.destName || f.destCity, country: f.destCountry },
    departureTime: f.departureTime,
    arrivalTime: f.arrivalTime,
    durationMinutes: Number(f.durationMinutes),
    stops: Number(f.stops),
    cabinClasses: [
      { cabin: 'economy', price: Number(f.economyPrice), totalSeats: Number(f.economySeats), availableSeats: Number(f.economySeats) },
    ],
  };
}

export default function AdminFlights() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyFlight);
  const [error, setError] = useState('');
  const { data, isLoading, isError, refetch } = useAdminFlights();
  const { mutate: create, isPending: creating } = useCreateFlight();
  const { mutate: deactivate } = useDeactivateFlight();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    create(toPayload(form), {
      onSuccess: () => { setShowForm(false); setForm(emptyFlight); },
      onError: (err) => setError(err.response?.data?.message || 'Could not create flight'),
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-indigo-900 dark:text-ivory">Flights</h2>
        <Button variant="outline" onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? 'Close' : 'New flight'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {error && <div className="col-span-full rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</div>}
          <input className="input" placeholder="Airline name" value={form.airlineName} onChange={update('airlineName')} required />
          <input className="input" placeholder="Airline code" value={form.airlineCode} onChange={update('airlineCode')} required />
          <input className="input" placeholder="Flight number" value={form.flightNumber} onChange={update('flightNumber')} required />
          <input className="input" placeholder="Stops" type="number" value={form.stops} onChange={update('stops')} />

          <input className="input uppercase" placeholder="Origin code (JFK)" value={form.originCode} onChange={update('originCode')} required />
          <input className="input" placeholder="Origin city" value={form.originCity} onChange={update('originCity')} required />
          <input className="input" placeholder="Origin airport name" value={form.originName} onChange={update('originName')} />
          <input className="input" placeholder="Origin country" value={form.originCountry} onChange={update('originCountry')} required />

          <input className="input uppercase" placeholder="Destination code" value={form.destCode} onChange={update('destCode')} required />
          <input className="input" placeholder="Destination city" value={form.destCity} onChange={update('destCity')} required />
          <input className="input" placeholder="Destination airport name" value={form.destName} onChange={update('destName')} />
          <input className="input" placeholder="Destination country" value={form.destCountry} onChange={update('destCountry')} required />

          <input className="input" type="datetime-local" value={form.departureTime} onChange={update('departureTime')} required />
          <input className="input" type="datetime-local" value={form.arrivalTime} onChange={update('arrivalTime')} required />
          <input className="input" type="number" placeholder="Duration (min)" value={form.durationMinutes} onChange={update('durationMinutes')} required />

          <input className="input" type="number" placeholder="Economy price" value={form.economyPrice} onChange={update('economyPrice')} required />
          <input className="input" type="number" placeholder="Economy seats" value={form.economySeats} onChange={update('economySeats')} required />

          <div className="col-span-full">
            <Button type="submit" variant="accent" loading={creating}>Create flight</Button>
          </div>
        </form>
      )}

      {isLoading && <Skeleton className="h-96 w-full" />}
      {isError && <ErrorState description="Couldn't load flights." onRetry={refetch} />}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border dark:border-indigo-800">
          <table className="w-full text-sm">
            <thead className="bg-ivory dark:bg-indigo-950 text-left text-xs uppercase tracking-wide text-muted dark:text-indigo-300">
              <tr>
                <th className="px-4 py-3">Flight</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Departs</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((f) => (
                <tr key={f._id} className="border-t border-border dark:border-indigo-800">
                  <td className="px-4 py-3 font-medium text-indigo-900 dark:text-ivory">{f.airline?.name} {f.flightNumber}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{f.origin?.code} → {f.destination?.code}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{new Date(f.departureTime).toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge variant={f.isActive ? 'success' : 'error'}>{f.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3">
                    {f.isActive && <button className="btn-ghost text-xs" onClick={() => deactivate(f._id)}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
