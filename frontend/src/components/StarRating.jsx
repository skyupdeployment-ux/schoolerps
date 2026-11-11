import { useState } from 'react';
import { Star } from 'lucide-react';

// Read-only:   <StarRating value={4} />
// Clickable:   <StarRating value={rating} onChange={setRating} />   (click the same star again to clear)
export default function StarRating({ value = 0, onChange, size = 16, showValue = false }) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === 'function';
  const shown = hover || value || 0;

  return (
    <div className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(shown);
        const star = <Star size={size} className={filled ? 'text-yellow-400' : 'text-gray-300'} fill={filled ? 'currentColor' : 'none'} />;
        return interactive ? (
          <button type="button" key={n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className="p-0.5"
            onMouseEnter={() => setHover(n)} onClick={() => onChange(n === value ? 0 : n)}>{star}</button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
      {showValue && <span className="ml-1 text-xs text-gray-500">{value ? `${Number(value).toFixed(1)} / 5` : 'Not rated'}</span>}
    </div>
  );
}