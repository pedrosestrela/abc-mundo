// A handful of small, kid-friendly inline SVG illustrations used by the
// songs module, looked up by illustrationId.
import React from "react";

export function SunFriends() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Sun and friends">
      <defs>
        <radialGradient id="sf-sun" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="55%" stopColor="#ffd93d" />
          <stop offset="100%" stopColor="#ffb703" />
        </radialGradient>
        <radialGradient id="sf-green" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#a8e6b0" />
          <stop offset="100%" stopColor="#3ba849" />
        </radialGradient>
        <radialGradient id="sf-blue" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#a9d0ff" />
          <stop offset="100%" stopColor="#4893ff" />
        </radialGradient>
        <filter id="sf-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#00000030" />
        </filter>
      </defs>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 100 + Math.cos(angle) * 40;
        const y1 = 60 + Math.sin(angle) * 40;
        const x2 = 100 + Math.cos(angle) * 56;
        const y2 = 60 + Math.sin(angle) * 56;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd93d" strokeWidth="6" strokeLinecap="round" />;
      })}
      <circle cx="100" cy="60" r="34" fill="url(#sf-sun)" filter="url(#sf-shadow)" />
      <circle cx="88" cy="55" r="4" fill="#5c3a00" />
      <circle cx="112" cy="55" r="4" fill="#5c3a00" />
      <path d="M85 70 Q100 82 115 70" stroke="#5c3a00" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="64" r="4" fill="#ff9f45" opacity="0.5" />
      <circle cx="120" cy="64" r="4" fill="#ff9f45" opacity="0.5" />
      <circle cx="40" cy="120" r="14" fill="url(#sf-green)" filter="url(#sf-shadow)" />
      <circle cx="35" cy="115" r="3.5" fill="#fff" opacity="0.6" />
      <circle cx="160" cy="120" r="14" fill="url(#sf-blue)" filter="url(#sf-shadow)" />
      <circle cx="155" cy="115" r="3.5" fill="#fff" opacity="0.6" />
    </svg>
  );
}

export function JumpingLetters() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Jumping letters">
      <defs>
        <linearGradient id="jl-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9d8f0" />
          <stop offset="100%" stopColor="#8ecae6" />
        </linearGradient>
        <filter id="jl-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000030" />
        </filter>
      </defs>
      <path d="M0 122 Q100 104 200 122 L200 140 L0 140 Z" fill="url(#jl-ground)" />
      <circle cx="20" cy="128" r="4" fill="#fff" opacity="0.5" />
      <circle cx="180" cy="130" r="3" fill="#fff" opacity="0.5" />
      <text x="30" y="90" fontSize="40" fontWeight="bold" fill="#ff6b6b" filter="url(#jl-shadow)">M</text>
      <text x="85" y="60" fontSize="40" fontWeight="bold" fill="#ffd93d" filter="url(#jl-shadow)">N</text>
      <text x="140" y="90" fontSize="40" fontWeight="bold" fill="#6bcb77" filter="url(#jl-shadow)">O</text>
    </svg>
  );
}

