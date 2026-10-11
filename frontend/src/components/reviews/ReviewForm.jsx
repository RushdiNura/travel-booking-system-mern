import { useState } from 'react';
import { Star } from 'lucide-react';
import { useCreateReview } from '../../lib/queries.js';
import Button from '../ui/Button.jsx';

export default function ReviewForm({ booking, onDone }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const { mutate: submit, isPending } = useCreateReview();

  const targetType = booking.bookingType === 'hotel' ? 'hotel' : 'package';
  const targetId = booking.bookingType === 'hotel' ? booking.hotel?.hotelRef?._id : booking.package?.packageRef?._id;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    submit(
      { bookingId: booking._id, targetType, targetId, rating, title, comment },
      { onSuccess: onDone, onError: (err) => setError(err.response?.data?.message || 'Could not submit review') }
    );
  };

  if (!targetId) return null; // e.g. flight bookings aren't reviewable in this model

  return (
    <form onSubmit={handleSubmit} className="card mt-2 space-y-3 p-4">
      {error && <div className="rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</div>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={`h-5 w-5 ${n <= rating ? 'fill-gold text-gold' : 'text-border dark:text-indigo-700'}`} />
          </button>
        ))}
      </div>
      <input className="input" placeholder="Review title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
      <textarea className="input" rows={3} placeholder="Share details of your experience" value={comment} onChange={(e) => setComment(e.target.value)} required maxLength={2000} />
      <Button type="submit" variant="accent" loading={isPending}>Submit review</Button>
    </form>
  );
}
