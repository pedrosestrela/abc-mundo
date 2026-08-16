import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTechHistory } from "../content/index.js";
import { getLangPair, getProfile, getVisitedTechHistoryStages, visitTechHistoryStage, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import {
  IllustrationCarriage,
  IllustrationEarlyCar,
  IllustrationClassicCar,
  IllustrationModernCar,
  IllustrationElectricCar,
  IllustrationCandle,
  IllustrationVoltaPile,
  IllustrationLightbulb,
  IllustrationCityLights,
  IllustrationLedBulb,
  IllustrationHydroDam,
  IllustrationWindTurbine,
  IllustrationSolarPanel,
  IllustrationPowerPlant,
  IllustrationNuclearPlant,
} from "../components/illustrations/techHistory.jsx";

// Picks which hand-authored illustration best matches a given stage id, one
// mapping per topic so every card gets a relevant visual.
const AUTOMOBILE_ILLUSTRATIONS = {
  carruagens: IllustrationCarriage,
  "primeiros-prototipos": IllustrationEarlyCar,
  "ford-t": IllustrationClassicCar,
  "carros-modernos": IllustrationModernCar,
  "carros-eletricos": IllustrationElectricCar,
};
const ELECTRICITY_ILLUSTRATIONS = {
  "velas-candeeiros": IllustrationCandle,
  "primeiras-experiencias": IllustrationVoltaPile,
  "lampada-eletrica": IllustrationLightbulb,
  eletrificacao: IllustrationCityLights,
  "led-hoje": IllustrationLedBulb,
};
const PRODUCTION_ILLUSTRATIONS = {
  hidroeletrica: IllustrationHydroDam,
  eolica: IllustrationWindTurbine,
  solar: IllustrationSolarPanel,
  termica: IllustrationPowerPlant,
  nuclear: IllustrationNuclearPlant,
};

const TOPICS = [
  { id: "automobile", icon: "🚗", illustrations: AUTOMOBILE_ILLUSTRATIONS },
  { id: "electricity", icon: "💡", illustrations: ELECTRICITY_ILLUSTRATIONS },
  { id: "production", icon: "🔌", illustrations: PRODUCTION_ILLUSTRATIONS },
];

export default function TechHistory() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const content = useMemo(() => getTechHistory(pair.mother), [pair.mother]);

  const [tab, setTab] = useState("automobile");
  const [openId, setOpenId] = useState(null);
  const [productionFilter, setProductionFilter] = useState("all");
  const [visitedVersion, setVisitedVersion] = useState(0);

  const activeTopic = TOPICS.find((topic) => topic.id === tab);
  const stages = content[tab] || [];
  const visited = useMemo(
    () => getVisitedTechHistoryStages(profile?.name, tab),
    [profile?.name, tab, visitedVersion]
  );

  const helpKeyByTab = {
    automobile: "techHistoryHelpCar",
    electricity: "techHistoryHelpLight",
    production: "techHistoryHelpEnergy",
  };
  const tabLabelKeyByTab = {
    automobile: "techHistoryCarTab",
    electricity: "techHistoryLightTab",
    production: "techHistoryEnergyTab",
  };

  function switchTab(nextTab) {
    setTab(nextTab);
    setOpenId(null);
    setProductionFilter("all");
  }

  function toggleStage(stage) {
    const opening = openId !== stage.id;
    setOpenId(opening ? stage.id : null);
    if (opening) {
      visitTechHistoryStage(profile?.name, tab, stage.id);
      pingProgress({ profileName: profile?.name, module: "tech-history", event: `${tab}_stage_visited:${stage.id}` });
      recordSkillEvent(profile?.name, "tech-history-stage-viewed", true);
      setVisitedVersion((v) => v + 1);
    }
  }

  const visibleStages =
    tab === "production" && productionFilter !== "all"
      ? stages.filter((s) => (productionFilter === "renewable" ? s.renewable : !s.renewable))
      : stages;

  return (
    <div className="page">
      <h1>{t("modules.techHistoryTitle")} 🔧</h1>
      <div className="help-btn-corner">
        <HelpButton text={t(`modules.${helpKeyByTab[tab]}`)} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.techHistoryIntro")}</p>
      <MascotBubble character="vasco" mood="happy" langCode={pair.mother}>
        {t("modules.techHistoryMascotIntro")}
      </MascotBubble>

      <div className="phonics-tabs">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className={"phonics-tab" + (tab === topic.id ? " selected" : "")}
            onClick={() => switchTab(topic.id)}
          >
            <span className="phonics-tab-inner">
              {topic.icon} {t(`modules.${tabLabelKeyByTab[topic.id]}`)}
              <TabSpeakIcon
                text={`${t(`modules.${tabLabelKeyByTab[topic.id]}`)}. ${t(`modules.${helpKeyByTab[topic.id]}`)}`}
                langCode={pair.mother}
              />
            </span>
          </button>
        ))}
      </div>

      <p className="page-intro">
        {t("modules.evolutionExplored")}: {visited.length}/{stages.length}
      </p>

      {tab === "production" && (
        <div className="phonics-tabs">
          <button
            type="button"
            className={"phonics-tab" + (productionFilter === "all" ? " selected" : "")}
            onClick={() => setProductionFilter("all")}
          >
            <span className="phonics-tab-inner">🔌 {t("modules.techHistoryFilterAll")}</span>
          </button>
          <button
            type="button"
            className={"phonics-tab" + (productionFilter === "renewable" ? " selected" : "")}
            onClick={() => setProductionFilter("renewable")}
          >
            <span className="phonics-tab-inner">🌱 {t("modules.techHistoryFilterRenewable")}</span>
          </button>
          <button
            type="button"
            className={"phonics-tab" + (productionFilter === "nonRenewable" ? " selected" : "")}
            onClick={() => setProductionFilter("nonRenewable")}
          >
            <span className="phonics-tab-inner">🪨 {t("modules.techHistoryFilterNonRenewable")}</span>
          </button>
        </div>
      )}

      {tab === "production" && <p className="page-intro">{t("modules.techHistoryEnergyIntro")}</p>}

      <div className="history-timeline">
        {visibleStages.map((stage) => {
          const isOpen = openId === stage.id;
          const isVisited = visited.includes(stage.id);
          const Illustration = activeTopic.illustrations[stage.id];
          return (
            <div key={stage.id} className={"history-era-card" + (isVisited ? " visited" : "")}>
              <button type="button" className="history-era-header" onClick={() => toggleStage(stage)}>
                {stage.period && <span className="history-year-badge">{stage.period}</span>}
                <span className="history-era-emoji">{stage.emoji}</span>
                <span className="history-era-title">{stage.title}</span>
                {tab === "production" && (
                  <span className="mission-badge science-topic-badge">
                    {stage.renewable ? `🌱 ${t("modules.techHistoryRenewableLabel")}` : `🪨 ${t("modules.techHistoryNonRenewableLabel")}`}
                  </span>
                )}
                {isVisited && <span className="history-era-check">✅</span>}
              </button>
              {isOpen && (
                <div className="history-era-body">
                  {Illustration && (
                    <div className="history-era-illustration">
                      <Illustration size={96} />
                    </div>
                  )}
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
    </div>
  );
}