export function AlphabetCircle() {
  const letters = ["W", "X", "Y", "Z"];
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"];
  return (
    <svg viewBox="0 0 200 200" width="100%" role="img" aria-label="Alphabet friends circle">
      <defs>
        {colors.map((c, i) => (
          <radialGradient key={c} id={`ac-grad-${i}`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="45%" stopColor={c} stopOpacity="0" />
            <stop offset="100%" stopColor={c} />
          </radialGradient>
        ))}
        <filter id="ac-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#00000030" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="70" fill="none" stroke="#f4a261" strokeWidth="4" strokeDasharray="10 6" strokeLinecap="round" />
      {letters.map((l, i) => {
        const angle = (i * Math.PI * 2) / letters.length - Math.PI / 2;
        const x = 100 + Math.cos(angle) * 70;
        const y = 100 + Math.sin(angle) * 70;
        return (
          <g key={l} filter="url(#ac-shadow)">
            <circle cx={x} cy={y} r="20" fill={colors[i % colors.length]} />
            <circle cx={x} cy={y} r="20" fill={`url(#ac-grad-${i})`} />
            <text x={x} y={y + 7} fontSize="20" fontWeight="bold" fill="#fff" textAnchor="middle">
              {l}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StarryNight() {
  const stars = [
    { x: 30, y: 30 }, { x: 60, y: 15 }, { x: 160, y: 25 },
    { x: 175, y: 60 }, { x: 20, y: 80 }, { x: 140, y: 100 },
  ];
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Moon and stars">
      <defs>
        <linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b1c3f" />
          <stop offset="100%" stopColor="#3a3d7a" />
        </linearGradient>
        <radialGradient id="sn-moon" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fffdf0" />
          <stop offset="100%" stopColor="#ffe066" />
        </radialGradient>
        <radialGradient id="sn-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe066" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffe066" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sn-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6bb0ff" />
          <stop offset="100%" stopColor="#4d96ff" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="140" fill="url(#sn-sky)" />
      <circle cx="140" cy="45" r="40" fill="url(#sn-glow)" />
      <circle cx="140" cy="45" r="26" fill="url(#sn-moon)" />
      <circle cx="150" cy="38" r="22" fill="url(#sn-sky)" />
      {stars.map((s, i) => (
        <text key={i} x={s.x} y={s.y} fontSize="16" fill="#fff9c4">★</text>
      ))}
      <path d="M20 130 Q100 100 180 130 L180 140 L20 140 Z" fill="url(#sn-hill)" />
    </svg>
  );
}

export function CountingBlocks() {
  const blocks = [
    { n: 1, color: "#ff6b6b" },
    { n: 2, color: "#ffd93d" },
    { n: 3, color: "#6bcb77" },
    { n: 4, color: "#4d96ff" },
    { n: 5, color: "#9b5de5" },
  ];
  return (
    <svg viewBox="0 0 200 100" width="100%" role="img" aria-label="Counting blocks">
      <defs>
        <filter id="cb-shadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#00000035" />
        </filter>
      </defs>
      {blocks.map((b, i) => (
        <g key={b.n} filter="url(#cb-shadow)">
          <rect x={10 + i * 38} y="30" width="30" height="30" rx="9" fill={b.color} />
          <path d={`M${14 + i * 38} 34 h22 a5 5 0 0 1 5 5 v4 h-27 z`} fill="#fff" opacity="0.25" />
          <text x={25 + i * 38} y="52" fontSize="16" fontWeight="bold" fill="#fff" textAnchor="middle">
            {b.n}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ShapesFun() {
  return (
    <svg viewBox="0 0 200 100" width="100%" role="img" aria-label="Shapes">
      <defs>
        <radialGradient id="shf-red" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffb0b0" />
          <stop offset="100%" stopColor="#ff6b6b" />
        </radialGradient>
        <linearGradient id="shf-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a9d0ff" />
          <stop offset="100%" stopColor="#4d96ff" />
        </linearGradient>
        <linearGradient id="shf-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8e6b0" />
          <stop offset="100%" stopColor="#6bcb77" />
        </linearGradient>
        <filter id="shf-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000030" />
        </filter>
      </defs>
      <circle cx="35" cy="50" r="26" fill="url(#shf-red)" filter="url(#shf-shadow)" />
      <circle cx="27" cy="42" r="5" fill="#fff" opacity="0.5" />
      <rect x="80" y="24" width="52" height="52" rx="10" fill="url(#shf-blue)" filter="url(#shf-shadow)" />
      <rect x="86" y="30" width="16" height="6" rx="3" fill="#fff" opacity="0.4" />
      <polygon points="170,20 195,75 145,75" fill="url(#shf-green)" filter="url(#shf-shadow)" strokeLinejoin="round" />
      <polygon points="170,32 183,58 157,58" fill="#fff" opacity="0.18" />
    </svg>
  );
}

// ---------------------------------------------------------------------
// Castelo do Tempo (Portugal History timeline) illustrations, one per era.
// Same style conventions as above: viewBox ~200x140, simple flat shapes,
// shared color palette.
// ---------------------------------------------------------------------

export function CavePainting() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Cave painting of a mammoth">
      <defs>
        <linearGradient id="cp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dab77e" />
          <stop offset="100%" stopColor="#c8a165" />
        </linearGradient>
        <linearGradient id="cp-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9c7a4a" />
          <stop offset="100%" stopColor="#8c6a3f" />
        </linearGradient>
        <radialGradient id="cp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd93d" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd93d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="140" fill="url(#cp-wall)" />
      <path d="M0 110 Q100 80 200 110 L200 140 L0 140 Z" fill="url(#cp-floor)" />
      <g stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 90 Q55 60 80 65 Q95 55 110 65 Q120 60 125 75 L120 95 Q90 105 60 100 Z" />
        <line x1="120" y1="80" x2="140" y2="70" />
        <line x1="118" y1="88" x2="138" y2="90" />
      </g>
      <circle cx="150" cy="30" r="20" fill="url(#cp-glow)" />
      <circle cx="150" cy="30" r="10" fill="#ffd93d" />
    </svg>
  );
}

export function CelticShield() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Celtic warrior shield">
      <polygon points="100,15 160,40 150,100 100,130 50,100 40,40" fill="#6bcb77" stroke="#2b5c3a" strokeWidth="4" />
      <circle cx="100" cy="70" r="24" fill="none" stroke="#fff" strokeWidth="4" />
      <path d="M100 46 L100 94 M76 70 L124 70" stroke="#fff" strokeWidth="4" />
      <line x1="20" y1="120" x2="45" y2="60" stroke="#5c3a00" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function RomanColumn() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Roman column and aqueduct">
      <defs>
        <linearGradient id="rc-stone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f4ead0" />
          <stop offset="100%" stopColor="#e8d9b5" />
        </linearGradient>
        <linearGradient id="rc-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ecae6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4d96ff" stopOpacity="0.6" />
        </linearGradient>
        <filter id="rc-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000025" />
        </filter>
      </defs>
      <rect x="10" y="60" width="180" height="14" rx="3" fill="url(#rc-stone)" stroke="#b8a37a" strokeWidth="1.5" filter="url(#rc-shadow)" />
      {[30, 80, 130, 170].map((x, i) => (
        <g key={i} filter="url(#rc-shadow)">
          <rect x={x} y="20" width="18" height="90" rx="2" fill="url(#rc-stone)" stroke="#b8a37a" strokeWidth="2" />
          <rect x={x - 3} y="16" width="24" height="7" rx="2" fill="#f4ead0" stroke="#b8a37a" strokeWidth="1.5" />
        </g>
      ))}
      <rect x="0" y="110" width="200" height="30" fill="url(#rc-water)" />
    </svg>
  );
}

export function VisigothCrown() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Visigothic votive crown">
      <circle cx="100" cy="60" r="40" fill="none" stroke="#f4a261" strokeWidth="8" />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <circle key={i} cx={100 + 40 * Math.cos((a * Math.PI) / 180)} cy={60 + 40 * Math.sin((a * Math.PI) / 180)} r="7" fill="#9b5de5" />
      ))}
      <line x1="100" y1="100" x2="100" y2="130" stroke="#f4a261" strokeWidth="4" />
      <polygon points="90,130 110,130 100,140" fill="#f4a261" />
    </svg>
  );
}

export function AndalusMoon() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Crescent moon over an Al-Andalus courtyard">
      <rect x="0" y="0" width="200" height="140" fill="#2b2d5c" />
      <circle cx="150" cy="35" r="20" fill="#ffe066" />
      <circle cx="158" cy="28" r="17" fill="#2b2d5c" />
      <path d="M20 140 L20 90 Q60 70 100 90 Q140 70 180 90 L180 140 Z" fill="#f4a261" />
      {[45, 100, 155].map((x, i) => (
        <path key={i} d={`M${x - 12} 90 Q${x} 70 ${x + 12} 90`} fill="none" stroke="#5c3a1e" strokeWidth="3" />
      ))}
    </svg>
  );
}

