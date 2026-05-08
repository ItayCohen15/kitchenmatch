import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

export const StarRating: React.FC<Props> = ({ value, onChange, size = 20, readonly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1 flex-row-reverse justify-center">
      {[5, 4, 3, 2, 1].map(star => {
        const filled = (hover || value) >= star;
        return (
          <button
            key={star}
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          </button>
        );
      })}
    </div>
  );
};
