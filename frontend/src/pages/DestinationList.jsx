import { Link } from 'react-router-dom';
import { useDestinations } from '../lib/queries.js';
import Seo from '../components/Seo.jsx';
import { Skeleton, ErrorState } from '../components/ui/Surfaces.jsx';
import { MapPin } from 'lucide-react';

export default function DestinationList() {
  const { data, isLoading, isError, refetch } = useDestinations();

  return (
    <div className="container-page py-10">
      <Seo title="Destinations" description="Explore destinations with live weather, curated highlights, and matching flights, hotels, and packages." />
      <h1 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">Destinations</h1>
      <div className="horizon-rule mt-3" />

      <div className="mt-8">
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        )}
        {isError && <ErrorState description="Couldn't load destinations right now." onRetry={refetch} />}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((dest) => (
              <Link key={dest._id} to={`/destinations/${dest.slug}`} className="card group overflow-hidden">
                <div className="h-52 w-full overflow-hidden bg-indigo-100 dark:bg-indigo-800">
                  {dest.images?.[0] && (
                    <img
                      src={dest.images[0]}
                      alt={dest.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">{dest.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted dark:text-indigo-300">
                    <MapPin className="h-3 w-3" /> {dest.country}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted dark:text-indigo-300">{dest.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
