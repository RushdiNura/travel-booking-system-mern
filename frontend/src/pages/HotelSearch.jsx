import { useState } from 'react';
import { useHotelSearch } from '../lib/queries.js';
import Seo from '../components/Seo.jsx';
import HotelCard from '../components/hotels/HotelCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Skeleton, EmptyState, ErrorState } from '../components/ui/Surfaces.jsx';
import { Hotel as HotelIcon, Search } from 'lucide-react';

export default function HotelSearch() {
  const [form, setForm] = useState({ destination: '', checkIn: '', checkOut: '', rooms: 1 });
  const [applied, setApplied] = useState({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('recommended');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [starRating, setStarRating] = useState('');

  const { data, isLoading, isError, refetch } = useHotelSearch({
    ...applied,
    page,
    sort,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    starRating: starRating || undefined,
  });

  const submit = (e) => {
    e.preventDefault();
    setApplied(form);
    setPage(1);
  };

  return (
    <div className="container-page py-10">
      <Seo title="Search hotels" description="Search hotels with real per-night availability, transparent pricing, and free-cancellation filters." />
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Search hotels</h1>
      <div className="horizon-rule mt-3" />

      <form onSubmit={submit} className="card mt-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="label">Destination</label>
          <input
            className="input"
            placeholder="City or destination"
            value={form.destination}
            onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Check-in</label>
          <input
            type="date"
            className="input"
            value={form.checkIn}
            onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Check-out</label>
          <input
            type="date"
            className="input"
            value={form.checkOut}
            onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Rooms</label>
            <input
              type="number"
              min={1}
              className="input"
              value={form.rooms}
              onChange={(e) => setForm((f) => ({ ...f, rooms: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn-accent">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted dark:text-indigo-300">Sort by</h3>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted dark:text-indigo-300">Price / night</h3>
            <div className="flex gap-2">
              <input className="input" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              <input className="input" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted dark:text-indigo-300">Star rating</h3>
            <select className="input" value={starRating} onChange={(e) => setStarRating(e.target.value)}>
              <option value="">Any</option>
              <option value="3">3+ stars</option>
              <option value="4">4+ stars</option>
              <option value="5">5 stars</option>
            </select>
          </div>
        </aside>

        <div>
          {isLoading && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          )}
          {isError && <ErrorState description="Couldn't load hotels right now." onRetry={refetch} />}
          {!isLoading && !isError && data?.data?.length === 0 && (
            <EmptyState icon={HotelIcon} title="No hotels found" description="Try adjusting your dates or filters." />
          )}
          {!isLoading && !isError && data?.data?.length > 0 && (
            <>
              <p className="mb-4 text-sm text-muted dark:text-indigo-300">{data.meta.total} hotels found</p>
              <div className="space-y-4">
                {data.data.map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}
              </div>
              <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
