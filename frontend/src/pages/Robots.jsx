import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile, getDifficultyTier, recordSkillEvent, pingProgress, getLangPair } from "../storage.js";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";

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
const ARROW_ORDER = ["up", "down", "left", "right"];

function cellKey(r, c) {
  return r + "," + c;
}

// --- Condições mode: robot has a facing direction and moves relative to
// it. "SE parede -> vira" checks the cell directly ahead; if it's a wall
// (obstacle or grid edge) the robot turns 90deg clockwise instead of
// moving, otherwise the block does nothing (it's only useful right where
// a wall actually is, which is the whole point of the exercise: blind
// "forward,forward,forward,forward" marching gets stuck at the edge,
// while inserting the conditional block right there lets the robot turn
// itself and keep going).
const FACE_ORDER = ["right", "down", "left", "up"];
function turnRight(facing) {
  const i = FACE_ORDER.indexOf(facing);
  return FACE_ORDER[(i + 1) % FACE_ORDER.length];
}

const COND_LEVELS = [
  {
    size: 4,
    start: [0, 0],
    facing: "right",
    goal: [3, 3],
    obstacles: [],
    // right,right,right (hits edge) -> ifWall (turns to face down) -> down,down,down
    solutionLength: 7,
  },
  {
    size: 5,
    start: [0, 0],
    facing: "right",
    goal: [4, 4],
    obstacles: [],
    solutionLength: 9,
  },
];

// --- Debug mode: a fixed broken program that does NOT reach the goal.
// The child taps a step to cycle it through the 4 directions until the
// program is fixed. Uses the same maze engine (absolute directions) as
// the main mode.
const DEBUG_LEVELS = [
  {
    size: 4,
    start: [0, 0],
    goal: [0, 3],
    obstacles: [],
    // Correct would be right,right,right. Bug: 2nd step is "down" instead of "right".
    brokenProgram: ["right", "down", "right"],
  },
  {
    size: 5,
    start: [0, 0],
    goal: [3, 3],
    obstacles: [[1, 2]],
    // Correct: right,right,right,down,down,down (avoids obstacle at 1,2).
    // Bug: missing a final "down" step so it stops one short of the goal.
    brokenProgram: ["right", "right", "right", "down", "down"],
  },
];

// --- Sensores mode: extends the conditional engine with a simple
// perception block: "SE bateria à frente -> apanha". Kept deliberately
// close to the conditional mode so the concept reads as "the same IF
// pattern, now checking something the robot senses" rather than a whole
// new mechanic.
const SENSOR_LEVELS = [
  {
    size: 4,
    start: [0, 0],
    facing: "right",
    goal: [0, 3],
    battery: [0, 2],
    obstacles: [],
  },
];

export default function Robots() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);

  const [mode, setMode] = useState("maze");

  const MODES = [
    { id: "maze", label: t("modules.robotsModeMaze"), emoji: "🧩" },
    { id: "conditional", label: t("modules.robotsModeConditional"), emoji: "🔀" },
    { id: "debug", label: t("modules.robotsModeDebug"), emoji: "🐞" },
    { id: "sensor", label: t("modules.robotsModeSensor"), emoji: "🔋" },
  ];

  return (
    <div className="page">
      <h1>{t("modules.robotsTitle")} 🤖</h1>
      <div className="help-btn-corner">
        <HelpButton
          text={
            mode === "maze"
              ? t("modules.robotsHelp")
              : mode === "conditional"
              ? t("modules.robotsCondHelp")
              : mode === "debug"
              ? t("modules.robotsDebugHelp")
              : t("modules.robotsSensorHelp")
          }
          langCode={pair.mother}
        />
      </div>
      <p className="page-intro">{t("modules.robotsIntro")}</p>

      <div className="robots-controls">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={"big-btn game-option" + (mode === m.id ? " correct" : "")}
            onClick={() => setMode(m.id)}
          >
            {m.emoji} {m.label}
            <TabSpeakIcon text={m.label} langCode={pair.mother} />
          </button>
        ))}
      </div>

      {mode === "maze" && <MazeMode t={t} pair={pair} profile={profile} tier={tier} />}
      {mode === "conditional" && <ConditionalMode t={t} pair={pair} profile={profile} />}
      {mode === "debug" && <DebugMode t={t} pair={pair} profile={profile} />}
      {mode === "sensor" && <SensorMode t={t} pair={pair} profile={profile} />}
    </div>
  );
}

function Grid({ size, cellsFor }) {
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cells.push(cellsFor(r, c));
    }
  }
  return (
    <div className="robots-grid" style={{ gridTemplateColumns: `repeat(${size}, 48px)` }}>
      {cells}
    </div>
  );
}

