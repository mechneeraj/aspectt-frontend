import React, { useState, useEffect, useCallback } from 'react';

/**
 * Aspectt OTT - Cinema-Grade Intro Splash Animation
 * 
 * Reuses the EXACT ASPECTT Brand Logo from AspectLogo.jsx:
 * - ViewBox: 0 0 126 28
 * - Typography: 'Montserrat', 'Inter', 'Arial Black', sans-serif (Weight: 800, LetterSpacing: -0.01em)
 * - Brand Colors: Matte Purple (#7E57C2) & Crisp White (#FFFFFF)
 * - Background: Deep Matte Cinema Black (#09090B)
 * 
 * Sequence (2.0s total):
 * - Stage 1 (0.0s - 0.6s): Merged Purple 'A' Monogram at center (Left stroke '/' + tilted final 'T')
 * - Stage 2 (0.6s - 1.4s): Rubber-Band Elastic Split & Middle Letters (A body + S P E C T) pop into place
 * - Stage 3 (1.4s - 2.0s): Full ASPECTT wordmark lock-in, cinema light sheen, hold, then smooth dissolve at 2.0s
 */
export default function SplashIntro() {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('intro') || searchParams.has('splash')) {
        return true;
      }
      const hasSeen = sessionStorage.getItem('aspectt_intro_seen');
      if (hasSeen === 'true') {
        return true;
      }
      sessionStorage.setItem('aspectt_intro_seen', 'true');
      return true;
    } catch {
      return false;
    }
  });

  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 600);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Lock body scroll while intro animation plays
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Stage 3 hold & initiate smooth fade-out at 2.0s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3000);

    // Complete unmount after fade transition (2.4s)
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 6000);

    // Keyboard shortcut to dismiss (Escape, Space, Enter)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleDismiss]);

  if (!isVisible) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[99999] bg-[#09090B] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-400 ease-out ${isFadingOut
        ? 'opacity-0 scale-[1.02] pointer-events-none'
        : 'opacity-100 scale-100 pointer-events-auto'
        }`}
      aria-label="Aspectt Intro Splash"
      role="banner"
    >
      <style>{`
        /* -------------------------------------------------------------
         * 1. Ultra-Smooth 60fps Wave Bounce (No SVG filter lag)
         * ------------------------------------------------------------- */
        @keyframes aspecttWaveBounce {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.84);
          }
          42% {
            opacity: 1;
            transform: translateY(-4px) scale(1.14);
          }
          68% {
            opacity: 1;
            transform: translateY(1.2px) scale(0.98);
          }
          85% {
            opacity: 1;
            transform: translateY(-0.5px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }

        /* -------------------------------------------------------------
         * 2. Ambient Aura / Bloom
         * ------------------------------------------------------------- */
        @keyframes aspecttAmbientBloom {
          0% {
            opacity: 0.25;
            transform: scale(0.85);
          }
          45% {
            opacity: 0.85;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.55;
            transform: scale(1.08);
          }
        }

        /* -------------------------------------------------------------
         * 3. Cinema Lens Sheen Sweep
         * ------------------------------------------------------------- */
        @keyframes aspecttCinemaSheen {
          0%, 55% {
            opacity: 0;
            transform: translateX(-120%) skewX(-20deg);
          }
          70% {
            opacity: 0.75;
          }
          90%, 100% {
            opacity: 0;
            transform: translateX(220%) skewX(-20deg);
          }
        }

        .wave-char {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center bottom;
          animation: aspecttWaveBounce 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }

        /* Tighter, snappier wave stagger (finishes cleanly at ~1.15s) */
        .wave-delay-0 { animation-delay: 0.04s; } /* A */
        .wave-delay-1 { animation-delay: 0.09s; } /* S */
        .wave-delay-2 { animation-delay: 0.14s; } /* P */
        .wave-delay-3 { animation-delay: 0.19s; } /* E */
        .wave-delay-4 { animation-delay: 0.24s; } /* C */
        .wave-delay-5 { animation-delay: 0.29s; } /* T */
        .wave-delay-6 { animation-delay: 0.34s; } /* T (Purple) */

        .anim-ambient-glow {
          animation: aspecttAmbientBloom 2.0s ease-out forwards;
          will-change: transform, opacity;
        }

        .anim-sheen-sweep {
          animation: aspecttCinemaSheen 2.0s ease-in-out forwards;
          will-change: transform, opacity;
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="anim-ambient-glow w-[360px] sm:w-[500px] md:w-[600px] h-[360px] sm:h-[500px] md:h-[600px] rounded-full bg-radial from-[#7E57C2]/30 via-[#7E57C2]/10 to-transparent blur-[80px]" />
      </div>

      {/* Subtle Top & Bottom Cinematic Borders */}
      <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-[#7E57C2]/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-[#7E57C2]/30 to-transparent pointer-events-none" />

      {/* Centerpiece Logo Container */}
      <div className="relative z-10 w-full max-w-[280px] xs:max-w-[340px] sm:max-w-[440px] md:max-w-[540px] lg:max-w-[600px] px-4 flex flex-col items-center justify-center">
        {/* Main Kinetic SVG Wordmark */}
        <div className="relative w-full overflow-visible">
          <svg
            viewBox="0 0 128 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto overflow-visible select-none"
            role="img"
            aria-label="ASPECTT"
          >
            <title>ASPECTT</title>

            {/* --- Letter 'A' (White Body + Purple '/' in front layer) --- */}
            <g className="wave-char wave-delay-0">
              <path
                d="M 15.7 5 L 23.2 23 L 20.2 23 L 18.53 19 L 9.0 19 L 9.0 16.5 L 17.49 16.5 L 14.1 8.5 Z"
                fill="#FFFFFF"
              />
              <polygon
                points="1.0,23 8.2,23 15.7,5 8.5,5"
                fill="#7E57C2"
              />
            </g>

            {/* --- Letter 'S' --- */}
            <text
              x="25.5"
              y="23"
              fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
              fontSize="25"
              fontWeight="800"
              fill="#FFFFFF"
              className="wave-char wave-delay-1"
            >
              S
            </text>

            {/* --- Letter 'P' --- */}
            <text
              x="42.2"
              y="23"
              fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
              fontSize="25"
              fontWeight="800"
              fill="#FFFFFF"
              className="wave-char wave-delay-2"
            >
              P
            </text>

            {/* --- Letter 'E' --- */}
            <text
              x="60.6"
              y="23"
              fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
              fontSize="25"
              fontWeight="800"
              fill="#FFFFFF"
              className="wave-char wave-delay-3"
            >
              E
            </text>

            {/* --- Letter 'C' --- */}
            <text
              x="77.8"
              y="23"
              fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
              fontSize="25"
              fontWeight="800"
              fill="#FFFFFF"
              className="wave-char wave-delay-4"
            >
              C
            </text>

            {/* --- Second-to-last Letter 'T' (White) --- */}
            <text
              x="98.2"
              y="23"
              fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
              fontSize="25"
              fontWeight="800"
              fill="#FFFFFF"
              className="wave-char wave-delay-5"
            >
              T
            </text>

            {/* --- Final Letter 'T' (Purple, cleanly spaced) --- */}
            <text
              x="113.5"
              y="23"
              fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
              fontSize="25"
              fontWeight="800"
              fill="#7E57C2"
              className="wave-char wave-delay-6"
            >
              T
            </text>
          </svg>

          {/* Cinema Light Sheen Sweep after wave settles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="anim-sheen-sweep w-24 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
