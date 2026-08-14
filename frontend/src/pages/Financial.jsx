import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFinancial } from "../content/index.js";
import { getDifficultyTier, getLangPair, getProfile, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

// Coin values used to build quiz rounds. Plain emoji + label, no real
// currency imagery needed.
const COINS = [
  { id: "1c", label: "1c", value: 1 },
  { id: "2c", label: "2c", value: 2 },
  { id: "5c", label: "5c", value: 5 },
  { id: "10c", label: "10c", value: 10 },
  { id: "20c", label: "20c", value: 20 },
  { id: "50c", label: "50c", value: 50 },
  { id: "1e", label: "1€", value: 100 },
  { id: "2e", label: "2€", value: 200 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatValue(cents) {
  if (cents >= 100 && cents % 100 === 0) return `${cents / 100}€`;
  if (cents >= 100) return `${(cents / 100).toFixed(2)}€`;
  return `${cents}c`;
}

function pickOptions(correctCoin, pool, count) {
  const others = shuffle(pool.filter((c) => c.id !== correctCoin.id)).slice(0, count - 1);
  return shuffle([correctCoin, ...others]);
}

// Builds one round of the coin game depending on the child's age tier.
// Tier 1: recognize a single coin's value among distractors.
// Tier 2-3: sum two coins and pick the matching total.
function buildRound(tier) {
  if (tier === 1) {
    const correct = COINS[Math.floor(Math.random() * COINS.length)];
    const options = pickOptions(correct, COINS, 3).map((c) => ({ key: c.id, label: c.label, correct: c.id === correct.id }));
    return { prompt: { emoji: "🪙", label: correct.label }, options, questionKind: "single" };
  }
  const pool = tier === 2 ? COINS.slice(0, 6) : COINS;
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while (b.id === a.id && guard < 10) {
    b = pool[Math.floor(Math.random() * pool.length)];
    guard += 1;
  }
  const total = a.value + b.value;
  const correctLabel = formatValue(total);
  const distractors = new Set();
  while (distractors.size < 2) {
    const delta = [10, 20, 50, -10, -20][Math.floor(Math.random() * 5)];
    const candidate = Math.max(1, total + delta);
    const candidateLabel = formatValue(candidate);
    if (candidateLabel !== correctLabel) distractors.add(candidateLabel);
  }
  const options = shuffle([correctLabel, ...distractors]).map((label) => ({
    key: label,
    label,
    correct: label === correctLabel,
  }));
  return { prompt: { emoji: "🪙", coins: [a, b] }, options, questionKind: "sum" };
}

const ROUNDS_PER_GAME = 6;

export default function Financial() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);

  const motherConcepts = getFinancial(pair.mother);
  const secondaryConcepts = getFinancial(pair.secondary);
  const conceptCount = Math.min(motherConcepts.length, secondaryConcepts.length);

  const [round, setRound] = useState(() => buildRound(tier));
  const [roundIndex, setRoundIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);

  const gameOver = finished || roundIndex > ROUNDS_PER_GAME;

  function handleViewConcept(concept) {
    pingProgress({ profileName: profile?.name, module: "financial", event: `concept_viewed:${concept.id}` });
  }

  function handleAnswer(option) {
    if (feedback) return;
    setFeedback(option.correct ? "correct" : "wrong");
    if (option.correct) setScore((s) => s + 1);
    pingProgress({
      profileName: profile?.name,
      module: "financial",
      event: `coin_answer:${option.correct ? "correct" : "wrong"}`,
    });
    setTimeout(() => {
      setFeedback(null);
      if (roundIndex >= ROUNDS_PER_GAME) {
        setFinished(true);
      } else {
        setRoundIndex((i) => i + 1);
        setRound(buildRound(tier));
      }
    }, 700);
  }

  function handlePlayAgain() {
    setScore(0);
    setRoundIndex(1);
    setFinished(false);
    setFeedback(null);
    setRound(buildRound(tier));
  }

  const promptCoins = useMemo(() => round.prompt.coins, [round]);

  return (
    <div className="page">
      <h1>{t("modules.financialTitle")} 💰</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.financialHelp")} langCode={pair.mother} />
      </div>

      <h2 className="section-title">{t("modules.financialConcepts")}</h2>
      <div className="reading-list">
        {Array.from({ length: conceptCount }).map((_, i) => {
          const m = motherConcepts[i];
          const s = secondaryConcepts[i];
          return (
            <div className="reading-card" key={m.id} onClick={() => handleViewConcept(m)}>
              <div className="reading-emoji">{m.emoji}</div>
              <div className="reading-words">
                <div className="reading-word-row">
                  <span className="reading-word">{m.concept}</span>
                  <SpeakButton text={`${m.concept}. ${m.explanation}`} langCode={pair.mother} />
                </div>
                <p className="financial-explanation">{m.explanation}</p>
                <div className="reading-word-row secondary">
                  <span className="reading-word">{s.concept}</span>
                  <SpeakButton text={`${s.concept}. ${s.explanation}`} langCode={pair.secondary} />
                </div>
                <p className="financial-explanation secondary">{s.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">{t("modules.financialCoinGame")} 🪙</h2>
      <div className="game-card">
        {gameOver ? (
          <div className="game-result">
            <p className="game-score">
              {t("modules.financialScore")}: {score} / {ROUNDS_PER_GAME}
            </p>
            <button type="button" className="big-btn" onClick={handlePlayAgain}>
              {t("modules.financialPlayAgain")}
            </button>
          </div>
        ) : (
          <>
            <div className="game-progress">
              {roundIndex} / {ROUNDS_PER_GAME} · {t("modules.financialScore")}: {score}
            </div>
            <div className="game-prompt">
              {round.questionKind === "single" ? (
                <div className="coin-display">
                  <span className="coin-emoji">{round.prompt.emoji}</span>
                  <span className="coin-label">{round.prompt.label}</span>
                </div>
              ) : (
                <div className="coin-display">
                  {promptCoins.map((c, idx) => (
                    <span className="coin-pair" key={idx}>
                      <span className="coin-emoji">🪙</span>
                      <span className="coin-label">{c.label}</span>
                      {idx === 0 && <span className="coin-plus">+</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="game-options">
              {round.options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`game-option-btn${feedback && opt.correct ? " correct" : ""}`}
                  disabled={!!feedback}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {feedback && (
              <p className={`game-feedback ${feedback}`}>{feedback === "correct" ? "✅" : "❌"}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
