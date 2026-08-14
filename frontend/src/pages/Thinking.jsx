import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getThinking } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getDifficultyTier,
  recordSkillEvent,
  pingProgress,
  getCompletedThinking,
  completeThinkingExercise,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";

// This module leans on reading comprehension and abstract reasoning, so
// (like Detective) it only really makes sense from tier 2 (age 7+) up.
// Tier 3 gets the full item pool, tier 2 a shorter one.
const TIER_CONFIG = {
  2: { count: 4 },
  3: { count: 6 },
};

const TYPES = [
  { key: "factOrAssumption", emoji: "🔍" },
  { key: "causeOrCoincidence", emoji: "🔗" },
  { key: "missingInfo", emoji: "🧩" },
  { key: "contradictions", emoji: "⚖️" },
  { key: "estimation", emoji: "📐" },
  { key: "puzzles", emoji: "💡" },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRounds(items, tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[2];
  const count = Math.min(config.count, items.length);
  return shuffle(items).slice(0, count);
}

export default function Thinking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const content = getThinking(pair.mother);
  const [confirmed, setConfirmed] = useState(tier > 1);
  const [activeType, setActiveType] = useState(null);
  const [completedVersion, setCompletedVersion] = useState(0);
  const completed = useMemo(() => getCompletedThinking(profile?.name), [profile?.name, completedVersion]);

  if (tier === 1 && !confirmed) {
    return (
      <div className="page">
        <h1>{t("modules.thinkingTitle")} 🧠</h1>
        <AgeAdvisory
          langCode={pair.mother}
          onAccept={() => setConfirmed(true)}
          onDecline={() => navigate("/mundos")}
        />
      </div>
    );
  }

  if (activeType) {
    return (
      <ExerciseRunner
        typeKey={activeType}
        items={content[activeType] || []}
        tier={tier}
        pair={pair}
        profile={profile}
        onExit={() => {
          setActiveType(null);
          setCompletedVersion((v) => v + 1);
        }}
      />
    );
  }

  return (
    <div className="page">
      <h1>{t("modules.thinkingTitle")} 🧠</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.thinkingHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.thinkingIntro")}</p>
      <div className="whys-progress">
        {t("modules.thinkingCompleted")}: {completed.length}
      </div>
      <div className="mundos-tile-grid">
        {TYPES.map((type) => {
          const count = (content[type.key] || []).length;
          return (
            <button
              key={type.key}
              type="button"
              className="mission-card mundos-tile"
              onClick={() => setActiveType(type.key)}
            >
              <div className="mission-emoji">{type.emoji}</div>
              <div className="mission-text">{t(`modules.thinking_${type.key}_Title`)}</div>
              <div className="mundos-tile-sub">
                {t(`modules.thinking_${type.key}_Sub`)} · {count}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseRunner({ typeKey, items, tier, pair, profile, onExit }) {
  const { t } = useTranslation();
  const [rounds] = useState(() => buildRounds(items, tier));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);

  const round = rounds[step];
  const finished = step >= rounds.length;

  function markDone(round, correct) {
    completeThinkingExercise(profile?.name, round.id);
    recordSkillEvent(profile?.name, `thinking-${typeKey}`, correct);
    pingProgress({
      profileName: profile?.name,
      module: "thinking",
      event: `${typeKey}:${correct ? "correct" : "wrong"}:${round.id}`,
    });
  }

  function handleNext() {
    setAnswered(null);
    setStep((s) => s + 1);
  }

  if (!round && !finished) return null;

  return (
    <div className="page">
      <h1>
        {t("modules.thinkingTitle")} {TYPES.find((ty) => ty.key === typeKey)?.emoji}
      </h1>
      <div className="help-btn-corner">
        <HelpButton text={t(`modules.thinking_${typeKey}_Help`)} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t(`modules.thinking_${typeKey}_Title`)}</p>

      {!finished ? (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>

          {typeKey === "factOrAssumption" && (
            <FactOrAssumptionRound
              round={round}
              answered={answered}
              pair={pair}
              onAnswer={(choseFact) => {
                if (answered) return;
                const correct = choseFact === round.isFact;
                setAnswered({ correct });
                if (correct) setScore((s) => s + 1);
                markDone(round, correct);
              }}
            />
          )}

          {typeKey === "causeOrCoincidence" && (
            <CauseOrCoincidenceRound
              round={round}
              answered={answered}
              pair={pair}
              onAnswer={(choseCause) => {
                if (answered) return;
                const correct = choseCause === round.isCause;
                setAnswered({ correct });
                if (correct) setScore((s) => s + 1);
                markDone(round, correct);
              }}
            />
          )}

          {typeKey === "missingInfo" && (
            <MissingInfoRound
              round={round}
              answered={answered}
              pair={pair}
              onAnswer={(opt) => {
                if (answered) return;
                const correct = !!opt.correct;
                setAnswered({ correct });
                if (correct) setScore((s) => s + 1);
                markDone(round, correct);
              }}
            />
          )}

          {typeKey === "contradictions" && (
            <ContradictionRound
              round={round}
              answered={answered}
              pair={pair}
              onAnswer={(choseContradicts) => {
                if (answered) return;
                const correct = choseContradicts === round.contradicts;
                setAnswered({ correct });
                if (correct) setScore((s) => s + 1);
                markDone(round, correct);
              }}
            />
          )}

          {typeKey === "estimation" && (
            <EstimationRound
              round={round}
              answered={answered}
              pair={pair}
              onAnswer={(guess) => {
                if (answered) return;
                const diff = Math.abs(Number(guess) - round.answer);
                const correct = diff <= round.tolerance;
                setAnswered({ correct, guess });
                if (correct) setScore((s) => s + 1);
                markDone(round, correct);
              }}
            />
          )}

          {typeKey === "puzzles" && (
            <PuzzleRound
              round={round}
              answered={answered}
              pair={pair}
              onReveal={() => {
                if (answered) return;
                setAnswered({ correct: true });
                setScore((s) => s + 1);
                markDone(round, true);
              }}
            />
          )}

          {answered && (
            <button type="button" className="big-btn" onClick={handleNext}>
              ➡️
            </button>
          )}
        </div>
      ) : (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.thinkingScore")}: {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={onExit}>
            {t("modules.thinkingBackToMenu")} 🧠
          </button>
        </div>
      )}
    </div>
  );
}

function FactOrAssumptionRound({ round, answered, pair, onAnswer }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="game-emoji">{round.emoji}</div>
      <p className="page-intro">
        {round.scenario}
        <SpeakButton text={round.scenario} langCode={pair.mother} />
      </p>
      <p className="mission-text">
        {round.statement}
        <SpeakButton text={round.statement} langCode={pair.mother} />
      </p>
      {!answered ? (
        <div className="game-options">
          <button type="button" className="big-btn game-option" onClick={() => onAnswer(true)}>
            ✅ {t("modules.thinkingWeKnow")}
          </button>
          <button type="button" className="big-btn game-option" onClick={() => onAnswer(false)}>
            💭 {t("modules.thinkingWeGuess")}
          </button>
        </div>
      ) : (
        <p className="game-result">
          {answered.correct ? "⭐" : "🤔"} {round.explanation}
          <SpeakButton text={round.explanation} langCode={pair.mother} />
        </p>
      )}
    </>
  );
}

function CauseOrCoincidenceRound({ round, answered, pair, onAnswer }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="game-emoji">{round.emoji}</div>
      <p className="page-intro">
        {round.scenario}
        <SpeakButton text={round.scenario} langCode={pair.mother} />
      </p>
      {!answered ? (
        <div className="game-options">
          <button type="button" className="big-btn game-option" onClick={() => onAnswer(true)}>
            🔗 {t("modules.thinkingCause")}
          </button>
          <button type="button" className="big-btn game-option" onClick={() => onAnswer(false)}>
            🎲 {t("modules.thinkingCoincidence")}
          </button>
        </div>
      ) : (
        <p className="game-result">
          {answered.correct ? "⭐" : "🤔"} {round.explanation}
          <SpeakButton text={round.explanation} langCode={pair.mother} />
        </p>
      )}
    </>
  );
}

function MissingInfoRound({ round, answered, pair, onAnswer }) {
  return (
    <>
      <div className="game-emoji">{round.emoji}</div>
      <p className="page-intro">
        {round.scenario}
        <SpeakButton text={round.scenario} langCode={pair.mother} />
      </p>
      <p className="mission-text">
        {round.question}
        <SpeakButton text={round.question} langCode={pair.mother} />
      </p>
      {!answered ? (
        <div className="game-options">
          {round.options.map((opt) => (
            <button
              key={opt.text}
              type="button"
              className="big-btn game-option"
              onClick={() => onAnswer(opt)}
            >
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        <p className="game-result">
          {answered.correct ? "⭐" : "🤔"} {round.afterNote}
          <SpeakButton text={round.afterNote} langCode={pair.mother} />
        </p>
      )}
    </>
  );
}

function ContradictionRound({ round, answered, pair, onAnswer }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="game-emoji">{round.emoji}</div>
      <p className="mission-text">
        1. {round.statementA}
        <SpeakButton text={round.statementA} langCode={pair.mother} />
      </p>
      <p className="mission-text">
        2. {round.statementB}
        <SpeakButton text={round.statementB} langCode={pair.mother} />
      </p>
      {!answered ? (
        <div className="game-options">
          <button type="button" className="big-btn game-option" onClick={() => onAnswer(true)}>
            ⚠️ {t("modules.thinkingContradicts")}
          </button>
          <button type="button" className="big-btn game-option" onClick={() => onAnswer(false)}>
            👍 {t("modules.thinkingNoContradiction")}
          </button>
        </div>
      ) : (
        <p className="game-result">
          {answered.correct ? "⭐" : "🤔"} {round.explanation}
          <SpeakButton text={round.explanation} langCode={pair.mother} />
        </p>
      )}
    </>
  );
}

function EstimationRound({ round, answered, pair, onAnswer }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  return (
    <>
      <div className="game-emoji">{round.emoji}</div>
      <p className="page-intro">
        {round.question}
        <SpeakButton text={round.question} langCode={pair.mother} />
      </p>
      {!answered ? (
        <div className="game-options">
          <input
            type="number"
            className="big-btn"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={round.unit}
          />
          <button
            type="button"
            className="big-btn game-option"
            onClick={() => onAnswer(value === "" ? NaN : value)}
          >
            ✅ {t("modules.thinkingSubmit")}
          </button>
        </div>
      ) : (
        <p className="game-result">
          {answered.correct ? "⭐ " + t("modules.thinkingCloseEnough") : "🤔"}{" "}
          {t("modules.thinkingRealAnswer")}: {round.answer} {round.unit}
        </p>
      )}
    </>
  );
}

function PuzzleRound({ round, answered, pair, onReveal }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="game-emoji">{round.emoji}</div>
      <p className="page-intro">
        {round.prompt}
        <SpeakButton text={round.prompt} langCode={pair.mother} />
      </p>
      {!answered ? (
        <button type="button" className="big-btn" onClick={onReveal}>
          💡 {t("modules.thinkingSeeIdeas")}
        </button>
      ) : (
        <ul className="mundos-tile-sub">
          {round.examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ul>
      )}
    </>
  );
}
