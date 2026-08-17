// Gradient-shaded planet illustrations for the "Sistema Solar" module.
//
// Deliberately more detailed than the flat line-art style used elsewhere in
// this library (see NOTICE.md in public/images/solar-system/ for why: real
// NASA/Wikimedia photos were the first choice but the build sandbox's
// network egress policy blocked those hosts). Each planet is a radial
// gradient sphere with a soft shadow terminator plus a couple of
// body-specific surface details (rings, spot, craters, ice caps, ...), still
// built only from inline SVG so the module stays fully self-contained.
//
// Every gradient id is namespaced with useId() so multiple copies of the
// same illustration can appear on one page (e.g. one in the timeline card,
// one reused in a quiz option) without id collisions.
import React, { useId } from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { STROKE } from "./palette.js";

// Shared sphere: a base radial gradient (light source top-left) plus a
// darker crescent on the lower-right to fake a terminator, so every planet
// reads as a lit 3D ball rather than a flat circle.
function Sphere({ uid, cx = 50, cy = 50, r = 34, colors, children }) {
  const gradId = `ss-grad-${uid}`;
  const shadowId = `ss-shadow-${uid}`;
  return (
    <>
      <defs>
        <radialGradient id={gradId} cx="38%" cy="34%" r="75%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="55%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.dark} />
        </radialGradient>
        <radialGradient id={shadowId} cx="70%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#00000055" />
          <stop offset="70%" stopColor="#00000000" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} stroke={STROKE} strokeWidth="2" />
      {children}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${shadowId})`} />
    </>
  );
}

export function IllustrationSun({ size = 96, className = "" }) {
  const uid = useId();
  const gradId = `ss-sun-${uid}`;
  const rays = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
  return (
    <IllustrationBase size={size} className={className} label="O Sol, uma estrela brilhante">
      <defs>
        <radialGradient id={gradId} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff6cf" />
          <stop offset="45%" stopColor="#ffd93d" />
          <stop offset="100%" stopColor="#f0862a" />
        </radialGradient>
      </defs>
      {rays.map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="50"
          x2={50 + 46 * Math.cos((deg * Math.PI) / 180)}
          y2={50 + 46 * Math.sin((deg * Math.PI) / 180)}
          stroke="#ffb734"
          strokeWidth="4"
          strokeLinecap="round"
          transform-origin="50 50"
        />
      ))}
      <circle cx="50" cy="50" r="30" fill={`url(#${gradId})`} stroke={STROKE} strokeWidth="2" />
      <circle cx="40" cy="42" r="4" fill="#f0862a" opacity="0.5" />
      <circle cx="58" cy="58" r="5" fill="#f0862a" opacity="0.4" />
    </IllustrationBase>
  );
}

export function IllustrationMercury({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Mercúrio, o planeta mais próximo do Sol">
      <Sphere uid={uid} r="26" colors={{ light: "#d8cdc4", mid: "#a89a8d", dark: "#6f6257" }}>
        <circle cx="40" cy="38" r="4" fill="#00000022" />
        <circle cx="58" cy="30" r="3" fill="#00000022" />
        <circle cx="34" cy="58" r="5" fill="#00000022" />
        <circle cx="62" cy="55" r="2.5" fill="#00000022" />
      </Sphere>
    </IllustrationBase>
  );
}

export function IllustrationVenus({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Vénus, coberto por nuvens espessas">
      <Sphere uid={uid} r="30" colors={{ light: "#fff3d6", mid: "#f0c979", dark: "#c99a45" }}>
        <path d="M22 42 Q40 34 58 42 T78 44" fill="none" stroke="#c99a4555" strokeWidth="4" strokeLinecap="round" />
        <path d="M24 56 Q42 50 60 56 T80 56" fill="none" stroke="#c99a4555" strokeWidth="4" strokeLinecap="round" />
      </Sphere>
    </IllustrationBase>
  );
}

export function IllustrationEarth({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="A Terra e a Lua">
      <Sphere uid={uid} r="30" colors={{ light: "#bff0ff", mid: "#4d96ff", dark: "#2359b8" }}>
        <path d="M28 34 q8 -6 14 0 q6 8 -2 14 q-8 4 -14 -2 q-4 -6 2 -12 Z" fill="#6bcb77" opacity="0.9" />
        <path d="M52 50 q10 -4 16 4 q4 8 -6 12 q-10 2 -12 -6 q-2 -6 2 -10 Z" fill="#6bcb77" opacity="0.9" />
        <path d="M34 62 q6 -4 10 2 q2 6 -6 8 q-6 0 -8 -4 q-1 -4 4 -6 Z" fill="#6bcb77" opacity="0.85" />
        <path d="M20 50 Q34 46 40 54" fill="none" stroke="#ffffffaa" strokeWidth="5" strokeLinecap="round" />
      </Sphere>
      <circle cx="82" cy="66" r="8" fill="#d8cdc4" stroke={STROKE} strokeWidth="1.5" />
      <circle cx="79" cy="63" r="1.6" fill="#00000022" />
      <circle cx="85" cy="69" r="1.2" fill="#00000022" />
    </IllustrationBase>
  );
}