function MazeMode({ t, pair, profile, tier }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [program, setProgram] = useState([]);
  const [robotPos, setRobotPos] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

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

  return (
    <div>
      <div className="robots-progress">
        {t("modules.robotsLevel")} {levelIndex + 1} / {LEVELS.length}
      </div>

      <Grid
        size={level.size}
        cellsFor={(r, c) => {
          const isRobot = displayPos[0] === r && displayPos[1] === c;
          const isGoal = level.goal[0] === r && level.goal[1] === c;
          const isObstacle = obstacleSet.has(cellKey(r, c));
          let content = "";
          if (isRobot) content = "🤖";
          else if (isGoal) content = "⭐";
          else if (isObstacle) content = "🪨";
          return (
            <div
              key={cellKey(r, c)}
              className={
                "robots-cell" + (isGoal ? " robots-goal" : "") + (isObstacle ? " robots-obstacle" : "")
              }
            >
              {content}
            </div>
          );
        }}
      />

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

function ConditionalMode({ t, pair, profile }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [program, setProgram] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [robotPos, setRobotPos] = useState(null);
  const [robotFacing, setRobotFacing] = useState(null);

  const level = COND_LEVELS[levelIndex];
  const obstacleSet = useMemo(
    () => new Set(level.obstacles.map(([r, c]) => cellKey(r, c))),
    [level]
  );

  function addStep(kind) {
    if (running) return;
    setResult(null);
    setProgram((p) => [...p, kind]);
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

  function goToLevel(i) {
    setLevelIndex(i);
    setProgram([]);
    setRobotPos(null);
    setRobotFacing(null);
    setResult(null);
  }

  function runProgram() {
    if (running || program.length === 0) return;
    setRunning(true);
    setResult(null);
    let pos = [...level.start];
    let facing = level.facing;
    setRobotPos(pos);
    setRobotFacing(facing);
    let step = 0;
    let hitWall = false;

    function aheadCell() {
      const [dr, dc] = DIRS[facing];
      return [pos[0] + dr, pos[1] + dc];
    }
    function isWallAhead() {
      const [nr, nc] = aheadCell();
      const inBounds = nr >= 0 && nr < level.size && nc >= 0 && nc < level.size;
      return !inBounds || obstacleSet.has(cellKey(nr, nc));
    }

    function tick() {
      if (hitWall || step >= program.length) {
        finish();
        return;
      }
      const kind = program[step];
      if (kind === "forward") {
        if (isWallAhead()) {
          hitWall = true;
        } else {
          pos = aheadCell();
          setRobotPos(pos);
        }
      } else if (kind === "ifWall") {
        if (isWallAhead()) {
          facing = turnRight(facing);
          setRobotFacing(facing);
        }
        // else: no-op, nothing ahead to react to
      }
      step += 1;
      setTimeout(tick, 500);
    }

    function finish() {
      const success = !hitWall && pos[0] === level.goal[0] && pos[1] === level.goal[1];
      setResult(success ? "success" : "retry");
      setRunning(false);
      recordSkillEvent(profile?.name, "robots-cond-" + levelIndex, success);
      pingProgress({
        profileName: profile?.name,
        module: "robots",
        event: success ? "cond_success" : "cond_retry",
      });
    }

    setTimeout(tick, 500);
  }

  const displayPos = robotPos || level.start;
  const displayFacing = robotFacing || level.facing;
  const facingEmoji = { right: "➡️", down: "⬇️", left: "⬅️", up: "⬆️" }[displayFacing];

  return (
    <div>
      <p className="page-intro">{t("modules.robotsCondIntro")}</p>
      <div className="robots-progress">
        {t("modules.robotsLevel")} {levelIndex + 1} / {COND_LEVELS.length}
      </div>

      <Grid
        size={level.size}
        cellsFor={(r, c) => {
          const isRobot = displayPos[0] === r && displayPos[1] === c;
          const isGoal = level.goal[0] === r && level.goal[1] === c;
          const isObstacle = obstacleSet.has(cellKey(r, c));
          let content = "";
          if (isRobot) content = facingEmoji;
          else if (isGoal) content = "⭐";
          else if (isObstacle) content = "🪨";
          return (
            <div
              key={cellKey(r, c)}
              className={
                "robots-cell" + (isGoal ? " robots-goal" : "") + (isObstacle ? " robots-obstacle" : "")
              }
            >
              {content}
            </div>
          );
        }}
      />

      <div className="robots-palette">
        <button type="button" className="robots-palette-btn" onClick={() => addStep("forward")} disabled={running}>
          ➡️ {t("modules.robotsCondForward")}
        </button>
        <button type="button" className="robots-palette-btn" onClick={() => addStep("ifWall")} disabled={running}>
          🔀 {t("modules.robotsCondTurnIfWall")}
        </button>
      </div>

      <div className="robots-program">
        {program.length === 0 ? (
          <span className="robots-program-empty">…</span>
        ) : (
          program.map((kind, i) => (
            <span key={i} className="robots-program-step">
              {kind === "forward" ? "➡️" : "🔀"}
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
          {levelIndex < COND_LEVELS.length - 1 && (
            <div style={{ marginTop: 10 }}>
              <button type="button" className="big-btn" onClick={() => goToLevel(levelIndex + 1)}>
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
        {COND_LEVELS.map((_, i) => (
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

function DebugMode({ t, pair, profile }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [program, setProgram] = useState(DEBUG_LEVELS[0].brokenProgram);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [robotPos, setRobotPos] = useState(null);

  const level = DEBUG_LEVELS[levelIndex];

  function cycleStep(i) {
    if (running) return;
    setResult(null);
    setProgram((p) => {
      const next = [...p];
      const curIdx = ARROW_ORDER.indexOf(next[i]);
      next[i] = ARROW_ORDER[(curIdx + 1) % ARROW_ORDER.length];
      return next;
    });
  }

  function resetBug() {
    if (running) return;
    setResult(null);
    setProgram([...level.brokenProgram]);
    setRobotPos(null);
  }

  function goToLevel(i) {
    setLevelIndex(i);
    setProgram([...DEBUG_LEVELS[i].brokenProgram]);
    setRobotPos(null);
    setResult(null);
  }

  function runProgram() {
    if (running) return;
    setRunning(true);
    setResult(null);
    let pos = [...level.start];
    setRobotPos(pos);
    let step = 0;
    const obstacleSet = new Set(level.obstacles.map(([r, c]) => cellKey(r, c)));

    function tick() {
      if (step >= program.length) {
        finish();
        return;
      }
      const [dr, dc] = DIRS[program[step]];
      const next = [pos[0] + dr, pos[1] + dc];
      const inBounds = next[0] >= 0 && next[0] < level.size && next[1] >= 0 && next[1] < level.size;
      if (inBounds && !obstacleSet.has(cellKey(next[0], next[1]))) {
        pos = next;
        setRobotPos(pos);
      }
      step += 1;
      setTimeout(tick, 450);
    }

    function finish() {
      const success = pos[0] === level.goal[0] && pos[1] === level.goal[1];
      setResult(success ? "success" : "retry");
      setRunning(false);
      recordSkillEvent(profile?.name, "robots-debug-" + levelIndex, success);
      pingProgress({
        profileName: profile?.name,
        module: "robots",
        event: success ? "debug_success" : "debug_retry",
      });
    }

    setTimeout(tick, 450);
  }

  const obstacleSet = useMemo(
    () => new Set(level.obstacles.map(([r, c]) => cellKey(r, c))),
    [level]
  );
  const displayPos = robotPos || level.start;

  return (
    <div>
      <p className="page-intro">{t("modules.robotsDebugIntro")}</p>
      <div className="robots-progress">
        {t("modules.robotsLevel")} {levelIndex + 1} / {DEBUG_LEVELS.length}
      </div>

      <Grid
        size={level.size}
        cellsFor={(r, c) => {
          const isRobot = displayPos[0] === r && displayPos[1] === c;
          const isGoal = level.goal[0] === r && level.goal[1] === c;
          const isObstacle = obstacleSet.has(cellKey(r, c));
          let content = "";
          if (isRobot) content = "🤖";
          else if (isGoal) content = "⭐";
          else if (isObstacle) content = "🪨";
          return (
            <div
              key={cellKey(r, c)}
              className={
                "robots-cell" + (isGoal ? " robots-goal" : "") + (isObstacle ? " robots-obstacle" : "")
              }
            >
              {content}
            </div>
          );
        }}
      />

      <div className="robots-program">
        {program.map((dir, i) => (
          <button
            key={i}
            type="button"
            className="robots-program-step robots-debug-step"
            onClick={() => cycleStep(i)}
            disabled={running}
            aria-label={t("modules.robotsDebugTapHint", "Tap to change")}
          >
            {ARROW_EMOJI[dir]}
          </button>
        ))}
      </div>

      <div className="robots-controls">
        <button type="button" className="big-btn" onClick={runProgram} disabled={running}>
          ▶️ {t("modules.robotsRun")}
        </button>
        <button type="button" className="big-btn" onClick={resetBug} disabled={running}>
          🔄 {t("modules.robotsDebugReset")}
        </button>
      </div>

      {result === "success" && (
        <div className="robots-feedback">
          {t("modules.robotsSuccess")}
          {levelIndex < DEBUG_LEVELS.length - 1 && (
            <div style={{ marginTop: 10 }}>
              <button type="button" className="big-btn" onClick={() => goToLevel(levelIndex + 1)}>
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
        {DEBUG_LEVELS.map((_, i) => (
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

function SensorMode({ t, pair, profile }) {
  const level = SENSOR_LEVELS[0];
  const [program, setProgram] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [robotPos, setRobotPos] = useState(null);
  const [robotFacing, setRobotFacing] = useState(null);
  const [grabbed, setGrabbed] = useState(false);

  const obstacleSet = useMemo(
    () => new Set(level.obstacles.map(([r, c]) => cellKey(r, c))),
    [level]
  );

  function addStep(kind) {
    if (running) return;
    setResult(null);
    setProgram((p) => [...p, kind]);
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
    setGrabbed(false);
  }

  function runProgram() {
    if (running || program.length === 0) return;
    setRunning(true);
    setResult(null);
    setGrabbed(false);
    let pos = [...level.start];
    let facing = level.facing;
    let hasBattery = false;
    setRobotPos(pos);
    setRobotFacing(facing);
    let step = 0;
    let hitWall = false;

    function aheadCell() {
      const [dr, dc] = DIRS[facing];
      return [pos[0] + dr, pos[1] + dc];
    }
    function inBounds(cell) {
      return cell[0] >= 0 && cell[0] < level.size && cell[1] >= 0 && cell[1] < level.size;
    }
    function isWallAhead() {
      const next = aheadCell();
      return !inBounds(next) || obstacleSet.has(cellKey(next[0], next[1]));
    }
    function isBatteryAhead() {
      const next = aheadCell();
      return next[0] === level.battery[0] && next[1] === level.battery[1] && !hasBattery;
    }

    function tick() {
      if (hitWall || step >= program.length) {
        finish();
        return;
      }
      const kind = program[step];
      if (kind === "forward") {
        if (isWallAhead()) {
          hitWall = true;
        } else {
          pos = aheadCell();
          setRobotPos(pos);
        }
      } else if (kind === "grabIfBattery") {
        if (isBatteryAhead()) {
          hasBattery = true;
          setGrabbed(true);
        }
        // else: no-op
      }
      step += 1;
      setTimeout(tick, 500);
    }

    function finish() {
      const success = !hitWall && hasBattery && pos[0] === level.goal[0] && pos[1] === level.goal[1];
      setResult(success ? "success" : "retry");
      setRunning(false);
      recordSkillEvent(profile?.name, "robots-sensor-0", success);
      pingProgress({
        profileName: profile?.name,
        module: "robots",
        event: success ? "sensor_success" : "sensor_retry",
      });
    }

    setTimeout(tick, 500);
  }

  const displayPos = robotPos || level.start;
  const displayFacing = robotFacing || level.facing;
  const facingEmoji = { right: "➡️", down: "⬇️", left: "⬅️", up: "⬆️" }[displayFacing];

  return (
    <div>
      <p className="page-intro">{t("modules.robotsSensorIntro")}</p>

      <Grid
        size={level.size}
        cellsFor={(r, c) => {
          const isRobot = displayPos[0] === r && displayPos[1] === c;
          const isGoal = level.goal[0] === r && level.goal[1] === c;
          const isBattery = !grabbed && level.battery[0] === r && level.battery[1] === c;
          const isObstacle = obstacleSet.has(cellKey(r, c));
          let content = "";
          if (isRobot) content = facingEmoji;
          else if (isGoal) content = "⭐";
          else if (isBattery) content = "🔋";
          else if (isObstacle) content = "🪨";
          return (
            <div
              key={cellKey(r, c)}
              className={
                "robots-cell" + (isGoal ? " robots-goal" : "") + (isObstacle ? " robots-obstacle" : "")
              }
            >
              {content}
            </div>
          );
        }}
      />

      {grabbed && <div className="robots-feedback">{t("modules.robotsSensorGrabbed")}</div>}

      <div className="robots-palette">
        <button type="button" className="robots-palette-btn" onClick={() => addStep("forward")} disabled={running}>
          ➡️ {t("modules.robotsCondForward")}
        </button>
        <button type="button" className="robots-palette-btn" onClick={() => addStep("grabIfBattery")} disabled={running}>
          🔋 {t("modules.robotsSensorGrab")}
        </button>
      </div>

      <div className="robots-program">
        {program.length === 0 ? (
          <span className="robots-program-empty">…</span>
        ) : (
          program.map((kind, i) => (
            <span key={i} className="robots-program-step">
              {kind === "forward" ? "➡️" : "🔋"}
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

      {result === "success" && <div className="robots-feedback">{t("modules.robotsSuccess")}</div>}
      {result === "retry" && (
        <div className="robots-feedback robots-feedback-retry">{t("modules.robotsTryAgain")}</div>
      )}
    </div>
  );
}
