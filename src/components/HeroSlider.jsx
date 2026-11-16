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
            opacity = 1;
            brightness = 0.8;
          } else if (offset === 2) {
            left = '16.67%';
            zIndex = 10;
            scale = 0.96;
            translateX = 0;
            opacity = 1;
            brightness = 0.65;
          } else {
            // offset 3: reaches 25% + 75% = 100% full width
            left = '25%';
            zIndex = 5;
            scale = 0.94;
            translateX = 0;
            opacity = 1;
            brightness = 0.5;
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
              {/* Mobile Artwork: Vertical portrait poster at 100% crispness */}
              <img
                src={movie.posterUrl || movie.poster}
                alt={movie.title}
                className="block md:hidden w-full h-full object-cover object-center opacity-100"
                draggable={false}
              />

              {/* Desktop / Tablet Artwork: Horizontal landscape backdrop at 100% crispness */}
              <img
                src={movie.backdropUrl || movie.backdrop || movie.posterUrl || movie.poster}
                alt={movie.title}
                className="hidden md:block w-full h-full object-cover object-center opacity-100"
                draggable={false}
              />

              {/* Front Card Action Buttons Overlay (Guaranteed contrast on both dark & bright posters via local pill) */}
              {isFront && (
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 z-10 pointer-events-auto">
                  <div className="flex items-center gap-2 sm:gap-2.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
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
                      className="inline-flex items-center gap-2 px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-semibold text-xs sm:text-sm tracking-wide transition-all duration-150 cursor-pointer border border-white/25 shadow-[0_6px_20px_rgba(0,0,0,0.65)] active:scale-95"
                      aria-label={`Play ${movie.title}`}
                    >
                      <PlayArrowIcon fontSize="small" />
                      <span>Play</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/movie/${movie.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#18181B] hover:bg-[#27272A] active:bg-[#09090B] text-white font-medium text-xs sm:text-sm tracking-wide transition-all duration-150 border border-white/30 cursor-pointer shadow-[0_6px_20px_rgba(0,0,0,0.65)] active:scale-95"
                      aria-label={`View details for ${movie.title}`}
                    >
                      <InfoOutlinedIcon fontSize="small" className="text-white/80" />
                      <span>Details</span>
                    </button>
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
