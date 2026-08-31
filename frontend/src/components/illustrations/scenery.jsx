import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import ImageIllustration from "./ImageIllustration.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

export function IllustrationHouse({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/house.svg" size={size} className={className} label="Casa" />;
}

export function IllustrationTree({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/tree.svg" size={size} className={className} label="Árvore" />;
}

export function IllustrationSun({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/sun.svg" size={size} className={className} label="Sol" />;
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
