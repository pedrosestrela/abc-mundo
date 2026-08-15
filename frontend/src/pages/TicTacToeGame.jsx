import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { pingProgress, recordSkillEvent } from "../storage.js";

// Classic 3x3 tic-tac-toe ("Jogo do Galo"). Supports 1 player (vs a simple
// heuristic computer opponent - not a perfect minimax, just: take an
// immediate win, block an immediate opponent win, otherwise prefer the
// center, then a corner, then any free cell) and 2 players (local
// pass-and-play, alternating turns on the same device). Bounded to a
// single round at a time with an explicit "play again" action - no
// auto-restart or escalating difficulty.
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(cells) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a], line };
    }
  }
  if (cells.every((c) => c)) return { winner: "draw", line: [] };
  return null;
}

function pickComputerMove(cells, computerMark, humanMark) {
  const empty = cells.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  if (empty.length === 0) return null;

  // 1) Take an immediate win if available.
  for (const i of empty) {
    const next = cells.slice();
    next[i] = computerMark;
    if (calculateWinner(next)?.winner === computerMark) return i;
  }
  // 2) Block an immediate opponent win.
  for (const i of empty) {
    const next = cells.slice();
    next[i] = humanMark;
    if (calculateWinner(next)?.winner === humanMark) return i;
  }
  // 3) Prefer the center.
  if (empty.includes(4)) return 4;
  // 4) Prefer a corner.
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // 5) Any free cell.
  return empty[Math.floor(Math.random() * empty.length)];
}

function freshCells() {
  return Array(9).fill(null);
}

export default function TicTacToeGame({ profileName }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("1p"); // "1p" | "2p"
  const [cells, setCells] = useState(freshCells);
  const [turn, setTurn] = useState("X"); // whose turn it is next
  const [logged, setLogged] = useState(false);

  const result = calculateWinner(cells);
  const finished = !!result;
  const computerMark = "O";
  const humanMark = "X";

  function applyMove(cells, mark, index) {
    const next = cells.slice();
    next[index] = mark;
    return next;
  }

  function handleCellTap(index) {
    if (finished || cells[index]) return;
    if (mode === "1p" && turn !== humanMark) return; // computer's turn, ignore taps

    const next = applyMove(cells, turn, index);
    setCells(next);
    const outcome = calculateWinner(next);
    if (outcome || mode === "2p") {
      setTurn(turn === "X" ? "O" : "X");
    }

    if (mode === "1p" && !outcome) {
      // Computer replies shortly after, for a readable pace.
      setTimeout(() => {
        setCells((current) => {
          const cellsAfterHuman = current;
          const already = calculateWinner(cellsAfterHuman);
          if (already) return current;
          const move = pickComputerMove(cellsAfterHuman, computerMark, humanMark);
          if (move === null) return current;
          const withComputer = applyMove(cellsAfterHuman, computerMark, move);
          setTurn(humanMark);
          return withComputer;
        });
      }, 500);
    }
  }

  if (finished && !logged) {
    setLogged(true);
    const humanWon = result.winner === humanMark;
    const outcomeEvent = result.winner === "draw" ? "tictactoe_draw" : result.winner === computerMark && mode === "1p" ? "tictactoe_loss" : "tictactoe_win";
    pingProgress({ profileName, module: "game-tictactoe", event: outcomeEvent });
    if (mode === "1p") recordSkillEvent(profileName, "game-tictactoe", humanWon);
  }

  function restart() {
    setCells(freshCells());
    setTurn("X");
    setLogged(false);
  }

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    restart();
  }

  const winLine = result && result.winner !== "draw" ? result.line : [];

  return (
    <div className="game-card ttt-wrap">
      <div className="game-options math-mode-toggle">
        <button
          type="button"
          className={"big-btn game-option" + (mode === "1p" ? " correct" : "")}
          onClick={() => switchMode("1p")}
        >
          🤖 {t("modules.tttMode1p")}
        </button>
        <button
          type="button"
          className={"big-btn game-option" + (mode === "2p" ? " correct" : "")}
          onClick={() => switchMode("2p")}
        >
          🧑‍🤝‍🧑 {t("modules.tttMode2p")}
        </button>
      </div>

      {!finished && (
        <p className="game-progress">
          {t("modules.tttTurn")}: <strong>{turn}</strong>
          {mode === "1p" && turn === computerMark ? " 🤖" : ""}
        </p>
      )}

      <div className="ttt-board" role="group" aria-label={t("modules.gameTabTicTacToe")}>
        {cells.map((cell, i) => (
          <button
            type="button"
            key={i}
            className={"ttt-cell" + (winLine.includes(i) ? " ttt-win" : "") + (cell ? " ttt-filled" : "")}
            onClick={() => handleCellTap(i)}
            disabled={finished || !!cell || (mode === "1p" && turn !== humanMark)}
            aria-label={cell ? cell : t("modules.tttEmptyCell")}
          >
            {cell}
          </button>
        ))}
      </div>

      {finished && (
        <div className="ttt-result">
          <div className="game-emoji">{result.winner === "draw" ? "🤝" : "🏆"}</div>
          <p className="game-result">
            {result.winner === "draw"
              ? t("modules.tttDraw")
              : mode === "1p"
              ? result.winner === humanMark
                ? t("modules.tttWin")
                : t("modules.tttLoss")
              : t("modules.tttWinnerIs") + " " + result.winner}
          </p>
          <button type="button" className="big-btn" onClick={restart}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
