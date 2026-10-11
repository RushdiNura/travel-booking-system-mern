import { useState } from 'react';
import { usePackageSearch } from '../lib/queries.js';
import Seo from '../components/Seo.jsx';
import PackageCard from '../components/packages/PackageCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Skeleton, EmptyState, ErrorState } from '../components/ui/Surfaces.jsx';
import { Map } from 'lucide-react';

export default function PackageSearch() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('recommended');
  const [destination, setDestination] = useState('');

  const { data, isLoading, isError, refetch } = usePackageSearch({ page, sort, destination: destination || undefined });

  return (
    <div className="container-page py-10">
      <Seo title="Holiday packages" description="Curated, multi-day trips with accommodation, activities, and transportation planned for you." />
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Holiday packages</h1>
      <div className="horizon-rule mt-3" />
      <p className="mt-3 max-w-xl text-sm text-muted dark:text-indigo-300">
        Curated, multi-day trips with accommodation, activities, and transportation planned for you.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search by destination"
          value={destination}
          onChange={(e) => { setDestination(e.target.value); setPage(1); }}
        />
        <select className="input max-w-[180px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recommended">Recommended</option>
          <option value="price">Price</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      <div className="mt-8">
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
          </div>
        )}
        {isError && <ErrorState description="Couldn't load packages right now." onRetry={refetch} />}
        {!isLoading && !isError && data?.data?.length === 0 && (
          <EmptyState icon={Map} title="No packages found" description="Try a different destination." />
        )}
        {!isLoading && !isError && data?.data?.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((pkg) => <PackageCard key={pkg._id} pkg={pkg} />)}
            </div>
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
