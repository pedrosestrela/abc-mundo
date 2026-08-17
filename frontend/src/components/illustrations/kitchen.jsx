import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import ImageIllustration from "./ImageIllustration.jsx";
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
  return <ImageIllustration src="/images/illustrations/bread.svg" size={size} className={className} label="Pão" />;
}

export function IllustrationBowl({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/bowl.svg" size={size} className={className} label="Taça" />;
}

export function IllustrationCup({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/cup.svg" size={size} className={className} label="Copo" />;
}

export function IllustrationChefHat({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/chef-hat.svg" size={size} className={className} label="Chapéu de cozinheiro" />;
}
