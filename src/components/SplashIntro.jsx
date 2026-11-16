import React, { useState, useEffect, useCallback } from 'react';

/**
 * Aspectt OTT - Cinema-Grade Intro Splash Animation
 * 
 * Features:
 * 1. 2-Second Sequence:
 *    - 0.0s - 0.6s: Stage 1 — Merged Purple 'A' Monogram at center (Left stroke '/' + tilted final 'T')
 *    - 0.6s - 1.4s: Stage 2 — Rubber-Band Elastic Split & Middle Letters (S P E C T) pop into place
 *    - 1.4s - 2.0s: Stage 3 — Full ASPECTT lock-in, cinema light sheen, and smooth dissolve
 * 2. Session Control:
 *    - Runs once per browser session via `sessionStorage.getItem('aspectt_intro_seen')`
 *    - Supports instant testing anytime with `?intro=true` query param
 *    - Click / Tap or Escape key to skip anytime
 * 3. 60 FPS GPU-Accelerated:
 *    - Pure CSS keyframes using transform (translate3d, rotate, scale) & opacity
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
    }, 1000);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Lock body scroll while intro animation plays
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Stage 3 fade-out at 2s
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // Complete unmount at 4s
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

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
      className={`fixed inset-0 z-[99999] bg-[#09090B] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer transition-all duration-300 ${isFadingOut
        ? 'opacity-0 scale-[1.03] pointer-events-none'
        : 'opacity-100 scale-100 pointer-events-auto'
        }`}
      aria-label="Aspectt Intro Splash"
      role="banner"
    >
      <style>{`
        /* -------------------------------------------------------------
         * 1. Monogram Left Stroke ('/' of A): Center -> Snap Left
         * ------------------------------------------------------------- */
        @keyframes aspecttLeftStroke {
          0% {
            transform: translate3d(148px, 0, 0);
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.85));
          }
          28% {
            transform: translate3d(148px, 0, 0);
            opacity: 1;
            filter: drop-shadow(0 0 22px rgba(139, 92, 246, 0.9));
          }
          33% {
            /* Anticipation / tension */
            transform: translate3d(152px, 0, 0) scale(0.96, 1.04);
          }
          56% {
            /* Rubber-band overshoot to the left */
            transform: translate3d(-18px, 0, 0) scale(1.08, 0.95);
          }
          72% {
            /* Spring recoil */
            transform: translate3d(4px, 0, 0) scale(0.98, 1.02);
          }
          85%, 100% {
            /* Locked into final wordmark position */
            transform: translate3d(0, 0, 0) scale(1, 1);
            filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.4));
          }
        }

        /* -------------------------------------------------------------
         * 2. Final Purple 'T': Tilted at Center -> Straighten & Snap Right
         * ------------------------------------------------------------- */
        @keyframes aspecttRightT {
          0% {
            transform: translate3d(-148px, 0, 0) rotate(22.6deg);
            transform-origin: 398px 24px;
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.85));
          }
          28% {
            transform: translate3d(-148px, 0, 0) rotate(22.6deg);
            transform-origin: 398px 24px;
            opacity: 1;
            filter: drop-shadow(0 0 22px rgba(139, 92, 246, 0.9));
          }
          33% {
            /* Anticipation / tension */
            transform: translate3d(-152px, 0, 0) rotate(24deg) scale(0.96, 1.04);
            transform-origin: 398px 24px;
          }
          56% {
            /* Rubber-band overshoot to the right and upright */
            transform: translate3d(18px, 0, 0) rotate(-3.5deg) scale(1.08, 0.95);
            transform-origin: 398px 24px;
          }
          72% {
            /* Spring recoil */
            transform: translate3d(-4px, 0, 0) rotate(0.8deg) scale(0.98, 1.02);
            transform-origin: 398px 24px;
          }
          85%, 100% {
            /* Locked into final wordmark position */
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1);
            transform-origin: 398px 24px;
            filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.4));
          }
        }

        /* -------------------------------------------------------------
         * 3. Middle Letters & 'A' White Body: Pop & Spring Between
         * ------------------------------------------------------------- */
        @keyframes aspecttMiddlePop {
          0%, 30% {
            opacity: 0;
            transform: scale(0.3) translateY(8px);
          }
          55% {
            opacity: 1;
            transform: scale(1.14) translateY(-3px);
          }
          72% {
            transform: scale(0.97) translateY(1px);
          }
          85%, 100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* -------------------------------------------------------------
         * 4. Ambient Aura / Bloom behind Monogram
         * ------------------------------------------------------------- */
        @keyframes aspecttAmbientBloom {
          0% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          28% {
            opacity: 0.85;
            transform: scale(1.05);
          }
          55% {
            opacity: 0.95;
            transform: scale(1.4, 0.9);
          }
          85%, 100% {
            opacity: 0.6;
            transform: scale(1.6, 1);
          }
        }

        /* -------------------------------------------------------------
         * 5. Cinema Lens Sheen / Light Shimmer (Stage 3)
         * ------------------------------------------------------------- */
        @keyframes aspecttCinemaSheen {
          0%, 65% {
            opacity: 0;
            transform: translateX(-120%) skewX(-20deg);
          }
          70% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          95%, 100% {
            opacity: 0;
            transform: translateX(220%) skewX(-20deg);
          }
        }

        .anim-stroke-left {
          animation: aspecttLeftStroke 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, filter;
        }

        .anim-t-right {
          animation: aspecttRightT 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          will-change: transform, filter;
        }

        .anim-middle-a-white {
          animation: aspecttMiddlePop 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) 0.04s forwards;
          transform-origin: 92px 50px;
          will-change: transform, opacity;
        }

        .anim-middle-s {
          animation: aspecttMiddlePop 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s forwards;
          transform-origin: 142px 50px;
          will-change: transform, opacity;
        }

        .anim-middle-p {
          animation: aspecttMiddlePop 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) 0.12s forwards;
          transform-origin: 194px 50px;
          will-change: transform, opacity;
        }

        .anim-middle-e {
          animation: aspecttMiddlePop 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) 0.06s forwards;
          transform-origin: 246px 50px;
          will-change: transform, opacity;
        }

        .anim-middle-c {
          animation: aspecttMiddlePop 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) 0.14s forwards;
          transform-origin: 298px 50px;
          will-change: transform, opacity;
        }

        .anim-middle-t1 {
          animation: aspecttMiddlePop 2.05s cubic-bezier(0.34, 1.56, 0.64, 1) 0.18s forwards;
          transform-origin: 350px 50px;
          will-change: transform, opacity;
        }

        .anim-ambient-glow {
          animation: aspecttAmbientBloom 2.05s ease-out forwards;
        }

        .anim-sheen-sweep {
          animation: aspecttCinemaSheen 2.05s ease-in-out forwards;
        }
      `}</style>

      {/* Ambient Cinema Radial Purple Backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="anim-ambient-glow w-[380px] sm:w-[520px] md:w-[620px] h-[380px] sm:h-[520px] md:h-[620px] rounded-full bg-radial from-[#7C3AED]/25 via-[#6D28D9]/10 to-transparent blur-[80px]" />
      </div>

      {/* Subtle Top & Bottom Cinematic Letterbox Borders */}
      <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-[#7C3AED]/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-[#7C3AED]/30 to-transparent pointer-events-none" />

      {/* Centerpiece Logo Container */}
      <div className="relative z-10 w-full max-w-[320px] xs:max-w-[380px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[620px] px-4 flex flex-col items-center justify-center">

        {/* Main Kinetic SVG Wordmark */}
        <div className="relative w-full overflow-visible">
          <svg
            viewBox="0 0 460 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto overflow-visible select-none drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
          >
            {/* SVG Filter for Deep Purple Cinema Bloom */}
            <defs>
              <filter id="purpleGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ==============================================================
             * 1. Letter 'A' - Left Solid Slanted Parallelogram '/' (PURPLE)
             * Starts at center joined with 'T', then snaps left with elastic recoil
             * ============================================================== */}
            <g id="intro-a-left-stroke" className="anim-stroke-left">
              <polygon
                points="50,78 69,78 93,22 74,22"
                fill="#8B5CF6"
              />
            </g>

            {/* ==============================================================
             * 2. Letter 'A' - Right Leg & Crossbar (CRISP WHITE)
             * Pops and joins the left stroke as it arrives
             * ============================================================== */}
            <g id="intro-a-white-body" className="anim-middle-a-white">
              <path
                d="M 93 22 L 116 78 L 102 78 L 96 64 L 72 64 L 72 55 L 93 55 L 85 36 Z"
                fill="#FFFFFF"
              />
            </g>

            {/* ==============================================================
             * 3. Middle Wordmark Letters: S P E C T (CRISP WHITE)
             * Pop and stretch into place between the split ends
             * ============================================================== */}
            {/* Letter 'S' */}
            <g id="intro-letter-s" className="anim-middle-s">
              <text
                x="142"
                y="78"
                fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
                fontSize="74"
                fontWeight="900"
                textAnchor="middle"
                fill="#FFFFFF"
                letterSpacing="-0.02em"
              >
                S
              </text>
            </g>

            {/* Letter 'P' */}
            <g id="intro-letter-p" className="anim-middle-p">
              <text
                x="194"
                y="78"
                fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
                fontSize="74"
                fontWeight="900"
                textAnchor="middle"
                fill="#FFFFFF"
                letterSpacing="-0.02em"
              >
                P
              </text>
            </g>

            {/* Letter 'E' (Exact Center at X=246) */}
            <g id="intro-letter-e" className="anim-middle-e">
              <text
                x="246"
                y="78"
                fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
                fontSize="74"
                fontWeight="900"
                textAnchor="middle"
                fill="#FFFFFF"
                letterSpacing="-0.02em"
              >
                E
              </text>
            </g>

            {/* Letter 'C' */}
            <g id="intro-letter-c" className="anim-middle-c">
              <text
                x="298"
                y="78"
                fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
                fontSize="74"
                fontWeight="900"
                textAnchor="middle"
                fill="#FFFFFF"
                letterSpacing="-0.02em"
              >
                C
              </text>
            </g>

            {/* Letter 'T' (First T, White) */}
            <g id="intro-letter-t1" className="anim-middle-t1">
              <text
                x="350"
                y="78"
                fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
                fontSize="74"
                fontWeight="900"
                textAnchor="middle"
                fill="#FFFFFF"
                letterSpacing="-0.02em"
              >
                T
              </text>
            </g>

            {/* ==============================================================
             * 4. Final Letter 'T' (SIGNATURE PURPLE #8B5CF6 / #7C3AED)
             * Starts tilted at center meeting '/', then straightens & snaps right
             * ============================================================== */}
            <g id="intro-t-final" className="anim-t-right">
              <path
                d="M 379 22 L 417 22 L 417 32 L 404 32 L 404 78 L 392 78 L 392 32 L 379 32 Z"
                fill="#8B5CF6"
              />
            </g>
          </svg>

          {/* Stage 3 Horizontal Cinema Light Sheen Line */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="anim-sheen-sweep w-24 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-sm" />
          </div>
        </div>

        {/* Studio Sub-label */}
        {/* <div className="mt-4 flex items-center gap-2 tracking-[0.28em] text-[9px] sm:text-[11px] font-semibold text-[#8A8F99] uppercase opacity-75">
          <span>Cinema</span>
          <span className="w-1 h-1 rounded-full bg-[#7C3AED]" />
          <span>Auteur</span>
          <span className="w-1 h-1 rounded-full bg-[#7C3AED]" />
          <span>Archives</span>
        </div> */}
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

