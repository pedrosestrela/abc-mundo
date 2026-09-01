import React, { Suspense, lazy, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getHumanBody, getToyHospital } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getDifficultyTier,
  getExploredBodyOrgans,
  exploreBodyOrgan,
  getCompletedHospitalScenarios,
  completeHospitalScenario,
  recordSkillEvent,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";

// Lazy-loaded: pulls in three.js's OrbitControls (only the pieces this
// component imports, not the whole globe.gl bundle), only needed when the
// child actually opens the 3D body view.
const HumanBody3D = lazy(() => import("../components/HumanBody3D.jsx"));

// A friendly, simplified front-view child silhouette (flat shapes only, no
// external art assets — same convention as Illustrations.jsx /
// InstrumentVisual.jsx) with tappable hotspots placed roughly where each
// organ/system actually sits in the body, reusing the "circle node + leader
// line" interaction language from Teardown.jsx's ExplodedView so the tap
// target always stays large and clear for small fingers.
const ORGAN_POSITIONS = {
  brain: { x: 160, y: 48 },
  heart: { x: 137, y: 148 },
  lungs: { x: 183, y: 150 },
  skeleton: { x: 160, y: 260 },
  muscles: { x: 95, y: 190 },
  digestion: { x: 160, y: 195 },
  skin: { x: 225, y: 190 },
  blood: { x: 160, y: 330 },
};

