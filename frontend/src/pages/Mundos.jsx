import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Small decorative inline SVG motifs, one per "place" theme.
// Kept intentionally tiny/lightweight — no external assets.
function VillageMotif() {
  return (
    <svg viewBox="0 0 120 40" className="mundos-motif" aria-hidden="true">
      <polygon points="10,24 20,12 30,24" fill="currentColor" opacity="0.35" />
      <rect x="12" y="24" width="16" height="12" fill="currentColor" opacity="0.35" />
      <circle cx="55" cy="20" r="10" fill="currentColor" opacity="0.25" />
      <rect x="50" y="20" width="10" height="16" fill="currentColor" opacity="0.25" />
      <polygon points="90,26 100,14 110,26" fill="currentColor" opacity="0.35" />
      <rect x="92" y="26" width="16" height="10" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function IslandMotif() {
  return (
    <svg viewBox="0 0 120 40" className="mundos-motif" aria-hidden="true">
      <circle cx="30" cy="18" r="9" fill="currentColor" opacity="0.3" />
      <text x="30" y="22" fontSize="10" textAnchor="middle" fill="currentColor" opacity="0.5">$</text>
      <circle cx="65" cy="12" r="6" fill="currentColor" opacity="0.25" />
      <path
        d="M0 30 Q 15 22, 30 30 T 60 30 T 90 30 T 120 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.35"
      />
    </svg>
  );
}

function MusicMotif() {
  return (
    <svg viewBox="0 0 120 40" className="mundos-motif" aria-hidden="true">
      <path d="M15 30 V10 l14 -3 v20" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.4" />
      <circle cx="15" cy="30" r="4" fill="currentColor" opacity="0.4" />
      <circle cx="29" cy="27" r="4" fill="currentColor" opacity="0.4" />
      <path d="M70 6 L70 34 M70 6 Q100 2 100 16 Q100 24 82 22" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
    </svg>
  );
}

function CastleMotif() {
  return (
    <svg viewBox="0 0 120 40" className="mundos-motif" aria-hidden="true">
      <rect x="10" y="16" width="10" height="20" fill="currentColor" opacity="0.35" />
      <rect x="8" y="10" width="4" height="6" fill="currentColor" opacity="0.35" />
      <rect x="16" y="10" width="4" height="6" fill="currentColor" opacity="0.35" />
      <circle cx="60" cy="22" r="14" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M46 22 H74 M60 8 V36" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <rect x="98" y="16" width="10" height="20" fill="currentColor" opacity="0.35" />
      <rect x="96" y="10" width="4" height="6" fill="currentColor" opacity="0.35" />
      <rect x="104" y="10" width="4" height="6" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function LabMotif() {
  return (
    <svg viewBox="0 0 120 40" className="mundos-motif" aria-hidden="true">
      <path d="M45 8 h10 v10 l8 16 a4 4 0 0 1 -4 6 H41 a4 4 0 0 1 -4 -6 l8 -16 z" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <circle cx="46" cy="30" r="1.6" fill="currentColor" opacity="0.4" />
      <circle cx="52" cy="26" r="1.6" fill="currentColor" opacity="0.4" />
      <circle cx="90" cy="20" r="7" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="90" cy="20" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function LifeMotif() {
  return (
    <svg viewBox="0 0 120 40" className="mundos-motif" aria-hidden="true">
      <polygon points="20,10 32,20 28,20 28,34 12,34 12,20 8,20" fill="currentColor" opacity="0.35" />
      <path d="M70 30 C70 20 78 16 84 20 C90 16 98 20 98 30 C98 34 90 34 84 30 C78 34 70 34 70 30 Z" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

const GROUPS = [
  {
    heading: "groupRead",
    place: "placeRead",
    theme: "village",
    Motif: VillageMotif,
    tiles: [
      { to: "/languages", emoji: "🌐", nav: "language", sub: "sub_language" },
      { to: "/phonics", emoji: "👂", nav: "phonics", sub: "sub_phonics" },
      { to: "/alphabet", emoji: "🔤", nav: "alphabet", sub: "sub_alphabet" },
      { to: "/syllables", emoji: "🧩", nav: "syllables", sub: "sub_syllables" },
      { to: "/reading", emoji: "📖", nav: "reading", sub: "sub_reading" },
      { to: "/phrases", emoji: "💬", nav: "phrases", sub: "sub_phrases" },
      { to: "/stories", emoji: "📚", nav: "stories", sub: "sub_stories" },
      { to: "/rhymes", emoji: "🎭", nav: "rhymes", sub: "sub_rhymes" },
    ],
  },
  {
    heading: "groupNumbers",
    place: "placeNumbers",
    theme: "island",
    Motif: IslandMotif,
    tiles: [
      { to: "/math", emoji: "🔢", nav: "math", sub: "sub_math" },
      { to: "/financial", emoji: "💰", nav: "financial", sub: "sub_financial" },
    ],
  },
  {
    heading: "groupMusic",
    place: "placeMusic",
    theme: "music",
    Motif: MusicMotif,
    tiles: [
      { to: "/songs", emoji: "🎵", nav: "songs", sub: "sub_songs" },
      { to: "/music", emoji: "🎶", nav: "music", sub: "sub_music" },
    ],
  },
  {
    heading: "groupWorld",
    place: "placeWorld",
    theme: "castle",
    Motif: CastleMotif,
    tiles: [
      { to: "/world", emoji: "🗺️", nav: "world", sub: "sub_world" },
      { to: "/history", emoji: "🏰", nav: "history", sub: "sub_history" },
      { to: "/science", emoji: "🔬", nav: "science", sub: "sub_science" },
      { to: "/city", emoji: "🏙️", nav: "city", sub: "sub_city" },
    ],
  },
  {
    heading: "groupCreate",
    place: "placeCreate",
    theme: "lab",
    Motif: LabMotif,
    tiles: [
      { to: "/game", emoji: "🎮", nav: "game", sub: "sub_game" },
      { to: "/robots", emoji: "🤖", nav: "robots", sub: "sub_robots" },
      { to: "/art", emoji: "🎨", nav: "art", sub: "sub_art" },
      { to: "/detective", emoji: "🕵️", nav: "detective", sub: "sub_detective" },
      { to: "/whys", emoji: "❓", nav: "whys", sub: "sub_whys" },
      { to: "/computing", emoji: "💻", nav: "computing", sub: "sub_computing" },
      { to: "/thinking", emoji: "🧠", nav: "thinking", sub: "sub_thinking" },
    ],
  },
  {
    heading: "groupLife",
    place: "placeLife",
    theme: "life",
    Motif: LifeMotif,
    tiles: [
      { to: "/lifeskills", emoji: "🌱", nav: "lifeskills", sub: "sub_lifeskills" },
    ],
  },
];

export default function Mundos() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="page mundos-page mundos-map">
      <h1 className="app-title">{t("mundos.heading")}</h1>
      <p className="mundos-map-intro">{t("mundos.mapIntro")}</p>

      {GROUPS.map((group, index) => {
        const { Motif } = group;
        return (
          <section
            key={group.heading}
            className={`mundos-place mundos-place-${group.theme}`}
            style={{ "--mundos-place-delay": `${index * 60}ms` }}
          >
            <div className="mundos-place-motif mundos-place-motif-left">
              <Motif />
            </div>
            <div className="mundos-place-motif mundos-place-motif-right">
              <Motif />
            </div>
            <div className="mundos-place-inner">
              <h2 className="mundos-place-title">{t(`mundos.${group.place}`)}</h2>
              <h3 className="mundos-group-heading">{t(`mundos.${group.heading}`)}</h3>
              <div className="mundos-tile-grid">
                {group.tiles.map((tile) => (
                  <button
                    key={tile.to}
                    type="button"
                    className="mission-card mundos-tile"
                    onClick={() => navigate(tile.to)}
                  >
                    <div className="mission-emoji">{tile.emoji}</div>
                    <div className="mission-text">{t(`nav.${tile.nav}`)}</div>
                    <div className="mundos-tile-sub">{t(`mundos.${tile.sub}`)}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
