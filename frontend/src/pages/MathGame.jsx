import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile, getDifficultyTier, pingProgress, recordSkillEvent, getLangPair } from "../storage.js";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";

// Small rotating pool of mascot-style character names used only as plain
// text inside scenario sentences (no illustration import - keeps this page
// decoupled from components/mascots/ while another agent may be building it).
const CHARACTERS = ["Lumi", "Tomás", "Nina", "Nia"];

// Objects that can appear in a scenario, paired with an i18n key for the
// translated plural noun ("maçãs", "apples", ...).
const SCENARIO_OBJECTS = [
  { emoji: "🍎", key: "mathObjApple" },
  { emoji: "⭐", key: "mathObjStar" },
  { emoji: "⚽", key: "mathObjBall" },
  { emoji: "📚", key: "mathObjBook" },
  { emoji: "🌸", key: "mathObjFlower" },
  { emoji: "🪙", key: "mathObjCoin" },
  { emoji: "🦋", key: "mathObjButterfly" },
  { emoji: "🍪", key: "mathObjCookie" },
];

// randInt is a function declaration further down this file - it's hoisted,
// so it's safe to use here even though it reads lower in the source.
function pickScenarioObject() {
  return SCENARIO_OBJECTS[randInt(0, SCENARIO_OBJECTS.length - 1)];
}

function pickCharacter() {
  return CHARACTERS[randInt(0, CHARACTERS.length - 1)];
}

// Fills a scenario template like "{character} tinha {a} {objeto}..." with
// the round's values. Plain string replace (not i18next interpolation) so
// the template strings can use the simple {a}/{b}/{objeto}/{character}
// placeholders spelled out in the design.
function fillScenario(template, { character, a, b, objeto }) {
  return template
    .replaceAll("{character}", character)
    .replaceAll("{a}", a)
    .replaceAll("{b}", b)
    .replaceAll("{objeto}", objeto);
}

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

// Tier -> multiplication table range and quiz length
const MUL_CONFIG = {
  1: { max: 5, rounds: 6 },
  2: { max: 5, rounds: 8 },
  3: { max: 10, rounds: 10 },
};

// Tier -> division range (dividend up to max*max/divisor stays exact) and quiz length
const DIV_CONFIG = {
  1: { max: 5, rounds: 6 },
  2: { max: 5, rounds: 8 },
  3: { max: 10, rounds: 10 },
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
    const scenarioObj = pickScenarioObject();
    rounds.push({
      a,
      b,
      op,
      correct,
      options: numberOptions(correct, config.max, 4),
      character: pickCharacter(),
      scenarioEmoji: scenarioObj.emoji,
      scenarioObjKey: scenarioObj.key,
      // Objects available for the tap-to-count mode: for addition, start
      // from `a` icons plus a pool of `b` more to tap in; for subtraction,
      // start from `a` icons to tap away.
      countable: isAdd ? a + b <= 10 : a <= 10,
    });
  }
  return rounds;
}

// Dedicated round set for the tap-to-count interaction mode: numbers are
// always kept small (<=10) so every object fits comfortably as individual
// tappable icons, regardless of the child's difficulty tier.
function buildCountingModeAddSubRounds() {
  const max = 10;
  const roundCount = 6;
  const rounds = [];
  for (let i = 0; i < roundCount; i++) {
    const isAdd = Math.random() < 0.5;
    let a, b, correct, op;
    if (isAdd) {
      a = randInt(1, max - 1);
      b = randInt(1, max - a);
      correct = a + b;
      op = "+";
    } else {
      a = randInt(2, max);
      b = randInt(1, a);
      correct = a - b;
      op = "-";
    }
    const scenarioObj = pickScenarioObject();
    rounds.push({
      a,
      b,
      op,
      correct,
      character: pickCharacter(),
      scenarioEmoji: scenarioObj.emoji,
      scenarioObjKey: scenarioObj.key,
    });
  }
  return rounds;
}

function buildMultiplicationRounds(tier) {
  const config = MUL_CONFIG[tier] || MUL_CONFIG[1];
  const rounds = [];
  for (let i = 0; i < config.rounds; i++) {
    const a = randInt(1, config.max);
    const b = randInt(1, config.max);
    const correct = a * b;
    const emoji = COUNT_EMOJI[randInt(0, COUNT_EMOJI.length - 1)];
    rounds.push({
      a,
      b,
      correct,
      emoji,
      options: numberOptions(correct, config.max * config.max, 4),
    });
  }
  return rounds;
}

function buildDivisionRounds(tier) {
  const config = DIV_CONFIG[tier] || DIV_CONFIG[1];
  const rounds = [];
  for (let i = 0; i < config.rounds; i++) {
    const divisor = randInt(2, config.max);
    const quotient = randInt(1, config.max);
    const dividend = divisor * quotient;
    const emoji = COUNT_EMOJI[randInt(0, COUNT_EMOJI.length - 1)];
    rounds.push({
      dividend,
      divisor,
      correct: quotient,
      emoji,
      options: numberOptions(quotient, config.max, 4),
    });
  }
  return rounds;
}