function BodyDiagram({ organs, activeId, exploredIds, onSelect }) {
  return (
    <svg
      className="instrument-visual-svg teardown-diagram body-diagram"
      viewBox="0 0 320 400"
      width="100%"
      role="img"
      aria-label="Corpo humano"
    >
      {/* Simplified friendly child silhouette: head, torso, arms, legs. */}
      <circle cx="160" cy="55" r="38" className="body-silhouette-part" />
      <rect x="128" y="90" width="64" height="130" rx="26" className="body-silhouette-part" />
      <rect x="88" y="100" width="30" height="105" rx="14" className="body-silhouette-part" />
      <rect x="202" y="100" width="30" height="105" rx="14" className="body-silhouette-part" />
      <rect x="136" y="212" width="20" height="120" rx="10" className="body-silhouette-part" />
      <rect x="164" y="212" width="20" height="120" rx="10" className="body-silhouette-part" />

      {organs.map((organ) => {
        const pos = ORGAN_POSITIONS[organ.id] || { x: 160, y: 200 };
        const active = organ.id === activeId;
        const explored = exploredIds.includes(organ.id);
        return (
          <g key={organ.id}>
            <g
              className="instrument-hit-area teardown-node"
              onClick={() => onSelect(organ)}
              role="button"
              tabIndex={0}
              aria-label={organ.label}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={26}
                className={
                  "teardown-part-circle" + (active ? " active" : "") + (explored ? " explored" : "")
                }
              />
              <text x={pos.x} y={pos.y + 7} textAnchor="middle" fontSize="20">
                {organ.emoji}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function BodyTab({ pair, profile, tier, t }) {
  const organs = getHumanBody(pair.mother);
  const [activeId, setActiveId] = useState(null);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState("simple");
  const explored = useMemo(() => getExploredBodyOrgans(profile?.name), [profile?.name, version]);
  const active = organs.find((o) => o.id === activeId);
  const allExplored = organs.length > 0 && organs.every((o) => explored.includes(o.id));

  function handleSelect(organ) {
    setActiveId(organ.id);
    exploreBodyOrgan(profile?.name, organ.id);
    recordSkillEvent(profile?.name, "human-body", true);
    pingProgress({ profileName: profile?.name, module: "human-body", event: `organ_explored:${organ.id}` });
    setVersion((v) => v + 1);
  }

  const explainText = active ? (tier <= 1 ? active.shortExplain : active.detailedExplain) : "";

  return (
    <>
      <p className="page-intro">{t("modules.humanBodyTapHint")}</p>
      <h2 className="songs-heading">
        {t("modules.humanBodyExplored")} ({explored.length}/{organs.length})
      </h2>

      <div className="tab-row" role="tablist">
        <button type="button" className={"tab-btn" + (view === "simple" ? " active" : "")} onClick={() => setView("simple")}>
          🔲 {t("modules.view2D")}
        </button>
        <button type="button" className={"tab-btn" + (view === "3d" ? " active" : "")} onClick={() => setView("3d")}>
          🌐 {t("modules.view3D")}
        </button>
      </div>

      <div className="game-card">
        {view === "simple" ? (
          <BodyDiagram organs={organs} activeId={activeId} exploredIds={explored} onSelect={handleSelect} />
        ) : (
          <Suspense fallback={<div className="globe-3d-container globe-3d-loading">🫀</div>}>
            <HumanBody3D organs={organs} activeId={activeId} exploredIds={explored} onSelect={handleSelect} />
          </Suspense>
        )}

        {active && (
          <div className="science-explanation">
            <div className="mission-badge computing-topic-badge">
              {active.emoji} {active.label}
            </div>
            <p className="game-result">
              {explainText}
              <SpeakButton text={explainText} langCode={pair.mother} />
            </p>
          </div>
        )}

        {allExplored && (
          <div className="science-explanation">
            <p className="game-result">🏆 {t("modules.humanBodyAllExplored")}</p>
          </div>
        )}
      </div>
    </>
  );
}

function HospitalScenarioCard({ scenario, pair, profile, done, onComplete, t }) {
  const [choiceId, setChoiceId] = useState(null);
  const choice = scenario.choices.find((c) => c.id === choiceId);

  function pick(c) {
    setChoiceId(c.id);
    if (c.correct && !done) {
      onComplete(scenario.id);
    }
  }

  function reset() {
    setChoiceId(null);
  }

  return (
    <div className={"game-card science-card" + (done ? " done" : "")}>
      <div className="game-emoji">{scenario.characterEmoji}</div>
      <p className="mission-text">
        {scenario.characterEmoji} {scenario.characterName}: {scenario.complaintEmoji} {scenario.complaint}
        <SpeakButton text={scenario.complaint} langCode={pair.mother} />
      </p>

      {!choice && (
        <div className="game-options">
          {scenario.choices.map((c) => (
            <button key={c.id} type="button" className="big-btn game-option" onClick={() => pick(c)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {choice && (
        <div className="science-explanation">
          <p className="game-result">
            {choice.correct ? "✅" : "💛"} {choice.feedback}
            <SpeakButton text={choice.feedback} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={reset}>
            🔁 {t("modules.humanBodyTryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}

function HospitalTab({ pair, profile, t }) {
  const scenarios = getToyHospital(pair.mother);
  const [version, setVersion] = useState(0);
  const done = useMemo(() => getCompletedHospitalScenarios(profile?.name), [profile?.name, version]);

  function handleComplete(scenarioId) {
    completeHospitalScenario(profile?.name, scenarioId);
    recordSkillEvent(profile?.name, "toy-hospital", true);
    pingProgress({ profileName: profile?.name, module: "human-body", event: `hospital_scenario_done:${scenarioId}` });
    setVersion((v) => v + 1);
  }

  return (
    <>
      <p className="page-intro">{t("modules.toyHospitalIntro")}</p>
      <h2 className="songs-heading">
        {t("modules.humanBodyExplored")} ({done.length}/{scenarios.length})
      </h2>
      {scenarios.map((scenario) => (
        <HospitalScenarioCard
          key={scenario.id}
          scenario={scenario}
          pair={pair}
          profile={profile}
          done={done.includes(scenario.id)}
          onComplete={handleComplete}
          t={t}
        />
      ))}
    </>
  );
}

export default function HumanBody() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const [tab, setTab] = useState("body");

  return (
    <div className="page">
      <h1>{t("modules.humanBodyTitle")} 🫀</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.humanBodyHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.humanBodyIntro")}</p>
      <MascotBubble character="nina" mood="happy" langCode={pair.mother}>
        {t("modules.humanBodyMascotIntro")}
      </MascotBubble>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "body" ? " selected" : "")} onClick={() => setTab("body")}>
          <span className="phonics-tab-inner">
            🫀 {t("modules.humanBodyTab")}
            <TabSpeakIcon text={`${t("modules.humanBodyTab")}. ${t("modules.humanBodyTapHint")}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "hospital" ? " selected" : "")} onClick={() => setTab("hospital")}>
          <span className="phonics-tab-inner">
            🧸 {t("modules.toyHospitalTab")}
            <TabSpeakIcon text={`${t("modules.toyHospitalTab")}. ${t("modules.toyHospitalIntro")}`} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {tab === "body" && <BodyTab pair={pair} profile={profile} tier={tier} t={t} />}
      {tab === "hospital" && <HospitalTab pair={pair} profile={profile} t={t} />}
    </div>
  );
}
