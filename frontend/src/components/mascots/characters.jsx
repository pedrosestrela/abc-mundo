import React, { useId } from "react";
import { PALETTE, STROKE, STROKE_WIDTH } from "../illustrations/palette.js";

// Shared "plush" body treatment: a soft radial gradient (light source
// top-left) so every mascot's body reads as a rounded, lit 3D shape instead
// of a flat tone, plus a small elliptical highlight and a ground shadow.
// `uid` namespaces the gradient id so multiple copies of the same mascot
// (e.g. one in a card, one in a modal) never collide.
function BodyGradient({ uid, color, dark }) {
  const gradId = `mascot-body-${uid}`;
  return (
    <defs>
      <radialGradient id={gradId} cx="36%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="35%" stopColor={color} />
        <stop offset="100%" stopColor={dark} />
      </radialGradient>
    </defs>
  );
}

function bodyFill(uid) {
  return `url(#mascot-body-${uid})`;
}

function BodyHighlight({ cx, cy, rx = 9, ry = 6 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" opacity="0.45" transform={`rotate(-30 ${cx} ${cy})`} />;
}

function BodyShadow({ cx, cy, rx, dark }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.32} fill={dark} opacity="0.35" />;
}

// Shared face parts so every mascot's expression logic looks the same no
// matter the body shape. `mood` is one of "neutral" | "happy" | "thinking".
function Eyes({ mood, cx1, cx2, cy }) {
  if (mood === "happy") {
    return (
      <>
        <path d={`M${cx1 - 4} ${cy} Q${cx1} ${cy - 6} ${cx1 + 4} ${cy}`} stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={`M${cx2 - 4} ${cy} Q${cx2} ${cy - 6} ${cx2 + 4} ${cy}`} stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (mood === "thinking") {
    return (
      <>
        <circle cx={cx1} cy={cy} r="2.5" fill={STROKE} />
        <ellipse cx={cx2} cy={cy - 1} rx="3" ry="2" fill={STROKE} />
      </>
    );
  }
  return (
    <>
      <circle cx={cx1} cy={cy} r="3.2" fill={STROKE} />
      <circle cx={cx2} cy={cy} r="3.2" fill={STROKE} />
    </>
  );
}

function Mouth({ mood, cx, cy }) {
  if (mood === "happy") {
    return <path d={`M${cx - 12} ${cy} Q${cx} ${cy + 14} ${cx + 12} ${cy}`} stroke={STROKE} strokeWidth="3.5" fill={PALETTE.white} strokeLinecap="round" />;
  }
  if (mood === "thinking") {
    return <circle cx={cx + 6} cy={cy + 2} r="3.5" fill="none" stroke={STROKE} strokeWidth="3" />;
  }
  return <path d={`M${cx - 9} ${cy} Q${cx} ${cy + 7} ${cx + 9} ${cy}`} stroke={STROKE} strokeWidth="3" fill="none" strokeLinecap="round" />;
}

const bodyClass = (mood) => `mascot-svg mascot-mood-${mood}`;

// Lumi — curious guide, colour of "discovery" (a soft glowing purple/yellow star-child).
export function MascotLumi({ mood = "neutral", size = 96, className = "" }) {
  const uid = useId();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${bodyClass(mood)} ${className}`} role="img" aria-label="Lumi">
      <BodyGradient uid={uid} color={PALETTE.purple} dark={PALETTE.purpleDark} />
      <circle cx="50" cy="55" r="34" fill={bodyFill(uid)} stroke={STROKE} strokeWidth={STROKE_WIDTH} className="mascot-bob" />
      <BodyShadow cx={50} cy={84} rx={22} dark={PALETTE.purpleDark} />
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        return <circle key={i} cx={50 + Math.cos(a) * 40} cy={55 + Math.sin(a) * 40} r="3.5" fill={PALETTE.yellow} className="mascot-twinkle" style={{ animationDelay: `${i * 0.2}s` }} />;
      })}
      <BodyHighlight cx={38} cy={40} />
      <Eyes mood={mood} cx1={40} cx2={60} cy={50} />
      <Mouth mood={mood} cx={50} cy={58} />
      <polygon points="50,14 54,22 46,22" fill={PALETTE.yellow} stroke={STROKE} strokeWidth="2.5" />
    </svg>
  );
}

// Bit — robot mascot for technology / programming.
export function MascotBit({ mood = "neutral", size = 96, className = "" }) {
  const uid = useId();
  const gradId = `mascot-bit-body-${uid}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${bodyClass(mood)} ${className}`} role="img" aria-label="Bit">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#a9caff" />
          <stop offset="45%" stopColor={PALETTE.blue} />
          <stop offset="100%" stopColor={PALETTE.blueDark} />
        </linearGradient>
      </defs>
      <rect x="30" y="10" width="6" height="12" fill={PALETTE.gray} />
      <circle cx="33" cy="9" r="4" fill={PALETTE.red} className="mascot-twinkle" />
      <rect x="20" y="30" width="60" height="50" rx="14" fill={`url(#${gradId})`} stroke={STROKE} strokeWidth={STROKE_WIDTH} className="mascot-bob" />
      <rect x="26" y="34" width="14" height="6" rx="3" fill="#ffffff" opacity="0.35" />
      <BodyShadow cx={50} cy={82} rx={28} dark={PALETTE.blueDark} />
      <rect x="30" y="42" width="40" height="26" rx="8" fill={PALETTE.cream} stroke={STROKE} strokeWidth="3" />
      <Eyes mood={mood} cx1={42} cx2={58} cy={54} />
      <Mouth mood={mood} cx={50} cy={60} />
      <rect x="10" y="46" width="10" height="8" rx="3" fill={PALETTE.blueDark} stroke={STROKE} strokeWidth="2.5" />
      <rect x="80" y="46" width="10" height="8" rx="3" fill={PALETTE.blueDark} stroke={STROKE} strokeWidth="2.5" />
    </svg>
  );
}

// Nina — science / nature guide (leaf-crowned).
export function MascotNina({ mood = "neutral", size = 96, className = "" }) {
  const uid = useId();
  const leafId = `mascot-nina-leaf-${uid}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${bodyClass(mood)} ${className}`} role="img" aria-label="Nina">
      <BodyGradient uid={uid} color={PALETTE.green} dark={PALETTE.greenDark} />
      <defs>
        <linearGradient id={leafId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={PALETTE.green} />
          <stop offset="100%" stopColor={PALETTE.greenDark} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="56" r="32" fill={bodyFill(uid)} stroke={STROKE} strokeWidth={STROKE_WIDTH} className="mascot-bob" />
      <BodyShadow cx={50} cy={84} rx={20} dark={PALETTE.greenDark} />
      <path d="M50 24 Q34 8 24 20 Q34 30 50 24 Z" fill={`url(#${leafId})`} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 24 Q66 8 76 20 Q66 30 50 24 Z" fill={`url(#${leafId})`} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
      <BodyHighlight cx={38} cy={44} />
      <Eyes mood={mood} cx1={41} cx2={59} cy={52} />
      <Mouth mood={mood} cx={50} cy={60} />
      <circle cx="30" cy="60" r="6" fill={PALETTE.pink} opacity="0.6" />
      <circle cx="70" cy="60" r="6" fill={PALETTE.pink} opacity="0.6" />
    </svg>
  );
}

// Tomás — maths / logic guide (glasses + geometric bowtie).
export function MascotTomas({ mood = "neutral", size = 96, className = "" }) {
  const uid = useId();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${bodyClass(mood)} ${className}`} role="img" aria-label="Tomás">
      <BodyGradient uid={uid} color={PALETTE.orange} dark={PALETTE.orangeDark} />
      <circle cx="50" cy="56" r="32" fill={bodyFill(uid)} stroke={STROKE} strokeWidth={STROKE_WIDTH} className="mascot-bob" />
      <BodyShadow cx={50} cy={84} rx={20} dark={PALETTE.orangeDark} />
      <BodyHighlight cx={38} cy={40} />
      <circle cx="38" cy="52" r="10" fill="#ffffff" opacity="0.25" stroke={STROKE} strokeWidth="3.5" />
      <circle cx="62" cy="52" r="10" fill="#ffffff" opacity="0.25" stroke={STROKE} strokeWidth="3.5" />
      <line x1="48" y1="52" x2="52" y2="52" stroke={STROKE} strokeWidth="3.5" />
      <Eyes mood={mood} cx1={38} cx2={62} cy={52} />
      <Mouth mood={mood} cx={50} cy={64} />
      <polygon points="40,84 50,78 60,84 50,90" fill={PALETTE.blue} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

// Milo — music guide (headphone note character).
export function MascotMilo({ mood = "neutral", size = 96, className = "" }) {
  const uid = useId();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${bodyClass(mood)} ${className}`} role="img" aria-label="Milo">
      <BodyGradient uid={uid} color={PALETTE.pink} dark="#d9607f" />
      <circle cx="50" cy="56" r="32" fill={bodyFill(uid)} stroke={STROKE} strokeWidth={STROKE_WIDTH} className="mascot-bob" />
      <BodyShadow cx={50} cy={84} rx={20} dark="#d9607f" />
      <BodyHighlight cx={38} cy={40} />
      <path d="M22 46 Q22 20 50 20 Q78 20 78 46" fill="none" stroke={STROKE} strokeWidth="5" strokeLinecap="round" />
      <rect x="16" y="44" width="12" height="16" rx="5" fill={PALETTE.purple} stroke={STROKE} strokeWidth="3" />
      <rect x="18" y="46" width="4" height="10" rx="2" fill="#ffffff" opacity="0.4" />
      <rect x="72" y="44" width="12" height="16" rx="5" fill={PALETTE.purple} stroke={STROKE} strokeWidth="3" />
      <rect x="74" y="46" width="4" height="10" rx="2" fill="#ffffff" opacity="0.4" />
      <Eyes mood={mood} cx1={41} cx2={59} cy={54} />
      <Mouth mood={mood} cx={50} cy={62} />
      <path d="M84 62 v14 a5 5 0 1 1 -4 -5 v-9 Z" fill={PALETTE.yellow} stroke={STROKE} strokeWidth="2.5" className="mascot-twinkle" />
    </svg>
  );
}