export function CountyCastle() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Small medieval county castle">
      <rect x="0" y="100" width="200" height="40" fill="#8ecae6" />
      <rect x="50" y="55" width="100" height="55" fill="#c9c9c9" />
      {[50, 80, 110, 140].map((x, i) => (
        <rect key={i} x={x} y="45" width="20" height="14" fill="#c9c9c9" />
      ))}
      <rect x="90" y="80" width="20" height="30" fill="#5c3a1e" />
      <polygon points="100,20 100,55" stroke="#5c3a1e" strokeWidth="3" />
      <polygon points="100,20 130,32 100,32" fill="#ff6b6b" />
    </svg>
  );
}

export function FirstKingCrown() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Royal crown of the first king of Portugal">
      <polygon points="40,110 40,70 65,90 100,50 135,90 160,70 160,110" fill="#ffd93d" stroke="#c98f00" strokeWidth="4" />
      <circle cx="65" cy="70" r="8" fill="#ff6b6b" />
      <circle cx="100" cy="50" r="9" fill="#4d96ff" />
      <circle cx="135" cy="70" r="8" fill="#6bcb77" />
      <rect x="40" y="110" width="120" height="14" fill="#ffd93d" stroke="#c98f00" strokeWidth="4" />
    </svg>
  );
}

export function SwordVictory() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Sword marking the end of the Reconquest">
      <line x1="100" y1="20" x2="100" y2="110" stroke="#c9c9c9" strokeWidth="10" strokeLinecap="round" />
      <rect x="70" y="95" width="60" height="10" fill="#f4a261" />
      <rect x="92" y="105" width="16" height="28" fill="#8c6a3f" />
      <path d="M40 130 Q100 145 160 130" stroke="#6bcb77" strokeWidth="6" fill="none" />
    </svg>
  );
}

