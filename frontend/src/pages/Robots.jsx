import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile, getDifficultyTier, recordSkillEvent, pingProgress, getLangPair } from "../storage.js";
import HelpButton from "../components/HelpButton.jsx";

// Each level: grid size, start [row,col], goal [row,col], obstacles [[row,col],...],
// and minTier (level only introduces the repeat block once tier allows it — but the
// repeat block itself is always offered from level 4 onward regardless of age tier,
// since it's just an optional shortcut, never required except where noted).
const LEVELS = [
  { size: 4, start: [0, 0], goal: [0, 2], obstacles: [] },
  { size: 4, start: [0, 0], goal: [2, 0], obstacles: [] },
  { size: 4, start: [0, 0], goal: [2, 2], obstacles: [] },
  { size: 4, start: [0, 0], goal: [0, 3], obstacles: [], suggestRepeat: true },
  { size: 5, start: [0, 0], goal: [4, 0], obstacles: [], suggestRepeat: true },
  { size: 5, start: [0, 0], goal: [3, 3], obstacles: [[1, 1]] },
  { size: 5, start: [0, 0], goal: [4, 4], obstacles: [[2, 2]], suggestRepeat: true },
  { size: 6, start: [0, 0], goal: [5, 5], obstacles: [[2, 3], [4, 1]] },
];

// Levels solvable with only right/down moves (no obstacles blocking a
// straight-ish path) confirmed below, e.g.:
// Level 3: start [0,0] goal [2,2] -> right,right,down,down reaches goal (no obstacles).
// Level 6: start [0,0] goal [3,3] obstacle [1,1] -> right,right,right,down,down,down
//   passes through (0,1),(0,2),(0,3),(1,3),(2,3),(3,3) — never touches (1,1). Solvable.

const DIRS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

const ARROW_EMOJI = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };

function cellKey(r, c) {
  return r + "," + c;
}

export default function Robots() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);

  const [levelIndex, setLevelIndex] = useState(0);
  const [program, setProgram] = useState([]);
  const [robotPos, setRobotPos] = useState(null); // during run animation
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null); // "success" | "retry" | null

  const level = LEVELS[levelIndex];
  const obstacleSet = useMemo(
    () => new Set(level.obstacles.map(([r, c]) => cellKey(r, c))),
    [level]
  );

  function addInstruction(dir) {
    if (running) return;
    setResult(null);
    setProgram((p) => [...p, dir]);
  }

  function addRepeat() {
    if (running || program.length < 2) return;
    setResult(null);
    setProgram((p) => [...p, ...p.slice(-2)]);
  }

  function undoLast() {
    if (running) return;
    setResult(null);
    setProgram((p) => p.slice(0, -1));
  }

  function clearProgram() {
    if (running) return;
    setResult(null);
    setProgram([]);
  }

  function runProgram() {
    if (running || program.length === 0) return;
    setRunning(true);
    setResult(null);
    let pos = [...level.start];
    setRobotPos(pos);
    let step = 0;
    let hitObstacle = false;

    function tick() {
      if (step >= program.length) {
        finish();
        return;
      }
      const [dr, dc] = DIRS[program[step]];
      const next = [pos[0] + dr, pos[1] + dc];
      const inBounds =
        next[0] >= 0 && next[0] < level.size && next[1] >= 0 && next[1] < level.size;
      if (inBounds && !obstacleSet.has(cellKey(next[0], next[1]))) {
        pos = next;
        setRobotPos(pos);
      } else {
        hitObstacle = true;
      }
      step += 1;
      setTimeout(tick, 450);
    }

    function finish() {
      const reachedGoal = pos[0] === level.goal[0] && pos[1] === level.goal[1];
      const success = reachedGoal && !hitObstacle;
      setResult(success ? "success" : "retry");
      setRunning(false);
      recordSkillEvent(profile?.name, "robots-level-" + levelIndex, success);
      pingProgress({
        profileName: profile?.name,
        module: "robots",
        event: success ? "level_success" : "level_retry",
      });
    }

    setTimeout(tick, 450);
  }

  function nextLevel() {
    setLevelIndex((i) => Math.min(LEVELS.length - 1, i + 1));
    setProgram([]);
    setRobotPos(null);
    setResult(null);
  }

  function goToLevel(i) {
    setLevelIndex(i);
    setProgram([]);
    setRobotPos(null);
    setResult(null);
  }

  const displayPos = robotPos || level.start;
  const showRepeat = levelIndex >= 3 || tier >= 2;

  const cells = [];
  for (let r = 0; r < level.size; r++) {
    for (let c = 0; c < level.size; c++) {
      const isRobot = displayPos[0] === r && displayPos[1] === c;
      const isGoal = level.goal[0] === r && level.goal[1] === c;
      const isObstacle = obstacleSet.has(cellKey(r, c));
      let content = "";
      if (isRobot) content = "🤖";
      else if (isGoal) content = "⭐";
      else if (isObstacle) content = "🪨";
      cells.push(
        <div
          key={cellKey(r, c)}
          className={
            "robots-cell" +
            (isGoal ? " robots-goal" : "") +
            (isObstacle ? " robots-obstacle" : "")
          }
        >
          {content}
        </div>
      );
    }
  }

  return (
    <div className="page">
      <h1>{t("modules.robotsTitle")} 🤖</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.robotsHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.robotsIntro")}</p>

      <div className="robots-progress">
        {t("modules.robotsLevel")} {levelIndex + 1} / {LEVELS.length}
      </div>

      <div
        className="robots-grid"
        style={{ gridTemplateColumns: `repeat(${level.size}, 48px)` }}
      >
        {cells}
      </div>

      <div className="robots-palette">
        {Object.keys(DIRS).map((dir) => (
          <button
            key={dir}
            type="button"
            className="robots-palette-btn"
            onClick={() => addInstruction(dir)}
            disabled={running}
          >
            {ARROW_EMOJI[dir]}
          </button>
        ))}
        {showRepeat && (
          <button
            type="button"
            className="robots-palette-btn"
            onClick={addRepeat}
            disabled={running || program.length < 2}
          >
            🔁 {t("modules.robotsRepeat")}
          </button>
        )}
      </div>

      <div className="robots-program">
        {program.length === 0 ? (
          <span className="robots-program-empty">…</span>
        ) : (
          program.map((dir, i) => (
            <span key={i} className="robots-program-step">
              {ARROW_EMOJI[dir]}
            </span>
          ))
        )}
      </div>

      <div className="robots-controls">
        <button type="button" className="big-btn" onClick={runProgram} disabled={running}>
          ▶️ {t("modules.robotsRun")}
        </button>
        <button type="button" className="big-btn" onClick={undoLast} disabled={running}>
          ↩️ {t("modules.robotsUndo")}
        </button>
        <button type="button" className="big-btn" onClick={clearProgram} disabled={running}>
          🗑️ {t("modules.robotsClear")}
        </button>
      </div>

      {result === "success" && (
        <div className="robots-feedback">
          {t("modules.robotsSuccess")}
          {levelIndex < LEVELS.length - 1 && (
            <div style={{ marginTop: 10 }}>
              <button type="button" className="big-btn" onClick={nextLevel}>
                {t("modules.robotsNextLevel")} ➡️
              </button>
            </div>
          )}
        </div>
      )}
      {result === "retry" && (
        <div className="robots-feedback robots-feedback-retry">{t("modules.robotsTryAgain")}</div>
      )}

      <div className="robots-controls">
        {LEVELS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={"big-btn game-option" + (i === levelIndex ? " correct" : "")}
            onClick={() => goToLevel(i)}
            disabled={running}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
