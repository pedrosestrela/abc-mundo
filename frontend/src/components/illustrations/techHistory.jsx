// Simple flat-design SVG illustrations for the "Tech History" module: the
// history of the automobile, the history of the lightbulb/electricity, and
// today's ways of producing electricity. Same shared visual language as the
// rest of the illustrations/ library (flat shapes, PALETTE colors,
// STROKE_WIDTH outlines), same { size, className } prop interface via
// IllustrationBase.
import React from "react";
import IllustrationBase from "./IllustrationBase.jsx";
import { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";

// A simple horse-drawn carriage: two large wheels, a boxy cabin, and a horse
// silhouette in front — used for the earliest automobile-history stage.
export function IllustrationCarriage({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Carruagem puxada por um cavalo">
      <path
        d="M62 20 Q72 14 80 22 L84 34 M80 22 L72 34 M62 20 L66 34"
        fill="none"
        stroke={PALETTE.brown}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="18" y="40" width="34" height="24" rx="4" fill={PALETTE.orange} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M52 46 L64 40 L64 58 L52 58" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <circle cx="26" cy="72" r="12" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="52" cy="72" r="12" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M8 64 L18 52" stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
    </IllustrationBase>
  );
}

// A boxy, boiler-topped early prototype vehicle — reads as "steam/early
// combustion car", used for the second automobile-history stage.
export function IllustrationEarlyCar({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Primeiro protótipo de automóvel com caldeira">
      <rect x="20" y="46" width="52" height="22" rx="4" fill={PALETTE.gray} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="34" cy="30" r="12" fill={PALETTE.brown} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M34 18 Q30 8 34 4 M40 18 Q44 10 40 2" fill="none" stroke={PALETTE.gray} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <circle cx="30" cy="76" r="10" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="64" cy="76" r="10" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
    </IllustrationBase>
  );
}

// A round-fendered classic car with an assembly-line arrow — used for the
// Ford Model T / mass-production stage.
export function IllustrationClassicCar({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Carro clássico numa linha de montagem">
      <path
        d="M14 58 L20 42 Q26 34 40 34 L58 34 Q68 34 74 44 L82 58 Z"
        fill={PALETTE.orangeDark}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <rect x="34" y="24" width="26" height="16" rx="4" fill={PALETTE.orange} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="28" cy="60" r="11" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="70" cy="60" r="11" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M4 78 H90 M78 72 L90 78 L78 84" fill="none" stroke={PALETTE.blue} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </IllustrationBase>
  );
}

// A rounder, sleeker modern car silhouette with headlights — used for the
// "modern cars" stage.
export function IllustrationModernCar({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Carro moderno">
      <path
        d="M10 58 Q10 46 24 44 L34 30 Q40 24 52 24 L64 24 Q74 24 78 34 L86 44 Q92 46 92 58 Z"
        fill={PALETTE.blue}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <path d="M36 30 L42 44 L72 44 L64 30 Z" fill={PALETTE.cream} opacity="0.85" />
      <circle cx="28" cy="60" r="11" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="74" cy="60" r="11" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="82" cy="44" r="3" fill={PALETTE.yellow} />
    </IllustrationBase>
  );
}

// A modern car silhouette with a lightning-bolt charging plug — used for the
// "electric cars" stage.
export function IllustrationElectricCar({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Carro elétrico a carregar">
      <path
        d="M8 58 Q8 46 22 44 L32 30 Q38 24 50 24 L62 24 Q72 24 76 34 L84 44 Q90 46 90 58 Z"
        fill={PALETTE.green}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <path d="M34 30 L40 44 L70 44 L62 30 Z" fill={PALETTE.cream} opacity="0.85" />
      <circle cx="26" cy="60" r="11" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="72" cy="60" r="11" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path
        d="M52 6 L42 24 L50 24 L46 40 L62 18 L54 18 Z"
        fill={PALETTE.yellow}
        stroke={STROKE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </IllustrationBase>
  );
}

// A lit candle — for the "candles and oil lamps" electricity-history stage.
export function IllustrationCandle({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Vela acesa">
      <rect x="42" y="40" width="16" height="46" rx="3" fill={PALETTE.cream} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M42 50 H58 M42 62 H58 M42 74 H58" stroke={STROKE} strokeWidth="1.5" opacity="0.3" />
      <path
        d="M50 38 C44 38 40 32 44 25 C46 29 48 29 48 25 C48 20 52 16 50 10 C56 16 58 22 55 27 C58 26 59 22 58 19 C63 24 61 33 55 36 Z"
        fill={PALETTE.orange}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <path
        d="M50 32 C46 32 44 28 46 23 C47 25 49 25 49 23 C49 20 51 18 50 15 C54 19 55 23 53 26 Z"
        fill={PALETTE.yellow}
      />
    </IllustrationBase>
  );
}

// A hand-cranked static-electricity / Volta-pile stack: alternating discs —
// used for the "first experiments with electricity" stage.
export function IllustrationVoltaPile({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Pilha voltaica, discos de metal empilhados">
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x="32"
          y={72 - i * 14}
          width="36"
          height="11"
          rx="2"
          fill={i % 2 === 0 ? PALETTE.orange : PALETTE.gray}
          stroke={STROKE}
          strokeWidth="3"
        />
      ))}
      <path d="M50 8 L44 22 L50 22 L46 34 L60 16 L52 16 Z" fill={PALETTE.yellow} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
    </IllustrationBase>
  );
}

