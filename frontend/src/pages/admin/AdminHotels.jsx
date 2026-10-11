import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAdminHotels, useCreateHotel, useDeactivateHotel } from '../../lib/adminQueries.js';
import { useDestinations } from '../../lib/queries.js';
import { Skeleton, ErrorState, Badge } from '../../components/ui/Surfaces.jsx';
import Button from '../../components/ui/Button.jsx';

const emptyHotel = {
  name: '', destination: '', city: '', country: '', starRating: 4,
  description: '', lat: '', lng: '',
};

export default function AdminHotels() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyHotel);
  const [error, setError] = useState('');
  const { data, isLoading, isError, refetch } = useAdminHotels();
  const { data: destinations } = useDestinations();
  const { mutate: create, isPending: creating } = useCreateHotel();
  const { mutate: deactivate } = useDeactivateHotel();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const slug = `${form.name}-${form.city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    create(
      {
        name: form.name,
        slug,
        destination: form.destination,
        starRating: Number(form.starRating),
        description: form.description,
        address: { city: form.city, country: form.country },
        coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
      },
      {
        onSuccess: () => { setShowForm(false); setForm(emptyHotel); },
        onError: (err) => setError(err.response?.data?.message || 'Could not create hotel'),
      }
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-indigo-900 dark:text-ivory">Hotels</h2>
        <Button variant="outline" onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? 'Close' : 'New hotel'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {error && <div className="col-span-full rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</div>}
          <input className="input" placeholder="Hotel name" value={form.name} onChange={update('name')} required />
          <select className="input" value={form.destination} onChange={update('destination')} required>
            <option value="">Select destination</option>
            {destinations?.data?.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input className="input" type="number" placeholder="Star rating" min={1} max={5} value={form.starRating} onChange={update('starRating')} />
          <input className="input" placeholder="City" value={form.city} onChange={update('city')} required />
          <input className="input" placeholder="Country" value={form.country} onChange={update('country')} required />
          <div className="flex gap-2">
            <input className="input" type="number" step="any" placeholder="Lat" value={form.lat} onChange={update('lat')} required />
            <input className="input" type="number" step="any" placeholder="Lng" value={form.lng} onChange={update('lng')} required />
          </div>
          <textarea className="input col-span-full" rows={2} placeholder="Description" value={form.description} onChange={update('description')} required />
          <div className="col-span-full">
            <Button type="submit" variant="accent" loading={creating}>Create hotel</Button>
          </div>
        </form>
      )}

      {isLoading && <Skeleton className="h-96 w-full" />}
      {isError && <ErrorState description="Couldn't load hotels." onRetry={refetch} />}
      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border border-border dark:border-indigo-800">
          <table className="w-full text-sm">
            <thead className="bg-ivory dark:bg-indigo-950 text-left text-xs uppercase tracking-wide text-muted dark:text-indigo-300">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((h) => (
                <tr key={h._id} className="border-t border-border dark:border-indigo-800">
                  <td className="px-4 py-3 font-medium text-indigo-900 dark:text-ivory">{h.name}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{h.destination?.name}</td>
                  <td className="px-4 py-3 text-muted dark:text-indigo-300">{h.starRating}★</td>
                  <td className="px-4 py-3"><Badge variant={h.isActive ? 'success' : 'error'}>{h.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3">
                    {h.isActive && <button className="btn-ghost text-xs" onClick={() => deactivate(h._id)}>Deactivate</button>}
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
