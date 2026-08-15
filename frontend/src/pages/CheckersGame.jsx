import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { pingProgress, recordSkillEvent } from "../storage.js";

// Simplified checkers ("Damas"), 8x8, standard starting layout.
//
// Rule choices (documented for maintainers):
// - CAPTURES ARE OPTIONAL, not mandatory. Formal checkers requires a player
//   to capture whenever possible; for this app's 5-12 age range we relax
//   that rule (same spirit as other simplified game rules in this app) so a
//   child isn't forced into a capture they didn't intend to make. A capture
//   is still a fully legal move whenever available.
// - Multi-jump chains are NOT implemented. Each turn is a single move: one
//   simple step, or one single jump-capture. This keeps move validation and
//   the UI (tap piece, tap destination) simple and easy to reason about for
//   young players, at the cost of not chaining consecutive captures in one
//   turn. This is an explicit, common simplified variant.
// - Kings ("damas") move/capture one square diagonally in any of the four
//   diagonal directions (forward or backward), same single-step / single
//   jump rule as regular pieces.
//
// Board coordinates: r,c in [0..7], r=0 is the top row. Player "red" starts
// on rows 0-2 (moves downward, increasing r), player "black" starts on rows
// 5-7 (moves upward, decreasing r) - matching standard checkers where each
// side starts on the 3 rows closest to itself and advances toward the other
// side. Only dark squares (r+c odd) are playable.

const SIZE = 8;

function isDark(r, c) {
  return (r + c) % 2 === 1;
}

function initialBoard() {
  // null = empty; otherwise { color: 'red'|'black', king: bool }
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isDark(r, c)) continue;
      if (r < 3) board[r][c] = { color: "red", king: false };
      else if (r > 4) board[r][c] = { color: "black", king: false };
    }
  }
  return board;
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function opponent(color) {
  return color === "red" ? "black" : "red";
}

// Diagonal directions a piece may move in. Regular pieces move only "forward"
// (red: increasing r, black: decreasing r); kings move in all 4 diagonals.
function pieceDirections(piece) {
  if (piece.king) {
    return [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 },
    ];
  }
  const dr = piece.color === "red" ? 1 : -1;
  return [
    { dr, dc: -1 },
    { dr, dc: 1 },
  ];
}

// Returns list of legal moves for the piece at (r,c): each move is
// { from:{r,c}, to:{r,c}, capture:{r,c}|null }
function movesForPiece(board, r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const moves = [];
  for (const { dr, dc } of pieceDirections(piece)) {
    const sr = r + dr;
    const sc = c + dc;
    if (inBounds(sr, sc) && board[sr][sc] === null) {
      moves.push({ from: { r, c }, to: { r: sr, c: sc }, capture: null });
    }
    const jr = r + dr * 2;
    const jc = c + dc * 2;
    if (
      inBounds(sr, sc) &&
      inBounds(jr, jc) &&
      board[sr][sc] &&
      board[sr][sc].color === opponent(piece.color) &&
      board[jr][jc] === null
    ) {
      moves.push({ from: { r, c }, to: { r: jr, c: jc }, capture: { r: sr, c: sc } });
    }
  }
  return moves;
}

function allMovesForColor(board, color) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        moves.push(...movesForPiece(board, r, c));
      }
    }
  }
  return moves;
}

function applyMove(board, move) {
  const next = board.map((row) => row.slice());
  const piece = next[move.from.r][move.from.c];
  next[move.from.r][move.from.c] = null;
  if (move.capture) next[move.capture.r][move.capture.c] = null;
  const promoted = move.to.r === 0 || move.to.r === SIZE - 1;
  next[move.to.r][move.to.c] = promoted ? { ...piece, king: true } : piece;
  return next;
}

function countPieces(board, color) {
  let n = 0;
  for (const row of board) for (const p of row) if (p && p.color === color) n++;
  return n;
}