export function WheatField() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Wheat field of the Farmer King">
      <rect x="0" y="90" width="200" height="50" fill="#f4a261" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <line x1={20 + i * 22} y1="95" x2={20 + i * 22} y2="55" stroke="#6bcb77" strokeWidth="3" />
          <circle cx={20 + i * 22} cy="50" r="6" fill="#ffd93d" />
        </g>
      ))}
      <circle cx="170" cy="25" r="16" fill="#ffe066" />
    </svg>
  );
}

export function PlagueRat() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Symbol of the Black Death era">
      <rect x="0" y="0" width="200" height="140" fill="#3a3a4a" />
      <ellipse cx="100" cy="90" rx="45" ry="24" fill="#7a7a8a" />
      <circle cx="60" cy="80" r="16" fill="#7a7a8a" />
      <path d="M55 68 L48 55 M65 68 L70 54" stroke="#7a7a8a" strokeWidth="4" />
      <circle cx="55" cy="80" r="2" fill="#000" />
      <path d="M140 95 Q160 100 175 90" stroke="#7a7a8a" strokeWidth="4" fill="none" />
    </svg>
  );
}

export function BalanceScale() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Scale symbolizing the 1383-85 crisis">
      <line x1="100" y1="15" x2="100" y2="100" stroke="#5c3a1e" strokeWidth="5" />
      <line x1="45" y1="40" x2="155" y2="40" stroke="#5c3a1e" strokeWidth="5" />
      <line x1="45" y1="40" x2="45" y2="65" stroke="#5c3a1e" strokeWidth="3" />
      <line x1="155" y1="40" x2="155" y2="65" stroke="#5c3a1e" strokeWidth="3" />
      <path d="M25 65 Q45 85 65 65 Z" fill="#4d96ff" />
      <path d="M135 65 Q155 85 175 65 Z" fill="#ff6b6b" />
      <rect x="80" y="100" width="40" height="30" fill="#8c6a3f" />
    </svg>
  );
}

