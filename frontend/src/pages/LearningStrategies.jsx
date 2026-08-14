import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLearningStrategies } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  recordSkillEvent,
  pingProgress,
  getCompletedLearningActivities,
  completeLearningActivity,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";

const TABS = [
  { key: "memory", emoji: "🧠" },
  { key: "attention", emoji: "🔍" },
  { key: "error", emoji: "💡" },
  { key: "strategy", emoji: "🧭" },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function LearningStrategies() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const content = getLearningStrategies(pair.mother);

  const [tab, setTab] = useState("memory");
  const [version, setVersion] = useState(0);
  const completed = useMemo(
    () => getCompletedLearningActivities(profile?.name),
    [profile?.name, version]
  );

  function markDone(activityKey, id) {
    const fullId = `${activityKey}:${id}`;
    completeLearningActivity(profile?.name, fullId);
    recordSkillEvent(profile?.name, `learning-${activityKey}`, true);
    pingProgress({
      profileName: profile?.name,
      module: "learningStrategies",
      event: `${activityKey}_done:${id}`,
    });
    setVersion((v) => v + 1);
  }

  return (
    <div className="page">
      <h1>{t("modules.learningStrategiesTitle")} 🧠✨</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.learningStrategiesHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.learningStrategiesIntro")}</p>
      <div className="whys-progress">
        {t("modules.learningStrategiesCompleted")}: {completed.length}
      </div>

      <div className="phonics-tabs">
        {TABS.map((tabInfo) => (
          <button
            key={tabInfo.key}
            type="button"
            className={"phonics-tab" + (tab === tabInfo.key ? " selected" : "")}
            onClick={() => setTab(tabInfo.key)}
          >
            <span className="phonics-tab-inner">
              {tabInfo.emoji} {t(`modules.learningStrategiesTab_${tabInfo.key}`)}
            </span>
            <TabSpeakIcon
              text={`${t(`modules.learningStrategiesTab_${tabInfo.key}`)}. ${t(`modules.learningStrategiesTabDesc_${tabInfo.key}`)}`}
              langCode={pair.mother}
            />
          </button>
        ))}
      </div>

      {tab === "memory" && (
        <MemoryActivity
          items={content.memory}
          teachback={content.teachback}
          pair={pair}
          onComplete={(id) => markDone("memory", id)}
        />
      )}
      {tab === "attention" && (
        <AttentionActivity
          items={content.attention}
          teachback={content.teachback}
          pair={pair}
          onComplete={(id) => markDone("attention", id)}
        />
      )}
      {tab === "error" && (
        <ErrorActivity
          items={content.errors}
          teachback={content.teachback}
          pair={pair}
          onComplete={(id) => markDone("error", id)}
        />
      )}
      {tab === "strategy" && (
        <StrategyActivity
          items={content.strategy}
          teachback={content.teachback}
          pair={pair}
          onComplete={(id) => markDone("strategy", id)}
        />
      )}
    </div>
  );
}

// A small, reusable "agora explica-me tu" teach-back consolidation card.
// Lightweight by design: no grading pressure beyond a gentle nudge - the
// pedagogical value is in prompting the reflection, not scoring it.
function TeachBackCard({ item, pair, onFinish }) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState(null);

  if (!item) return null;

  return (
    <div className="game-card">
      <div className="game-emoji">🗣️</div>
      <p className="mission-text">{t("modules.learningStrategiesTeachBackTitle")}</p>
      <p className="page-intro">
        {item.concept}
        <SpeakButton text={item.concept} langCode={pair.mother} />
      </p>
      {picked === null ? (
        <div className="game-options">
          {item.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              className="big-btn game-option"
              onClick={() => setPicked(i)}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="game-result">
            {picked === item.bestIndex
              ? "⭐ " + t("modules.learningStrategiesTeachBackGood")
              : "💭 " + t("modules.learningStrategiesTeachBackThink")}
          </p>
          <p className="page-intro">
            {item.options[item.bestIndex]}
            <SpeakButton text={item.options[item.bestIndex]} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={onFinish}>
            ✅ {t("modules.learningStrategiesContinue")}
          </button>
        </>
      )}
    </div>
  );
}

