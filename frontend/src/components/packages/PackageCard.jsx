import { Link } from 'react-router-dom';
import { Star, CalendarDays, MapPin } from 'lucide-react';

export default function PackageCard({ pkg }) {
  return (
    <Link to={`/packages/${pkg._id}`} className="card flex flex-col overflow-hidden">
      <div className="h-48 w-full bg-indigo-100 dark:bg-indigo-800">
        {pkg.images?.[0] && <img src={pkg.images[0]} alt={pkg.title} className="h-full w-full object-cover" loading="lazy" />}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">{pkg.title}</h3>
            {pkg.ratingAverage > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-900 dark:text-ivory">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {pkg.ratingAverage.toFixed(1)}
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted dark:text-indigo-300">
            <MapPin className="h-3 w-3" /> {pkg.destination?.name}, {pkg.destination?.country}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-muted dark:text-indigo-300">{pkg.shortDescription}</p>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted dark:text-indigo-300">
            <CalendarDays className="h-3 w-3" /> {pkg.durationDays} days / {pkg.durationNights} nights
          </p>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-xs text-muted dark:text-indigo-300">from</span>
          <p className="font-display text-xl text-indigo-900 dark:text-ivory tabular-nums">
            ${pkg.price?.toFixed(0)} <span className="text-xs font-sans font-normal text-muted dark:text-indigo-300">/ traveler</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
