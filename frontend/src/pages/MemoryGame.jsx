import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { pingProgress, recordSkillEvent } from "../storage.js";

// Classic concentration / card-matching mini-game. Bounded at 6 pairs (12
// cards) per round so it has a natural stopping point - no escalating
// difficulty or infinite replay loop.
//
// Several themed icon sets are offered so replays don't always show the
// same 6 icons. Each set has exactly PAIR_COUNT visually distinct emoji.
const PAIR_COUNT = 6;

const THEMES = [
  { id: "classic", labelKey: "modules.memoryThemeClassic", icons: ["🍎", "⭐", "🐣", "🎈", "🍀", "🐟"] },
  { id: "animals", labelKey: "modules.memoryThemeAnimals", icons: ["🐶", "🐱", "🦁", "🐘", "🦊", "🐻"] },
  { id: "food", labelKey: "modules.memoryThemeFood", icons: ["🍎", "🍌", "🍕", "🍰", "🍓", "🥕"] },
  { id: "space", labelKey: "modules.memoryThemeSpace", icons: ["🚀", "🌙", "⭐", "🪐", "☄️", "🛸"] },
  { id: "nature", labelKey: "modules.memoryThemeNature", icons: ["🌳", "🌸", "🌈", "☀️", "🍄", "🌊"] },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(themeId) {
  const theme = THEMES.find((th) => th.id === themeId) || THEMES[0];
  const faces = shuffle(theme.icons).slice(0, PAIR_COUNT);
  const cards = shuffle([...faces, ...faces]).map((face, idx) => ({
    id: idx,
    face,
    matched: false,
  }));
  return cards;
}

export default function MemoryGame({ profileName }) {
  const { t } = useTranslation();
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [cards, setCards] = useState(() => buildDeck(THEMES[0].id));
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loggedWin, setLoggedWin] = useState(false);

  const won = cards.every((c) => c.matched);

  if (won && !loggedWin) {
    setLoggedWin(true);
    pingProgress({ profileName, module: "game-memory", event: "memory_win" });
    recordSkillEvent(profileName, "game-memory", true);
  }

  function handleFlip(card) {
    if (busy || card.matched || flipped.includes(card.id)) return;
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      setBusy(true);
      setMoves((m) => m + 1);
      const [aId, bId] = next;
      const a = cards.find((c) => c.id === aId);
      const b = cards.find((c) => c.id === bId);
      if (a.face === b.face) {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === aId || c.id === bId ? { ...c, matched: true } : c)));
          setFlipped([]);
          setBusy(false);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 800);
      }
    }
  }

  function restart(nextThemeId) {
    const useThemeId = nextThemeId || themeId;
    setThemeId(useThemeId);
    setCards(buildDeck(useThemeId));
    setFlipped([]);
    setMoves(0);
    setBusy(false);
    setLoggedWin(false);
  }

  function selectTheme(id) {
    if (id === themeId) return;
    restart(id);
  }

  return (
    <div className="memory-wrap">
      <div className="memory-hud">
        <span>
          🃏 {t("modules.memoryMovesLabel")}: {moves}
        </span>
      </div>
      <div className="memory-theme-picker" role="group" aria-label={t("modules.memoryThemeLabel")}>
        {THEMES.map((theme) => (
          <button
            type="button"
            key={theme.id}
            className={"memory-theme-btn" + (theme.id === themeId ? " active" : "")}
            onClick={() => selectTheme(theme.id)}
          >
            <span aria-hidden="true">{theme.icons[0]}</span> {t(theme.labelKey)}
          </button>
        ))}
      </div>
      <div className="memory-grid">
        {cards.map((card) => {
          const isFlipped = card.matched || flipped.includes(card.id);
          return (
            <button
              type="button"
              key={card.id}
              className={"memory-card" + (isFlipped ? " flipped" : "") + (card.matched ? " matched" : "")}
              onClick={() => handleFlip(card)}
              disabled={card.matched}
              aria-label={isFlipped ? card.face : "?"}
            >
              <span className="memory-card-face">{isFlipped ? card.face : "❓"}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="memory-result">
          <div className="game-emoji">🎉</div>
          <p className="game-result">{t("modules.memoryWin")}</p>
          <button type="button" className="big-btn" onClick={() => restart()}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
