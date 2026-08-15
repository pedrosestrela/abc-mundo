import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getHumanEvolution } from "../content/index.js";
import { getLangPair, getProfile, getVisitedEvolutionStages, visitEvolutionStage, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import {
  IllustrationHominid,
  IllustrationModernHuman,
  IllustrationStoneTool,
  IllustrationFire,
  IllustrationCaveArt,
} from "../components/illustrations/humanEvolution.jsx";

// Picks which of the 5 human-evolution illustrations best fits a given
// timeline stage, so every stage still gets a relevant visual without
// needing one hand-authored illustration per stage.
function stageIllustration(stageId) {
  switch (stageId) {
    case "homo-erectus":
      return IllustrationFire;
    case "arte-e-cultura":
      return IllustrationCaveArt;
    case "homo-sapiens":
    case "agricultura":
    case "humanos-hoje":
      return IllustrationModernHuman;
    case "homo-habilis":
      return IllustrationStoneTool;
    default:
      return IllustrationHominid;
  }
}

function BrainSizeChart({ stages, pair, t }) {
  const maxBrain = Math.max(...stages.map((s) => s.brainSizeCm3));
  return (
    <div className="game-card science-card">
      <div className="game-emoji">🧠</div>
      <p className="mission-text">
        {t("modules.evolutionBrainChartQuestion")}
        <SpeakButton text={t("modules.evolutionBrainChartQuestion")} langCode={pair.mother} />
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          justifyContent: "center",
          height: 160,
          overflowX: "auto",
          padding: "8px 4px",
        }}
      >
        {stages.map((s) => {
          const barHeight = Math.max(6, Math.round((s.brainSizeCm3 / maxBrain) * 130));
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flex: "0 0 auto" }}>
              <div style={{ fontSize: 11, marginBottom: 2 }}>{s.brainSizeCm3} cm³</div>
              <div
                style={{
                  width: 28,
                  height: barHeight,
                  background: "var(--purple, #9b5de5)",
                  borderRadius: 6,
                  transition: "height 0.3s ease",
                }}
                aria-hidden="true"
              />
              <div style={{ fontSize: 20, marginTop: 4 }}>{s.emoji}</div>
              <div style={{ fontSize: 10, textAlign: "center", lineHeight: 1.15 }}>{s.title}</div>
            </div>
          );
        })}
      </div>
      <p className="mission-text">{t("modules.evolutionBrainChartNote")}</p>
    </div>
  );
}

function HeightChart({ stages, pair, t }) {
  const maxHeight = Math.max(...stages.map((s) => s.heightCm));
  return (
    <div className="game-card science-card">
      <div className="game-emoji">📏</div>
      <p className="mission-text">
        {t("modules.evolutionHeightChartQuestion")}
        <SpeakButton text={t("modules.evolutionHeightChartQuestion")} langCode={pair.mother} />
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          justifyContent: "center",
          height: 160,
          overflowX: "auto",
          padding: "8px 4px",
        }}
      >
        {stages.map((s) => {
          const barHeight = Math.max(6, Math.round((s.heightCm / maxHeight) * 130));
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 52, flex: "0 0 auto" }}>
              <div style={{ fontSize: 11, marginBottom: 2 }}>{s.heightCm} cm</div>
              <div
                style={{
                  width: 28,
                  height: barHeight,
                  background: "var(--pink, #ff8fab)",
                  borderRadius: 6,
                  transition: "height 0.3s ease",
                }}
                aria-hidden="true"
              />
              <div style={{ fontSize: 20, marginTop: 4 }}>{s.emoji}</div>
              <div style={{ fontSize: 10, textAlign: "center", lineHeight: 1.15 }}>{s.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HumanEvolution() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const stages = useMemo(() => getHumanEvolution(pair.mother), [pair.mother]);

  const [tab, setTab] = useState("timeline");
  const [openId, setOpenId] = useState(null);
  const [visitedVersion, setVisitedVersion] = useState(0);
  const visited = useMemo(() => getVisitedEvolutionStages(profile?.name), [profile?.name, visitedVersion]);

  function toggleStage(stage) {
    const opening = openId !== stage.id;
    setOpenId(opening ? stage.id : null);
    if (opening) {
      visitEvolutionStage(profile?.name, stage.id);
      pingProgress({ profileName: profile?.name, module: "human-evolution", event: `stage_visited:${stage.id}` });
      recordSkillEvent(profile?.name, "evolution-stage-viewed", true);
      setVisitedVersion((v) => v + 1);
    }
  }

  return (
    <div className="page">
      <h1>{t("modules.evolutionTitle")} 🧬</h1>
      <div className="help-btn-corner">
        <HelpButton
          text={tab === "compare" ? t("modules.evolutionHelpCompare") : t("modules.evolutionHelpTimeline")}
          langCode={pair.mother}
        />
      </div>
      <p className="page-intro">{t("modules.evolutionIntro")}</p>
      <MascotBubble character="nina" mood="happy" langCode={pair.mother}>
        {t("modules.evolutionMascotIntro")}
      </MascotBubble>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "timeline" ? " selected" : "")} onClick={() => setTab("timeline")}>
          <span className="phonics-tab-inner">
            🧬 {t("modules.evolutionTimelineTab")}
            <TabSpeakIcon text={`${t("modules.evolutionTimelineTab")}. ${t("modules.evolutionHelpTimeline")}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "compare" ? " selected" : "")} onClick={() => setTab("compare")}>
          <span className="phonics-tab-inner">
            📊 {t("modules.evolutionCompareTab")}
            <TabSpeakIcon text={`${t("modules.evolutionCompareTab")}. ${t("modules.evolutionHelpCompare")}`} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {tab === "timeline" && (
        <>
          <p className="page-intro">
            {t("modules.evolutionExplored")}: {visited.length}/{stages.length}
          </p>
          <div className="history-timeline">
            {stages.map((stage) => {
              const isOpen = openId === stage.id;
              const isVisited = visited.includes(stage.id);
              const Illustration = stageIllustration(stage.id);
              return (
                <div key={stage.id} className={"history-era-card" + (isVisited ? " visited" : "")}>
                  <button type="button" className="history-era-header" onClick={() => toggleStage(stage)}>
                    <span className="history-year-badge">{stage.period}</span>
                    <span className="history-era-emoji">{stage.emoji}</span>
                    <span className="history-era-title">{stage.title}</span>
                    {isVisited && <span className="history-era-check">✅</span>}
                  </button>
                  {isOpen && (
                    <div className="history-era-body">
                      <div className="history-era-illustration">
                        <Illustration size={96} />
                      </div>
                      <p className="mission-text">
                        {stage.description}
                        <SpeakButton text={stage.description} langCode={pair.mother} />
                      </p>
                      <p className="mission-badge science-topic-badge">
                        🔑 {t("modules.evolutionKeyDevelopment")}: {stage.keyDevelopment}
                      </p>
                      <p className="mission-text science-try-home">
                        ✨ {t("modules.evolutionFunFact")}: {stage.funFact}
                        <SpeakButton text={`${stage.keyDevelopment} ${stage.funFact}`} langCode={pair.mother} />
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "compare" && (
        <>
          <p className="page-intro">{t("modules.evolutionCompareIntro")}</p>
          <BrainSizeChart stages={stages} pair={pair} t={t} />
          <HeightChart stages={stages} pair={pair} t={t} />
        </>
      )}
    </div>
  );
}
