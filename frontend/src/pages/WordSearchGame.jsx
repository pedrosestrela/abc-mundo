import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getReading } from "../content/index.js";
import { getDifficultyTier } from "../storage.js";
import { pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

// Sopa de letras / Word Search. A letter grid is generated from a handful
// of words drawn from the child's reading word bank (getReading), placed
// horizontally, vertically, and (tier 3 only) diagonally. The child taps
// the first letter of a word then the last letter to select the whole
// run - no drag support needed, which keeps this reliable on touch
// devices. A word-bank sidebar shows each target word's emoji hint so a
// non-reading child can still play by shape/emoji recognition, and each
// found word is read aloud immediately via SpeakButton.
const TIER_CONFIG = {
  1: { size: 6, wordCount: 4, diagonals: false },
  2: { size: 8, wordCount: 6, diagonals: false },
  3: { size: 10, wordCount: 8, diagonals: true },
};

const DIRS_STRAIGHT = [
  { dr: 0, dc: 1 }, // horizontal
  { dr: 1, dc: 0 }, // vertical
];
const DIRS_DIAGONAL = [
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 },
];

const ALPHA_FALLBACK = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomLetter(langCode) {
  // Pull from the fallback latin alphabet for filler letters; Chinese word
  // search would need a different fill strategy, so we simply skip filling
  // with random glyphs for zh and reuse letters already placed in the grid
  // (handled by the caller leaving those cells blank-safe via a space).
  if (langCode === "zh") return "・";
  return ALPHA_FALLBACK[Math.floor(Math.random() * ALPHA_FALLBACK.length)];
}

