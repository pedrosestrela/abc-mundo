import React from "react";

// Wrapper for illustrations sourced as static image assets (see
// public/images/illustrations/NOTICE.md for provenance/license of each
// file), rather than hand-drawn inline SVG. Mirrors the IllustrationBase
// prop interface (size, className) so it's a drop-in replacement at call
// sites.
export default function ImageIllustration({ src, size = 64, className = "", label }) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      className={`illustration-svg ${className}`}
      role="img"
      alt={label || ""}
    />
  );
}
