import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTrafficSigns } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getExploredTrafficSigns,
  exploreTrafficSign,
  pingProgress,
  recordSkillEvent,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";

const CATEGORY_ICONS = {
  pedestrian: "🚶",
  driver: "🚗",
};

// --- Part 2: "Vamos Conduzir!" driving simulation -------------------------
//
// A small top-down grid where the child drives a car along a single fixed
// route from a start point to a destination ("a escola"), reusing the same
// tap-based grid-movement idea as MazeGame.jsx (own implementation, not a
// shared module - MazeGame.jsx itself is untouched).
//
// Every route is a strict, hand-verified sequence of adjacent cells (see
// scratchpad validation before this file was written) - no branching maze,
// just a road with a couple of traffic-sign cells embedded in it, plus at
// most one tempting "no entry" side street the child can wander into.
//
// Rule enforcement is intentionally *non-punitive*: an illegal move is
// simply refused (the car never actually leaves the safe cell it was on),
// a friendly explanation is shown, and the child taps to try again. There
// is no crash animation and no "game over" - only "vamos tentar outra vez".
const DRIVE_LAYOUTS = [
  {
    id: "rota-1",
    rows: 5,
    cols: 6,
    path: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 5], [2, 5],
      [2, 4], [2, 3], [2, 2], [2, 1], [2, 0],
      [3, 0], [4, 0],
      [4, 1], [4, 2], [4, 3], [4, 4], [4, 5],
    ],
    signs: {
      "0,3": { type: "stop" },
      "1,5": { type: "light" },
      "2,1": { type: "oneway", dir: { dr: 0, dc: -1 } },
    },
    noEntry: ["3,2"],
  },
  {
    id: "rota-2",
    rows: 4,
    cols: 5,
    path: [
      [0, 2], [0, 3], [0, 4],
      [1, 4], [2, 4], [3, 4],
      [3, 3], [3, 2], [3, 1], [3, 0],
      [2, 0], [1, 0], [0, 0],
    ],
    signs: {
      "0,4": { type: "stop" },
      "3,4": { type: "light" },
      "2,0": { type: "oneway", dir: { dr: -1, dc: 0 } },
    },
    noEntry: ["2,1"],
  },
];

const LIGHT_SEQUENCE = ["red", "yellow", "green"];
const LIGHT_MS = 2200;

function key(r, c) {
  return `${r},${c}`;
}

function pickLayout(excludeId) {
  const pool = excludeId ? DRIVE_LAYOUTS.filter((l) => l.id !== excludeId) : DRIVE_LAYOUTS;
  const list = pool.length ? pool : DRIVE_LAYOUTS;
  return list[Math.floor(Math.random() * list.length)];
}

function freshDriveState(layout) {
  return {
    layout,
    pos: layout.path[0],
    confirmedStops: {}, // key(r,c) -> true once the child has "waited" at that stop sign
    status: "playing", // playing | won
  };
}

