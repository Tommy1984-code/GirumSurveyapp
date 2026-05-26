import React from 'react';

export default function StarRating({ value, min = 1, max = 5, onChange, size = 'md' }) {
  const stars = [];
  for (let i = min; i <= max; i += 1) stars.push(i);
  const sizes = { xs: 'w-4 h-4', sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9', xl: 'w-11 h-11' };
  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="flex gap-1">
      {stars.map((starValue) => {
        const active = starValue <= (Number(value) || 0);
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange && onChange(starValue)}
            className={`${sizeClass} transition-all duration-200 hover:scale-110 ${
              active ? 'text-amber-400 drop-shadow-sm' : 'text-gray-300 hover:text-amber-200'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.6l2.9 5.9 6.6 1-4.8 4.6 1.1 6.5L12 17.5 6.2 20.6l1.1-6.5L2.5 9.5l6.6-1L12 2.6z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