// A classic incandescent lightbulb with a glowing filament — used for the
// "electric lightbulb" invention stage and reused for "today's LEDs" in a
// brighter palette by the caller if desired.
export function IllustrationLightbulb({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Lâmpada elétrica acesa">
      <circle cx="50" cy="40" r="26" fill={PALETTE.yellow} opacity="0.9" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M42 62 H58 V72 Q58 78 50 78 Q42 78 42 72 Z" fill={PALETTE.gray} stroke={STROKE} strokeWidth="3" />
      <path d="M42 66 H58 M42 71 H58" stroke={STROKE} strokeWidth="1.5" opacity="0.4" />
      <path
        d="M42 30 Q50 24 58 30 Q52 40 58 50 Q50 56 42 50 Q48 40 42 30 Z"
        fill="none"
        stroke={PALETTE.orangeDark}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </IllustrationBase>
  );
}

// A row of houses/buildings with a shared power line overhead — used for the
// "electrification of homes and cities" stage.
export function IllustrationCityLights({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Casas e ruas iluminadas por eletricidade">
      <path d="M6 22 H94" stroke={STROKE} strokeWidth="3" opacity="0.5" />
      <path d="M20 22 V12 M50 22 V8 M78 22 V14" stroke={STROKE} strokeWidth="3" opacity="0.5" />
      <circle cx="20" cy="10" r="4" fill={PALETTE.yellow} />
      <circle cx="50" cy="6" r="4" fill={PALETTE.yellow} />
      <circle cx="78" cy="12" r="4" fill={PALETTE.yellow} />
      <rect x="10" y="46" width="24" height="34" fill={PALETTE.purple} opacity="0.85" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="40" y="34" width="26" height="46" fill={PALETTE.blue} opacity="0.85" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="72" y="52" width="20" height="28" fill={PALETTE.orange} opacity="0.85" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="17" y="54" width="6" height="6" fill={PALETTE.yellow} />
      <rect x="47" y="42" width="6" height="6" fill={PALETTE.yellow} />
      <rect x="57" y="58" width="6" height="6" fill={PALETTE.yellow} />
      <rect x="79" y="60" width="6" height="6" fill={PALETTE.yellow} />
    </IllustrationBase>
  );
}

// A small, bright LED bulb — a slimmer, brighter twin of IllustrationLightbulb
// used for the "today's LEDs" stage.
export function IllustrationLedBulb({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Lâmpada LED moderna">
      <path d="M50 6 L46 16 M40 12 L44 20 M60 12 L56 20" stroke={PALETTE.yellow} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="50" cy="42" r="24" fill={PALETTE.white} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="50" cy="42" r="14" fill={PALETTE.blue} opacity="0.4" />
      <path d="M42 62 H58 V70 Q58 76 50 76 Q42 76 42 70 Z" fill={PALETTE.gray} stroke={STROKE} strokeWidth="3" />
    </IllustrationBase>
  );
}