// Vasco — history / exploration guide (explorer hat + compass).
export function MascotVasco({ mood = "neutral", size = 96, className = "" }) {
  const uid = useId();
  const hatId = `mascot-vasco-hat-${uid}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${bodyClass(mood)} ${className}`} role="img" aria-label="Vasco">
      <BodyGradient uid={uid} color={PALETTE.yellow} dark={PALETTE.yellowDark} />
      <defs>
        <linearGradient id={hatId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c68f61" />
          <stop offset="100%" stopColor={PALETTE.brown} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="58" r="30" fill={bodyFill(uid)} stroke={STROKE} strokeWidth={STROKE_WIDTH} className="mascot-bob" />
      <BodyShadow cx={50} cy={84} rx={19} dark={PALETTE.yellowDark} />
      <path d="M18 40 Q50 20 82 40 Q66 30 50 30 Q34 30 18 40 Z" fill={`url(#${hatId})`} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="50" cy="40" rx="16" ry="6" fill={PALETTE.brownDark} stroke={STROKE} strokeWidth="3" />
      <BodyHighlight cx={38} cy={50} />
      <Eyes mood={mood} cx1={41} cx2={59} cy={56} />
      <Mouth mood={mood} cx={50} cy={64} />
      <circle cx="50" cy="82" r="9" fill={PALETTE.cream} stroke={STROKE} strokeWidth="2.5" />
      <line x1="50" y1="82" x2="50" y2="76" stroke={PALETTE.red} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="82" x2="55" y2="82" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Pipa — creativity / stories / art guide (beret + paintbrush).
export function MascotPipa({ mood = "neutral", size = 96, className = "" }) {
  const uid = useId();
  const beretId = `mascot-pipa-beret-${uid}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`${bodyClass(mood)} ${className}`} role="img" aria-label="Pipa">
      <BodyGradient uid={uid} color={PALETTE.red} dark={PALETTE.redDark} />
      <defs>
        <radialGradient id={beretId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#c495ea" />
          <stop offset="100%" stopColor={PALETTE.purpleDark} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="58" r="31" fill={bodyFill(uid)} stroke={STROKE} strokeWidth={STROKE_WIDTH} className="mascot-bob" />
      <BodyShadow cx={50} cy={86} rx={20} dark={PALETTE.redDark} />
      <ellipse cx="48" cy="30" rx="20" ry="10" fill={`url(#${beretId})`} stroke={STROKE} strokeWidth="3" />
      <circle cx="66" cy="24" r="4" fill={PALETTE.yellow} stroke={STROKE} strokeWidth="2" />
      <BodyHighlight cx={38} cy={44} />
      <Eyes mood={mood} cx1={41} cx2={59} cy={56} />
      <Mouth mood={mood} cx={50} cy={64} />
      <rect x="78" y="60" width="6" height="20" rx="2" fill={PALETTE.brown} stroke={STROKE} strokeWidth="2" transform="rotate(25 81 70)" />
      <path d="M85 56 q6 -4 4 4 q-2 6 -8 4 Z" fill={PALETTE.blue} stroke={STROKE} strokeWidth="2" transform="rotate(25 81 70)" />
    </svg>
  );
}

export const MASCOTS = {
  lumi: { Component: MascotLumi, color: PALETTE.purple, name: "Lumi" },
  bit: { Component: MascotBit, color: PALETTE.blue, name: "Bit" },
  nina: { Component: MascotNina, color: PALETTE.green, name: "Nina" },
  tomas: { Component: MascotTomas, color: PALETTE.orange, name: "Tomás" },
  milo: { Component: MascotMilo, color: PALETTE.pink, name: "Milo" },
  vasco: { Component: MascotVasco, color: PALETTE.yellow, name: "Vasco" },
  pipa: { Component: MascotPipa, color: PALETTE.red, name: "Pipa" },
};
