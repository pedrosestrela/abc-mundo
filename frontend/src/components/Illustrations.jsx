// A handful of small, kid-friendly inline SVG illustrations used by the
// songs module, looked up by illustrationId.
import React from "react";

export function SunFriends() {
  return (
    <svg viewBox="0 0 200 140" width="100%" height="auto" role="img" aria-label="Sun and friends">
      <circle cx="100" cy="60" r="34" fill="#ffd93d" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x1 = 100 + Math.cos(angle) * 40;
        const y1 = 60 + Math.sin(angle) * 40;
        const x2 = 100 + Math.cos(angle) * 55;
        const y2 = 60 + Math.sin(angle) * 55;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd93d" strokeWidth="6" strokeLinecap="round" />;
      })}
      <circle cx="88" cy="55" r="4" fill="#5c3a00" />
      <circle cx="112" cy="55" r="4" fill="#5c3a00" />
      <path d="M85 70 Q100 82 115 70" stroke="#5c3a00" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="120" r="14" fill="#6bcB77" />
      <circle cx="160" cy="120" r="14" fill="#4d96ff" />
    </svg>
  );
}

export function JumpingLetters() {
  return (
    <svg viewBox="0 0 200 140" width="100%" height="auto" role="img" aria-label="Jumping letters">
      <rect x="0" y="110" width="200" height="30" fill="#8ecae6" />
      <text x="30" y="90" fontSize="40" fontWeight="bold" fill="#ff6b6b">M</text>
      <text x="85" y="60" fontSize="40" fontWeight="bold" fill="#ffd93d">N</text>
      <text x="140" y="90" fontSize="40" fontWeight="bold" fill="#6bcb77">O</text>
    </svg>
  );
}

export function AlphabetCircle() {
  const letters = ["W", "X", "Y", "Z"];
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"];
  return (
    <svg viewBox="0 0 200 200" width="100%" height="auto" role="img" aria-label="Alphabet friends circle">
      <circle cx="100" cy="100" r="70" fill="none" stroke="#f4a261" strokeWidth="4" strokeDasharray="10 6" />
      {letters.map((l, i) => {
        const angle = (i * Math.PI * 2) / letters.length - Math.PI / 2;
        const x = 100 + Math.cos(angle) * 70;
        const y = 100 + Math.sin(angle) * 70;
        return (
          <g key={l}>
            <circle cx={x} cy={y} r="20" fill={colors[i % colors.length]} />
            <text x={x} y={y + 7} fontSize="20" fontWeight="bold" fill="#fff" textAnchor="middle">
              {l}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const ILLUSTRATIONS = {
  "sun-friends": SunFriends,
  "jumping-letters": JumpingLetters,
  "alphabet-circle": AlphabetCircle,
};

export default function Illustration({ illustrationId }) {
  const Component = ILLUSTRATIONS[illustrationId] || SunFriends;
  return <Component />;
}
