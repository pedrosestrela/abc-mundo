// Simple, respectful, non-stereotyped illustrations for the "A Evolução do
// Homem" (Human Evolution) timeline. Same shared visual language as the rest
// of the illustrations/ library (flat shapes, PALETTE colors, STROKE_WIDTH
// outlines), same { size, className } prop interface via IllustrationBase.
//
// Deliberately avoids "caveman" tropes (clubs, exaggerated hunch, fur
// loincloths) — these are simple upright silhouettes that read as
// scientifically reasonable early-hominid figures, not cartoons.
import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

// A simple walking hominid silhouette, slightly stooped posture — used for
// earlier stages (Australopithecus, Homo habilis) to show a body plan that
// is upright but not yet fully modern.
export function IllustrationHominid({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Hominídeo a caminhar ereto">
      <path
        d="M50 14 a8 8 0 1 1 0 16 a8 8 0 1 1 0 -16 Z
           M50 30 Q46 46 44 62 Q42 74 32 84
           M50 30 Q54 44 58 58 Q64 70 70 80
           M50 30 Q50 50 48 66
           M42 42 Q34 46 26 40
           M56 40 Q64 42 70 34"
        fill="none"
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 22 a8 8 0 1 0 0 16 a8 8 0 1 0 0 -16 Z"
        fill={PALETTE.brown}
        opacity="0.9"
      />
    </IllustrationBase>
  );
}

// A tall, fully upright modern-human silhouette — used for Homo sapiens /
// "humans today" stages, for visual comparison against IllustrationHominid.
export function IllustrationModernHuman({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Ser humano moderno, em pé">
      <circle cx="50" cy="18" r="9" fill={PALETTE.purple} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path
        d="M50 27 L50 60 M50 35 L30 50 M50 35 L70 50 M50 60 L38 92 M50 60 L62 92"
        fill="none"
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IllustrationBase>
  );
}

// A simple chipped stone hand-axe / tool.
export function IllustrationStoneTool({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Ferramenta de pedra lascada">
      <path
        d="M50 12 L68 40 L62 70 L50 88 L38 70 L32 40 Z"
        fill={PALETTE.gray}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <path d="M50 12 L50 88 M40 30 L50 40 L60 30 M38 55 L50 62 L62 55" fill="none" stroke={STROKE} strokeWidth="2.5" opacity="0.5" />
    </IllustrationBase>
  );
}

// A simple flame, for the "fire" milestone.
export function IllustrationFire({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Fogo">
      <path
        d="M50 90 C30 90 24 74 30 60 C33 66 38 68 38 62 C38 50 46 42 44 28 C58 36 66 50 62 64 C68 60 70 52 68 46 C78 56 76 78 62 86 C68 80 68 72 62 68 C60 80 50 90 50 90 Z"
        fill={PALETTE.orange}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <path
        d="M50 82 C42 82 38 74 42 66 C44 70 48 70 48 66 C48 60 52 56 50 48 C58 54 60 62 56 68 C60 66 62 62 60 58 C66 64 64 76 56 80 Z"
        fill={PALETTE.yellow}
      />
    </IllustrationBase>
  );
}

// A simple cave-painting motif: an ochre animal outline + a hand stencil,
// echoing real Paleolithic cave art (e.g. Côa Valley, Lascaux) without
// depicting any specific real artwork.
export function IllustrationCaveArt({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Pintura rupestre: animal e mão">
      <rect x="6" y="6" width="88" height="88" rx="6" fill={PALETTE.orange} opacity="0.18" />
      <path
        d="M20 62 Q30 44 48 46 Q58 40 66 46 Q74 42 78 52 L72 66 Q54 74 34 70 Z"
        fill="none"
        stroke={PALETTE.brownDark}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M72 52 L84 44 M70 60 L86 62" stroke={PALETTE.brownDark} strokeWidth="4" strokeLinecap="round" />
      <g opacity="0.8">
        <path
          d="M22 84 L20 74 L23 66 L25 74 L27 64 L30 74 L32 65 L34 75 L37 70 L37 84 Z"
          fill={PALETTE.red}
          opacity="0.7"
        />
      </g>
    </IllustrationBase>
  );
}

export const HUMAN_EVOLUTION_ILLUSTRATIONS = {
  IllustrationHominid,
  IllustrationModernHuman,
  IllustrationStoneTool,
  IllustrationFire,
  IllustrationCaveArt,
};
