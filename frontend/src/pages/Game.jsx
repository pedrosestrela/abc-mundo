import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getReading } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, pingProgress } from "../storage.js";

// Tier -> { poolSize: how many words to draw questions from, rounds: quiz length }
const TIER_CONFIG = {
  1: { poolSize: 8, rounds: 5 },
  2: { poolSize: 16, rounds: 8 },
  3: { poolSize: 22, rounds: 10 },
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRounds(words, tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const pool = words.slice(0, Math.min(config.poolSize, words.length));
  const rounds = [];
  const count = Math.min(config.rounds, pool.length);
  const shuffled = shuffle(pool);
  for (let i = 0; i < count; i++) {
    const correct = shuffled[i];
    const distractors = shuffle(pool.filter((w) => w.word !== correct.word)).slice(0, 2);
    rounds.push({ correct, options: shuffle([correct, ...distractors]) });
  }
  return rounds;
}

export default function Game() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const words = getReading(pair.mother);

  const [rounds] = useState(() => buildRounds(words, tier));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const round = rounds[step];
  const finished = step >= rounds.length;

  function handleAnswer(option) {
    if (feedback) return;
    const correct = option.word === round.correct.word;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    pingProgress({
      profileName: profile?.name,
      module: "game",
      event: correct ? "quiz_correct" : "quiz_wrong",
    });
    setTimeout(() => {
      setFeedback(null);
      setStep((s) => s + 1);
    }, 900);
  }

  function handleRestart() {
    window.location.reload();
  }

  if (!round && !finished) return null;

  return (
    <div className="page">
      <h1>{t("modules.gameTitle")} 🎮</h1>

      {!finished ? (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          <div className="game-emoji">{round.correct.emoji}</div>
          <p className="page-intro">{t("modules.gamePrompt")}</p>
          <div className="game-options">
            {round.options.map((opt) => (
              <button
                key={opt.word}
                type="button"
                className={
                  "big-btn game-option" +
                  (feedback && opt.word === round.correct.word ? " correct" : "") +
                  (feedback === "wrong" && opt.word !== round.correct.word ? "" : "")
                }
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
              >
                {opt.word}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.gameScore")}: {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={handleRestart}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}
