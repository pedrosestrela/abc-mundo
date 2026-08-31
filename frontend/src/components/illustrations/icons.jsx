import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import ImageIllustration from "./ImageIllustration.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

export function IllustrationBook({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/book.svg" size={size} className={className} label="Livro" />;
}

export function IllustrationPencil({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Lápis">
      <rect x="40" y="18" width="20" height="52" rx="2" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} transform="rotate(45 50 50)" />
      <polygon points="34,64 46,76 30,80" fill={PALETTE.brown} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
      <rect x="60" y="8" width="20" height="12" rx="3" fill={PALETTE.pink} stroke={STROKE} strokeWidth="3" transform="rotate(45 70 14)" />
    </IllustrationBase>
  );
}

export function IllustrationStar({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/star.svg" size={size} className={className} label="Estrela" />;
}

export function IllustrationHeart({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/heart.svg" size={size} className={className} label="Coração" />;
}

export function IllustrationClock({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Relógio">
      <circle cx="50" cy="50" r="36" fill={PALETTE.cream} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="50" cy="50" r="4" fill={STROKE} />
      <line x1="50" y1="50" x2="50" y2="26" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="50" x2="66" y2="58" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <rect x="44" y="8" width="12" height="8" rx="3" fill={PALETTE.orange} stroke={STROKE} strokeWidth="3" />
    </IllustrationBase>
  );
}