export function IllustrationMars({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Marte, o planeta vermelho">
      <Sphere uid={uid} r="28" colors={{ light: "#ffb08a", mid: "#e2653c", dark: "#a3391c" }}>
        <path d="M26 36 q10 -4 18 2" fill="none" stroke="#a3391c66" strokeWidth="4" strokeLinecap="round" />
        <circle cx="58" cy="60" r="4" fill="#a3391c55" />
        <circle cx="36" cy="58" r="3" fill="#a3391c55" />
        <path d="M42 24 a8 8 0 0 1 12 2" fill="none" stroke="#ffffffcc" strokeWidth="5" strokeLinecap="round" />
      </Sphere>
    </IllustrationBase>
  );
}

export function IllustrationJupiter({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Júpiter, o maior planeta, com a Grande Mancha Vermelha">
      <Sphere uid={uid} r="36" colors={{ light: "#fff0da", mid: "#e8b378", dark: "#a9744f" }}>
        <path d="M14 40 Q50 34 86 40" fill="none" stroke="#a9744f55" strokeWidth="4" />
        <path d="M12 50 Q50 46 88 50" fill="none" stroke="#c9895e66" strokeWidth="5" />
        <path d="M14 60 Q50 56 86 60" fill="none" stroke="#a9744f55" strokeWidth="4" />
        <ellipse cx="66" cy="58" rx="9" ry="5.5" fill="#e0603f" stroke="#a3391c" strokeWidth="1.5" />
      </Sphere>
    </IllustrationBase>
  );
}

export function IllustrationSaturn({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Saturno e os seus anéis">
      <ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="#f0b429" strokeWidth="5" opacity="0.85" />
      <ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="#d69a1e" strokeWidth="1.5" opacity="0.6" />
      <Sphere uid={uid} cx={50} cy={48} r="26" colors={{ light: "#fff3d6", mid: "#f0c979", dark: "#c99a45" }}>
        <path d="M26 42 Q50 38 74 42" fill="none" stroke="#c99a4555" strokeWidth="3" />
        <path d="M26 52 Q50 49 74 52" fill="none" stroke="#c99a4555" strokeWidth="3" />
      </Sphere>
      <path d="M4 52 A46 12 0 0 1 50 40" fill="none" stroke="#f0b429" strokeWidth="6" opacity="0.95" strokeLinecap="round" />
    </IllustrationBase>
  );
}

export function IllustrationUranus({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Úrano, um planeta gelado azul-esverdeado">
      <ellipse cx="50" cy="50" rx="42" ry="10" fill="none" stroke="#bfe9e0" strokeWidth="3" opacity="0.7" transform="rotate(20 50 50)" />
      <Sphere uid={uid} r="28" colors={{ light: "#e7fff8", mid: "#8fe3d3", dark: "#4bb7a3" }} />
    </IllustrationBase>
  );
}

export function IllustrationNeptune({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Neptuno, um planeta azul e ventoso">
      <Sphere uid={uid} r="28" colors={{ light: "#c9e0ff", mid: "#4d6fdf", dark: "#2c3f9e" }}>
        <path d="M24 44 Q40 38 56 44 T84 42" fill="none" stroke="#ffffff88" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="42" cy="56" rx="8" ry="5" fill="#2c3f9e" opacity="0.7" />
      </Sphere>
    </IllustrationBase>
  );
}

export function IllustrationDwarfPlanets({ size = 96, className = "" }) {
  const uid = useId();
  return (
    <IllustrationBase size={size} className={className} label="Plutão e outros planetas anões">
      <Sphere uid={`${uid}a`} cx={34} cy={58} r="16" colors={{ light: "#f5e3d0", mid: "#cba589", dark: "#8a6a53" }}>
        <path d="M26 54 q6 -3 10 1" fill="none" stroke="#8a6a5355" strokeWidth="3" />
      </Sphere>
      <Sphere uid={`${uid}b`} cx={68} cy={32} r="9" colors={{ light: "#e5eefc", mid: "#a9bde0", dark: "#6f85ad" }} />
      <Sphere uid={`${uid}c`} cx={76} cy={62} r="6" colors={{ light: "#fff", mid: "#d7d0e6", dark: "#9b90b3" }} />
    </IllustrationBase>
  );
}

export function IllustrationAsteroids({ size = 96, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Asteroides e cometas">
      <polygon points="24,30 34,24 42,32 38,42 26,42" fill="#a9744f" stroke={STROKE} strokeWidth="2" />
      <polygon points="52,50 62,44 70,52 66,64 54,62" fill="#8a5c3b" stroke={STROKE} strokeWidth="2" />
      <polygon points="20,60 28,56 34,64 28,72" fill="#c9895e" stroke={STROKE} strokeWidth="2" />
      <g>
        <circle cx="76" cy="24" r="6" fill="#bfe9e0" stroke={STROKE} strokeWidth="1.5" />
        <path d="M72 20 L58 10 M74 26 L62 22 M78 22 L68 12" stroke="#bfe9e0" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      </g>
    </IllustrationBase>
  );
}
