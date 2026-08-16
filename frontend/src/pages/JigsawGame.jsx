import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getDifficultyTier, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

// Puzzle / Quebra-cabecas (jigsaw). Rather than slicing an actual SVG
// illustration (fragile with clip-path across browsers/zoom), each puzzle
// "image" is one big emoji rendered once per tile at a matching negative
// offset - background-position style slicing, but using an emoji glyph
// instead of a raster/SVG asset so there is zero new asset pipeline. Every
// tile shows the same emoji at the same absolute size but each tile's
// wrapper is clipped to its own grid cell, so lined up correctly the
// pieces read as one big picture; shuffled, only the color/position hints
// help. Interaction is simplest-possible: tap two tiles to swap them.
const TIER_CONFIG = {
  1: { cols: 2, rows: 2 }, // 4 pieces
  2: { cols: 3, rows: 3 }, // 9 pieces
  3: { cols: 4, rows: 4 }, // 16 pieces
};

const PICTURES = ["🦁", "🌳", "🚀", "🏰", "🐢", "🌈", "🐬", "🦋"];

function shuffledPositions(count) {
  const order = Array.from({ length: count }, (_, i) => i);
  // Fisher-Yates, then guarantee it's not already solved.
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const isSolved = order.every((v, i) => v === i);
  if (isSolved && order.length > 1) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

function buildPuzzle(tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const count = config.cols * config.rows;
  const picture = PICTURES[Math.floor(Math.random() * PICTURES.length)];
  return { cols: config.cols, rows: config.rows, picture, order: shuffledPositions(count) };
}

export default function JigsawGame({ pair, profileName, profile }) {
  const { t } = useTranslation();
  const langCode = pair?.mother || "pt";
  const tier = getDifficultyTier(profile?.age);

  const [puzzle, setPuzzle] = useState(() => buildPuzzle(tier));
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [logged, setLogged] = useState(false);

  const solved = puzzle.order.every((v, i) => v === i);

  if (solved && !logged) {
    setLogged(true);
    pingProgress({ profileName, module: "game-jigsaw", event: "jigsaw_win" });
    recordSkillEvent(profileName, "game-jigsaw", true);
  }

  function handleTap(idx) {
    if (solved) return;
    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    setPuzzle((p) => {
      const nextOrder = [...p.order];
      [nextOrder[selected], nextOrder[idx]] = [nextOrder[idx], nextOrder[selected]];
      return { ...p, order: nextOrder };
    });
    setMoves((m) => m + 1);
    setSelected(null);
  }

  function restart() {
    setPuzzle(buildPuzzle(tier));
    setSelected(null);
    setMoves(0);
    setLogged(false);
  }

  const { cols, rows, picture, order } = puzzle;
  const BOARD_PX = 280; // fixed board size so per-piece pixel offsets are simple and reliable
  const cellW = BOARD_PX / cols;
  const cellH = BOARD_PX / rows;

  return (
    <div className="game-card jigsaw-wrap">
      <p className="page-intro">{t("modules.jigsawMovesLabel")}: {moves}</p>

      <div
        className="jigsaw-board"
        style={{
          width: BOARD_PX,
          height: BOARD_PX,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {order.map((pieceIdx, slotIdx) => {
          const pieceRow = Math.floor(pieceIdx / cols);
          const pieceCol = pieceIdx % cols;
          const isSelected = selected === slotIdx;
          const isCorrect = pieceIdx === slotIdx;
          return (
            <button
              type="button"
              key={slotIdx}
              className={"jigsaw-piece" + (isSelected ? " jigsaw-piece-selected" : "") + (solved ? " jigsaw-piece-solved" : "")}
              onClick={() => handleTap(slotIdx)}
              disabled={solved}
              aria-label={isCorrect ? t("modules.jigsawPieceCorrect") : t("modules.jigsawPiece")}
            >
              <span
                className="jigsaw-piece-inner"
                style={{
                  width: BOARD_PX,
                  height: BOARD_PX,
                  fontSize: BOARD_PX * 0.72,
                  transform: `translate(${-pieceCol * cellW}px, ${-pieceRow * cellH}px)`,
                }}
              >
                {picture}
              </span>
            </button>
          );
        })}
      </div>

      {solved && (
        <div className="game-result">
          <div className="game-emoji">🎉</div>
          <p className="game-result">
            {t("modules.jigsawWin")}
            <SpeakButton text={t("modules.jigsawWin")} langCode={langCode} />
          </p>
          <button type="button" className="big-btn" onClick={restart}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
