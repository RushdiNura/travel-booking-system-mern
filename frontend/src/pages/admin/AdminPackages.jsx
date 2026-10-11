import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAdminPackages, useCreatePackage, useDeactivatePackage } from '../../lib/adminQueries.js';
import { useDestinations } from '../../lib/queries.js';
import { Skeleton, ErrorState, Badge } from '../../components/ui/Surfaces.jsx';
import Button from '../../components/ui/Button.jsx';

const emptyPackage = {
  title: '', destination: '', price: 1000, durationDays: 5, durationNights: 4,
  description: '', maxTravelersPerBooking: 8,
};

export default function AdminPackages() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPackage);
  const [error, setError] = useState('');
  const { data, isLoading, isError, refetch } = useAdminPackages();
  const { data: destinations } = useDestinations();
  const { mutate: create, isPending: creating } = useCreatePackage();
  const { mutate: deactivate } = useDeactivatePackage();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    create(
      {
        title: form.title,
        slug,
        destination: form.destination,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        durationNights: Number(form.durationNights),
        description: form.description,
        maxTravelersPerBooking: Number(form.maxTravelersPerBooking),
        itinerary: [{ day: 1, title: 'Arrival', description: 'Arrival and check-in.' }],
        departureDates: [],
      },
      {
        onSuccess: () => { setShowForm(false); setForm(emptyPackage); },
        onError: (err) => setError(err.response?.data?.message || 'Could not create package'),
      }
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-indigo-900 dark:text-ivory">Packages</h2>
        <Button variant="outline" onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? 'Close' : 'New package'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {error && <div className="col-span-full rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</div>}
          <input className="input" placeholder="Package title" value={form.title} onChange={update('title')} required />
          <select className="input" value={form.destination} onChange={update('destination')} required>
            <option value="">Select destination</option>
            {destinations?.data?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input className="input" type="number" placeholder="Price per traveler" value={form.price} onChange={update('price')} required />
          <input className="input" type="number" placeholder="Duration (days)" value={form.durationDays} onChange={update('durationDays')} required />
          <input className="input" type="number" placeholder="Duration (nights)" value={form.durationNights} onChange={update('durationNights')} required />
          <input className="input" type="number" placeholder="Max travelers/booking" value={form.maxTravelersPerBooking} onChange={update('maxTravelersPerBooking')} />
          <textarea className="input col-span-full" rows={2} placeholder="Description" value={form.description} onChange={update('description')} required />
          <p className="col-span-full text-xs text-muted dark:text-indigo-300">
            A single-day placeholder itinerary is created — add the full day-by-day plan and departure dates by editing this package's record directly for now (a dedicated itinerary editor UI is a good next addition).
          </p>
          <div className="col-span-full">
            <Button type="submit" variant="accent" loading={creating}>Create package</Button>
          </div>
        </form>
      )}

      {isLoading && <Skeleton className="h-96 w-full" />}
      {isError && <ErrorState description="Couldn't load packages." onRetry={refetch} />}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border dark:border-indigo-800">
          <table className="w-full text-sm">
            <thead className="bg-ivory dark:bg-indigo-950 text-left text-xs uppercase tracking-wide text-muted dark:text-indigo-300">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p._id} className="border-t border-border dark:border-indigo-800">
                  <td className="px-4 py-3 font-medium text-indigo-900 dark:text-ivory">{p.title}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{p.destination?.name}</td>
                  <td className="px-4 py-3 tabular-nums text-indigo-900 dark:text-ivory">${p.price?.toFixed(0)}</td>
                  <td className="px-4 py-3"><Badge variant={p.isActive ? 'success' : 'error'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3">
                    {p.isActive && <button className="btn-ghost text-xs" onClick={() => deactivate(p._id)}>Deactivate</button>}
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
