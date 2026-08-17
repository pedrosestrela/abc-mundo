import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

export function IllustrationBattery({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Pilha">
      <rect x="20" y="30" width="56" height="40" rx="6" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="76" y="42" width="8" height="16" rx="2" fill={STROKE} />
      <text x="50" y="56" fontSize="20" textAnchor="middle" fill={STROKE}>+ −</text>
    </IllustrationBase>
  );
}

export function IllustrationWire({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Fio">
      <path d="M10 50 Q35 20 50 50 T90 50" fill="none" stroke={PALETTE.red} strokeWidth="7" strokeLinecap="round" />
      <circle cx="10" cy="50" r="6" fill={STROKE} />
      <circle cx="90" cy="50" r="6" fill={STROKE} />
    </IllustrationBase>
  );
}

export function IllustrationBulb({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Lâmpada">
      <circle cx="50" cy="40" r="28" fill={PALETTE.yellow} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M40 62 H60 V72 Q60 78 50 78 Q40 78 40 72 Z" fill={PALETTE.cream} stroke={STROKE} strokeWidth="3" />
      <path d="M42 34 L50 46 L58 34" fill="none" stroke={STROKE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </IllustrationBase>
  );
}

export function IllustrationMotor({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Motor">
      <rect x="26" y="30" width="34" height="40" rx="6" fill={PALETTE.blue} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="72" cy="50" r="18" fill="none" stroke={STROKE} strokeWidth="3" />
      <line x1="72" y1="32" x2="72" y2="68" stroke={STROKE} strokeWidth="3" />
      <line x1="54" y1="50" x2="90" y2="50" stroke={STROKE} strokeWidth="3" />
    </IllustrationBase>
  );
}

export function IllustrationSwitch({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Interruptor">
      <rect x="14" y="40" width="72" height="20" rx="10" fill={PALETTE.cream} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <line x1="26" y1="50" x2="62" y2="34" stroke={PALETTE.green} strokeWidth="6" strokeLinecap="round" />
      <circle cx="26" cy="50" r="6" fill={STROKE} />
      <circle cx="74" cy="34" r="6" fill={STROKE} />
    </IllustrationBase>
  );
}

export function IllustrationBuzzer({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Campainha">
      <circle cx="50" cy="50" r="30" fill={PALETTE.pink} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M50 24 V16 M32 32 L26 26 M68 32 L74 26" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
    </IllustrationBase>
  );
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
