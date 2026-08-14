import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

// All animal illustrations share: rounded body shapes, simple dot eyes,
// a single flat shading tone (a slightly darker patch) per shape, and the
// same outline stroke width. Keep additions to this same recipe.

export function IllustrationDog({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Cão">
      <ellipse cx="50" cy="62" rx="30" ry="24" fill={PALETTE.brown} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <ellipse cx="50" cy="66" rx="30" ry="12" fill={PALETTE.brownDark} opacity="0.5" />
      <circle cx="50" cy="34" r="20" fill={PALETTE.brown} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M32 26 Q22 10 30 32" fill={PALETTE.brown} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <path d="M68 26 Q78 10 70 32" fill={PALETTE.brown} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <circle cx="43" cy="34" r="3" fill={STROKE} />
      <circle cx="57" cy="34" r="3" fill={STROKE} />
      <circle cx="50" cy="42" r="4" fill={STROKE} />
      <path d="M42 48 Q50 54 58 48" stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />
    </IllustrationBase>
  );
}

export function IllustrationCat({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Gato">
      <ellipse cx="50" cy="64" rx="28" ry="22" fill={PALETTE.orange} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <ellipse cx="50" cy="68" rx="28" ry="10" fill={PALETTE.orangeDark} opacity="0.5" />
      <circle cx="50" cy="34" r="19" fill={PALETTE.orange} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <polygon points="32,22 26,6 42,18" fill={PALETTE.orange} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <polygon points="68,22 74,6 58,18" fill={PALETTE.orange} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <circle cx="43" cy="34" r="3" fill={STROKE} />
      <circle cx="57" cy="34" r="3" fill={STROKE} />
      <path d="M47 40 L53 40 L50 44 Z" fill={STROKE} />
      <path d="M50 44 Q42 50 34 46 M50 44 Q58 50 66 46" stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </IllustrationBase>
  );
}

export function IllustrationCow({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Vaca">
      <ellipse cx="50" cy="64" rx="30" ry="23" fill={PALETTE.white} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <ellipse cx="38" cy="58" rx="8" ry="7" fill={PALETTE.outline} opacity="0.85" />
      <ellipse cx="62" cy="70" rx="9" ry="7" fill={PALETTE.outline} opacity="0.85" />
      <circle cx="50" cy="34" r="18" fill={PALETTE.white} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M36 22 Q30 10 40 16" fill={PALETTE.white} stroke={STROKE} strokeWidth="4" strokeLinejoin="round" />
      <path d="M64 22 Q70 10 60 16" fill={PALETTE.white} stroke={STROKE} strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="50" cy="42" rx="14" ry="10" fill={PALETTE.pink} stroke={STROKE} strokeWidth="3" />
      <circle cx="44" cy="42" r="2.5" fill={STROKE} />
      <circle cx="56" cy="42" r="2.5" fill={STROKE} />
      <circle cx="43" cy="30" r="3" fill={STROKE} />
      <circle cx="57" cy="30" r="3" fill={STROKE} />
    </IllustrationBase>
  );
}

export function IllustrationLion({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Leão">
      <circle cx="50" cy="50" r="30" fill={PALETTE.orangeDark} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="50" cy="50" r="19" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="42" cy="47" r="3" fill={STROKE} />
      <circle cx="58" cy="47" r="3" fill={STROKE} />
      <path d="M47 55 L53 55 L50 59 Z" fill={STROKE} />
      <path d="M50 59 Q43 65 36 62 M50 59 Q57 65 64 62" stroke={STROKE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </IllustrationBase>
  );
}

export function IllustrationSheep({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Ovelha">
      <ellipse cx="48" cy="58" rx="26" ry="20" fill={PALETTE.white} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <ellipse cx="48" cy="62" rx="26" ry="9" fill={PALETTE.gray} opacity="0.5" />
      <circle cx="78" cy="52" r="14" fill={PALETTE.brown} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="73" cy="50" r="2.5" fill={STROKE} />
      <circle cx="83" cy="50" r="2.5" fill={STROKE} />
      <rect x="30" y="76" width="6" height="12" rx="3" fill={PALETTE.brown} stroke={STROKE} strokeWidth="3" />
      <rect x="58" y="76" width="6" height="12" rx="3" fill={PALETTE.brown} stroke={STROKE} strokeWidth="3" />
    </IllustrationBase>
  );
}

export function IllustrationMouse({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Rato">
      <circle cx="50" cy="55" r="24" fill={PALETTE.gray} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="28" cy="30" r="11" fill={PALETTE.gray} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="72" cy="30" r="11" fill={PALETTE.gray} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="28" cy="30" r="4" fill={PALETTE.pink} />
      <circle cx="72" cy="30" r="4" fill={PALETTE.pink} />
      <circle cx="43" cy="52" r="3" fill={STROKE} />
      <circle cx="57" cy="52" r="3" fill={STROKE} />
      <circle cx="50" cy="60" r="3.5" fill={PALETTE.pink} stroke={STROKE} strokeWidth="2" />
      <path d="M85 65 Q95 60 92 72" stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />
    </IllustrationBase>
  );
}

export function IllustrationDuck({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Pato">
      <ellipse cx="48" cy="66" rx="26" ry="18" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <ellipse cx="48" cy="70" rx="26" ry="8" fill={PALETTE.yellowDark} opacity="0.5" />
      <circle cx="62" cy="38" r="17" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="68" cy="35" r="2.5" fill={STROKE} />
      <path d="M78 40 Q90 42 78 46 Z" fill={PALETTE.orange} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
    </IllustrationBase>
  );
}

export function IllustrationFrog({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Rã">
      <ellipse cx="50" cy="62" rx="28" ry="20" fill={PALETTE.green} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <ellipse cx="50" cy="66" rx="28" ry="9" fill={PALETTE.greenDark} opacity="0.5" />
      <circle cx="34" cy="34" r="11" fill={PALETTE.green} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="66" cy="34" r="11" fill={PALETTE.green} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="34" cy="34" r="4" fill={STROKE} />
      <circle cx="66" cy="34" r="4" fill={STROKE} />
      <path d="M36 58 Q50 68 64 58" stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />
    </IllustrationBase>
  );
}
