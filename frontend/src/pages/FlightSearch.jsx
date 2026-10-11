import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFlightSearch } from '../lib/queries.js';
import Seo from '../components/Seo.jsx';
import FlightSearchForm from '../components/search/FlightSearchForm.jsx';
import FlightCard from '../components/flights/FlightCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Skeleton } from '../components/ui/Surfaces.jsx';
import { EmptyState, ErrorState } from '../components/ui/Surfaces.jsx';
import { PlaneTakeoff } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'cheapest', label: 'Cheapest' },
  { value: 'fastest', label: 'Fastest' },
  { value: 'departure', label: 'Departure time' },
];

export default function FlightSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('recommended');
  const [maxStops, setMaxStops] = useState('');

  const params = {
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
    travelers: searchParams.get('travelers') || 1,
    cabin: searchParams.get('cabin') || 'economy',
    page,
    sort,
    maxStops: maxStops || undefined,
  };

  const { data, isLoading, isError, refetch } = useFlightSearch(params);

  const handleSearch = (form) => {
    setSearchParams(form);
    setPage(1);
  };

  const hasSearched = Boolean(params.origin && params.destination);

  return (
    <div className="container-page py-10">
      <Seo title="Search flights" description="Search flights by route and date with real-time seat availability, transparent pricing, and no hidden fees." />
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Search flights</h1>
      <div className="horizon-rule mt-3" />

      <div className="mt-6">
        <FlightSearchForm initial={params} onSearch={handleSearch} />
      </div>

      {!hasSearched && (
        <div className="mt-10">
          <EmptyState
            icon={PlaneTakeoff}
            title="Search for a route"
            description="Enter an origin and destination airport code to see available flights."
          />
        </div>
      )}

      {hasSearched && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-6">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted dark:text-indigo-300">Sort by</h3>
              <div className="space-y-1">
                {SORT_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-indigo-900 dark:text-ivory">
                    <input
                      type="radio"
                      name="sort"
                      checked={sort === opt.value}
                      onChange={() => setSort(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted dark:text-indigo-300">Stops</h3>
              <select className="input" value={maxStops} onChange={(e) => setMaxStops(e.target.value)}>
                <option value="">Any</option>
                <option value="0">Nonstop only</option>
                <option value="1">1 stop or fewer</option>
              </select>
            </div>
          </aside>

          <div>
            {isLoading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            )}

            {isError && <ErrorState description="Couldn't load flights right now." onRetry={refetch} />}

            {!isLoading && !isError && data?.data?.length === 0 && (
              <EmptyState
                icon={PlaneTakeoff}
                title="No flights found"
                description="Try a different date or route — this may just mean no flights match this exact search."
              />
            )}

            {!isLoading && !isError && data?.data?.length > 0 && (
              <>
                <p className="mb-4 text-sm text-muted dark:text-indigo-300">{data.meta.total} flights found</p>
                <div className="space-y-3">
                  {data.data.map((flight) => (
                    <FlightCard key={flight._id} flight={flight} />
                  ))}
                </div>
                <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
