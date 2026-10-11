import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, Check, X, Users } from 'lucide-react';
import { usePackage } from '../lib/queries.js';
import LeafletMap from '../components/maps/LeafletMap.jsx';
import ReviewsList from '../components/reviews/ReviewsList.jsx';
import Seo from '../components/Seo.jsx';
import { Skeleton, ErrorState, Badge } from '../components/ui/Surfaces.jsx';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: pkg, isLoading, isError, refetch } = usePackage(id);
  const [selectedDate, setSelectedDate] = useState(null);
  const [travelers, setTravelers] = useState(2);

  const goToCheckout = () => {
    navigate('/checkout', {
      state: {
        bookingType: 'package',
        travelerCount: travelers,
        maxTravelers: pkg.maxTravelersPerBooking,
        currency: pkg.currency,
        priceEstimate: pkg.price * travelers,
        summary: {
          title: pkg.title,
          subtitle: `${selectedDate.startDate} · ${travelers} traveler${travelers > 1 ? 's' : ''}`,
        },
        bookingFields: {
          packageId: pkg._id,
          departureDateId: selectedDate._id,
          travelerSlots: travelers,
        },
      },
    });
  };


  if (isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="mt-6 h-8 w-1/3" />
      </div>
    );
  }
  if (isError || !pkg) {
    return <div className="container-page py-10"><ErrorState description="Couldn't load this package." onRetry={refetch} /></div>;
  }

  const total = pkg.price * travelers;

  return (
    <div className="container-page py-10">
      <Seo title={pkg.title} description={pkg.shortDescription || pkg.description} image={pkg.images?.[0]} />
      <div className="h-80 w-full overflow-hidden rounded-lg bg-indigo-100 dark:bg-indigo-800">
        {pkg.images?.[0] && <img src={pkg.images[0]} alt={pkg.title} className="h-full w-full object-cover" />}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="font-display text-3xl text-indigo-900 dark:text-ivory">{pkg.title}</h1>
          <p className="mt-1 text-sm text-muted dark:text-indigo-300">
            {pkg.destination?.name}, {pkg.destination?.country} · {pkg.durationDays} days / {pkg.durationNights} nights
          </p>
          <div className="horizon-rule mt-5" />
          <p className="mt-5 text-sm leading-relaxed text-indigo-900 dark:text-ivory">{pkg.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">Included</h3>
              <ul className="mt-2 space-y-1.5">
                {pkg.included?.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-indigo-900 dark:text-ivory">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">Not included</h3>
              <ul className="mt-2 space-y-1.5">
                {pkg.notIncluded?.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted dark:text-indigo-300">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="mt-8 font-display text-xl text-indigo-900 dark:text-ivory">Day by day</h3>
          <ol className="mt-4 space-y-5 border-l border-border dark:border-indigo-800 pl-5">
            {pkg.itinerary?.map((day) => (
              <li key={day.day} className="relative">
                <span className="absolute -left-[27px] flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-indigo-950">
                  {day.day}
                </span>
                <p className="font-medium text-indigo-900 dark:text-ivory">{day.title}</p>
                <p className="mt-1 text-sm text-muted dark:text-indigo-300">{day.description}</p>
              </li>
            ))}
          </ol>

          {pkg.destination?.coordinates && (
            <>
              <h3 className="mt-8 font-display text-xl text-indigo-900 dark:text-ivory">Where you'll be</h3>
              <div className="mt-3">
                <LeafletMap lat={pkg.destination.coordinates.lat} lng={pkg.destination.coordinates.lng} label={pkg.destination.name} />
              </div>
            </>
          )}

          <h3 className="mt-8 font-display text-xl text-indigo-900 dark:text-ivory">Traveler reviews</h3>
          <div className="mt-4">
            <ReviewsList targetType="package" targetId={pkg._id} />
          </div>
        </div>

        {/* Booking panel */}
        <aside className="h-fit rounded-lg border border-border dark:border-indigo-800 bg-surface dark:bg-indigo-900 p-5 shadow-elevated lg:sticky lg:top-24">
          <p className="font-display text-2xl text-indigo-900 dark:text-ivory tabular-nums">
            ${pkg.price?.toFixed(0)} <span className="text-sm font-sans font-normal text-muted dark:text-indigo-300">/ traveler</span>
          </p>

          <div className="mt-4">
            <label className="label">Departure date</label>
            <div className="space-y-2">
              {pkg.departureDates?.map((d) => (
                <button
                  key={d._id}
                  onClick={() => setSelectedDate(d)}
                  disabled={d.availableSlots <= 0}
                  className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm ${
                    selectedDate?._id === d._id ? 'border-indigo-900 dark:border-gold bg-indigo-50 dark:bg-indigo-800' : 'border-border dark:border-indigo-800'
                  } disabled:opacity-40`}
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" /> {d.startDate}
                  </span>
                  <Badge variant={d.availableSlots > 0 ? 'success' : 'error'}>
                    {d.availableSlots > 0 ? `${d.availableSlots} left` : 'Full'}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="travelers">
              <Users className="mr-1 inline h-3 w-3" /> Travelers
            </label>
            <input
              id="travelers"
              type="number"
              min={1}
              max={pkg.maxTravelersPerBooking}
              className="input"
              value={travelers}
              onChange={(e) => setTravelers(Number(e.target.value))}
            />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-border dark:border-indigo-800 pt-4">
            <span className="text-sm text-muted dark:text-indigo-300">Total</span>
            <span className="font-display text-xl text-indigo-900 dark:text-ivory tabular-nums">${total.toFixed(0)}</span>
          </div>

          <button className="btn-accent mt-4 w-full" disabled={!selectedDate} onClick={goToCheckout}>
            {selectedDate ? 'Continue to booking' : 'Select a departure date'}
          </button>
        </aside>
      </div>
    </div>
  );
}
