import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getDetectiveCards } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";
import { useNavigate } from "react-router-dom";

// Tier -> rounds: this module only makes sense from tier 2 (age 7+) up.
const TIER_CONFIG = {
  2: { rounds: 8 },
  3: { rounds: 12 },
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

export default function Detective() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const cards = getDetectiveCards(pair.mother);

  const [rounds] = useState(() => buildRounds(cards, tier));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [confirmed, setConfirmed] = useState(tier > 1);

  if (tier === 1 && !confirmed) {
    return (
      <div className="page">
        <h1>{t("modules.detectiveTitle")} 🕵️</h1>
        <AgeAdvisory
          langCode={pair.mother}
          onAccept={() => setConfirmed(true)}
          onDecline={() => navigate("/mundos")}
        />
      </div>
    );
  }

  const round = rounds[step];
  const finished = step >= rounds.length;

  function handleAnswer(choseFact) {
    if (answered) return;
    const correct = choseFact === round.isFact;
    setAnswered({ correct, choseFact });
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "detective-fact-opinion", correct);
    pingProgress({
      profileName: profile?.name,
      module: "detective",
      event: correct ? "quiz_correct" : "quiz_wrong",
    });
  }

  function handleNext() {
    setAnswered(null);
    setStep((s) => s + 1);
  }

  function handleRestart() {
    window.location.reload();
  }

  if (!round && !finished) return null;

  return (
    <div className="page">
      <h1>{t("modules.detectiveTitle")} 🕵️</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.detectiveHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.detectiveIntro")}</p>

      {!finished ? (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          <div className="game-emoji">{round.emoji}</div>
          <p className="page-intro">
            {round.statement}
            <SpeakButton text={round.statement} langCode={pair.mother} />
          </p>

          {!answered ? (
            <div className="game-options">
              <button
                type="button"
                className="big-btn game-option"
                onClick={() => handleAnswer(true)}
              >
                ✅ {t("modules.detectiveFact")}
              </button>
              <button
                type="button"
                className="big-btn game-option"
                onClick={() => handleAnswer(false)}
              >
                💭 {t("modules.detectiveOpinion")}
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
            {t("modules.detectiveScore")}: {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={handleRestart}>
            {t("modules.detectivePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
