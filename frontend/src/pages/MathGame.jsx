import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile, getDifficultyTier, pingProgress, getLangPair } from "../storage.js";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";

// Tier -> { max: highest count/number, rounds: quiz length }
const TIER_CONFIG = {
  1: { max: 10, rounds: 5 },
  2: { max: 20, rounds: 8 },
  3: { max: 20, rounds: 10 },
};

const ARITH_CONFIG = {
  2: { max: 10, rounds: 8 },
  3: { max: 20, rounds: 10 },
};

const COUNT_EMOJI = ["🍎", "⭐", "🐣", "🎈", "🍀", "🐟", "🌸", "🚗"];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function numberOptions(correct, max, count) {
  const options = new Set([correct]);
  while (options.size < count) {
    const candidate = randInt(Math.max(1, correct - 3), Math.min(max, correct + 3));
    options.add(candidate);
  }
  return shuffle([...options]);
}

function buildCountingRounds(tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const optionCount = tier === 1 ? 3 : 4;
  const rounds = [];
  for (let i = 0; i < config.rounds; i++) {
    const correct = randInt(1, config.max);
    const emoji = COUNT_EMOJI[randInt(0, COUNT_EMOJI.length - 1)];
    rounds.push({ correct, emoji, options: numberOptions(correct, config.max, optionCount) });
  }
  return rounds;
}

function buildNumberRounds(tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const optionCount = tier === 1 ? 3 : 4;
  const rounds = [];
  for (let i = 0; i < config.rounds; i++) {
    const correct = randInt(1, config.max);
    const emoji = COUNT_EMOJI[randInt(0, COUNT_EMOJI.length - 1)];
    rounds.push({ correct, emoji, options: numberOptions(correct, config.max, optionCount) });
  }
  return rounds;
}

function buildAddSubRounds(tier) {
  const config = ARITH_CONFIG[tier] || ARITH_CONFIG[2];
  const rounds = [];
  for (let i = 0; i < config.rounds; i++) {
    const isAdd = Math.random() < 0.5;
    let a, b, correct, op;
    if (isAdd) {
      a = randInt(0, config.max - 1);
      b = randInt(0, config.max - a);
      correct = a + b;
      op = "+";
    } else {
      a = randInt(0, config.max);
      b = randInt(0, a);
      correct = a - b;
      op = "-";
    }
    rounds.push({ a, b, op, correct, options: numberOptions(correct, config.max, 4) });
  }
  return rounds;
}

function QuizRunner({ rounds, renderPrompt, moduleEvent, profile, t, onDone }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const round = rounds[step];
  const finished = step >= rounds.length;

  function handleAnswer(option) {
    if (feedback) return;
    const correct = option === round.correct;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    pingProgress({
      profileName: profile?.name,
      module: moduleEvent,
      event: correct ? "quiz_correct" : "quiz_wrong",
    });
    setTimeout(() => {
      setFeedback(null);
      setStep((s) => s + 1);
    }, 900);
  }

  function handleRestart() {
    onDone();
  }

  if (!round && !finished) return null;

  return (
    <div className="game-card">
      {!finished ? (
        <>
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          {renderPrompt(round)}
          <div className="game-options">
            {round.options.map((opt, i) => (
              <button
                key={opt + "-" + i}
                type="button"
                className={
                  "big-btn game-option" +
                  (feedback && opt === round.correct ? " correct" : "")
                }
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.mathScore")}: {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={handleRestart}>
            {t("modules.mathPlayAgain")} 🔁
          </button>
        </>
      )}
    </div>
  );
}

const HELP_KEY_BY_ACTIVITY = {
  counting: "mathHelpCounting",
  numbers: "mathHelpNumbers",
  addsub: "mathHelpAddSub",
};

export default function MathGame() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);

  const [activity, setActivity] = useState("counting");
  const [seed, setSeed] = useState(0);
  const [addSubConfirmed, setAddSubConfirmed] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);

  const tabs = [
    { key: "counting", label: t("modules.mathCounting"), emoji: "🔢" },
    { key: "numbers", label: t("modules.mathNumbers"), emoji: "🔠" },
    { key: "addsub", label: t("modules.mathAddSub"), emoji: "➕" },
  ];

  function switchActivity(key) {
    if (key === "addsub" && tier === 1 && !addSubConfirmed) {
      setShowAdvisory(true);
      return;
    }
    setActivity(key);
    setSeed((s) => s + 1);
  }

  function restart() {
    setSeed((s) => s + 1);
  }

  return (
    <div className="page">
      <h1>{t("modules.mathTitle")} 🔢</h1>
      <div className="help-btn-corner">
        <HelpButton text={t(`modules.${HELP_KEY_BY_ACTIVITY[activity]}`)} langCode={pair.mother} />
      </div>

      <div className="game-options">
        {tabs.map((tab) => (
          <div key={tab.key} className="game-option-row">
            <button
              type="button"
              className={"big-btn game-option" + (activity === tab.key ? " correct" : "")}
              onClick={() => switchActivity(tab.key)}
            >
              {tab.emoji} {tab.label}
            </button>
            <TabSpeakIcon
              text={`${tab.label}. ${t(`modules.${HELP_KEY_BY_ACTIVITY[tab.key]}`)}`}
              langCode={pair.mother}
            />
          </div>
        ))}
      </div>

      {showAdvisory && (
        <AgeAdvisory
          langCode={pair.mother}
          onAccept={() => {
            setAddSubConfirmed(true);
            setShowAdvisory(false);
            setActivity("addsub");
            setSeed((s) => s + 1);
          }}
          onDecline={() => setShowAdvisory(false)}
        />
      )}

      {activity === "counting" && (
        <QuizRunner
          key={"counting-" + seed}
          rounds={buildCountingRounds(tier)}
          profile={profile}
          t={t}
          moduleEvent="math_counting"
          onDone={restart}
          renderPrompt={(round) => (
            <div className="game-emoji">{round.emoji.repeat(round.correct)}</div>
          )}
        />
      )}

      {activity === "numbers" && (
        <QuizRunner
          key={"numbers-" + seed}
          rounds={buildNumberRounds(tier)}
          profile={profile}
          t={t}
          moduleEvent="math_numbers"
          onDone={restart}
          renderPrompt={(round) => (
            <div className="game-emoji">{round.emoji.repeat(round.correct)}</div>
          )}
        />
      )}

      {activity === "addsub" && (
        <QuizRunner
          key={"addsub-" + seed}
          rounds={buildAddSubRounds(tier)}
          profile={profile}
          t={t}
          moduleEvent="math_addsub"
          onDone={restart}
          renderPrompt={(round) => (
            <div className="game-emoji math-expression">
              {round.a} {round.op} {round.b} = ?
            </div>
          )}
        />
      )}
    </div>
  );
}