// A dam with falling water spinning a turbine — for hydroelectric power.
export function IllustrationHydroDam({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Barragem hidroelétrica com água a cair">
      <rect x="10" y="16" width="34" height="46" fill={PALETTE.gray} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M44 30 Q60 34 60 50 Q60 66 44 70" fill="none" stroke={PALETTE.blue} strokeWidth="6" strokeLinecap="round" />
      <circle cx="66" cy="70" r="12" fill="none" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <path d="M66 58 V82 M54 70 H78 M58 62 L74 78 M74 62 L58 78" stroke={STROKE} strokeWidth="2.5" />
      <path d="M8 70 H92" stroke={PALETTE.blue} strokeWidth="6" opacity="0.5" strokeLinecap="round" />
    </IllustrationBase>
  );
}

// A three-blade wind turbine on a tower — for wind power.
export function IllustrationWindTurbine({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Turbina eólica a girar">
      <path d="M50 40 L50 88" stroke={PALETTE.gray} strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="38" r="4" fill={PALETTE.gray} stroke={STROKE} strokeWidth="2" />
      <path d="M50 38 L50 10 Q56 10 56 20 Z" fill={PALETTE.blue} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 38 L26 52 Q26 44 36 42 Z" fill={PALETTE.blue} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M50 38 L74 52 Q74 44 64 42 Z" fill={PALETTE.blue} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
    </IllustrationBase>
  );
}

// A solar panel tilted toward a sun — for solar power.
export function IllustrationSolarPanel({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Painel solar sob o sol">
      <circle cx="76" cy="18" r="10" fill={PALETTE.yellow} stroke={STROKE} strokeWidth="3" />
      <path d="M76 2 V6 M92 18 H88 M62 18 H66 M64 6 L67 9 M88 6 L85 9" stroke={PALETTE.yellow} strokeWidth="3" strokeLinecap="round" />
      <path d="M10 70 L20 34 L78 34 L68 70 Z" fill={PALETTE.blue} stroke={STROKE} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" />
      <path d="M28 34 L20 70 M46 34 L38 70 M64 34 L56 70 M16 48 H74 M13 58 H72" stroke={STROKE} strokeWidth="1.5" opacity="0.5" />
      <path d="M22 70 H66 L64 78 H24 Z" fill={PALETTE.gray} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
    </IllustrationBase>
  );
}

// A factory/power-plant with a smoking chimney — used for thermal (fossil
// fuel) power, and reused with a cooling-tower silhouette read for nuclear.
export function IllustrationPowerPlant({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Central térmica com fumo a sair da chaminé">
      <rect x="16" y="44" width="60" height="34" fill={PALETTE.gray} stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <rect x="60" y="20" width="12" height="24" fill={PALETTE.gray} stroke={STROKE} strokeWidth="3" />
      <path
        d="M66 20 Q60 12 66 6 Q70 10 68 14 Q74 16 72 22"
        fill="none"
        stroke={PALETTE.brownDark}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.7"
      />
      <rect x="26" y="54" width="10" height="10" fill={PALETTE.yellow} opacity="0.8" />
      <rect x="44" y="54" width="10" height="10" fill={PALETTE.yellow} opacity="0.8" />
    </IllustrationBase>
  );
}

// A nuclear plant: cooling tower + reactor dome — for nuclear power.
export function IllustrationNuclearPlant({ size = 64, className = "" }) {
  return (
    <IllustrationBase size={size} className={className} label="Central nuclear com torre de arrefecimento">
      <path
        d="M20 80 L26 40 Q30 30 40 30 Q50 30 54 40 L60 80 Z"
        fill={PALETTE.gray}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
      />
      <path d="M64 80 V52 A14 14 0 0 1 92 52 V80 Z" fill={PALETTE.blue} opacity="0.7" stroke={STROKE} strokeWidth={STROKE_WIDTH} />
      <circle cx="40" cy="18" r="9" fill={PALETTE.yellow} stroke={STROKE} strokeWidth="3" />
      <path d="M40 9 L34 18 L40 18 L36 27 L46 15 L41 15 Z" fill={PALETTE.orangeDark} />
    </IllustrationBase>
  );
}

export const TECH_HISTORY_ILLUSTRATIONS = {
  IllustrationCarriage,
  IllustrationEarlyCar,
  IllustrationClassicCar,
  IllustrationModernCar,
  IllustrationElectricCar,
  IllustrationCandle,
  IllustrationVoltaPile,
  IllustrationLightbulb,
  IllustrationCityLights,
  IllustrationLedBulb,
  IllustrationHydroDam,
  IllustrationWindTurbine,
  IllustrationSolarPanel,
  IllustrationPowerPlant,
  IllustrationNuclearPlant,
};
