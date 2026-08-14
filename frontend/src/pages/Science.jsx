import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getScience } from "../content/index.js";
import { getLangPair, getProfile, getExploredScience, exploreScienceCard, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

const TOPIC_ICONS = {
  biology: "🧬",
  physics: "⚙️",
  chemistry: "🧪",
  earth: "🌍",
};

export default function Science() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const cards = getScience(pair.mother);
  const [openId, setOpenId] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [version, setVersion] = useState(0);

  const explored = useMemo(() => getExploredScience(profile?.name), [profile?.name, version]);

  function handleOpen(card) {
    setOpenId(card.id === openId ? null : card.id);
    setPrediction(null);
  }

  function handlePredict(card, option) {
    if (prediction) return;
    setPrediction(option);
    exploreScienceCard(profile?.name, card.id);
    recordSkillEvent(profile?.name, "science-" + card.topic, true);
    pingProgress({ profileName: profile?.name, module: "science", event: `experiment_explored:${card.id}` });
    setVersion((v) => v + 1);
  }

  return (
    <div className="page">
      <h1>{t("modules.scienceTitle")} 🔬</h1>
      <p className="page-intro">{t("modules.scienceIntro")}</p>

      <h2 className="songs-heading">
        {t("modules.scienceExplored")} ({explored.length}/{cards.length})
      </h2>

      {cards.map((card) => {
        const isOpen = openId === card.id;
        const wasExplored = explored.includes(card.id);
        return (
          <div key={card.id} className={"game-card science-card" + (wasExplored ? " done" : "")}>
            <div className="mission-badge science-topic-badge">
              {TOPIC_ICONS[card.topic] || "🔬"} {card.topic}
            </div>
            <div className="game-emoji">{card.emoji}</div>
            <p className="mission-text">
              {card.question}
              <SpeakButton text={card.question} langCode={pair.mother} />
            </p>

            {!isOpen && (
              <button type="button" className="big-btn" onClick={() => handleOpen(card)}>
                🔎 {t("modules.sciencePredict")}
              </button>
            )}

            {isOpen && !prediction && (
              <div className="game-options">
                {card.prediction_options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="big-btn game-option"
                    onClick={() => handlePredict(card, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {isOpen && prediction && (
              <div className="science-explanation">
                <p className="game-result">💡 {card.explanation}</p>
                <p className="mission-text science-try-home">
                  🏠 {t("modules.scienceTryAtHome")}: {card.tryAtHome}
                </p>
                <SpeakButton text={`${card.explanation} ${card.tryAtHome}`} langCode={pair.mother} />
                <div>
                  <button type="button" className="big-btn" onClick={() => handleOpen(card)}>
                    ➡️
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
