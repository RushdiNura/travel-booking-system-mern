import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, ShieldCheck, Loader2 } from 'lucide-react';
import { useHotel, useRoomAvailability } from '../lib/queries.js';
import LeafletMap from '../components/maps/LeafletMap.jsx';
import ReviewsList from '../components/reviews/ReviewsList.jsx';
import Seo from '../components/Seo.jsx';
import { Skeleton, ErrorState, Badge } from '../components/ui/Surfaces.jsx';

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: hotel, isLoading, isError, refetch } = useHotel(id);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState(1);

  const { data: availability, isLoading: loadingAvailability } = useRoomAvailability(id, checkIn, checkOut, rooms);

  const selectRoom = (room) => {
    navigate('/checkout', {
      state: {
        bookingType: 'hotel',
        travelerCount: 1,
        maxTravelers: room.capacity.adults + room.capacity.children,
        currency: room.currency,
        priceEstimate: room.totalPriceEstimate,
        summary: {
          title: hotel.name,
          subtitle: `${room.name} · ${checkIn} → ${checkOut} · ${rooms} room${rooms > 1 ? 's' : ''}`,
        },
        bookingFields: {
          hotelId: hotel._id,
          roomTypeId: room.roomTypeId,
          checkIn,
          checkOut,
          rooms,
        },
      },
    });
  };


  if (isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="mt-6 h-8 w-1/3" />
        <Skeleton className="mt-3 h-4 w-2/3" />
      </div>
    );
  }
  if (isError || !hotel) {
    return <div className="container-page py-10"><ErrorState description="Couldn't load this hotel." onRetry={refetch} /></div>;
  }

  return (
    <div className="container-page py-10">
      <Seo title={hotel.name} description={hotel.shortDescription || hotel.description} image={hotel.images?.[0]} />
      {/* Gallery */}
      <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-lg" style={{ height: 360 }}>
        <div className="col-span-4 sm:col-span-2 sm:row-span-2">
          {hotel.images?.[0] && <img src={hotel.images[0]} alt={hotel.name} className="h-full w-full object-cover" />}
        </div>
        {hotel.images?.slice(1, 3).map((img, i) => (
          <div key={i} className="hidden sm:block">
            <img src={img} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-indigo-900 dark:text-ivory">{hotel.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted dark:text-indigo-300">
                <MapPin className="h-4 w-4" /> {hotel.address?.line1}, {hotel.address?.city}, {hotel.address?.country}
              </p>
            </div>
            {hotel.ratingAverage > 0 && (
              <div className="flex items-center gap-1 rounded bg-indigo-900 px-3 py-1.5 text-sm font-medium text-ivory">
                <Star className="h-4 w-4 fill-gold text-gold" /> {hotel.ratingAverage.toFixed(1)}
                <span className="text-indigo-300">({hotel.ratingCount})</span>
              </div>
            )}
          </div>

          <div className="horizon-rule mt-5" />
          <p className="mt-5 text-sm leading-relaxed text-indigo-900 dark:text-ivory">{hotel.description}</p>

          <h2 className="mt-8 font-display text-xl text-indigo-900 dark:text-ivory">Amenities</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {hotel.amenities?.map((a) => <Badge key={a} variant="neutral">{a}</Badge>)}
          </div>

          <h2 className="mt-8 font-display text-xl text-indigo-900 dark:text-ivory">Location</h2>
          <div className="mt-3">
            <LeafletMap lat={hotel.coordinates.lat} lng={hotel.coordinates.lng} label={hotel.name} />
          </div>

          <h2 className="mt-8 font-display text-xl text-indigo-900 dark:text-ivory">Cancellation policy</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted dark:text-indigo-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            {hotel.policies?.cancellationPolicy}
          </p>

          <h2 className="mt-8 font-display text-xl text-indigo-900 dark:text-ivory">Guest reviews</h2>
          <div className="mt-4">
            <ReviewsList targetType="hotel" targetId={hotel._id} />
          </div>
        </div>

        {/* Booking panel */}
        <aside className="h-fit rounded-lg border border-border dark:border-indigo-800 bg-surface dark:bg-indigo-900 p-5 shadow-elevated lg:sticky lg:top-24">
          <h3 className="font-display text-lg text-indigo-900 dark:text-ivory">Check availability</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <label className="label">Check-in</label>
              <input type="date" className="input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="label">Check-out</label>
              <input type="date" className="input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Rooms</label>
            <input type="number" min={1} className="input" value={rooms} onChange={(e) => setRooms(Number(e.target.value))} />
          </div>

          <div className="mt-5 space-y-3">
            {!checkIn || !checkOut ? (
              <p className="text-sm text-muted dark:text-indigo-300">Choose dates to see room availability and pricing.</p>
            ) : loadingAvailability ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-900 dark:text-ivory" />
            ) : (
              availability?.map((room) => (
                <div key={room.roomTypeId} className="rounded border border-border dark:border-indigo-800 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-900 dark:text-ivory">{room.name}</p>
                    {room.canBook ? (
                      <Badge variant="success">{room.minAvailableAcrossStay} left</Badge>
                    ) : (
                      <Badge variant="error">Unavailable</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted dark:text-indigo-300">
                    {room.capacity.adults} adults{room.capacity.children ? ` · ${room.capacity.children} children` : ''}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display text-lg text-indigo-900 dark:text-ivory tabular-nums">
                      ${room.totalPriceEstimate.toFixed(0)} <span className="text-xs font-sans text-muted dark:text-indigo-300">total</span>
                    </span>
                    <button className="btn-accent" disabled={!room.canBook} onClick={() => selectRoom(room)}>
                      Select
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}











//           {/* Unified search card */}
//          
//             
//              
//             </div>
//             <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//               <div>
//                 <label className="label">From</label>
//                 <input className="input" placeholder="Origin city or airport" />
//               </div>
//               <div>
//                 <label className="label">To</label>
//                 <input className="input" placeholder="Destination" />
//               </div>
//               <div>
//                 <label className="label">Depart</label>
//                 <input type="date" className="input" />
//               </div>
//               <div>
//                 <label className="label">Travelers</label>
//                 <input className="input" placeholder="1 adult" />
//               </div>
//             </div>
//             <Link to="/flights" className="btn-accent mt-5 w-full sm:w-auto">
//               Search flights
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Why choose us */}
//       <section className="container-page py-20">
//         <h2 className="font-display text-2xl text-indigo-900 dark:text-ivory sm:text-3xl">
//           Why travelers book with Aerlume
//         </h2>
//         <div className="horizon-rule mt-3" />
//         <div className="mt-10 grid gap-8 sm:grid-cols-3">
//           {WHY_ITEMS.map((item) => (
//             <div key={item.title}>
//               <item.icon className="h-6 w-6 text-gold" aria-hidden="true" />
//               <h3 className="mt-3 font-display text-lg text-indigo-900 dark:text-ivory">
//                 {item.title}
//               </h3>
//               <p className="mt-1.5 text-sm text-muted dark:text-indigo-300">
//                 {item.text}
//               </p>
//             </div>
//           ))}
//         </div>
//       </section>
//     </div>
//   );
// }