// A simple, beatable heuristic AI:
// 1. Prefer a capture move if one exists.
// 2. Among remaining candidates, avoid moves that leave the moved piece
//    immediately capturable by the opponent.
// 3. Otherwise pick randomly (with mild preference for advancing forward).
function pickAiMove(board, color) {
  const moves = allMovesForColor(board, color);
  if (moves.length === 0) return null;

  const captures = moves.filter((m) => m.capture);
  const pool = captures.length > 0 ? captures : moves;

  const safe = pool.filter((m) => {
    const next = applyMove(board, m);
    const oppMoves = allMovesForColor(next, opponent(color));
    // Reject moves that leave the piece we just moved sitting where the
    // opponent can immediately jump-capture it.
    return !oppMoves.some((om) => om.capture && om.capture.r === m.to.r && om.capture.c === m.to.c);
  });

  const candidates = safe.length > 0 ? safe : pool;
  // Mild positional preference: forward advancement (toward promotion row).
  const forwardDr = color === "red" ? 1 : -1;
  const advancing = candidates.filter((m) => m.to.r - m.from.r === forwardDr || m.capture);
  const finalPool = advancing.length > 0 ? advancing : candidates;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function boardHasNoPieces(board, color) {
  return countPieces(board, color) === 0;
}

function freshState(mode) {
  return {
    board: initialBoard(),
    turn: "red",
    mode, // "1p" | "2p"
    selected: null,
    status: "playing", // playing | red-wins | black-wins
  };
}

export default function CheckersGame({ profileName }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null); // null until chosen
  const [state, setState] = useState(() => freshState("2p"));
  const [loggedEnd, setLoggedEnd] = useState(false);

  const humanColor = "red";
  const aiColor = "black";

  function startGame(chosenMode) {
    setMode(chosenMode);
    setState(freshState(chosenMode));
    setLoggedEnd(false);
  }

  function evaluateEnd(board, nextTurnColor) {
    if (boardHasNoPieces(board, "red")) return "black-wins";
    if (boardHasNoPieces(board, "black")) return "red-wins";
    const movesForNext = allMovesForColor(board, nextTurnColor);
    if (movesForNext.length === 0) return nextTurnColor === "red" ? "black-wins" : "red-wins";
    return "playing";
  }

  function commitMove(move) {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      const board = applyMove(prev.board, move);
      const nextTurn = opponent(prev.turn);
      const status = evaluateEnd(board, nextTurn);
      return { ...prev, board, turn: nextTurn, selected: null, status };
    });
  }

  function handleSquareTap(r, c) {
    if (state.status !== "playing") return;
    if (state.mode === "1p" && state.turn !== humanColor) return; // AI's turn

    const piece = state.board[r][c];
    if (state.selected) {
      const legal = movesForPiece(state.board, state.selected.r, state.selected.c);
      const chosen = legal.find((m) => m.to.r === r && m.to.c === c);
      if (chosen) {
        commitMove(chosen);
        return;
      }
      // Tapping another own piece re-selects it; tapping elsewhere deselects.
      if (piece && piece.color === state.turn) {
        setState((prev) => ({ ...prev, selected: { r, c } }));
      } else {
        setState((prev) => ({ ...prev, selected: null }));
      }
      return;
    }
    if (piece && piece.color === state.turn) {
      setState((prev) => ({ ...prev, selected: { r, c } }));
    }
  }

  // AI turn effect.
  useEffect(() => {
    if (state.status !== "playing") return;
    if (state.mode !== "1p" || state.turn !== aiColor) return;
    const id = setTimeout(() => {
      setState((prev) => {
        if (prev.status !== "playing" || prev.turn !== aiColor) return prev;
        const move = pickAiMove(prev.board, aiColor);
        if (!move) {
          return { ...prev, status: "red-wins" };
        }
        const board = applyMove(prev.board, move);
        const nextTurn = opponent(prev.turn);
        const status = evaluateEnd(board, nextTurn);
        return { ...prev, board, turn: nextTurn, selected: null, status };
      });
    }, 550);
    return () => clearTimeout(id);
  }, [state.status, state.mode, state.turn]);

  // Log the game outcome exactly once when it resolves.
  useEffect(() => {
    if (state.status === "playing" || loggedEnd) return;
    setLoggedEnd(true);
    const humanWon = state.status === "red-wins";
    pingProgress({ profileName, module: "game-checkers", event: humanWon ? "checkers_win" : "checkers_loss" });
    if (state.mode === "1p") {
      recordSkillEvent(profileName, "game-checkers", humanWon);
    } else {
      // 2-player local mode has no single "correct" outcome to score against
      // a skill target, but we still log a completion event.
      recordSkillEvent(profileName, "game-checkers", true);
    }
  }, [state.status, loggedEnd, profileName, state.mode]);

  function restart() {
    setMode(null);
  }

  if (!mode) {
    return (
      <div className="checkers-wrap">
        <div className="checkers-mode-picker">
          <button type="button" className="big-btn" onClick={() => startGame("1p")}>
            {t("modules.checkers1Player")} 🤖
          </button>
          <button type="button" className="big-btn" onClick={() => startGame("2p")}>
            {t("modules.checkers2Players")} 🧑‍🤝‍🧑
          </button>
        </div>
      </div>
    );
  }

  const legalDestinations = state.selected ? movesForPiece(state.board, state.selected.r, state.selected.c) : [];

  let turnLabel;
  if (state.status === "playing") {
    if (state.mode === "1p") {
      turnLabel = state.turn === humanColor ? t("modules.checkersYourTurn") : t("modules.checkersAiTurn");
    } else {
      turnLabel =
        state.turn === "red" ? t("modules.checkersTurnRed") : t("modules.checkersTurnBlack");
    }
  }

  return (
    <div className="checkers-wrap">
      {state.status === "playing" && <div className="checkers-hud">{turnLabel}</div>}

      <div className="checkers-board" role="img" aria-label={t("modules.checkersTitle")}>
        {state.board.map((row, r) => (
          <div className="checkers-row" key={r}>
            {row.map((piece, c) => {
              const dark = isDark(r, c);
              const isSelected = state.selected && state.selected.r === r && state.selected.c === c;
              const isDest = legalDestinations.some((m) => m.to.r === r && m.to.c === c);
              return (
                <button
                  type="button"
                  key={c}
                  className={
                    "checkers-cell" +
                    (dark ? " dark" : " light") +
                    (isSelected ? " selected" : "") +
                    (isDest ? " destination" : "")
                  }
                  disabled={!dark}
                  onClick={() => dark && handleSquareTap(r, c)}
                  aria-label={piece ? `${piece.color}${piece.king ? "-king" : ""}` : "empty"}
                >
                  {isDest && <span className="checkers-hint" aria-hidden="true" />}
                  {piece && (
                    <span className={"checkers-piece " + piece.color + (piece.king ? " king" : "")} aria-hidden="true">
                      {piece.king ? "★" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {state.status !== "playing" && (
        <div className="checkers-result">
          <div className="game-emoji">{state.status === "red-wins" ? "🏆" : "🎲"}</div>
          <p className="game-result">
            {state.status === "red-wins" ? t("modules.checkersRedWins") : t("modules.checkersBlackWins")}
          </p>
          <button type="button" className="big-btn" onClick={restart}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}

      {state.status === "playing" && (
        <button type="button" className="checkers-restart-link" onClick={restart}>
          {t("modules.checkersChangeMode")}
        </button>
      )}
    </div>
  );
}
