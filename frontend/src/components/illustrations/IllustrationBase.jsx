import React from "react";

// Shared wrapper so every illustration exposes the same prop interface:
// size (px, applied to both width/height) and className passthrough.
export default function IllustrationBase({ viewBox = "0 0 100 100", size = 64, className = "", label, children }) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={`illustration-svg ${className}`}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}
