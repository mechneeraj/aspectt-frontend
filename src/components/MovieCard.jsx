import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col cursor-pointer select-none"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 
        Card Thumbnail Container:
        - Mobile (< sm): 3 cards per row, compact vertical orientation with rounded-lg corners
        - PC & Tablet (sm: and above): Compact horizontal orientation (sm:aspect-video 16:9) with rounded-xl corners
      */}
      <div className="relative aspect-poster sm:aspect-video w-full bg-[#282B30] border border-[#353941] rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 group-hover:border-[#4E535E]">
        {!imageError ? (
          <>
            {/* Mobile portrait poster (vertical compact) */}
            <img
              src={movie.posterUrl || movie.poster}
              alt={movie.title}
              onError={() => setImageError(true)}
              loading="lazy"
              className="block sm:hidden w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
            {/* PC and tablet landscape backdrop (horizontal compact) */}
            <img
              src={movie.backdropUrl || movie.backdrop || movie.posterUrl || movie.poster}
              alt={movie.title}
              onError={() => setImageError(true)}
              loading="lazy"
              className="hidden sm:block w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-[#282B30]">
            <span className="text-[#7E57C2] font-bold text-sm sm:text-base mb-0.5">Aspectt</span>
            <span className="text-[10px] sm:text-xs text-[#B8BCC4] truncate max-w-full px-1">{movie.title}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Display ONLY the movie title directly beneath each card */}
      <div className="pt-1 px-0.5">
        <h3 className="text-white text-[11px] sm:text-xs md:text-sm font-medium tracking-tight truncate group-hover:text-[#7E57C2] transition-colors leading-tight">
          {movie.title}
        </h3>
      </div>
    </div>
  );
}