function QuizRunner({ rounds, renderPrompt, moduleEvent, skillId, profile, t, onDone }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  // Anti-guessing: once an option is clicked wrong, it stays visible but
  // disabled so the child can't just spam every option in turn.
  const [wrongOptions, setWrongOptions] = useState(() => new Set());
  const [wrongCount, setWrongCount] = useState(0);

  const round = rounds[step];
  const finished = step >= rounds.length;

  function handleAnswer(option) {
    if (feedback) return;
    if (wrongOptions.has(option)) return;
    const correct = option === round.correct;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setScore((s) => s + 1);
      // Only award full skill/XP credit if the child got it right within
      // the first couple of attempts, not after guessing through options.
      if (skillId) recordSkillEvent(profile?.name, skillId, wrongCount < 2);
    } else {
      setWrongOptions((prev) => new Set(prev).add(option));
      setWrongCount((c) => c + 1);
    }
    pingProgress({
      profileName: profile?.name,
      module: moduleEvent,
      event: correct ? "quiz_correct" : "quiz_wrong",
    });
    if (correct) {
      setTimeout(() => {
        setFeedback(null);
        setWrongOptions(new Set());
        setWrongCount(0);
        setStep((s) => s + 1);
      }, 900);
    } else {
      // Let them try again instead of skipping ahead - the clicked option
      // is now disabled so they must pick a different one.
      setTimeout(() => setFeedback(null), 500);
    }
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
                  (feedback && opt === round.correct ? " correct" : "") +
                  (wrongOptions.has(opt) ? " disabled" : "")
                }
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback || wrongOptions.has(opt)}
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