// --- Memória: sequence recall, then re-attempt after being taught a technique ---
function MemoryActivity({ items, teachback, pair, onComplete }) {
  const { t } = useTranslation();
  const [round, setRound] = useState(() => pickOne(items));
  const [phase, setPhase] = useState("study1"); // study1 -> recall1 -> technique -> study2 -> recall2 -> teachback -> done
  const [picks1, setPicks1] = useState([]);
  const [picks2, setPicks2] = useState([]);
  const [pool, setPool] = useState([]);
  const teachbackItem = useMemo(() => pickOne(teachback), [round]);

  function startRecall() {
    setPool(shuffle([...round.items, ...extraDistractors(round.items)]));
    setPhase("recall1");
  }

  function extraDistractors(items) {
    const extras = ["🍕", "🎁", "🐸", "🧩", "🚗", "🌙", "🍩", "⭐"].filter((e) => !items.includes(e));
    return shuffle(extras).slice(0, 3);
  }

  function handlePick(picks, setPicks, nextPhase) {
    return (emoji) => {
      if (picks.includes(emoji)) return;
      const next = [...picks, emoji];
      setPicks(next);
      if (next.length >= round.items.length) {
        setTimeout(() => setPhase(nextPhase), 400);
      }
    };
  }

  function restartWithTechnique() {
    setPool(shuffle([...round.items, ...extraDistractors(round.items)]));
    setPhase("study2");
  }

  const correctCount1 = picks1.filter((e) => round.items.includes(e)).length;
  const correctCount2 = picks2.filter((e) => round.items.includes(e)).length;

  return (
    <div className="game-card">
      <div className="help-btn-corner">
        <HelpButton text={t("modules.learningStrategiesMemoryHelp")} langCode={pair.mother} />
      </div>

      {phase === "study1" && (
        <>
          <p className="page-intro">{t("modules.learningStrategiesMemoryStudy")}</p>
          <div className="game-emoji" style={{ letterSpacing: "0.3em" }}>
            {round.items.join(" ")}
          </div>
          <button type="button" className="big-btn" onClick={startRecall}>
            ➡️ {t("modules.learningStrategiesMemoryHide")}
          </button>
        </>
      )}

      {phase === "recall1" && (
        <>
          <p className="page-intro">{t("modules.learningStrategiesMemoryRecall")}</p>
          <div className="game-options">
            {pool.map((emoji, i) => (
              <button
                key={emoji + i}
                type="button"
                className={"big-btn game-option" + (picks1.includes(emoji) ? " done" : "")}
                disabled={picks1.includes(emoji)}
                onClick={handlePick(picks1, setPicks1, "technique")}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="mundos-tile-sub">
            {picks1.length} / {round.items.length}
          </p>
        </>
      )}

      {phase === "technique" && (
        <>
          <div className="game-emoji">💡</div>
          <p className="game-result">
            {t("modules.learningStrategiesMemoryFirstScore")}: {correctCount1} / {round.items.length}
          </p>
          <p className="page-intro">
            {round.technique}
            <SpeakButton text={round.technique} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={restartWithTechnique}>
            🔁 {t("modules.learningStrategiesMemoryTryAgain")}
          </button>
        </>
      )}

      {phase === "study2" && (
        <>
          <p className="page-intro">{t("modules.learningStrategiesMemoryStudy")}</p>
          <div className="game-emoji" style={{ letterSpacing: "0.3em" }}>
            {round.items.join(" ")}
          </div>
          <button type="button" className="big-btn" onClick={() => setPhase("recall2")}>
            ➡️ {t("modules.learningStrategiesMemoryHide")}
          </button>
        </>
      )}

      {phase === "recall2" && (
        <>
          <p className="page-intro">{t("modules.learningStrategiesMemoryRecall")}</p>
          <div className="game-options">
            {pool.map((emoji, i) => (
              <button
                key={emoji + i}
                type="button"
                className={"big-btn game-option" + (picks2.includes(emoji) ? " done" : "")}
                disabled={picks2.includes(emoji)}
                onClick={handlePick(picks2, setPicks2, "result")}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className="mundos-tile-sub">
            {picks2.length} / {round.items.length}
          </p>
        </>
      )}

      {phase === "result" && (
        <>
          <div className="game-emoji">{correctCount2 >= correctCount1 ? "🏆" : "🤔"}</div>
          <p className="game-result">
            {t("modules.learningStrategiesMemoryFirstScore")}: {correctCount1} / {round.items.length}
          </p>
          <p className="game-result">
            {t("modules.learningStrategiesMemorySecondScore")}: {correctCount2} / {round.items.length}
          </p>
          <p className="page-intro">
            {correctCount2 >= correctCount1
              ? t("modules.learningStrategiesMemoryImproved")
              : t("modules.learningStrategiesMemoryKeepTrying")}
          </p>
          <button type="button" className="big-btn" onClick={() => setPhase("teachback")}>
            ➡️ {t("modules.learningStrategiesContinue")}
          </button>
        </>
      )}

      {phase === "teachback" && (
        <TeachBackCard
          item={teachbackItem}
          pair={pair}
          onFinish={() => {
            onComplete(round.id);
            setPhase("done");
          }}
        />
      )}

      {phase === "done" && (
        <>
          <div className="game-emoji">🎉</div>
          <button
            type="button"
            className="big-btn"
            onClick={() => {
              setRound(pickOne(items));
              setPicks1([]);
              setPicks2([]);
              setPhase("study1");
            }}
          >
            🔁 {t("modules.learningStrategiesPlayAgain")}
          </button>
        </>
      )}
    </div>
  );
}

// --- Atenção: find the one important thing among distractors ---
function AttentionActivity({ items, teachback, pair, onComplete }) {
  const { t } = useTranslation();
  const [round, setRound] = useState(() => pickOne(items));
  const [answered, setAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTeachback, setShowTeachback] = useState(false);
  const teachbackItem = useMemo(() => pickOne(teachback), [round]);

  const scene = round.scene.match(/\p{Emoji}/gu) || [round.scene];

  function handleTap(emoji) {
    if (answered) return;
    if (emoji === round.targetEmoji) {
      setAnswered(true);
    } else {
      setShowHint(true);
    }
  }

  function nextRound() {
    setRound(pickOne(items));
    setAnswered(false);
    setShowHint(false);
    setShowTeachback(false);
  }

  return (
    <div className="game-card">
      <div className="help-btn-corner">
        <HelpButton text={t("modules.learningStrategiesAttentionHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">
        {round.question}
        <SpeakButton text={round.question} langCode={pair.mother} />
      </p>
      <div className="game-emoji" style={{ letterSpacing: "0.15em", fontSize: "2rem" }}>
        {scene.map((emoji, i) => (
          <button
            key={i}
            type="button"
            className="attention-scene-btn"
            onClick={() => handleTap(emoji)}
            disabled={answered}
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {showHint && !answered && (
        <p className="mundos-tile-sub">
          🔎 {round.hint}
          <SpeakButton text={round.hint} langCode={pair.mother} />
        </p>
      )}

      {answered && !showTeachback && (
        <>
          <p className="game-result">⭐ {t("modules.learningStrategiesAttentionFound")}</p>
          <button type="button" className="big-btn" onClick={() => setShowTeachback(true)}>
            ➡️ {t("modules.learningStrategiesContinue")}
          </button>
        </>
      )}

      {showTeachback && (
        <TeachBackCard
          item={teachbackItem}
          pair={pair}
          onFinish={() => {
            onComplete(round.id);
            nextRound();
          }}
        />
      )}
    </div>
  );
}

// --- Erro: warm reframing vignette with reflection prompts (no right/wrong feedback) ---
function ErrorActivity({ items, teachback, pair, onComplete }) {
  const { t } = useTranslation();
  const [round, setRound] = useState(() => pickOne(items));
  const [promptIndex, setPromptIndex] = useState(0);
  const [showTeachback, setShowTeachback] = useState(false);
  const teachbackItem = useMemo(() => pickOne(teachback), [round]);

  const allPromptsShown = promptIndex >= round.reflectionPrompts.length;

  function nextRound() {
    setRound(pickOne(items));
    setPromptIndex(0);
    setShowTeachback(false);
  }

  return (
    <div className="game-card learning-error-card">
      <div className="help-btn-corner">
        <HelpButton text={t("modules.learningStrategiesErrorHelp")} langCode={pair.mother} />
      </div>
      <div className="game-emoji">{round.character}</div>
      <p className="page-intro">
        {round.scenario}
        <SpeakButton text={round.scenario} langCode={pair.mother} />
      </p>
      <p className="mission-text">🌱 {t("modules.learningStrategiesErrorReframe")}</p>

      {!allPromptsShown ? (
        <div className="game-card">
          <p className="game-result">
            {round.reflectionPrompts[promptIndex]}
            <SpeakButton text={round.reflectionPrompts[promptIndex]} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={() => setPromptIndex((i) => i + 1)}>
            💭 {t("modules.learningStrategiesErrorNextPrompt")}
          </button>
        </div>
      ) : !showTeachback ? (
        <>
          <p className="game-result">🌟 {t("modules.learningStrategiesErrorDone")}</p>
          <button type="button" className="big-btn" onClick={() => setShowTeachback(true)}>
            ➡️ {t("modules.learningStrategiesContinue")}
          </button>
        </>
      ) : (
        <TeachBackCard
          item={teachbackItem}
          pair={pair}
          onFinish={() => {
            onComplete(round.id);
            nextRound();
          }}
        />
      )}
    </div>
  );
}

// --- Estratégia: puzzle where the first approach fails, offering hints ---
function StrategyActivity({ items, teachback, pair, onComplete }) {
  const { t } = useTranslation();
  const [round, setRound] = useState(() => pickOne(items));
  const [phase, setPhase] = useState("firstTry"); // firstTry -> hint1 -> hint2 -> answer -> teachback -> done
  const [showTeachback, setShowTeachback] = useState(false);
  const teachbackItem = useMemo(() => pickOne(teachback), [round]);

  function nextRound() {
    setRound(pickOne(items));
    setPhase("firstTry");
    setShowTeachback(false);
  }

  return (
    <div className="game-card">
      <div className="help-btn-corner">
        <HelpButton text={t("modules.learningStrategiesStrategyHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">
        {round.prompt}
        <SpeakButton text={round.prompt} langCode={pair.mother} />
      </p>

      {phase === "firstTry" && (
        <>
          <p className="mission-text">
            {round.firstTry}
            <SpeakButton text={round.firstTry} langCode={pair.mother} />
          </p>
          <p className="game-result">🤔 {t("modules.learningStrategiesStrategyDidntWork")}</p>
          <button type="button" className="big-btn" onClick={() => setPhase("hint1")}>
            🧭 {t("modules.learningStrategiesStrategyTryAnother")}
          </button>
        </>
      )}

      {phase === "hint1" && (
        <>
          <p className="game-result">
            {round.hint1}
            <SpeakButton text={round.hint1} langCode={pair.mother} />
          </p>
          <div className="game-options">
            <button type="button" className="big-btn game-option" onClick={() => setPhase("hint2")}>
              🧭 {t("modules.learningStrategiesStrategyAnotherIdea")}
            </button>
            <button type="button" className="big-btn game-option" onClick={() => setPhase("answer")}>
              💡 {t("modules.learningStrategiesStrategyReveal")}
            </button>
          </div>
        </>
      )}

      {phase === "hint2" && (
        <>
          <p className="game-result">
            {round.hint2}
            <SpeakButton text={round.hint2} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={() => setPhase("answer")}>
            💡 {t("modules.learningStrategiesStrategyReveal")}
          </button>
        </>
      )}

      {phase === "answer" && !showTeachback && (
        <>
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {round.answer}
            <SpeakButton text={round.answer} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={() => setShowTeachback(true)}>
            ➡️ {t("modules.learningStrategiesContinue")}
          </button>
        </>
      )}

      {showTeachback && (
        <TeachBackCard
          item={teachbackItem}
          pair={pair}
          onFinish={() => {
            onComplete(round.id);
            nextRound();
          }}
        />
      )}
    </div>
  );
}
