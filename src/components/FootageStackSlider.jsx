import React, { useState, useRef } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function FootageStackSlider({ clips = [], onWatchClip }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const totalCards = clips.length;
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isSwiping = useRef(false);

  const dragStartX = useRef(null);
  const isDragging = useRef(false);

  if (!clips || totalCards === 0) return null;

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % totalCards);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  // Touch Handlers for Mobile Swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current || touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    setSwipeOffset(deltaX);
  };

  const handleTouchEnd = (e) => {
    if (isSwiping.current && touchStartX.current !== null) {
      const currentX = e.changedTouches[0].clientX;
      const deltaX = currentX - touchStartX.current;
      const currentY = e.changedTouches[0].clientY;
      const deltaY = Math.abs(currentY - (touchStartY.current || 0));

      if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > deltaY) {
        if (deltaX < 0) {
          nextCard();
        } else {
          prevCard();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
    setSwipeOffset(0);
  };

  // Mouse Drag Handlers for Testing/Emulation
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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
      if (Math.abs(deltaX) > 40) {
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
  };

  const handleCardClick = (index, offset) => {
    if (Math.abs(swipeOffset) > 10) return;
    if (offset !== 0) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="w-full select-none">
      {/* Stacked Deck Stage Container: Horizontal Stack where top card covers 75% and beneath cards reveal across remaining 25% */}
      <div
        className="relative w-full h-[235px] overflow-hidden flex items-center touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDragging.current = false;
          setSwipeOffset(0);
        }}
      >
        {clips.map((clip, index) => {
          const offset = (index - activeIndex + totalCards) % totalCards;
          const isFront = offset === 0;

          // Top card covers 75% of the width (0% to 75%).
          // Remaining 25% is occupied by below cards revealing evenly (8.33% slice each at 8.33%, 16.67%, 25% left).
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
            opacity = 0.92;
            brightness = 0.72;
          } else if (offset === 2) {
            left = '16.67%';
            zIndex = 10;
            scale = 0.96;
            translateX = 0;
            opacity = 0.80;
            brightness = 0.54;
          } else {
            // offset 3: reaches 25% + 75% = 100% full width
            left = '25%';
            zIndex = 5;
            scale = 0.94;
            translateX = 0;
            opacity = 0.65;
            brightness = 0.40;
          }

          return (
            <div
              key={clip.id}
              onClick={() => handleCardClick(index, offset)}
              style={{
                left,
                zIndex,
                transform: `translateX(${translateX}px) scale(${scale})`,
                transformOrigin: 'right center',
                opacity,
                filter: `brightness(${brightness})`,
                transition:
                  isSwiping.current || isDragging.current
                    ? 'none'
                    : 'all 360ms cubic-bezier(0.25, 1, 0.5, 1)',
              }}
              className={`
                absolute top-0
                w-[75%] h-full
                rounded-xl overflow-hidden
                border border-[#353941] bg-[#282B30]
                cursor-pointer flex flex-col justify-between
                ${isFront ? 'shadow-[0_10px_25px_rgba(0,0,0,0.65)]' : 'hover:border-[#7E57C2]'}
              `}
              title={
                isFront
                  ? `Watch ${clip.role || 'Filmmaker'} : ${clip.personName || clip.filmmakerName || clip.director}`
                  : `Bring to front`
              }
            >
              {/* Clean Thumbnail Container */}
              <div className="relative aspect-video w-full bg-[#1E2024] overflow-hidden flex-shrink-0">
                <img
                  src={clip.thumbnailUrl || clip.image}
                  alt={clip.personName || clip.filmmakerName || clip.director}
                  className="w-full h-full object-cover opacity-90"
                  draggable={false}
                />

                {/* Central Play Trigger (Front Card Only) */}
                {isFront && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (Math.abs(swipeOffset) > 10) return;
                      onWatchClip(clip);
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity cursor-pointer"
                    aria-label={`Play ${clip.role || 'Filmmaker'} : ${clip.personName || clip.filmmakerName || clip.director}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#7E57C2] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                      <PlayArrowIcon fontSize="small" />
                    </div>
                  </button>
                )}
              </div>

              {/* Card Body: Only {clip.role} : {clip.personName} and Play button */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <p
                  className="text-xs text-white truncate"
                  title={`${clip.role || 'Filmmaker'} : ${clip.personName || clip.filmmakerName || clip.director}`}
                >
                  <span className="text-[#8A8F99] font-normal">{clip.role || 'Filmmaker'} : </span>
                  <strong className="text-white font-medium">
                    {clip.personName || clip.filmmakerName || clip.director}
                  </strong>
                </p>

                {/* Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (Math.abs(swipeOffset) > 10) return;
                    if (isFront) {
                      onWatchClip(clip);
                    } else {
                      setActiveIndex(index);
                    }
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-[#7E57C2] hover:bg-[#673AB7] active:bg-[#512DA8] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-none"
                >
                  <PlayArrowIcon sx={{ fontSize: 14 }} className="text-white" />
                  <span>Play</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Centered Dots Indicator just below the cards */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {clips.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              i === activeIndex
                ? 'w-5 h-1.5 bg-[#7E57C2]'
                : 'w-1.5 h-1.5 bg-[#353941] hover:bg-[#8A8F99]'
            }`}
            aria-label={`Go to clip ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

