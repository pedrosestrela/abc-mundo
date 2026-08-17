import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

export function IllustrationApple({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Maçã">
      <path d="M50 34 C30 24 14 40 16 58 C18 76 34 86 50 78 C66 86 82 76 84 58 C86 40 70 24 50 34 Z" fill={PALETTE.red} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <path d="M50 34 C50 24 56 18 62 16" fill="none" stroke={PALETTE.brown} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="56" cy="14" rx="8" ry="4" fill={PALETTE.green} transform="rotate(-30 56 14)" />
    </IllustrationBase>
  );
}

export function IllustrationBanana({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Banana">
      <path d="M22 74 C18 50 30 24 58 18 C64 17 66 24 60 26 C38 32 30 52 34 72 C36 82 24 84 22 74 Z" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <circle cx="58" cy="18" r="4" fill={PALETTE.brown} />
    </IllustrationBase>
  );
}

export function IllustrationBread({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Pão">
      <path d="M16 46 C16 26 30 16 50 16 C70 16 84 26 84 46 V78 H16 Z" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <path d="M30 40 Q50 30 70 40" fill="none" stroke={PALETTE.brown} strokeWidth="3" strokeLinecap="round" />
    </IllustrationBase>
  );
}

export function IllustrationBowl({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Taça">
      <path d="M12 40 H88 L78 76 Q76 84 66 84 H34 Q24 84 22 76 Z" fill={PALETTE.blue} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <ellipse cx="50" cy="40" rx="38" ry="8" fill={PALETTE.white} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
    </IllustrationBase>
  );
}

export function IllustrationCup({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Copo">
      <path d="M28 20 H72 L66 82 H34 Z" fill={PALETTE.pink} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <ellipse cx="50" cy="20" rx="22" ry="5" fill={PALETTE.white} stroke={STROKE} strokeWidth="3" />
      <path d="M36 34 H64" stroke={PALETTE.white} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
    </IllustrationBase>
  );
}

export function IllustrationChefHat({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Chapéu de cozinheiro">
      <path d="M26 46 C14 46 12 28 26 24 C28 12 46 8 50 20 C54 8 72 12 74 24 C88 28 86 46 74 46 V60 H26 Z" fill={PALETTE.white} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <rect x="22" y="60" width="56" height="18" rx="3" fill={PALETTE.white} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
    </IllustrationBase>
  );
}
