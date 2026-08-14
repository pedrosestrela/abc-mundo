import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

export function IllustrationHouse({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Casa">
      <polygon points="50,14 88,46 12,46" fill={PALETTE.red} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <rect x="20" y="46" width="60" height="40" fill={PALETTE.cream} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="42" y="60" width="16" height="26" fill={PALETTE.brown} stroke={STROKE} strokeWidth="3" />
      <rect x="26" y="54" width="12" height="12" fill={PALETTE.blue} stroke={STROKE} strokeWidth="3" />
      <rect x="62" y="54" width="12" height="12" fill={PALETTE.blue} stroke={STROKE} strokeWidth="3" />
    </IllustrationBase>
  );
}

export function IllustrationTree({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Árvore">
      <rect x="44" y="58" width="12" height="28" rx="4" fill={PALETTE.brown} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="50" cy="38" r="28" fill={PALETTE.green} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="38" cy="46" r="10" fill={PALETTE.greenDark} opacity="0.5" />
    </IllustrationBase>
  );
}

export function IllustrationSun({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Sol">
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 50 + Math.cos(a) * 32;
        const y1 = 50 + Math.sin(a) * 32;
        const x2 = 50 + Math.cos(a) * 44;
        const y2 = 50 + Math.sin(a) * 44;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={PALETTE.yellowDark} strokeWidth="6" strokeLinecap="round" />;
      })}
      <circle cx="50" cy="50" r="26" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="42" cy="45" r="3" fill={STROKE} />
      <circle cx="58" cy="45" r="3" fill={STROKE} />
      <path d="M40 56 Q50 64 60 56" stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />
    </IllustrationBase>
  );
}

export function IllustrationCloud({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Nuvem">
      <path
        d="M25 66 a16 16 0 0 1 0-32 a20 20 0 0 1 38-8 a16 16 0 0 1 12 30 a16 16 0 0 1 -4 10 Z"
        fill={PALETTE.white}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <ellipse cx="45" cy="58" rx="20" ry="6" fill={PALETTE.gray} opacity="0.4" />
    </IllustrationBase>
  );
}

export function IllustrationRiver({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Rio">
      <rect x="0" y="0" width="100" height="100" fill={PALETTE.cream} />
      <path
        d="M0 40 Q25 30 50 42 Q75 54 100 40 L100 70 Q75 84 50 72 Q25 60 0 70 Z"
        fill={PALETTE.blue}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <path d="M15 52 Q30 48 45 54" stroke={PALETTE.white} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
    </IllustrationBase>
  );
}