export function Caravel() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Portuguese caravel sailing the ocean">
      <defs>
        <linearGradient id="cv-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6bb3ff" />
          <stop offset="100%" stopColor="#3a7fe0" />
        </linearGradient>
        <linearGradient id="cv-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5764a" />
          <stop offset="100%" stopColor="#8c6a3f" />
        </linearGradient>
        <linearGradient id="cv-sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fff9e6" />
        </linearGradient>
        <radialGradient id="cv-sun" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="100%" stopColor="#ffe066" />
        </radialGradient>
      </defs>
      <circle cx="170" cy="25" r="14" fill="url(#cv-sun)" />
      <rect x="0" y="95" width="200" height="45" fill="url(#cv-sea)" />
      <path d="M0 98 Q20 93 40 98 T80 98 T120 98 T160 98 T200 98" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M40 95 L60 60 L150 95 Z" fill="url(#cv-hull)" stroke="#5c3a1e" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="100" y1="20" x2="100" y2="70" stroke="#5c3a1e" strokeWidth="4" strokeLinecap="round" />
      <path d="M100 22 L140 45 L100 62 Z" fill="url(#cv-sail)" stroke="#c9c9c9" strokeLinejoin="round" />
      <path d="M100 40 L70 55 L100 65 Z" fill="url(#cv-sail)" stroke="#c9c9c9" strokeLinejoin="round" />
    </svg>
  );
}

export function CompassNavigator() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Navigational compass of the discoveries">
      <circle cx="100" cy="70" r="55" fill="#8ecae6" stroke="#2b5c8a" strokeWidth="4" />
      <circle cx="100" cy="70" r="6" fill="#2b5c8a" />
      <polygon points="100,25 108,70 100,60 92,70" fill="#ff6b6b" />
      <polygon points="100,115 108,70 100,80 92,70" fill="#fff" />
      <text x="100" y="18" fontSize="10" fill="#2b5c8a" textAnchor="middle">N</text>
    </svg>
  );
}

export function DesertBattle() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Desert battlefield of Alcácer Quibir">
      <rect x="0" y="0" width="200" height="90" fill="#f4a261" />
      <rect x="0" y="90" width="200" height="50" fill="#e0b96a" />
      <circle cx="150" cy="30" r="18" fill="#ffe066" />
      <line x1="60" y1="100" x2="60" y2="60" stroke="#5c3a1e" strokeWidth="4" />
      <line x1="90" y1="100" x2="90" y2="55" stroke="#5c3a1e" strokeWidth="4" />
      <polygon points="60,60 66,72 54,72" fill="#c9c9c9" />
      <polygon points="90,55 96,67 84,67" fill="#c9c9c9" />
    </svg>
  );
}

export function LinkedCrowns() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Two linked crowns of the Iberian Union">
      <circle cx="75" cy="65" r="35" fill="none" stroke="#ff6b6b" strokeWidth="8" />
      <circle cx="125" cy="65" r="35" fill="none" stroke="#ffd93d" strokeWidth="8" />
      <polygon points="55,105 55,90 65,100 75,80 85,100 95,90 95,105" fill="#ff6b6b" opacity="0.85" />
      <polygon points="105,105 105,90 115,100 125,80 135,100 145,90 145,105" fill="#ffd93d" opacity="0.85" />
    </svg>
  );
}

export function CarnationFlag() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Flag raised at the Restoration of Independence">
      <line x1="40" y1="20" x2="40" y2="130" stroke="#5c3a1e" strokeWidth="6" />
      <rect x="40" y="25" width="90" height="55" fill="#6bcb77" />
      <rect x="103" y="25" width="27" height="55" fill="#ff6b6b" />
      <circle cx="103" cy="52" r="14" fill="#ffd93d" stroke="#c98f00" strokeWidth="2" />
    </svg>
  );
}

