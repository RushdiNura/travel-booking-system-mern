import { Star } from 'lucide-react';
import { useReviews } from '../../lib/queries.js';
import { Skeleton } from '../ui/Surfaces.jsx';

export default function ReviewsList({ targetType, targetId }) {
  const { data, isLoading } = useReviews(targetType, targetId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!data?.data?.length) {
    return <p className="text-sm text-muted dark:text-indigo-300">No reviews yet — be the first to share your experience.</p>;
  }

  return (
    <div className="space-y-5">
      {data.data.map((review) => (
        <div key={review._id} className="border-b border-border dark:border-indigo-800 pb-5 last:border-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-indigo-900 dark:text-ivory">{review.user?.name || 'Traveler'}</p>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-gold text-gold' : 'text-border dark:text-indigo-700'}`} />
              ))}
            </div>
          </div>
          <p className="mt-1.5 text-sm font-medium text-indigo-900 dark:text-ivory">{review.title}</p>
          <p className="mt-1 text-sm text-muted dark:text-indigo-300">{review.comment}</p>
          <p className="mt-1.5 text-xs text-muted dark:text-indigo-300">{new Date(review.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