// Tap-based counting mode: instead of picking from multiple-choice numbers,
// the child sees the scenario's objects as individual tappable icons and
// taps them away (subtraction) or taps more in from a pool (addition) until
// they believe they've reached the right count, then confirms. Tap-only
// (no HTML5 drag-and-drop) since real drag-and-drop is unreliable on
// touch/iOS Safari for this age group.
function CountingModeQuiz({ rounds, moduleEvent, skillId, profile, t, onDone }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [removed, setRemoved] = useState(() => new Set());
  const [added, setAdded] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongTries, setWrongTries] = useState(0);

  const round = rounds[step];
  const finished = step >= rounds.length;

  if (!round && !finished) return null;

  if (finished) {
    return (
      <div className="game-card">
        <div className="game-emoji">🏆</div>
        <p className="game-result">
          {t("modules.mathScore")}: {score} / {rounds.length}
        </p>
        <button type="button" className="big-btn" onClick={onDone}>
          {t("modules.mathPlayAgain")} 🔁
        </button>
      </div>
    );
  }

  const isAdd = round.op === "+";
  const objetoLabel = t(`modules.${round.scenarioObjKey}`);
  const scenarioKey = isAdd ? "mathScenarioAdd" : "mathScenarioSub";
  const scenarioText = fillScenario(t(`modules.${scenarioKey}`), {
    character: round.character,
    a: round.a,
    b: round.b,
    objeto: objetoLabel,
  });

  const currentTotal = isAdd ? round.a + added : round.a - removed.size;
  // Extra tap-in pool for addition: a few spares beyond `b` so tapping the
  // exact right number is a deliberate choice, not the only option shown.
  const poolSize = isAdd ? Math.min(round.b + 3, 10) : 0;

  function resetRoundState() {
    setRemoved(new Set());
    setAdded(0);
    setFeedback(null);
  }

  function handleConfirm() {
    if (feedback) return;
    const correct = currentTotal === round.correct;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setScore((s) => s + 1);
      if (skillId) recordSkillEvent(profile?.name, skillId, wrongTries < 2);
    } else {
      setWrongTries((c) => c + 1);
    }
    pingProgress({
      profileName: profile?.name,
      module: moduleEvent,
      event: correct ? "quiz_correct" : "quiz_wrong",
    });
    if (correct) {
      setTimeout(() => {
        resetRoundState();
        setWrongTries(0);
        setStep((s) => s + 1);
      }, 900);
    } else {
      // Let them keep adjusting the count and try confirming again.
      setTimeout(() => setFeedback(null), 500);
    }
  }

  return (
    <div className="game-card">
      <div className="game-progress">
        {step + 1} / {rounds.length} · ⭐ {score}
      </div>
      <p className="math-scenario-text">
        {round.scenarioEmoji} {scenarioText}
      </p>

      <div className="game-emoji math-count-objects">
        {Array.from({ length: round.a }).map((_, i) => {
          const isRemoved = removed.has(i);
          return (
            <button
              key={"base-" + i}
              type="button"
              className={"math-count-icon" + (isRemoved ? " removed" : "")}
              disabled={!isAdd && (isRemoved || !!feedback)}
              onClick={() => {
                if (isAdd || feedback) return;
                setRemoved((prev) => new Set(prev).add(i));
              }}
              aria-label={isAdd ? undefined : t("modules.mathTapToRemove")}
            >
              {round.scenarioEmoji}
            </button>
          );
        })}
      </div>

      {isAdd && (
        <>
          <p className="math-count-label">{t("modules.mathTapToAdd")}</p>
          <div className="game-emoji math-count-objects math-count-pool">
            {Array.from({ length: poolSize }).map((_, i) => {
              const isAdded = i < added;
              return (
                <button
                  key={"pool-" + i}
                  type="button"
                  className={"math-count-icon" + (isAdded ? " added" : "")}
                  disabled={isAdded || !!feedback}
                  onClick={() => setAdded((n) => n + 1)}
                >
                  {round.scenarioEmoji}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="math-count-total">
        {t("modules.mathCountRemaining").replace("{count}", currentTotal)}
      </div>

      <button
        type="button"
        className={
          "big-btn math-count-confirm" +
          (feedback === "correct" ? " correct" : "") +
          (feedback === "wrong" ? " wrong" : "")
        }
        onClick={handleConfirm}
        disabled={!!feedback}
      >
        {t("modules.mathConfirm")} ✅
      </button>
    </div>
  );
}

const HELP_KEY_BY_ACTIVITY = {
  counting: "mathHelpCounting",
  numbers: "mathHelpNumbers",
  addsub: "mathHelpAddSub",
  multiplication: "mathHelpMultiplication",
  division: "mathHelpDivision",
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
  const [pendingActivity, setPendingActivity] = useState("addsub");
  // Addition/subtraction offers two interaction styles: pick a
  // multiple-choice answer, or tap objects to count them directly.
  const [addSubMode, setAddSubMode] = useState("choice");

  const tabs = [
    { key: "counting", label: t("modules.mathCounting"), emoji: "🔢" },
    { key: "numbers", label: t("modules.mathNumbers"), emoji: "🔠" },
    { key: "addsub", label: t("modules.mathAddSub"), emoji: "➕" },
    { key: "multiplication", label: t("modules.mathMultiplication"), emoji: "✖️" },
    { key: "division", label: t("modules.mathDivision"), emoji: "➗" },
  ];

  const GATED_ACTIVITIES = ["addsub", "multiplication", "division"];

  function switchActivity(key) {
    if (GATED_ACTIVITIES.includes(key) && tier === 1 && !addSubConfirmed) {
      setPendingActivity(key);
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
            setActivity(pendingActivity);
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
        <>
          <div className="game-options math-mode-toggle">
            <button
              type="button"
              className={"big-btn game-option" + (addSubMode === "choice" ? " correct" : "")}
              onClick={() => setAddSubMode("choice")}
            >
              🔘 {t("modules.mathModeChoice")}
            </button>
            <button
              type="button"
              className={"big-btn game-option" + (addSubMode === "count" ? " correct" : "")}
              onClick={() => setAddSubMode("count")}
            >
              👆 {t("modules.mathModeCount")}
            </button>
          </div>

          {addSubMode === "choice" ? (
            <QuizRunner
              key={"addsub-choice-" + seed}
              rounds={buildAddSubRounds(tier)}
              profile={profile}
              t={t}
              moduleEvent="math_addsub"
              skillId="math-addsub"
              onDone={restart}
              renderPrompt={(round) => {
                const objetoLabel = t(`modules.${round.scenarioObjKey}`);
                const scenarioKey = round.op === "+" ? "mathScenarioAdd" : "mathScenarioSub";
                const scenarioText = fillScenario(t(`modules.${scenarioKey}`), {
                  character: round.character,
                  a: round.a,
                  b: round.b,
                  objeto: objetoLabel,
                });
                return (
                  <>
                    <p className="math-scenario-text">
                      {round.scenarioEmoji} {scenarioText}
                    </p>
                    <div className="game-emoji math-expression">
                      {round.a} {round.op} {round.b} = ?
                    </div>
                  </>
                );
              }}
            />
          ) : (
            <CountingModeQuiz
              key={"addsub-count-" + seed}
              rounds={buildCountingModeAddSubRounds()}
              profile={profile}
              t={t}
              moduleEvent="math_addsub"
              skillId="math-addsub"
              onDone={restart}
            />
          )}
        </>
      )}

      {activity === "multiplication" && (
        <QuizRunner
          key={"multiplication-" + seed}
          rounds={buildMultiplicationRounds(tier)}
          profile={profile}
          t={t}
          moduleEvent="math_multiplication"
          onDone={restart}
          renderPrompt={(round) => (
            <>
              <div className="game-emoji">
                {Array.from({ length: round.a }).map((_, i) => (
                  <span key={i} style={{ marginRight: "0.5em" }}>
                    {round.emoji.repeat(round.b)}
                  </span>
                ))}
              </div>
              <div className="math-expression">
                {round.a} × {round.b} = ?
              </div>
            </>
          )}
        />
      )}

      {activity === "division" && (
        <QuizRunner
          key={"division-" + seed}
          rounds={buildDivisionRounds(tier)}
          profile={profile}
          t={t}
          moduleEvent="math_division"
          onDone={restart}
          renderPrompt={(round) => (
            <>
              <div className="game-emoji">{round.emoji.repeat(round.dividend)}</div>
              <div className="math-expression">
                {round.dividend} ÷ {round.divisor} = ?
              </div>
            </>
          )}
        />
      )}
    </div>
  );
}
