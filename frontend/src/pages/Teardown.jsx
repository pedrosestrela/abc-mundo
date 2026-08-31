import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getObjectTeardown } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getExploredTeardownParts,
  exploreTeardownPart,
  recordSkillEvent,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

// Generic "exploded view" diagram: the object's emoji sits in the centre and
// each part is a labeled node arranged in a circle around it, connected by a
// thin leader line — a simple, honest stand-in for a real teardown
// illustration (flat shapes + labels, matching the Illustrations.jsx /
// InstrumentVisual.jsx convention of no external art assets) that still
// reads clearly for any object regardless of its real shape.
function ExplodedView({ obj, activePartId, exploredIds, onSelectPart }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 118;
  const n = obj.parts.length;

  return (
    <svg
      className="instrument-visual-svg teardown-diagram"
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      role="img"
      aria-label={obj.title}
    >
      <circle cx={cx} cy={cy} r={44} className="teardown-center-circle" />
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="40">
        {obj.emoji}
      </text>
      {obj.parts.map((part, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const nx = cx + radius * Math.cos(angle);
        const ny = cy + radius * Math.sin(angle);
        const active = part.id === activePartId;
        const explored = exploredIds.includes(`${obj.id}:${part.id}`);
        return (
          <g key={part.id}>
            <line
              x1={cx + 48 * Math.cos(angle)}
              y1={cy + 48 * Math.sin(angle)}
              x2={nx}
              y2={ny}
              className={"teardown-leader-line" + (active ? " active" : "")}
            />
            <g
              className="instrument-hit-area teardown-node"
              onClick={() => onSelectPart(part)}
              role="button"
              tabIndex={0}
              aria-label={part.label}
            >
              <circle
                cx={nx}
                cy={ny}
                r={30}
                className={
                  "teardown-part-circle" + (active ? " active" : "") + (explored ? " explored" : "")
                }
              />
              <text x={nx} y={ny + 8} textAnchor="middle" fontSize="24">
                {part.emoji}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export default function Teardown() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const objects = getObjectTeardown(pair.mother);

  const [openId, setOpenId] = useState(null);
  const [activePartId, setActivePartId] = useState(null);
  const [version, setVersion] = useState(0);

  const explored = useMemo(() => getExploredTeardownParts(profile?.name), [profile?.name, version]);

  function handleOpenObject(obj) {
    const nowOpen = obj.id !== openId;
    setOpenId(nowOpen ? obj.id : null);
    setActivePartId(null);
    if (nowOpen) {
      pingProgress({ profileName: profile?.name, module: "teardown", event: `object_opened:${obj.id}` });
    }
  }

  function handleSelectPart(obj, part) {
    setActivePartId(part.id);
    exploreTeardownPart(profile?.name, obj.id, part.id);
    recordSkillEvent(profile?.name, "object-teardown", true);
    pingProgress({ profileName: profile?.name, module: "teardown", event: `part_explored:${obj.id}:${part.id}` });
    setVersion((v) => v + 1);
  }

  function objectExploredCount(obj) {
    return obj.parts.filter((p) => explored.includes(`${obj.id}:${p.id}`)).length;
  }

  const openObject = objects.find((o) => o.id === openId);
  const activePart = openObject ? openObject.parts.find((p) => p.id === activePartId) : null;
  const allExplored = openObject ? objectExploredCount(openObject) === openObject.parts.length : false;

  return (
    <div className="page">
      <h1>{t("modules.teardownTitle")} 🔍</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.teardownHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.teardownIntro")}</p>

      {!openObject && (
        <div className="computing-grid">
          {objects.map((obj) => {
            const count = objectExploredCount(obj);
            const done = count === obj.parts.length;
            return (
              <button
                key={obj.id}
                type="button"
                className={"computing-term-btn" + (done ? " done" : "")}
                onClick={() => handleOpenObject(obj)}
              >
                <span className="computing-term-emoji">{obj.emoji}</span>
                {obj.title}
                <span className="mundos-tile-sub">
                  {count}/{obj.parts.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {openObject && (
        <div className="game-card">
          <p className="mission-text">
            {openObject.title}
            <SpeakButton text={openObject.title} langCode={pair.mother} />
          </p>
          <p className="page-intro">{t("modules.teardownTapHint")}</p>

          <ExplodedView
            obj={openObject}
            activePartId={activePartId}
            exploredIds={explored}
            onSelectPart={(part) => handleSelectPart(openObject, part)}
          />

          {activePart && (
            <div className="science-explanation">
              <div className="mission-badge computing-topic-badge">
                {activePart.emoji} {activePart.label}
              </div>
              <p className="page-intro">{t("modules.teardownWhyLabel")}</p>
              <p className="game-result">
                {activePart.why}
                <SpeakButton text={activePart.why} langCode={pair.mother} />
              </p>
            </div>
          )}

          {allExplored && (
            <div className="science-explanation">
              <p className="game-result">🏆 {t("modules.teardownSummaryHeading")}</p>
              <p className="mission-text">
                {openObject.summary}
                <SpeakButton text={openObject.summary} langCode={pair.mother} />
              </p>
            </div>
          )}

          <button type="button" className="big-btn" onClick={() => handleOpenObject(openObject)}>
            ✅ {t("modules.teardownBack")}
          </button>
        </div>
      )}
    </div>
  );
}
