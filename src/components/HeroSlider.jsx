import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAuth } from '../context/AuthContext';

export default function HeroSlider({ featuredMovies }) {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal, setPendingPlayback } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  const totalCards = featuredMovies?.length || 0;

  // Touch and drag tracking
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  const dragStartX = useRef(null);
  const isDragging = useRef(false);

  // Reactive window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-slide to next card every 2 seconds (2000ms) in a continuous loop
  useEffect(() => {
    if (isPaused || totalCards <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalCards);
    }, 2000);

    return () => clearInterval(timer);
  }, [isPaused, totalCards]);

  if (!featuredMovies || featuredMovies.length === 0) return null;

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % totalCards);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  // Touch Handlers for Mobile Swipe
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current || touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    // Allow slight drag follow
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = (e) => {
    if (isSwiping.current && touchStartX.current !== null) {
      const currentX = e.changedTouches[0].clientX;
      const deltaX = currentX - touchStartX.current;
      const currentY = e.changedTouches[0].clientY;
      const deltaY = Math.abs(currentY - (touchStartY.current || 0));

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > deltaY) {
        if (deltaX < 0) {
          // Swiped left -> advance front card to back
          nextCard();
        } else {
          // Swiped right -> bring previous card to front
          prevCard();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
    setSwipeOffset(0);
    setIsPaused(false);
  };

  // Mouse Drag Handlers for Desktop
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPaused(true);
    dragStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const deltaX = e.clientX - dragStartX.current;
    setSwipeOffset(deltaX);
  };

  const handleMouseUp = (e) => {
    if (isDragging.current && dragStartX.current !== null) {
      const deltaX = e.clientX - dragStartX.current;
      if (Math.abs(deltaX) > 50) {
        if (deltaX < 0) {
          nextCard();
        } else {
          prevCard();
        }
      }
    }
    dragStartX.current = null;
    isDragging.current = false;
    setSwipeOffset(0);
    setIsPaused(false);
  };

  // Click handler for cards in the deck
  const handleCardClick = (index, offset, movieId) => {
    if (Math.abs(swipeOffset) > 10) return; // Prevent navigation if dragging

    if (offset === 0) {
      // Front active card -> navigate to movie details
      navigate(`/movie/${movieId}`);
    } else {
      // Peeking card edge clicked -> bring that card directly to front!
      setActiveIndex(index);
    }
  };

  const isMobile = windowWidth < 768;

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        isDragging.current = false;
        setSwipeOffset(0);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 
        3D Stacked Deck Stage Container:
        - Mobile (< md): height exactly 50vh, leaving room on right for peeking card edges
        - Desktop (md and above): height 400px–450px landscape aspect ratio
      */}
      <div className="relative w-full h-[50vh] min-h-[350px] max-h-[500px] md:h-[420px] lg:h-[450px] overflow-hidden flex items-center">
        
        {featuredMovies.map((movie, index) => {
          // Calculate relative position in stack (0 = front, 1 = first behind, 2 = second behind, 3 = third behind)
          const offset = (index - activeIndex + totalCards) % totalCards;
          const isFront = offset === 0;

          // Same 75% top card / 25% revealing below cards ratio across PC, Tablet & Mobile
          let left = '0%';
          let zIndex = 30;
          let scale = 1;
          let translateX = 0;
          let opacity = 1;
          let brightness = 1;

          if (offset === 0) {
            left = '0%';
            zIndex = 30;
            scale = 1;
            translateX = swipeOffset;
            opacity = 1;
            brightness = 1;
          } else if (offset === 1) {
            left = '8.33%';
            zIndex = 20;
            scale = 0.98;
            translateX = 0;
            opacity = 0.94;
            brightness = 0.72;
          } else if (offset === 2) {
            left = '16.67%';
            zIndex = 10;
            scale = 0.96;
            translateX = 0;
            opacity = 0.85;
            brightness = 0.52;
          } else {
            // offset 3: reaches 25% + 75% = 100% full width
            left = '25%';
            zIndex = 5;
            scale = 0.94;
            translateX = 0;
            opacity = 0.75;
            brightness = 0.38;
          }

          return (
            <div
              key={movie.id}
              onClick={() => handleCardClick(index, offset, movie.id)}
              style={{
                left,
                zIndex,
                transform: `translateX(${translateX}px) scale(${scale})`,
                transformOrigin: 'right center',
                opacity,
                filter: `brightness(${brightness})`,
                transition: isSwiping.current || isDragging.current ? 'none' : 'all 450ms cubic-bezier(0.25, 1, 0.5, 1)',
              }}
              className={`
                absolute top-0
                w-[75%]
                h-full
                rounded-xl overflow-hidden
                border border-[#353941] bg-[#282B30]
                cursor-pointer
                ${isFront ? 'shadow-[0_8px_30px_rgba(0,0,0,0.6)]' : 'hover:border-[#7E57C2]'}
              `}
              title={isFront ? `Watch ${movie.title}` : `Bring ${movie.title} to front`}
            >
              {/* Mobile Artwork: Vertical portrait poster */}
              <img
                src={movie.posterUrl || movie.poster}
                alt={movie.title}
                className="block md:hidden w-full h-full object-cover object-center"
                draggable={false}
              />

              {/* Desktop / Tablet Artwork: Horizontal landscape backdrop */}
              <img
                src={movie.backdropUrl || movie.backdrop || movie.posterUrl || movie.poster}
                alt={movie.title}
                className="hidden md:block w-full h-full object-cover object-center opacity-90"
                draggable={false}
              />

              {/* Smooth Matte Fade Gradients (#1E2024) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E2024] via-[#1E2024]/65 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1E2024]/90 via-[#1E2024]/40 to-transparent pointer-events-none hidden md:block" />

              {/* Front Card Text & Action Overlay (Only rendered active on front card) */}
              {isFront ? (
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-7 md:p-9 pointer-events-auto">
                  <div className="max-w-xl space-y-2.5 sm:space-y-3">
                    
                    {/* Genre / Tagline Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded bg-[#1E2024]/90 border border-[#353941] text-[#7E57C2]">
                        {movie.genres?.join(' • ')}
                      </span>
                      <span className="text-xs text-[#B8BCC4] font-medium hidden sm:inline">
                        {movie.year || movie.releaseYear} • {movie.duration}
                      </span>
                    </div>

                    {/* Movie Title in Crisp White */}
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-none leading-tight">
                      {movie.title}
                    </h2>

                    {/* Action Buttons: Matte Purple "Play" & Secondary "Details" */}
                    <div className="flex items-center gap-3 pt-1 sm:pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            setPendingPlayback(movie.id || movie);
                            openAuthModal('login', 'Sign in or create a free account to watch films on Aspectt.');
                            return;
                          }
                          navigate(`/movie/${movie.id}?play=true`);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded bg-[#7E57C2] hover:bg-[#673AB7] active:bg-[#512DA8] text-white font-semibold text-xs sm:text-sm tracking-wide transition-colors duration-150 cursor-pointer shadow-none"
                      >
                        <PlayArrowIcon fontSize="small" />
                        <span>Play</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/movie/${movie.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded bg-[#282B30] hover:bg-[#353941] text-white font-medium text-xs sm:text-sm tracking-wide transition-colors duration-150 border border-[#353941] cursor-pointer"
                      >
                        <InfoOutlinedIcon fontSize="small" className="text-[#B8BCC4]" />
                        <span>Details</span>
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                /* Peeking Edge Card Overlay (Visual Indicator that clicking brings it to front) */
                <div className="absolute inset-0 flex items-center justify-end pr-2 md:pr-4 pointer-events-none">
                  <div className="hidden sm:flex flex-col items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-[10px] uppercase font-bold text-[#7E57C2] tracking-widest rotate-90 whitespace-nowrap">
                      {movie.title}
                    </span>
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {/* Desktop Navigation Chevrons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevCard();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-full bg-[#282B30]/90 hover:bg-[#353941] text-white border border-[#353941] flex items-center justify-center transition-all opacity-80 hover:opacity-100 hidden sm:flex cursor-pointer"
          aria-label="Previous card"
        >
          <ChevronLeftIcon fontSize="small" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            nextCard();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-full bg-[#282B30]/90 hover:bg-[#353941] text-white border border-[#353941] flex items-center justify-center transition-all opacity-80 hover:opacity-100 hidden sm:flex cursor-pointer"
          aria-label="Next card"
        >
          <ChevronRightIcon fontSize="small" />
        </button>

        {/* Clickable Pagination Stack Indicators */}
        <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 z-40 flex items-center gap-1.5 bg-[#1E2024]/85 px-2.5 py-1 rounded-full border border-[#353941]/90">
          {featuredMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(idx);
              }}
              className={`transition-all duration-300 rounded-full cursor-pointer border-none ${
                idx === activeIndex
                  ? 'w-6 h-1.5 bg-[#7E57C2]'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Show stacked card ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