export function TsunamiWave() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Tsunami wave of the 1755 earthquake">
      <rect x="0" y="0" width="200" height="140" fill="#c9c9c9" />
      <path d="M0 90 Q40 50 80 90 Q120 130 160 90 Q180 70 200 90 L200 140 L0 140 Z" fill="#2b5c8a" />
      <rect x="70" y="55" width="16" height="35" fill="#8c6a3f" transform="rotate(15 78 70)" />
      <polygon points="150,15 155,35 175,35 158,47 165,68 150,55 135,68 142,47 125,35 145,35" fill="#ffd93d" />
    </svg>
  );
}

export function ReconstructionCrane() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Reconstruction of Lisbon led by the Marquis of Pombal">
      <rect x="0" y="110" width="200" height="30" fill="#c9c9c9" />
      <rect x="30" y="60" width="55" height="50" fill="#f4a261" stroke="#8c6a3f" strokeWidth="2" />
      <rect x="100" y="40" width="55" height="70" fill="#e8d9b5" stroke="#8c6a3f" strokeWidth="2" />
      <line x1="127" y1="10" x2="127" y2="40" stroke="#5c3a1e" strokeWidth="4" />
      <line x1="127" y1="10" x2="160" y2="20" stroke="#5c3a1e" strokeWidth="4" />
      <line x1="160" y1="20" x2="160" y2="45" stroke="#5c3a1e" strokeWidth="3" />
    </svg>
  );
}

export function BookAndQuill() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Book and quill symbolizing Pombal's reforms">
      <rect x="45" y="70" width="110" height="55" rx="4" fill="#4d96ff" />
      <line x1="100" y1="70" x2="100" y2="125" stroke="#fff" strokeWidth="2" />
      <path d="M120 30 L150 70 L135 78 L108 40 Z" fill="#ffd93d" stroke="#c98f00" strokeWidth="2" />
      <line x1="108" y1="40" x2="95" y2="66" stroke="#5c3a1e" strokeWidth="2" />
    </svg>
  );
}

export function SoldierHelmet() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Helmet symbolizing the French invasions">
      <path d="M60 90 Q60 40 100 40 Q140 40 140 90 Z" fill="#7a7a8a" stroke="#4a4a5a" strokeWidth="3" />
      <rect x="55" y="88" width="90" height="14" fill="#4a4a5a" />
      <circle cx="100" cy="35" r="8" fill="#ff6b6b" />
      <rect x="20" y="115" width="160" height="10" fill="#5c3a1e" />
    </svg>
  );
}

export function ConstitutionScroll() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Constitution scroll of the Liberal Wars era">
      <rect x="40" y="30" width="120" height="80" fill="#fff9e6" stroke="#c9c9c9" strokeWidth="3" />
      <circle cx="40" cy="30" r="10" fill="#e8d9b5" />
      <circle cx="40" cy="110" r="10" fill="#e8d9b5" />
      <circle cx="160" cy="30" r="10" fill="#e8d9b5" />
      <circle cx="160" cy="110" r="10" fill="#e8d9b5" />
      {[45, 60, 75, 90].map((y, i) => (
        <line key={i} x1="55" y1={y} x2="145" y2={y} stroke="#c9c9c9" strokeWidth="3" />
      ))}
    </svg>
  );
}

export function BrokenChain() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Broken chain symbolizing the abolition of slavery">
      {[40, 75, 110].map((x, i) => (
        <ellipse key={i} cx={x} cy="70" rx="18" ry="26" fill="none" stroke="#5c3a1e" strokeWidth="8" transform={`rotate(${i % 2 === 0 ? 20 : -20} ${x} 70)`} />
      ))}
      <line x1="140" y1="55" x2="165" y2="85" stroke="#5c3a1e" strokeWidth="8" strokeLinecap="round" />
      <line x1="165" y1="55" x2="140" y2="85" stroke="#5c3a1e" strokeWidth="8" strokeLinecap="round" />
      <circle cx="100" cy="30" r="14" fill="#ffd93d" />
    </svg>
  );
}

