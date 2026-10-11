import { Link } from 'react-router-dom';
import { Star, MapPin, Coffee, ShieldCheck } from 'lucide-react';

export default function HotelCard({ hotel }) {
  return (
    <Link to={`/hotels/${hotel._id}`} className="card flex flex-col overflow-hidden sm:flex-row">
      <div className="h-48 w-full shrink-0 bg-indigo-100 dark:bg-indigo-800 sm:h-auto sm:w-64">
        {hotel.images?.[0] && (
          <img src={hotel.images[0]} alt={hotel.name} className="h-full w-full object-cover" loading="lazy" />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">{hotel.name}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted dark:text-indigo-300">
                <MapPin className="h-3 w-3" /> {hotel.address?.city}, {hotel.address?.country}
              </p>
            </div>
            {hotel.ratingAverage > 0 && (
              <div className="flex shrink-0 items-center gap-1 rounded bg-indigo-900 px-2 py-1 text-xs font-medium text-ivory">
                <Star className="h-3 w-3 fill-gold text-gold" /> {hotel.ratingAverage.toFixed(1)}
              </div>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted dark:text-indigo-300">{hotel.shortDescription || hotel.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hotel.breakfastIncluded && (
              <span className="badge-neutral"><Coffee className="mr-1 h-3 w-3" /> Breakfast included</span>
            )}
            {hotel.freeCancellation && (
              <span className="badge-success"><ShieldCheck className="mr-1 h-3 w-3" /> Free cancellation</span>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-xs text-muted dark:text-indigo-300">from</span>
          <p className="font-display text-xl text-indigo-900 dark:text-ivory tabular-nums">
            ${hotel.fromPrice?.toFixed(0)} <span className="text-xs font-sans font-normal text-muted dark:text-indigo-300">/ night</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
