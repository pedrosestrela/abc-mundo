import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

export function IllustrationBook({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Livro">
      <path d="M50 24 Q30 14 14 22 V78 Q30 70 50 80 Z" fill={PALETTE.blue} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <path d="M50 24 Q70 14 86 22 V78 Q70 70 50 80 Z" fill={PALETTE.red} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <path d="M50 24 V80" stroke={STROKE} strokeWidth="3" />
    </IllustrationBase>
  );
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
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 36 : 16;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    pts.push(`${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`);
  }
  return (
    <IllustrationBase size={size} className={className} label="Estrela">
      <polygon points={pts.join(" ")} fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
    </IllustrationBase>
  );
}

export function IllustrationHeart({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Coração">
      <path
        d="M50 84 C20 62 8 44 8 28 C8 14 20 6 32 10 C40 13 46 20 50 28 C54 20 60 13 68 10 C80 6 92 14 92 28 C92 44 80 62 50 84 Z"
        fill={PALETTE.red}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <ellipse cx="34" cy="26" rx="8" ry="5" fill={PALETTE.white} opacity="0.4" />
    </IllustrationBase>
  );
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
