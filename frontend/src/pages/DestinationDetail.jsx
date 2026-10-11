import { useParams, Link } from 'react-router-dom';
import { CloudSun, MapPin, Heart } from 'lucide-react';
import { useDestination, useDestinationWeather, useSaveDestination, useUnsaveDestination, useSavedDestinations } from '../lib/queries.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeafletMap from '../components/maps/LeafletMap.jsx';
import CurrencyConverter from '../components/currency/CurrencyConverter.jsx';
import Seo from '../components/Seo.jsx';
import { Skeleton, ErrorState, Badge } from '../components/ui/Surfaces.jsx';

export default function DestinationDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: dest, isLoading, isError, refetch } = useDestination(slug);
  const { data: weather } = useDestinationWeather(slug);
  const { data: saved } = useSavedDestinations();
  const { mutate: save, isPending: saving } = useSaveDestination();
  const { mutate: unsave, isPending: unsaving } = useUnsaveDestination();

  const isSaved = saved?.some((d) => d._id === dest?._id);

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (isError || !dest) {
    return <div className="container-page py-10"><ErrorState description="Couldn't load this destination." onRetry={refetch} /></div>;
  }

  return (
    <div className="container-page py-10">
      <Seo title={dest.name} description={dest.shortDescription || dest.description} image={dest.images?.[0]} />
      <div className="h-80 w-full overflow-hidden rounded-lg bg-indigo-100 dark:bg-indigo-800">
        {dest.images?.[0] && <img src={dest.images[0]} alt={dest.name} className="h-full w-full object-cover" />}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-indigo-900 dark:text-ivory">{dest.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted dark:text-indigo-300">
                <MapPin className="h-4 w-4" /> {dest.country}
              </p>
            </div>
            {user && (
              <button
                onClick={() => (isSaved ? unsave(dest._id) : save(dest._id))}
                disabled={saving || unsaving}
                className="btn-outline shrink-0"
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-error text-error' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
          <div className="horizon-rule mt-5" />
          <p className="mt-5 text-sm leading-relaxed text-indigo-900 dark:text-ivory">{dest.description}</p>

          {dest.highlights?.length > 0 && (
            <>
              <h3 className="mt-8 font-display text-lg text-indigo-900 dark:text-ivory">Highlights</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {dest.highlights.map((h) => <Badge key={h} variant="neutral">{h}</Badge>)}
              </div>
            </>
          )}

          <h3 className="mt-8 font-display text-lg text-indigo-900 dark:text-ivory">Location</h3>
          <div className="mt-3">
            <LeafletMap lat={dest.coordinates.lat} lng={dest.coordinates.lng} label={dest.name} zoom={11} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`/flights?destination=${dest.slug}`} className="btn-outline">Find flights</Link>
            <Link to={`/hotels?destination=${dest.slug}`} className="btn-outline">Find hotels</Link>
            <Link to={`/packages?destination=${dest.slug}`} className="btn-outline">See packages</Link>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-border dark:border-indigo-800 bg-surface dark:bg-indigo-900 p-5 shadow-elevated">
          <h3 className="flex items-center gap-2 font-display text-lg text-indigo-900 dark:text-ivory">
            <CloudSun className="h-5 w-5 text-gold" /> Weather
          </h3>
          {!weather ? (
            <Skeleton className="mt-3 h-20 w-full" />
          ) : weather.source === 'unavailable' ? (
            <p className="mt-3 text-sm text-muted dark:text-indigo-300">{weather.error}</p>
          ) : (
            <>
              <p className="mt-3 font-display text-3xl text-indigo-900 dark:text-ivory tabular-nums">
                {Math.round(weather.current.temperatureC)}°C
              </p>
              <p className="text-xs text-muted dark:text-indigo-300">Live conditions via Open-Meteo</p>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {weather.daily?.slice(0, 4).map((d) => (
                  <div key={d.date} className="text-xs">
                    <p className="text-muted dark:text-indigo-300">{new Date(d.date).toLocaleDateString([], { weekday: 'short' })}</p>
                    <p className="mt-1 font-medium text-indigo-900 dark:text-ivory tabular-nums">{Math.round(d.maxC)}°</p>
                    <p className="text-muted dark:text-indigo-300 tabular-nums">{Math.round(d.minC)}°</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-5 border-t border-border dark:border-indigo-800 pt-4 text-xs text-muted dark:text-indigo-300">
            <p><span className="font-medium text-indigo-900 dark:text-ivory">Best time to visit:</span> {dest.bestTimeToVisit}</p>
            <p className="mt-1"><span className="font-medium text-indigo-900 dark:text-ivory">Currency:</span> {dest.currency}</p>
          </div>
        </aside>
      </div>

      <div className="mt-8 max-w-md">
        <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">Currency converter</h3>
        <p className="mt-1 text-xs text-muted dark:text-indigo-300">
          Rates are estimates from a third-party provider, refreshed on request — always confirm the current rate
          with your bank or card provider before relying on it for a purchase.
        </p>
        <div className="card mt-3 p-4">
          <CurrencyConverter defaultTo={dest.currency} />
        </div>
      </div>
    </div>
  );
}
