import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const GROUPS = [
  {
    heading: "groupRead",
    tiles: [
      { to: "/languages", emoji: "🌐", nav: "language", sub: "sub_language" },
      { to: "/phonics", emoji: "👂", nav: "phonics", sub: "sub_phonics" },
      { to: "/alphabet", emoji: "🔤", nav: "alphabet", sub: "sub_alphabet" },
      { to: "/syllables", emoji: "🧩", nav: "syllables", sub: "sub_syllables" },
      { to: "/reading", emoji: "📖", nav: "reading", sub: "sub_reading" },
      { to: "/phrases", emoji: "💬", nav: "phrases", sub: "sub_phrases" },
      { to: "/stories", emoji: "📚", nav: "stories", sub: "sub_stories" },
    ],
  },
  {
    heading: "groupNumbers",
    tiles: [
      { to: "/math", emoji: "🔢", nav: "math", sub: "sub_math" },
      { to: "/financial", emoji: "💰", nav: "financial", sub: "sub_financial" },
    ],
  },
  {
    heading: "groupMusic",
    tiles: [
      { to: "/songs", emoji: "🎵", nav: "songs", sub: "sub_songs" },
      { to: "/piano", emoji: "🎹", nav: "piano", sub: "sub_piano" },
    ],
  },
  {
    heading: "groupWorld",
    tiles: [
      { to: "/world", emoji: "🗺️", nav: "world", sub: "sub_world" },
      { to: "/history", emoji: "🏰", nav: "history", sub: "sub_history" },
      { to: "/science", emoji: "🔬", nav: "science", sub: "sub_science" },
    ],
  },
  {
    heading: "groupCreate",
    tiles: [
      { to: "/game", emoji: "🎮", nav: "game", sub: "sub_game" },
      { to: "/robots", emoji: "🤖", nav: "robots", sub: "sub_robots" },
      { to: "/art", emoji: "🎨", nav: "art", sub: "sub_art" },
      { to: "/detective", emoji: "🕵️", nav: "detective", sub: "sub_detective" },
      { to: "/whys", emoji: "❓", nav: "whys", sub: "sub_whys" },
      { to: "/computing", emoji: "💻", nav: "computing", sub: "sub_computing" },
    ],
  },
  {
    heading: "groupLife",
    tiles: [
      { to: "/lifeskills", emoji: "🌱", nav: "lifeskills", sub: "sub_lifeskills" },
    ],
  },
];

export default function Mundos() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="page mundos-page">
      <h1 className="app-title">{t("mundos.heading")}</h1>

      {GROUPS.map((group) => (
        <section key={group.heading} className="mundos-group">
          <h2 className="mundos-group-heading">{t(`mundos.${group.heading}`)}</h2>
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
        </section>
      ))}
    </div>
  );
}
