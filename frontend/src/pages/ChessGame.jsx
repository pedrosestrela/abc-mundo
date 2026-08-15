import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Chess } from "chess.js";
import { pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import ZenToggle from "../components/ZenToggle.jsx";

// Real chess, powered by chess.js (BSD-2-Clause, pure JS, bundled at build
// time - no runtime network dependency) for all move generation/validation,
// check/checkmate/stalemate detection, castling, en passant and promotion.
// We only render the board and pick the computer's move.
//
// Pieces are rendered as Unicode chess glyphs (♔♕♖♗♘♙ etc). Unicode chess
// symbols render reliably as plain black-outline glyphs on iOS Safari, but
// the "filled" black pieces (♚♛♜♝♞♟) can inherit emoji-style presentation
// inconsistently on some platforms. To keep colors unambiguous everywhere we
// always use the "white" glyph shapes and color them via CSS (white piece =
// light fill, black piece = dark fill) instead of relying on separate
// black/white Unicode codepoints.
const GLYPH = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function squareId(file, rank) {
  return FILES[file] + rank;
}

// Very small material-value heuristic for the computer opponent. No deep
// search (keeps it fast/lag-free on a tablet) - just: prefer capturing the
// most valuable piece available, otherwise avoid moves that leave the
// moved piece hanging to an immediate recapture, otherwise play a
// pseudo-random legal move. This is intentionally weak/fair for kids.
const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function chooseComputerMove(game) {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  function isSquareAttacked(fen, square, byColor) {
    const probe = new Chess(fen);
    // chess.js exposes isAttacked(square, color) on recent versions.
    if (typeof probe.isAttacked === "function") {
      return probe.isAttacked(square, byColor);
    }
    return false;
  }

  let best = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    let score = Math.random() * 0.1; // small jitter so it's not fully deterministic
    if (move.captured) {
      score += PIECE_VALUE[move.captured] * 10;
    }
    // Penalize landing somewhere the opponent could immediately recapture
    // for more than the piece is worth.
    game.move(move);
    const opponentColor = game.turn();
    const attacked = isSquareAttacked(game.fen(), move.to, opponentColor);
    if (attacked) {
      score -= PIECE_VALUE[move.piece] * 8;
    }
    if (game.isCheckmate()) {
      score += 1000;
    } else if (game.inCheck && game.inCheck()) {
      score += 2;
    }
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function buildBoardSquares(game) {
  const board = game.board(); // 8x8, board[0] = rank 8 ... board[7] = rank 1
  const squares = [];
  for (let r = 0; r < 8; r++) {
    const rank = 8 - r;
    for (let f = 0; f < 8; f++) {
      const cell = board[r][f];
      squares.push({
        id: squareId(f, rank),
        file: f,
        rank,
        piece: cell,
      });
    }
  }
  return squares;
}

export default function ChessGame({ profileName, langCode }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null); // null | "1p" | "2p"
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [loggedEnd, setLoggedEnd] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  const squares = useMemo(() => buildBoardSquares(game), [game]);
  const gameOver = game.isGameOver();
  const inCheck = game.inCheck ? game.inCheck() : false;
  const turn = game.turn(); // 'w' | 'b'

  function logEndIfNeeded() {
    if (loggedEnd || !gameOver) return;
    setLoggedEnd(true);
    const won = game.isCheckmate();
    pingProgress({ profileName, module: "game-chess", event: won ? "chess_checkmate" : "chess_draw" });
    if (mode === "1p") {
      // Player is always white in 1-player mode; success = white winning.
      recordSkillEvent(profileName, "game-chess", won && turn === "b");
    } else {
      recordSkillEvent(profileName, "game-chess", true);
    }
  }
  if (gameOver && !loggedEnd) logEndIfNeeded();

  function applyMove(from, to) {
    const next = new Chess(game.fen());
    let result;
    try {
      result = next.move({ from, to, promotion: "q" });
    } catch (e) {
      result = null;
    }
    if (!result) return false;
    setGame(next);
    setSelected(null);
    setLegalTargets([]);
    setMoveCount((c) => c + 1);

    if (mode === "1p" && !next.isGameOver() && next.turn() === "b") {
      setThinking(true);
      setTimeout(() => {
        const compMove = chooseComputerMove(next);
        if (compMove) {
          next.move({ from: compMove.from, to: compMove.to, promotion: "q" });
          setGame(new Chess(next.fen()));
        }
        setThinking(false);
      }, 400);
    }
    return true;
  }

  function handleSquareTap(sq) {
    if (thinking || gameOver) return;
    if (mode === "1p" && turn === "b") return; // computer's turn, no taps

    if (selected) {
      if (legalTargets.includes(sq.id)) {
        applyMove(selected, sq.id);
        return;
      }
      // Tapping another own piece re-selects instead of attempting an
      // illegal move.
      if (sq.piece && sq.piece.color === turn) {
        selectSquare(sq);
      } else {
        setSelected(null);
        setLegalTargets([]);
      }
      return;
    }
    if (sq.piece && sq.piece.color === turn) {
      selectSquare(sq);
    }
  }

  function selectSquare(sq) {
    const moves = game.moves({ square: sq.id, verbose: true });
    setSelected(sq.id);
    setLegalTargets(moves.map((m) => m.to));
  }

  function restart() {
    setGame(new Chess());
    setSelected(null);
    setLegalTargets([]);
    setThinking(false);
    setLoggedEnd(false);
    setMoveCount(0);
  }

  function chooseMode(m) {
    setMode(m);
    restart();
  }

  let statusText = "";
  if (game.isCheckmate()) {
    statusText = t(turn === "w" ? "modules.chessCheckmateBlack" : "modules.chessCheckmateWhite");
  } else if (game.isStalemate() || game.isDraw()) {
    statusText = t("modules.chessStalemate");
  } else if (thinking) {
    statusText = t("modules.chessThinking");
  } else if (inCheck) {
    statusText = t("modules.chessCheck") + " " + t(turn === "w" ? "modules.chessTurnWhite" : "modules.chessTurnBlack");
  } else {
    statusText = t(turn === "w" ? "modules.chessTurnWhite" : "modules.chessTurnBlack");
  }

  if (!mode) {
    return (
      <div className="game-card chess-mode-picker">
        <button type="button" className="big-btn" onClick={() => chooseMode("1p")}>
          🤖 {t("modules.chess1Player")}
        </button>
        <button type="button" className="big-btn" onClick={() => chooseMode("2p")}>
          🧑‍🤝‍🧑 {t("modules.chess2Player")}
        </button>
      </div>
    );
  }

  return (
    <div className="game-card chess-wrap">
      <ZenToggle />
      <div className="chess-status" aria-live="polite">
        {statusText}
        {!gameOver && <span className="chess-move-count"> · {moveCount}</span>}
        {gameOver && <SpeakButton text={statusText} langCode={langCode} />}
      </div>

      <div
        className="chess-board"
        role="grid"
        aria-label="chess board"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          width: "min(92vw, 420px)",
          aspectRatio: "1 / 1",
          margin: "0 auto",
          border: "3px solid var(--chess-border, #5c4326)",
          borderRadius: "8px",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {squares.map((sq) => {
          const dark = (sq.file + sq.rank) % 2 === 0;
          const isSelected = selected === sq.id;
          const isTarget = legalTargets.includes(sq.id);
          const bg = isSelected ? "#f7d774" : dark ? "#8a5a3b" : "#f0d9b5";
          return (
            <button
              type="button"
              key={sq.id}
              onClick={() => handleSquareTap(sq)}
              aria-label={sq.id}
              style={{
                position: "relative",
                background: bg,
                border: "none",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "min(7vw, 30px)",
                lineHeight: 1,
                cursor: gameOver ? "default" : "pointer",
                color: sq.piece ? (sq.piece.color === "w" ? "#ffffff" : "#1a1a1a") : "inherit",
                textShadow:
                  sq.piece && sq.piece.color === "w"
                    ? "0 0 2px #333, 0 0 1px #333"
                    : "none",
              }}
            >
              {sq.piece ? GLYPH[sq.piece.type] : ""}
              {isTarget && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    width: sq.piece ? "88%" : "28%",
                    height: sq.piece ? "88%" : "28%",
                    borderRadius: "50%",
                    background: sq.piece ? "transparent" : "rgba(30,120,40,0.55)",
                    border: sq.piece ? "3px solid rgba(30,120,40,0.75)" : "none",
                    boxSizing: "border-box",
                    pointerEvents: "none",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {gameOver && (
        <div className="chess-end">
          <div className="game-emoji">{game.isCheckmate() ? "🏆" : "🤝"}</div>
          <button type="button" className="big-btn" onClick={restart}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}
      {!gameOver && (
        <button type="button" className="big-btn chess-restart" onClick={restart}>
          {t("modules.gamePlayAgain")} 🔁
        </button>
      )}
    </div>
  );
}