function buildGrid(words, size, allowDiagonals, langCode) {
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const placed = [];
  const dirs = allowDiagonals ? [...DIRS_STRAIGHT, ...DIRS_DIAGONAL] : DIRS_STRAIGHT;

  for (const w of words) {
    const letters = Array.from(w.word.replace(/\s+/g, ""));
    if (letters.length > size) continue;
    let ok = false;
    const dirOptions = shuffle(dirs);
    for (const dir of dirOptions) {
      if (ok) break;
      const maxRow = dir.dr >= 0 ? size - 1 - (letters.length - 1) * dir.dr : (letters.length - 1) * -dir.dr;
      const minRow = dir.dr >= 0 ? 0 : (letters.length - 1) * -dir.dr;
      const maxCol = dir.dc >= 0 ? size - 1 - (letters.length - 1) * dir.dc : (letters.length - 1) * -dir.dc;
      const minCol = dir.dc >= 0 ? 0 : (letters.length - 1) * -dir.dc;
      if (maxRow < minRow || maxCol < minCol) continue;
      const attempts = shuffle(
        Array.from({ length: (maxRow - minRow + 1) * (maxCol - minCol + 1) }, (_, idx) => idx)
      );
      for (const idx of attempts) {
        const row = minRow + Math.floor(idx / (maxCol - minCol + 1));
        const col = minCol + (idx % (maxCol - minCol + 1));
        let fits = true;
        for (let i = 0; i < letters.length; i++) {
          const r = row + dir.dr * i;
          const c = col + dir.dc * i;
          const existing = grid[r][c];
          if (existing && existing !== letters[i].toUpperCase()) {
            fits = false;
            break;
          }
        }
        if (!fits) continue;
        const cells = [];
        for (let i = 0; i < letters.length; i++) {
          const r = row + dir.dr * i;
          const c = col + dir.dc * i;
          grid[r][c] = letters[i].toUpperCase();
          cells.push([r, c]);
        }
        placed.push({ word: w, cells, found: false });
        ok = true;
        break;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = randomLetter(langCode);
    }
  }

  return { grid, placed };
}

function buildPuzzle(pair, tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const words = getReading(pair.mother).filter((w) => w.word.replace(/\s+/g, "").length <= config.size);
  const chosen = shuffle(words).slice(0, config.wordCount);
  let attempt = buildGrid(chosen, config.size, config.diagonals, pair.mother);
  // Guarantee at least a couple words placed even in edge cases (e.g. very
  // short word banks); retry a few times with a fresh shuffle if needed.
  let tries = 0;
  while (attempt.placed.length < Math.min(2, chosen.length) && tries < 5) {
    attempt = buildGrid(shuffle(chosen), config.size, config.diagonals, pair.mother);
    tries++;
  }
  return { size: config.size, ...attempt };
}

function cellKey(r, c) {
  return `${r}_${c}`;
}

function lineCells(a, b) {
  const [r1, c1] = a;
  const [r2, c2] = b;
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  if (dr === 0 && dc === 0) return [a];
  const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  // Only straight (horizontal/vertical/diagonal-45) lines are valid.
  if (Math.abs(r2 - r1) !== 0 && Math.abs(c2 - c1) !== 0 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return null;
  const cells = [];
  for (let i = 0; i <= steps; i++) {
    cells.push([r1 + dr * i, c1 + dc * i]);
  }
  return cells;
}

function sameCells(a, b) {
  if (a.length !== b.length) return false;
  const as = a.map(([r, c]) => cellKey(r, c)).sort();
  const bs = b.map(([r, c]) => cellKey(r, c)).sort();
  return as.every((v, i) => v === bs[i]);
}

export default function WordSearchGame({ pair, profileName, profile }) {
  const { t } = useTranslation();
  const langCode = pair?.mother || "pt";
  const tier = getDifficultyTier(profile?.age);

  const [puzzle, setPuzzle] = useState(() => buildPuzzle(pair, tier));
  const [selStart, setSelStart] = useState(null);
  const [found, setFound] = useState({}); // wordKey -> true
  const [lastFound, setLastFound] = useState(null);
  const [logged, setLogged] = useState(false);

  const allFound = puzzle.placed.length > 0 && puzzle.placed.every((p) => found[p.word.word]);

  if (allFound && !logged) {
    setLogged(true);
    pingProgress({ profileName, module: "game-wordsearch", event: "wordsearch_win" });
    recordSkillEvent(profileName, "game-wordsearch", true);
  }

  const foundCellSet = useMemo(() => {
    const set = new Set();
    for (const p of puzzle.placed) {
      if (found[p.word.word]) {
        for (const [r, c] of p.cells) set.add(cellKey(r, c));
      }
    }
    return set;
  }, [puzzle, found]);

  function handleCellTap(r, c) {
    if (allFound) return;
    if (!selStart) {
      setSelStart([r, c]);
      return;
    }
    const line = lineCells(selStart, [r, c]);
    setSelStart(null);
    if (!line) return;
    const match = puzzle.placed.find((p) => !found[p.word.word] && sameCells(p.cells, line));
    if (match) {
      setFound((f) => ({ ...f, [match.word.word]: true }));
      setLastFound(match.word);
    }
  }

  function restart() {
    setPuzzle(buildPuzzle(pair, tier));
    setSelStart(null);
    setFound({});
    setLastFound(null);
    setLogged(false);
  }

  return (
    <div className="game-card wordsearch-wrap">
      <div className="wordsearch-layout">
        <div
          className="wordsearch-grid"
          style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}
          role="grid"
          aria-label={t("modules.wordsearchTitle")}
        >
          {puzzle.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = cellKey(r, c);
              const isFoundCell = foundCellSet.has(key);
              const isSelected = selStart && selStart[0] === r && selStart[1] === c;
              return (
                <button
                  type="button"
                  key={key}
                  className={
                    "wordsearch-cell" + (isFoundCell ? " wordsearch-cell-found" : "") + (isSelected ? " wordsearch-cell-selected" : "")
                  }
                  onClick={() => handleCellTap(r, c)}
                  disabled={allFound}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>

        <div className="wordsearch-bank" aria-label={t("modules.wordsearchBankLabel")}>
          <p className="page-intro">{t("modules.wordsearchBankLabel")}</p>
          {puzzle.placed.map((p) => (
            <div key={p.word.word} className={"wordsearch-bank-item" + (found[p.word.word] ? " wordsearch-bank-item-found" : "")}>
              <span className="wordsearch-bank-emoji" aria-hidden="true">
                {p.word.emoji}
              </span>
              <span className="wordsearch-bank-word">{p.word.word}</span>
              {found[p.word.word] && <span aria-hidden="true">✅</span>}
            </div>
          ))}
        </div>
      </div>

      {lastFound && !allFound && (
        <p className="wordsearch-toast">
          {lastFound.emoji || "🔤"} {lastFound.word}
          <SpeakButton text={lastFound.word} langCode={langCode} />
        </p>
      )}

      {allFound && (
        <div className="game-result">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.wordsearchWin")}
            <SpeakButton text={t("modules.wordsearchWin")} langCode={langCode} />
          </p>
          <button type="button" className="big-btn" onClick={restart}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
