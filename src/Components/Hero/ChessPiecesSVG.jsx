import React, { useId } from "react";

const THEME_PALETTES = {
  classic: {
    stop1: "#6ee7b7",
    stop2: "#10b981",
    stop3: "#065f46",
    stroke: "#a7f3d0",
    glow: "rgba(16, 185, 129, 0.55)",
  },
  blitz: {
    stop1: "#e9d5ff",
    stop2: "#a855f7",
    stop3: "#4c1d95",
    stroke: "#f3e8ff",
    glow: "rgba(168, 85, 247, 0.55)",
  },
  engine: {
    stop1: "#e9d5ff",
    stop2: "#a855f7",
    stop3: "#4c1d95",
    stroke: "#f3e8ff",
    glow: "rgba(168, 85, 247, 0.55)",
  },
  gold: {
    stop1: "#fef08a",
    stop2: "#f59e0b",
    stop3: "#78350f",
    stroke: "#fef9c3",
    glow: "rgba(245, 158, 11, 0.55)",
  },
};

/**
 * Authentic Staunton (Cburnett) Chess Piece Vectors with 3D Metallic/Glass Gradients
 */
export function StauntonPiece({ type = "knight", arena, theme, size, uid }) {
  const reactId = useId().replace(/:/g, "");
  const resolvedTheme = arena || theme || "classic";
  const palette = THEME_PALETTES[resolvedTheme] || THEME_PALETTES.classic;
  const uniqueSuffix = uid || reactId;
  const gradId = `staunton-grad-${type}-${resolvedTheme}-${uniqueSuffix}`;
  const shineId = `staunton-shine-${type}-${resolvedTheme}-${uniqueSuffix}`;

  return (
    <svg
      viewBox="0 0 45 45"
      width={size || undefined}
      height={size || undefined}
      style={size ? { width: size, height: size, flexShrink: 0 } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="staunton-piece-svg"
    >
      <defs>
        <linearGradient id={gradId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor={palette.stop1} stopOpacity="0.95" />
          <stop offset="50%" stopColor={palette.stop2} stopOpacity="0.88" />
          <stop offset="100%" stopColor={palette.stop3} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={shineId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {type === "knight" && (
        <g
          fill={`url(#${gradId})`}
          stroke={palette.stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Authentic Staunton Knight Horse Head & Mane */}
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
          {/* Eye & Nostril */}
          <circle cx="15.5" cy="14.5" r="1.2" fill="#ffffff" stroke="none" />
          <circle cx="9.5" cy="25.5" r="0.8" fill="#ffffff" stroke="none" />
          {/* Base Pedestal */}
          <path d="M 9.5,39 L 35.5,39 L 35.5,41.5 L 9.5,41.5 Z" />
        </g>
      )}

      {type === "king" && (
        <g
          fill={`url(#${gradId})`}
          stroke={palette.stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Crown Cross */}
          <path d="M 22.5,11.63 L 22.5,6" strokeWidth="1.8" />
          <path d="M 20,8 L 25,8" strokeWidth="1.8" />
          {/* Center Jewel Spire */}
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
          {/* Royal Mantle & Base */}
          <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z" />
          <path d="M 11.5,30 C 17,27 27,27 32.5,30" fill="none" />
          <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" fill="none" />
          <path d="M 11.5,37 C 17,34 27,34 32.5,37" fill="none" />
        </g>
      )}

      {type === "queen" && (
        <g
          fill={`url(#${gradId})`}
          stroke={palette.stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Coronet Pearls */}
          <circle cx="6" cy="12" r="2" />
          <circle cx="14" cy="9" r="2" />
          <circle cx="22.5" cy="8" r="2" />
          <circle cx="31" cy="9" r="2" />
          <circle cx="39" cy="12" r="2" />
          {/* Queen Crown Body */}
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,11 L 14,25 L 7,14 L 9,26 z" />
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" />
          <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" />
        </g>
      )}

      {type === "bishop" && (
        <g
          fill={`url(#${gradId})`}
          stroke={palette.stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Mitre Orb & Body */}
          <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
          <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
          <circle cx="22.5" cy="8" r="2.2" />
          {/* Mitre Cross Cut */}
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" fill="none" />
        </g>
      )}

      {type === "rook" && (
        <g
          fill={`url(#${gradId})`}
          stroke={palette.stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Battlements & Tower */}
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
          <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
        </g>
      )}

      {type === "pawn" && (
        <g
          fill={`url(#${gradId})`}
          stroke={palette.stroke}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Classic Staunton Pawn */}
          <path d="M 22.5,9 C 19.5,9 17,11.5 17,14.5 C 17,16.8 18.4,18.7 20.4,19.5 C 17.5,21 15,24 15,29 C 15,31 16,32.5 16,32.5 L 12,36 C 11,37 11,39 11,39 L 34,39 C 34,39 34,37 33,36 L 29,32.5 C 29,32.5 30,31 30,29 C 30,24 27.5,21 24.6,19.5 C 26.6,18.7 28,16.8 28,14.5 C 28,11.5 25.5,9 22.5,9 z" />
          <path d="M 16,32.5 L 29,32.5" fill="none" />
        </g>
      )}
    </svg>
  );
}
