import React, { useId } from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import ImageIllustration from "./ImageIllustration.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

export function IllustrationBattery({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/battery.svg" size={size} className={className} label="Pilha" />;
}

export function IllustrationWire({ size = 64, className = "" }) {
  const uid = useId();
  const gradId = `wire-grad-${uid}`;
  return (
    <IllustrationBase size={size} className={className} label="Fio">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff8a7a" />
          <stop offset="55%" stopColor={PALETTE.red} />
          <stop offset="100%" stopColor="#c23324" />
        </linearGradient>
      </defs>
      <path d="M10 50 Q35 20 50 50 T90 50" fill="none" stroke={gradId ? `url(#${gradId})` : PALETTE.red} strokeWidth="8" strokeLinecap="round" />
      <path d="M10 50 Q35 20 50 50 T90 50" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <circle cx="10" cy="50" r="7" fill="#4a4a4a" />
      <circle cx="8" cy="48" r="2" fill="#8a8a8a" opacity="0.7" />
      <circle cx="90" cy="50" r="7" fill="#4a4a4a" />
      <circle cx="88" cy="48" r="2" fill="#8a8a8a" opacity="0.7" />
    </IllustrationBase>
  );
}

export function IllustrationBulb({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/bulb.svg" size={size} className={className} label="Lâmpada" />;
}

export function IllustrationMotor({ size = 64, className = "" }) {
  const uid = useId();
  const bodyGrad = `motor-body-${uid}`;
  const capGrad = `motor-cap-${uid}`;
  return (
    <IllustrationBase size={size} className={className} label="Motor">
      <defs>
        <linearGradient id={bodyGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8fb8ff" />
          <stop offset="60%" stopColor={PALETTE.blue} />
          <stop offset="100%" stopColor="#2b5fc4" />
        </linearGradient>
        <radialGradient id={capGrad} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#e9edf2" />
          <stop offset="100%" stopColor="#a9b2bd" />
        </radialGradient>
      </defs>
      <rect x="26" y="30" width="34" height="40" rx="6" fill={`url(#${bodyGrad})`} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="30" y="34" width="8" height="32" rx="3" fill="#ffffff" opacity="0.25" />
      <circle cx="72" cy="50" r="18" fill={`url(#${capGrad})`} stroke={STROKE} strokeWidth="3" />
      <circle cx="72" cy="50" r="6" fill="#6f7783" stroke={STROKE} strokeWidth="1.5" />
      <line x1="72" y1="32" x2="72" y2="68" stroke={STROKE} strokeWidth="3" />
      <line x1="54" y1="50" x2="90" y2="50" stroke={STROKE} strokeWidth="3" />
    </IllustrationBase>
  );
}

export function IllustrationSwitch({ size = 64, className = "" }) {
  const uid = useId();
  const baseGrad = `switch-base-${uid}`;
  return (
    <IllustrationBase size={size} className={className} label="Interruptor">
      <defs>
        <linearGradient id={baseGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="100%" stopColor={PALETTE.cream} />
        </linearGradient>
      </defs>
      <rect x="14" y="40" width="72" height="20" rx="10" fill={`url(#${baseGrad})`} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="16" y="42" width="68" height="5" rx="2.5" fill="#ffffff" opacity="0.6" />
      <line x1="26" y1="50" x2="62" y2="34" stroke={PALETTE.green} strokeWidth="6" strokeLinecap="round" />
      <line x1="26" y1="50" x2="62" y2="34" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="26" cy="50" r="6" fill="#3a3a3a" />
      <circle cx="24" cy="48" r="1.6" fill="#8a8a8a" />
      <circle cx="74" cy="34" r="6" fill="#3a3a3a" />
      <circle cx="72" cy="32" r="1.6" fill="#8a8a8a" />
    </IllustrationBase>
  );
}

export function IllustrationBuzzer({ size = 64, className = "" }) {
  return <ImageIllustration src="/images/illustrations/buzzer.svg" size={size} className={className} label="Campainha" />;
}

export function IllustrationTrafficLight({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Semáforo">
      <rect x="34" y="12" width="32" height="76" rx="8" fill={STROKE} />
      <circle cx="50" cy="28" r="9" fill={PALETTE.red} />
      <circle cx="50" cy="50" r="9" fill={PALETTE.yellow} />
      <circle cx="50" cy="72" r="9" fill={PALETTE.green} />
    </IllustrationBase>
  );
}
