import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { pingProgress, recordSkillEvent } from "../storage.js";

// Original, simplified maze-chase mini-game ("Caça ao Tesouro no Labirinto").
// This is an ORIGINAL grid layout, using only the generic "navigate a maze,
// collect items, avoid chasers" gameplay concept - it does NOT reuse any
// copyrighted maze layout, character names/designs, or visual assets from
// any commercial arcade game. The player is a fox emoji collecting stars;
// the chasers are simple original colored blobs (no ghost sprites).
//
// Grid legend: '#' = wall, '.' = collectible star, ' ' = empty walkable
// path (no collectible), 'P' = player start, 'C' = chaser start.
const MAZE_ROWS = [
  "###########",
  "#....#....#",
  "#.##.#.##.#",
  "#.#.....#.#",
  "#.#.###.#.#",
  "#.....P...#",
  "#.#.###.#.#",
  "#.#.....#.#",
  "#.##.#.##.#",
  "#C...#...C#",
  "###########",
];

const TICK_MS = 480; // how often chasers take a step
const CHASER_COLORS = ["maze-chaser-teal", "maze-chaser-violet", "maze-chaser-coral"];

function parseMaze() {
  const grid = MAZE_ROWS.map((row) => row.split(""));
  let player = { r: 0, c: 0 };
  const chasers = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === "P") {
        player = { r, c };
        grid[r][c] = " ";
      } else if (grid[r][c] === "C") {
        chasers.push({ r, c, id: chasers.length });
        grid[r][c] = " ";
      }
    }
  }
  return { grid, player, chasers };
}

function countDots(grid) {
  let n = 0;
  for (const row of grid) for (const cell of row) if (cell === ".") n++;
  return n;
}

function isWalkable(grid, r, c) {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
  return grid[r][c] !== "#";
}

const DIRS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
];

function stepChaser(grid, chaser, target) {
  // Simple chase AI: try the neighbor that most reduces Manhattan distance
  // to the player, with a little randomness so it isn't perfectly relentless.
  const options = DIRS.map(({ dr, dc }) => ({ r: chaser.r + dr, c: chaser.c + dc })).filter((p) =>
    isWalkable(grid, p.r, p.c)
  );
  if (options.length === 0) return chaser;
  if (Math.random() < 0.25) {
    const pick = options[Math.floor(Math.random() * options.length)];
    return { ...chaser, r: pick.r, c: pick.c };
  }
  options.sort(
    (a, b) =>
      Math.abs(a.r - target.r) + Math.abs(a.c - target.c) - (Math.abs(b.r - target.r) + Math.abs(b.c - target.c))
  );
  const best = options[0];
  return { ...chaser, r: best.r, c: best.c };
}

function freshState() {
  const { grid, player, chasers } = parseMaze();
  return { grid, player, chasers, dotsLeft: countDots(grid), score: 0, status: "playing" };
}

export default function MazeGame({ profileName }) {
  const { t } = useTranslation();
  const [state, setState] = useState(freshState);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const move = useCallback((dr, dc) => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      const nr = prev.player.r + dr;
      const nc = prev.player.c + dc;
      if (!isWalkable(prev.grid, nr, nc)) return prev;
      const grid = prev.grid;
      let dotsLeft = prev.dotsLeft;
      let score = prev.score;
      if (grid[nr][nc] === ".") {
        const newGrid = grid.map((row) => row.slice());
        newGrid[nr][nc] = " ";
        dotsLeft -= 1;
        score += 10;
        const caught = prev.chasers.some((ch) => ch.r === nr && ch.c === nc);
        return {
          ...prev,
          grid: newGrid,
          player: { r: nr, c: nc },
          dotsLeft,
          score,
          status: caught ? "caught" : dotsLeft === 0 ? "won" : "playing",
        };
      }
      const caught = prev.chasers.some((ch) => ch.r === nr && ch.c === nc);
      return { ...prev, player: { r: nr, c: nc }, status: caught ? "caught" : "playing" };
    });
  }, []);

  // Chaser tick loop.
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.status !== "playing") return prev;
        const chasers = prev.chasers.map((ch) => stepChaser(prev.grid, ch, prev.player));
        const caught = chasers.some((ch) => ch.r === prev.player.r && ch.c === prev.player.c);
        return { ...prev, chasers, status: caught ? "caught" : "playing" };
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Log the round outcome exactly once when it resolves.
  useEffect(() => {
    if (state.status === "playing") return;
    const correct = state.status === "won";
    pingProgress({ profileName, module: "game-pacman", event: correct ? "maze_win" : "maze_caught" });
    recordSkillEvent(profileName, "game-pacman", correct);
  }, [state.status, profileName]);

  function restart() {
    setState(freshState());
  }

  return (
    <div className="maze-wrap">
      <div className="maze-hud">
        <span>⭐ {t("modules.mazeScoreLabel")}: {state.score}</span>
      </div>
      <div className="maze-board" role="img" aria-label={t("modules.mazeTitle")}>
        {state.grid.map((row, r) => (
          <div className="maze-row" key={r}>
            {row.map((cell, c) => {
              const isPlayer = state.player.r === r && state.player.c === c;
              const chaserIdx = state.chasers.findIndex((ch) => ch.r === r && ch.c === c);
              return (
                <div key={c} className={"maze-cell" + (cell === "#" ? " maze-wall" : "")}>
                  {cell === "." && <span className="maze-dot" aria-hidden="true" />}
                  {chaserIdx >= 0 && (
                    <span className={"maze-chaser " + CHASER_COLORS[chaserIdx % CHASER_COLORS.length]} aria-hidden="true">
                      <span className="maze-chaser-eye" />
                      <span className="maze-chaser-eye" />
                    </span>
                  )}
                  {isPlayer && (
                    <span className="maze-player" aria-hidden="true">
                      🦊
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {state.status === "playing" && (
        <div className="maze-dpad" role="group" aria-label={t("modules.mazeTitle")}>
          <button type="button" className="maze-dpad-btn maze-dpad-up" aria-label={t("modules.mazeUp")} onClick={() => move(-1, 0)}>
            ⬆️
          </button>
          <button type="button" className="maze-dpad-btn maze-dpad-left" aria-label={t("modules.mazeLeft")} onClick={() => move(0, -1)}>
            ⬅️
          </button>
          <button type="button" className="maze-dpad-btn maze-dpad-right" aria-label={t("modules.mazeRight")} onClick={() => move(0, 1)}>
            ➡️
          </button>
          <button type="button" className="maze-dpad-btn maze-dpad-down" aria-label={t("modules.mazeDown")} onClick={() => move(1, 0)}>
            ⬇️
          </button>
        </div>
      )}

      {state.status !== "playing" && (
        <div className="maze-result">
          <div className="game-emoji">{state.status === "won" ? "🏆" : "🦊"}</div>
          <p className="game-result">{state.status === "won" ? t("modules.mazeWin") : t("modules.mazeCaught")}</p>
          <button type="button" className="big-btn" onClick={restart}>
            {t("modules.mazeTryAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