export function RepublicFlag() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Flag of the Portuguese Republic">
      <line x1="50" y1="15" x2="50" y2="130" stroke="#5c3a1e" strokeWidth="6" />
      <rect x="50" y="25" width="45" height="55" fill="#6bcb77" />
      <rect x="95" y="25" width="65" height="55" fill="#ff6b6b" />
      <circle cx="95" cy="52" r="16" fill="#ffd93d" stroke="#c98f00" strokeWidth="2" />
    </svg>
  );
}

export function WarMedal() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Medal for Portugal in the First World War">
      <polygon points="80,15 90,45 65,45" fill="#4d96ff" />
      <polygon points="120,15 110,45 135,45" fill="#ff6b6b" />
      <circle cx="100" cy="85" r="35" fill="#ffd93d" stroke="#c98f00" strokeWidth="5" />
      <circle cx="100" cy="85" r="18" fill="#c98f00" />
    </svg>
  );
}

export function LockedDoor() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Locked door symbolizing the Estado Novo dictatorship">
      <rect x="0" y="0" width="200" height="140" fill="#4a4a5a" />
      <rect x="60" y="20" width="80" height="110" fill="#7a7a8a" stroke="#2b2b33" strokeWidth="4" />
      <circle cx="120" cy="75" r="7" fill="#2b2b33" />
      <rect x="45" y="10" width="10" height="120" fill="#2b2b33" />
      <rect x="145" y="10" width="10" height="120" fill="#2b2b33" />
    </svg>
  );
}

export function Carnation() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Red carnation of the 25 de Abril revolution">
      <defs>
        <linearGradient id="cn-stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fe0a0" />
          <stop offset="100%" stopColor="#6bcb77" />
        </linearGradient>
        <radialGradient id="cn-petal" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff9d9d" />
          <stop offset="100%" stopColor="#ff6b6b" />
        </radialGradient>
        <filter id="cn-shadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#00000030" />
        </filter>
      </defs>
      <line x1="100" y1="70" x2="100" y2="135" stroke="url(#cn-stem)" strokeWidth="5" strokeLinecap="round" />
      <path d="M100 100 Q80 110 75 125" stroke="url(#cn-stem)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g filter="url(#cn-shadow)">
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 10;
          return <circle key={i} cx={100 + 22 * Math.cos(a)} cy={55 + 22 * Math.sin(a)} r="13" fill="url(#cn-petal)" opacity="0.9" />;
        })}
        <circle cx="100" cy="55" r="10" fill="url(#cn-petal)" />
      </g>
      <circle cx="100" cy="55" r="9" fill="#ffd93d" />
      <circle cx="96" cy="51" r="2.5" fill="#fff" opacity="0.6" />
    </svg>
  );
}

export function EuropeStars() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Ring of stars symbolizing joining the EEC/EU">
      <circle cx="100" cy="70" r="45" fill="#4d96ff" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
        const x = 100 + 32 * Math.cos(a);
        const y = 70 + 32 * Math.sin(a);
        return <text key={i} x={x} y={y + 5} fontSize="12" fill="#ffd93d" textAnchor="middle">★</text>;
      })}
    </svg>
  );
}

export function EuroCoin() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Euro coin symbolizing the adoption of the euro">
      <defs>
        <radialGradient id="ec-gold" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="100%" stopColor="#ffd93d" />
        </radialGradient>
        <radialGradient id="ec-blue" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#7fb4ff" />
          <stop offset="100%" stopColor="#4d96ff" />
        </radialGradient>
        <filter id="ec-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#00000035" />
        </filter>
      </defs>
      <circle cx="100" cy="70" r="50" fill="url(#ec-gold)" stroke="#c98f00" strokeWidth="5" filter="url(#ec-shadow)" />
      <circle cx="100" cy="70" r="36" fill="url(#ec-blue)" />
      <path d="M75 52 A28 28 0 1 0 75 88" stroke="#fff" strokeOpacity="0.3" strokeWidth="4" fill="none" strokeLinecap="round" />
      <text x="100" y="82" fontSize="42" fontWeight="bold" fill="#fff" textAnchor="middle">€</text>
      <circle cx="82" cy="52" r="4" fill="#fff" opacity="0.35" />
    </svg>
  );
}

