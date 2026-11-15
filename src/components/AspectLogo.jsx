import React from 'react';

/**
 * AspectLogo - Custom Sharp Flat-Matte SVG Wordmark for "ASPECTT"
 * 
 * Design specifications:
 * 1. Bold Geometric Typography:
 *    - Uppercase geometric sans-serif ('Montserrat', 'Inter', 'Arial Black', sans-serif)
 *    - Bold weight (800), tight uniform letter spacing, flat matte finish with zero shadows or gradients.
 * 2. Wide Slanted Purple Parallelogram on "A":
 *    - Right diagonal leg and horizontal crossbar of the "A" in crisp White (#FFFFFF).
 *    - Left ascending leg of the "A" is a solid, extra-wide slanted parallelogram (/) in Matte Purple (#7E57C2)
 *      running cleanly from the exact top cap-height (y=5) down to the bottom baseline (y=23), matching the exact angle of the "A".
 * 3. White "SPECT" + Matte Purple Final "T":
 *    - "SPECT" in crisp White (#FFFFFF).
 *    - Final "T" in Matte Purple (#7E57C2), balancing the purple opening parallelogram of the "A".
 *    - Matches height, stroke weight, and baseline of the entire wordmark.
 */
export default function AspectLogo({ className = 'h-6 sm:h-7 w-auto' }) {
  return (
    <svg
      viewBox="0 0 126 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none pointer-events-none`}
      role="img"
      aria-label="ASPECTT"
    >
      <title>ASPECTT</title>

      {/* --- Letter 'A': Geometric Construction --- */}
      <g id="letter-A">
        {/* Right diagonal leg and horizontal crossbar in crisp White (#FFFFFF) */}
        <path
          d="M 15.7 5 L 23.2 23 L 20.2 23 L 18.53 19 L 9.0 19 L 9.0 16.5 L 17.49 16.5 L 14.1 8.5 Z"
          fill="#FFFFFF"
        />

        {/* Solid, Extra-Wide Slanted Parallelogram (/) in Matte Purple (#7E57C2) */}
        {/* Runs cleanly from exact top cap-height (y=5) down to bottom baseline (y=23) matching exact angle */}
        <polygon
          points="1.0,23 8.2,23 15.7,5 8.5,5"
          fill="#7E57C2"
        />
      </g>

      {/* --- Wordmark Letters: "SPECT" (White) + Final "T" (Matte Purple #7E57C2) --- */}
      <text
        x="25.5"
        y="23"
        fontFamily="'Montserrat', 'Inter', 'Arial Black', sans-serif"
        fontSize="25"
        fontWeight="800"
        letterSpacing="-0.01em"
      >
        <tspan fill="#FFFFFF">SPECT</tspan>
        <tspan fill="#7E57C2">T</tspan>
      </text>
    </svg>
  );
}
