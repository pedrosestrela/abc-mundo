import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getComputing, getComputingSafety } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getDifficultyTier,
  getExploredComputing,
  exploreComputingCard,
  recordSkillEvent,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";

const TOPIC_ICONS = {
  hardware: "🔧",
  software: "💽",
  internet: "🌐",
  safety: "🛡️",
};

// Tier -> rounds: the safety quiz only makes sense from tier 2 (age 7+) up.
const TIER_CONFIG = {
  2: { rounds: 8 },
  3: { rounds: 9 },
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRounds(cards, tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[2];
  const count = Math.min(config.rounds, cards.length);
  return shuffle(cards).slice(0, count);
}

export default function Computing() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const cards = getComputing(pair.mother);
  const safetyCards = getComputingSafety(pair.mother);

  const [openId, setOpenId] = useState(null);
  const [version, setVersion] = useState(0);
  const explored = useMemo(() => getExploredComputing(profile?.name), [profile?.name, version]);

  const [rounds] = useState(() => buildRounds(safetyCards, tier));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [safetyConfirmed, setSafetyConfirmed] = useState(tier > 1);
  const [showAdvisory, setShowAdvisory] = useState(false);

  function handleOpen(card) {
    const nowOpen = card.id !== openId;
    setOpenId(nowOpen ? card.id : null);
    if (nowOpen) {
      exploreComputingCard(profile?.name, card.id);
      recordSkillEvent(profile?.name, "computing-" + card.topic, true);
      pingProgress({ profileName: profile?.name, module: "computing", event: `concept_explored:${card.id}` });
      setVersion((v) => v + 1);
    }
  }

  function handleAnswer(choseSafe) {
    if (answered) return;
    const round = rounds[step];
    const correct = choseSafe === round.isSafe;
    setAnswered({ correct, choseSafe });
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "computing-safety", correct);
    pingProgress({
      profileName: profile?.name,
      module: "computing",
      event: correct ? "safety_quiz_correct" : "safety_quiz_wrong",
    });
  }

  function handleNext() {
    setAnswered(null);
    setStep((s) => s + 1);
  }

  function handleRestart() {
    window.location.reload();
  }

  const round = rounds[step];
  const finished = step >= rounds.length;

  return (
    <div className="page">
      <h1>{t("modules.computingTitle")} 💻</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.computingHelpConcepts")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.computingIntro")}</p>

      <h2 className="songs-heading">🧠 {t("modules.computingConcepts")}</h2>
      <h3 className="songs-heading">
        {t("modules.computingExplored")} ({explored.length}/{cards.length})
      </h3>

      <div className="computing-grid">
        {cards.map((card) => {
          const wasExplored = explored.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={"computing-term-btn" + (wasExplored ? " done" : "")}
              onClick={() => handleOpen(card)}
            >
              <span className="computing-term-emoji">{card.emoji}</span>
              {card.term}
            </button>
          );
        })}
      </div>

      {cards
        .filter((card) => card.id === openId)
        .map((card) => (
          <div key={card.id} className={"game-card computing-card done"}>
            <div className="mission-badge computing-topic-badge">
              {TOPIC_ICONS[card.topic] || "💻"} {card.topic}
            </div>
            <div className="game-emoji">{card.emoji}</div>
            <p className="mission-text">{card.term}</p>
            <div className="computing-explanation">
              <p className="game-result">{card.explanation}</p>
              <SpeakButton text={card.explanation} langCode={pair.mother} />
            </div>
            <div>
              <button type="button" className="big-btn" onClick={() => handleOpen(card)}>
                ✅
              </button>
            </div>
          </div>
        ))}

      <h2 className="songs-heading">🕵️ {t("modules.computingSafetyGame")}</h2>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.computingHelpSafety")} langCode={pair.mother} />
      </div>

      {showAdvisory && (
        <AgeAdvisory
          langCode={pair.mother}
          onAccept={() => {
            setSafetyConfirmed(true);
            setShowAdvisory(false);
          }}
          onDecline={() => setShowAdvisory(false)}
        />
      )}

      {tier === 1 && !safetyConfirmed ? (
        <div className="game-card">
          <div className="game-emoji">🕵️</div>
          <button type="button" className="big-btn" onClick={() => setShowAdvisory(true)}>
            ▶️ {t("modules.computingSafetyGame")}
          </button>
        </div>
      ) : !finished ? (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          <div className="game-emoji">{round.emoji}</div>
          <p className="page-intro">
            {round.scenario}
            <SpeakButton text={round.scenario} langCode={pair.mother} />
          </p>

          {!answered ? (
            <div className="game-options">
              <button type="button" className="big-btn game-option" onClick={() => handleAnswer(true)}>
                {t("modules.computingSafe")}
              </button>
              <button type="button" className="big-btn game-option" onClick={() => handleAnswer(false)}>
                {t("modules.computingAskAdult")}
              </button>
            </div>
          ) : (
            <div className="game-card">
              <p className="game-result">
                {answered.correct ? "⭐" : "🤔"} {round.explanation}
                <SpeakButton text={round.explanation} langCode={pair.mother} />
              </p>
              <button type="button" className="big-btn" onClick={handleNext}>
                ➡️
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.computingScore")}: {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={handleRestart}>
            {t("modules.computingPlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