function DrivingGame({ profileName, t, langCode }) {
  const [state, setState] = useState(() => freshDriveState(pickLayout()));
  const [lightIndex, setLightIndex] = useState(0);
  const [violation, setViolation] = useState(null); // { message } | null

  const { layout, pos, confirmedStops, status } = state;
  const pathSet = useMemo(() => new Set(layout.path.map(([r, c]) => key(r, c))), [layout]);
  const noEntrySet = useMemo(() => new Set(layout.noEntry || []), [layout]);
  const destination = layout.path[layout.path.length - 1];
  const light = LIGHT_SEQUENCE[lightIndex];

  // Traffic light cycling timer - always runs while a round is in progress,
  // so the child has to time their move rather than the light being static.
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setLightIndex((i) => (i + 1) % LIGHT_SEQUENCE.length), LIGHT_MS);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status !== "won") return;
    pingProgress({ profileName, module: "traffic-school", event: `drive_completed:${layout.id}` });
    recordSkillEvent(profileName, "traffic-school", true);
  }, [status, profileName, layout.id]);

  function showViolation(message) {
    pingProgress({ profileName, module: "traffic-school", event: "drive_rule_reminder" });
    setViolation({ message });
  }

  function move(dr, dc) {
    if (status !== "playing" || violation) return;
    const [r, c] = pos;
    const posKey = key(r, c);
    const currentSign = layout.signs[posKey];

    // A stop sign only releases the car once the child has explicitly
    // confirmed they waited - trying to drive off before that is the
    // "ran the stop sign" mistake this module is meant to teach.
    if (currentSign?.type === "stop" && !confirmedStops[posKey]) {
      showViolation(t("modules.trafficSchoolViolationStop"));
      return;
    }
    // Same idea for a red/yellow light: leaving while it isn't green.
    if (currentSign?.type === "light" && light !== "green") {
      showViolation(t("modules.trafficSchoolViolationLight"));
      return;
    }

    const nr = r + dr;
    const nc = c + dc;
    const nKey = key(nr, nc);

    if (noEntrySet.has(nKey)) {
      showViolation(t("modules.trafficSchoolViolationNoEntry"));
      return;
    }
    if (!pathSet.has(nKey)) return; // off-road: simply not drivable, like a wall

    const targetSign = layout.signs[nKey];
    if (targetSign?.type === "oneway") {
      const wantDir = targetSign.dir;
      if (wantDir.dr !== dr || wantDir.dc !== dc) {
        showViolation(t("modules.trafficSchoolViolationOneway"));
        return;
      }
    }

    const won = nr === destination[0] && nc === destination[1];
    setState((prev) => ({ ...prev, pos: [nr, nc], status: won ? "won" : "playing" }));
  }

  function confirmStop() {
    const posKey = key(pos[0], pos[1]);
    setState((prev) => ({ ...prev, confirmedStops: { ...prev.confirmedStops, [posKey]: true } }));
  }

  function restart(newLayout) {
    setState(freshDriveState(newLayout || pickLayout(layout.id)));
    setLightIndex(0);
    setViolation(null);
  }

  const posKey = key(pos[0], pos[1]);
  const currentSign = layout.signs[posKey];
  const waitingAtStop = currentSign?.type === "stop" && !confirmedStops[posKey];
  const waitingAtLight = currentSign?.type === "light" && light !== "green";

  return (
    <div className="drive-wrap">
      <p className="page-intro">{t("modules.trafficSchoolDriveIntro")}</p>

      <div className="drive-board" role="img" aria-label={t("modules.trafficSchoolDriveTitle")}>
        {Array.from({ length: layout.rows }).map((_, r) => (
          <div className="drive-row" key={r}>
            {Array.from({ length: layout.cols }).map((_, c) => {
              const cellKey = key(r, c);
              const isRoad = pathSet.has(cellKey);
              const isNoEntry = noEntrySet.has(cellKey);
              const isCar = pos[0] === r && pos[1] === c;
              const isDest = destination[0] === r && destination[1] === c;
              const sign = layout.signs[cellKey];
              return (
                <div
                  key={c}
                  className={
                    "drive-cell" +
                    (isRoad ? " drive-road" : "") +
                    (isNoEntry ? " drive-no-entry" : "")
                  }
                >
                  {isNoEntry && !isCar && <span aria-hidden="true">⛔</span>}
                  {isDest && !isCar && <span aria-hidden="true">🏫</span>}
                  {sign?.type === "stop" && !isCar && <span aria-hidden="true">🛑</span>}
                  {sign?.type === "light" && !isCar && (
                    <span aria-hidden="true">{light === "red" ? "🔴" : light === "yellow" ? "🟡" : "🟢"}</span>
                  )}
                  {sign?.type === "oneway" && !isCar && <span aria-hidden="true">➡️</span>}
                  {isCar && <span className="drive-car" aria-hidden="true">🚗</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {status === "playing" && !violation && waitingAtStop && (
        <div className="game-card">
          <p className="mission-text">🛑 {t("modules.trafficSchoolStopPrompt")}</p>
          <button type="button" className="big-btn" onClick={confirmStop}>
            ✅ {t("modules.trafficSchoolStopConfirm")}
          </button>
        </div>
      )}

      {status === "playing" && !violation && waitingAtLight && !waitingAtStop && (
        <p className="mission-text">🚦 {t("modules.trafficSchoolWaitLight")}</p>
      )}

      {status === "playing" && violation && (
        <div className="game-card">
          <p className="mission-text">🦉 {violation.message}</p>
          <button type="button" className="big-btn" onClick={() => setViolation(null)}>
            🔁 {t("modules.trafficSchoolTryAgain")}
          </button>
        </div>
      )}

      {status === "playing" && (
        <div className="maze-dpad" role="group" aria-label={t("modules.trafficSchoolDriveTitle")}>
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

      {status === "won" && (
        <div className="maze-result">
          <div className="game-emoji">🏆</div>
          <p className="game-result">{t("modules.trafficSchoolDriveWin")}</p>
          <button type="button" className="big-btn" onClick={() => restart()}>
            {t("modules.trafficSchoolTryAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}

// --- Part 1: "Sinais de Trânsito" tap-to-reveal card grid ------------------

function SignsGrid({ signs, explored, onOpen, category, t }) {
  const visible = category === "all" ? signs : signs.filter((s) => s.category === category);
  return (
    <div className="computing-grid">
      {visible.map((sign) => {
        const done = explored.includes(sign.id);
        return (
          <button
            key={sign.id}
            type="button"
            className={"computing-term-btn" + (done ? " done" : "")}
            onClick={() => onOpen(sign)}
          >
            <span className="computing-term-emoji">{sign.emoji}</span>
            {sign.name}
            <span className="mundos-tile-sub">
              {CATEGORY_ICONS[sign.category] || "🚦"} {t(`modules.trafficSchoolCategory_${sign.category}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function TrafficSchool() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const signs = getTrafficSigns(pair.mother);

  const [tab, setTab] = useState("signs");
  const [openSign, setOpenSign] = useState(null);
  const [category, setCategory] = useState("all");
  const [version, setVersion] = useState(0);

  const explored = useMemo(() => getExploredTrafficSigns(profile?.name), [profile?.name, version]);

  function handleOpen(sign) {
    setOpenSign(sign);
    exploreTrafficSign(profile?.name, sign.id);
    pingProgress({ profileName: profile?.name, module: "traffic-school", event: `sign_explored:${sign.id}` });
    setVersion((v) => v + 1);
  }

  return (
    <div className="page">
      <h1>{t("modules.trafficSchoolTitle")} 🚦</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.trafficSchoolHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.trafficSchoolIntro")}</p>

      <h2 className="songs-heading">
        {t("modules.trafficSchoolSignsExplored")} ({explored.length}/{signs.length})
      </h2>

      <div className="phonics-tabs">
        <button
          type="button"
          className={"phonics-tab" + (tab === "signs" ? " selected" : "")}
          onClick={() => setTab("signs")}
        >
          <span className="phonics-tab-inner">
            🚸 {t("modules.trafficSchoolSignsTab")}
            <TabSpeakIcon text={t("modules.trafficSchoolSignsTab")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (tab === "drive" ? " selected" : "")}
          onClick={() => setTab("drive")}
        >
          <span className="phonics-tab-inner">
            🚗 {t("modules.trafficSchoolDriveTab")}
            <TabSpeakIcon text={t("modules.trafficSchoolDriveTab")} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {tab === "signs" && (
        <>
          <div className="phonics-tabs">
            <button
              type="button"
              className={"phonics-tab" + (category === "all" ? " selected" : "")}
              onClick={() => setCategory("all")}
            >
              <span className="phonics-tab-inner">🌟 {t("modules.trafficSchoolCategory_all")}</span>
            </button>
            <button
              type="button"
              className={"phonics-tab" + (category === "pedestrian" ? " selected" : "")}
              onClick={() => setCategory("pedestrian")}
            >
              <span className="phonics-tab-inner">🚶 {t("modules.trafficSchoolCategory_pedestrian")}</span>
            </button>
            <button
              type="button"
              className={"phonics-tab" + (category === "driver" ? " selected" : "")}
              onClick={() => setCategory("driver")}
            >
              <span className="phonics-tab-inner">🚗 {t("modules.trafficSchoolCategory_driver")}</span>
            </button>
          </div>

          {!openSign && (
            <SignsGrid signs={signs} explored={explored} onOpen={handleOpen} category={category} t={t} />
          )}

          {openSign && (
            <div className="game-card">
              <div className="game-emoji">{openSign.emoji}</div>
              <p className="mission-text">
                {openSign.name}
                <SpeakButton text={openSign.name} langCode={pair.mother} />
              </p>
              <p className="game-result">
                💡 {openSign.meaning}
                <SpeakButton text={openSign.meaning} langCode={pair.mother} />
              </p>
              <button type="button" className="big-btn" onClick={() => setOpenSign(null)}>
                ✅ {t("modules.howThingsWorkBack")}
              </button>
            </div>
          )}
        </>
      )}

      {tab === "drive" && (
        <DrivingGame profileName={profile?.name} t={t} langCode={pair.mother} />
      )}
    </div>
  );
}
