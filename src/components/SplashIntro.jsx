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
        return false;
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
    }, 400);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Lock body scroll while intro animation plays
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Stage 3 hold & initiate smooth fade-out at 2.0s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // Complete unmount after fade transition (2.4s)
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2400);

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
      className={`fixed inset-0 z-[99999] bg-[#09090B] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-400 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
      aria-label="Aspectt Intro Splash"
      role="banner"
    >
      <style>{`
        /* -------------------------------------------------------------
         * 1. Monogram Left Stroke ('/' of A): Center -> Elastic Snap Left
         * ------------------------------------------------------------- */
        @keyframes aspecttLeftStroke {
          0% {
            transform: translate3d(47.3px, 0, 0);
            opacity: 1;
            filter: drop-shadow(0 0 16px rgba(126, 87, 194, 0.9));
          }
          28% {
            transform: translate3d(47.3px, 0, 0);
            opacity: 1;
            filter: drop-shadow(0 0 18px rgba(126, 87, 194, 0.95));
          }
          33% {
            /* Elastic anticipation tension pulling slightly right */
            transform: translate3d(48.8px, 0, 0) scale(0.96, 1.04);
          }
          58% {
            /* Rubber-band overshoot snapping left past resting origin */
            transform: translate3d(-4.5px, 0, 0) scale(1.06, 0.96);
          }
          74% {
            /* Spring recoil */
            transform: translate3d(1.2px, 0, 0) scale(0.99, 1.01);
          }
          86%, 100% {
            /* Locked into exact real logo position */
            transform: translate3d(0, 0, 0) scale(1, 1);
            filter: drop-shadow(0 0 6px rgba(126, 87, 194, 0.35));
          }
        }

        /* -------------------------------------------------------------
         * 2. Final Purple 'T': Tilted at Center -> Straighten & Snap Right
         * ------------------------------------------------------------- */
        @keyframes aspecttRightT {
          0% {
            transform: translate3d(-44.8px, 0, 0) rotate(22.6deg);
            transform-origin: 107.8px 5px;
            opacity: 1;
            filter: drop-shadow(0 0 16px rgba(126, 87, 194, 0.9));
          }
          28% {
            transform: translate3d(-44.8px, 0, 0) rotate(22.6deg);
            transform-origin: 107.8px 5px;
            opacity: 1;
            filter: drop-shadow(0 0 18px rgba(126, 87, 194, 0.95));
          }
          33% {
            /* Elastic anticipation tension */
            transform: translate3d(-46.2px, 0, 0) rotate(24deg) scale(0.96, 1.04);
            transform-origin: 107.8px 5px;
          }
          58% {
            /* Rubber-band overshoot snapping right and upright */
            transform: translate3d(4.5px, 0, 0) rotate(-3.5deg) scale(1.06, 0.96);
            transform-origin: 107.8px 5px;
          }
          74% {
            /* Spring recoil */
            transform: translate3d(-1.2px, 0, 0) rotate(0.8deg) scale(0.99, 1.01);
            transform-origin: 107.8px 5px;
          }
          86%, 100% {
            /* Locked into exact real logo position */
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1);
            transform-origin: 107.8px 5px;
            filter: drop-shadow(0 0 6px rgba(126, 87, 194, 0.35));
          }
        }

        /* -------------------------------------------------------------
         * 3. Middle Letters & 'A' White Body: Pop & Spring Between
         * ------------------------------------------------------------- */
        @keyframes aspecttMiddlePop {
          0%, 30% {
            opacity: 0;
            transform: scale(0.4) translateY(2px);
          }
          58% {
            opacity: 1;
            transform: scale(1.08) translateY(-0.6px);
          }
          74% {
            opacity: 1;
            transform: scale(0.98) translateY(0.2px);
          }
          86%, 100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* -------------------------------------------------------------
         * 4. Ambient Aura / Bloom behind Monogram
         * ------------------------------------------------------------- */
        @keyframes aspecttAmbientBloom {
          0% {
            opacity: 0.35;
            transform: scale(0.85);
          }
          28% {
            opacity: 0.85;
            transform: scale(1.05);
          }
          58% {
            opacity: 0.95;
            transform: scale(1.35, 0.9);
          }
          86%, 100% {
            opacity: 0.55;
            transform: scale(1.5, 1);
          }
        }

        /* -------------------------------------------------------------
         * 5. Cinema Lens Sheen / Light Shimmer (Stage 3)
         * ------------------------------------------------------------- */
        @keyframes aspecttCinemaSheen {
          0%, 68% {
            opacity: 0;
            transform: translateX(-120%) skewX(-20deg);
          }
          72% {
            opacity: 0.8;
          }
          84% {
            opacity: 0.8;
          }
          94%, 100% {
            opacity: 0;
            transform: translateX(220%) skewX(-20deg);
          }
        }

        .anim-stroke-left {
          animation: aspecttLeftStroke 2.0s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, filter;
        }

        .anim-t-right {
          animation: aspecttRightT 2.0s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, filter;
        }

        .anim-middle-a-white {
          animation: aspecttMiddlePop 2.0s cubic-bezier(0.34, 1.56, 0.64, 1) 0.02s forwards;
          transform-origin: 19px 14px;
          will-change: transform, opacity;
        }

        .anim-middle-spect {
          animation: aspecttMiddlePop 2.0s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s forwards;
          transform-origin: 63px 14px;
          will-change: transform, opacity;
        }

        .anim-ambient-glow {
          animation: aspecttAmbientBloom 2.0s ease-out forwards;
        }

        .anim-sheen-sweep {
          animation: aspecttCinemaSheen 2.0s ease-in-out forwards;
        }
      `}</style>

      {/* Ambient Cinema Radial Purple Backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="anim-ambient-glow w-[360px] sm:w-[500px] md:w-[600px] h-[360px] sm:h-[500px] md:h-[600px] rounded-full bg-radial from-[#7E57C2]/30 via-[#7E57C2]/10 to-transparent blur-[80px]" />
      </div>

      {/* Subtle Top & Bottom Cinematic Borders */}
      <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-[#7E57C2]/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-[#7E57C2]/30 to-transparent pointer-events-none" />

      {/* Centerpiece Logo Container */}
      <div className="relative z-10 w-full max-w-[280px] xs:max-w-[340px] sm:max-w-[440px] md:max-w-[540px] lg:max-w-[600px] px-4 flex flex-col items-center justify-center">

        {/* Main Kinetic SVG Wordmark (Exact AspectLogo Structure & Styling) */}
        <div className="relative w-full overflow-visible">
          <svg
            viewBox="0 0 126 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto overflow-visible select-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
            role="img"
            aria-label="ASPECTT"
          >
            <title>ASPECTT</title>

            {/* --- Letter 'A': Left Slanted Parallelogram '/' in Matte Purple (#7E57C2) --- */}
            {/* Starts at center merged with final 'T', then snaps left with elastic rubber-band spring */}
            <g id="intro-a-left-stroke" className="anim-stroke-left">
              <polygon
                points="1.0,23 8.2,23 15.7,5 8.5,5"
                fill="#7E57C2"
              />
            </g>

            {/* --- Letter 'A': Right Diagonal Leg & Crossbar in Crisp White (#FFFFFF) --- */}
            {/* Pops into place as the left stroke arrives */}
            <g id="intro-a-white-body" className="anim-middle-a-white">
              <path
                d="M 15.7 5 L 23.2 23 L 20.2 23 L 18.53 19 L 9.0 19 L 9.0 16.5 L 17.49 16.5 L 14.1 8.5 Z"
                fill="#FFFFFF"
              />
            </g>

            {/* --- Wordmark Middle Letters: "SPECT" in Crisp White (#FFFFFF) --- */}
            {/* Exact font-family, font-size (25), font-weight (800), letter-spacing (-0.01em) */}
            <g id="intro-letters-spect" className="anim-middle-spect">
              <text
                x="25.5"
                y="23"
                fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
                fontSize="25"
                fontWeight="800"
                letterSpacing="-0.01em"
                fill="#FFFFFF"
              >
                SPECT
              </text>
            </g>

            {/* --- Final Letter 'T' in Matte Purple (#7E57C2) --- */}
            {/* Starts tilted at center forming the right stroke of the 'A' monogram, then straightens & snaps right */}
            <g id="intro-t-final" className="anim-t-right">
              <text
                x="100.5"
                y="23"
                fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
                fontSize="25"
                fontWeight="800"
                letterSpacing="-0.01em"
                fill="#7E57C2"
              >
                T
              </text>
            </g>
          </svg>

          {/* Stage 3 Horizontal Cinema Light Sheen Line */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="anim-sheen-sweep w-24 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />
          </div>
        </div>
      </div>

      {/* Discrete Skip Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute bottom-6 right-6 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-[11px] font-medium tracking-wider uppercase text-white/50 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
        title="Skip intro animation"
        aria-label="Skip intro animation"
      >
        <span>Skip</span>
        <span className="text-[9px] text-white/30 hidden sm:inline">[Esc]</span>
      </button>
    </div>
  );
}