export function FootballTrophy() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Football and stadium for Euro 2004">
      <rect x="0" y="100" width="200" height="40" fill="#6bcb77" />
      <circle cx="100" cy="60" r="28" fill="#fff" stroke="#2b2b33" strokeWidth="3" />
      <polygon points="100,45 111,53 107,66 93,66 89,53" fill="#2b2b33" />
      <path d="M40 100 Q100 70 160 100" stroke="#fff" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function ChampionCup() {
  return (
    <svg viewBox="0 0 200 140" width="100%" role="img" aria-label="Champion's cup for the 2016 European title">
      <defs>
        <linearGradient id="cc-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="60%" stopColor="#ffd93d" />
          <stop offset="100%" stopColor="#e8ad00" />
        </linearGradient>
        <filter id="cc-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#00000030" />
        </filter>
      </defs>
      <g filter="url(#cc-shadow)">
        <path d="M75 30 h50 v35 a25 25 0 0 1 -50 0 Z" fill="url(#cc-gold)" stroke="#c98f00" strokeWidth="4" strokeLinejoin="round" />
        <path d="M75 40 Q50 40 50 60 Q50 75 75 72" fill="none" stroke="#c98f00" strokeWidth="5" strokeLinecap="round" />
        <path d="M125 40 Q150 40 150 60 Q150 75 125 72" fill="none" stroke="#c98f00" strokeWidth="5" strokeLinecap="round" />
        <rect x="90" y="95" width="20" height="20" fill="url(#cc-gold)" stroke="#c98f00" strokeWidth="3" />
        <rect x="75" y="115" width="50" height="12" rx="3" fill="#c98f00" />
      </g>
      <path d="M82 36 Q80 50 88 58" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="100" cy="35" r="3" fill="#fff" opacity="0.55" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  "sun-friends": SunFriends,
  "jumping-letters": JumpingLetters,
  "alphabet-circle": AlphabetCircle,
  "starry-night": StarryNight,
  "counting-blocks": CountingBlocks,
  "shapes-fun": ShapesFun,
  // Castelo do Tempo eras (keyed by era id in portugalHistory.json)
  prehistoria: CavePainting,
  "lusitanos-celtas": CelticShield,
  romanos: RomanColumn,
  visigodos: VisigothCrown,
  "al-andalus": AndalusMoon,
  "condado-portucalense": CountyCastle,
  "afonso-henriques": FirstKingCrown,
  reconquista: SwordVictory,
  "dom-dinis": WheatField,
  "peste-negra": PlagueRat,
  "crise-1383": BalanceScale,
  descobrimentos: Caravel,
  "joao-ii": CompassNavigator,
  "alcacer-quibir": DesertBattle,
  "uniao-iberica": LinkedCrowns,
  restauracao: CarnationFlag,
  "terramoto-1755": TsunamiWave,
  "pombal-reformas": ReconstructionCrane,
  "invasoes-francesas": SoldierHelmet,
  liberalismo: ConstitutionScroll,
  "abolicao-escravatura": BrokenChain,
  "republica-1910": RepublicFlag,
  "primeira-guerra-mundial": WarMedal,
  "estado-novo": LockedDoor,
  "revolucao-abril": Carnation,
  "adesao-cee": EuropeStars,
  "adesao-euro": EuroCoin,
  euro2004: FootballTrophy,
  euro2016: ChampionCup,
};

export default function Illustration({ illustrationId }) {
  const Component = ILLUSTRATIONS[illustrationId] || SunFriends;
  return <Component />;
}
