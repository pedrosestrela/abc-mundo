import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getProfile, getDifficultyTier, pingProgress, recordSkillEvent, getLangPair } from "../storage.js";
import HelpButton from "../components/HelpButton.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { pickLine } from "../components/mascots/reactionLines.js";

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

// Tier -> array/groups visual range for multiplication's counting mode.
// Kept deliberately small at tier 1 (per product owner: 2x2 to 3x4) and
// scaled up gradually so the array never gets too large to count by eye.
const MUL_GROUPS_CONFIG = {
  1: { groupsMin: 2, groupsMax: 3, perMin: 2, perMax: 4, rounds: 5 },
  2: { groupsMin: 2, groupsMax: 4, perMin: 2, perMax: 5, rounds: 6 },
  3: { groupsMin: 3, groupsMax: 5, perMin: 2, perMax: 6, rounds: 6 },
};

function buildMultiplicationCountingRounds(tier) {
  const config = MUL_GROUPS_CONFIG[tier] || MUL_GROUPS_CONFIG[1];
  const rounds = [];
  for (let i = 0; i < config.rounds; i++) {
    const groups = randInt(config.groupsMin, config.groupsMax);
    const perGroup = randInt(config.perMin, config.perMax);
    const scenarioObj = pickScenarioObject();
    rounds.push({
      groups,
      perGroup,
      correct: groups * perGroup,
      character: pickCharacter(),
      scenarioEmoji: scenarioObj.emoji,
      scenarioObjKey: scenarioObj.key,
    });
  }
  return rounds;
}

// Tier -> sharing/partition visual range for division's counting mode.
// Only evenly-divisible totals are generated (no remainders), as requested,
// so every object always finds a bucket and "each friend gets N" is exact.
const DIV_SHARE_CONFIG = {
  1: { friendsMin: 2, friendsMax: 3, perMin: 2, perMax: 3, rounds: 5 },
  2: { friendsMin: 2, friendsMax: 4, perMin: 2, perMax: 4, rounds: 6 },
  3: { friendsMin: 2, friendsMax: 5, perMin: 2, perMax: 6, rounds: 6 },
};

function buildDivisionCountingRounds(tier) {
  const config = DIV_SHARE_CONFIG[tier] || DIV_SHARE_CONFIG[1];
  const rounds = [];
  for (let i = 0; i < config.rounds; i++) {
    const friends = randInt(config.friendsMin, config.friendsMax);
    const perFriend = randInt(config.perMin, config.perMax);
    const scenarioObj = pickScenarioObject();
    rounds.push({
      friends,
      perFriend,
      total: friends * perFriend,
      correct: perFriend,
      character: pickCharacter(),
      scenarioEmoji: scenarioObj.emoji,
      scenarioObjKey: scenarioObj.key,
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

function QuizRunner({ rounds, renderPrompt, moduleEvent, skillId, profile, pair, t, onDone }) {
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
          {feedback && pair && (
            <MascotBubble character="nina" reaction={feedback === "correct" ? "happy" : "encouraging"} langCode={pair.mother}>
              {pickLine(t(feedback === "correct" ? "mascotLines.mathCorrect" : "mascotLines.mathEncouraging", { returnObjects: true }))}
            </MascotBubble>
          )}
        </>
      ) : (
        <>
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.mathScore")}: {score} / {rounds.length}
          </p>
          {pair && (
            <MascotBubble character="nina" reaction="resting" langCode={pair.mother}>
              {t("mascotLines.genericClosing")}
            </MascotBubble>
          )}
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

// Array/groups visual mode for multiplication: the child sees `groups` rows
// of `perGroup` icons each (e.g. "3 groups of 4 apples") and taps every icon
// in turn to build a running total, making "multiplication is repeated
// addition of equal groups" visible instead of an abstract fact to recall.
function MultiplicationCountingQuiz({ rounds, moduleEvent, skillId, profile, t, onDone }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [tapped, setTapped] = useState(() => new Set());
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

  const objetoLabel = t(`modules.${round.scenarioObjKey}`);
  const scenarioText = fillScenario(t("modules.mathScenarioMultiplication"), {
    character: round.character,
    a: round.groups,
    b: round.perGroup,
    objeto: objetoLabel,
  });

  function resetRoundState() {
    setTapped(new Set());
    setFeedback(null);
  }

  function handleConfirm() {
    if (feedback) return;
    const correct = tapped.size === round.correct;
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
      <p className="math-count-label">{t("modules.mathTapToCount")}</p>

      <div className="math-groups">
        {Array.from({ length: round.groups }).map((_, g) => (
          <div key={"group-" + g} className="math-count-objects math-group-row">
            {Array.from({ length: round.perGroup }).map((_, j) => {
              const idx = g * round.perGroup + j;
              const isTapped = tapped.has(idx);
              return (
                <button
                  key={"item-" + idx}
                  type="button"
                  className={"math-count-icon" + (isTapped ? " added" : "")}
                  disabled={isTapped || !!feedback}
                  onClick={() => setTapped((prev) => new Set(prev).add(idx))}
                >
                  {round.scenarioEmoji}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="math-count-total">
        {t("modules.mathRunningTotal").replace("{count}", tapped.size)}
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

// Sharing/partition visual mode for division: the child sees `total` objects
// in a pool and `friends` buckets. Tap an object, then tap a bucket, to
// distribute items one at a time (partitive division) until every object is
// placed, revealing "each friend gets N" - no drag-and-drop, tap-only.
function DivisionCountingQuiz({ rounds, moduleEvent, skillId, profile, t, onDone }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  // assignments[i] = bucket index the i-th item was placed into, or null
  const [assignments, setAssignments] = useState(() => []);
  const [selected, setSelected] = useState(null);
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

  const objetoLabel = t(`modules.${round.scenarioObjKey}`);
  const scenarioText = fillScenario(t("modules.mathScenarioDivision"), {
    character: round.character,
    a: round.total,
    b: round.friends,
    objeto: objetoLabel,
  });

  const bucketCounts = Array.from({ length: round.friends }).map(
    (_, b) => assignments.filter((v) => v === b).length
  );
  const allPlaced = assignments.length === round.total && assignments.every((v) => v !== null);

  function resetRoundState() {
    setAssignments([]);
    setSelected(null);
    setFeedback(null);
  }

  function handleItemTap(idx) {
    if (feedback) return;
    if (assignments[idx] != null) {
      // Tapping an already-placed item returns it to the pool for correction.
      setAssignments((prev) => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
      return;
    }
    setSelected(idx);
  }

  function handleBucketTap(b) {
    if (feedback || selected == null) return;
    setAssignments((prev) => {
      const next = [...prev];
      next[selected] = b;
      return next;
    });
    setSelected(null);
  }

  function handleConfirm() {
    if (feedback || !allPlaced) return;
    const correct = bucketCounts.every((c) => c === round.correct);
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
      <p className="math-count-label">
        {selected == null ? t("modules.mathTapItemFirst") : t("modules.mathTapBucket")}
      </p>

      <div className="game-emoji math-count-objects">
        {Array.from({ length: round.total }).map((_, i) => {
          const placed = assignments[i] != null;
          return (
            <button
              key={"item-" + i}
              type="button"
              className={
                "math-count-icon" +
                (placed ? " removed" : "") +
                (selected === i ? " selected" : "")
              }
              disabled={!!feedback}
              onClick={() => handleItemTap(i)}
            >
              {round.scenarioEmoji}
            </button>
          );
        })}
      </div>

      <div className="math-buckets">
        {Array.from({ length: round.friends }).map((_, b) => (
          <button
            key={"bucket-" + b}
            type="button"
            className="math-bucket"
            disabled={!!feedback}
            onClick={() => handleBucketTap(b)}
          >
            <div className="math-bucket-label">🧒 {b + 1}</div>
            <div className="math-bucket-items">
              {round.scenarioEmoji.repeat(bucketCounts[b])}
            </div>
            <div className="math-bucket-count">{bucketCounts[b]}</div>
          </button>
        ))}
      </div>

      <button
        type="button"
        className={
          "big-btn math-count-confirm" +
          (feedback === "correct" ? " correct" : "") +
          (feedback === "wrong" ? " wrong" : "")
        }
        onClick={handleConfirm}
        disabled={!!feedback || !allPlaced}
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
  balloons: "mathHelpBalloons",
  stories: "mathHelpStories",
};

// Everyday "math story" mini-scenarios: unlike the addsub scenario system
// above (random numbers + a rotating character/object template), these are a
// small, fixed, hand-written set so the numbers and wording always make
// concrete real-world sense together (e.g. always exactly "2 apples + 1
// apple", never a randomly generated absurd combination) — a light-touch way
// to give the child a handful of everyday story problems to connect counting
// to, per the product owner's request. Each entry's `promptKey` is a full,
// already-numbered sentence in i18n (not templated), and `correct`/`emoji`
// drive the same multiple-choice QuizRunner used by every other mode here.
const MATH_STORIES = [
  { promptKey: "mathStory1", correct: 3, emoji: "🍎" },
  { promptKey: "mathStory2", correct: 3, emoji: "⭐" },
  { promptKey: "mathStory3", correct: 5, emoji: "⚽" },
  { promptKey: "mathStory4", correct: 4, emoji: "🍪" },
  { promptKey: "mathStory5", correct: 7, emoji: "🌸" },
  { promptKey: "mathStory6", correct: 5, emoji: "🪙" },
];

function buildMathStoryRounds() {
  return MATH_STORIES.map((story) => ({
    ...story,
    options: numberOptions(story.correct, story.correct + 5, 3),
  }));
}

const BALLOON_COLORS = ["#ff6b6b", "#4dabf7", "#ffd43b", "#69db7c", "#da77f2", "#ff922b"];
const BALLOON_ROUNDS = 8;

// "Balões da Matemática" (Math Balloon Pop): a different game FEEL from the
// multiple-choice QuizRunner above — the same round shape (an arithmetic
// problem + a set of number options, reusing buildAddSubRounds) is instead
// presented as gently bobbing balloons the child taps to pop. Pure CSS
// animation on absolutely-positioned buttons, no canvas/engine needed.
function BalloonGame({ rounds, profile, t, onDone }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(() => new Set());
  const [wrongTries, setWrongTries] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [layout] = useState(() =>
    rounds.map((round) =>
      round.options.map((_, i) => ({
        left: 8 + ((i * 23) % 80) + Math.floor(Math.random() * 8),
        top: 10 + ((i * 19) % 65) + Math.floor(Math.random() * 8),
        color: BALLOON_COLORS[(i + Math.floor(Math.random() * BALLOON_COLORS.length)) % BALLOON_COLORS.length],
        duration: 2.4 + Math.random() * 1.6,
        delay: Math.random() * -2,
      }))
    )
  );

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

  function handlePop(option, idx) {
    if (feedback || popped.has(idx)) return;
    const correct = option === round.correct;
    if (correct) {
      setFeedback("correct");
      setScore((s) => s + 1);
      recordSkillEvent(profile?.name, "math-balloons", wrongTries < 2);
      pingProgress({ profileName: profile?.name, module: "math_balloons", event: "quiz_correct" });
      setTimeout(() => {
        setFeedback(null);
        setPopped(new Set());
        setWrongTries(0);
        setStep((s) => s + 1);
      }, 700);
    } else {
      setPopped((prev) => new Set(prev).add(idx));
      setWrongTries((c) => c + 1);
      pingProgress({ profileName: profile?.name, module: "math_balloons", event: "quiz_wrong" });
    }
  }

  const objetoLabel = t(`modules.${round.scenarioObjKey}`);
  const scenarioKey = round.op === "+" ? "mathScenarioAdd" : "mathScenarioSub";
  const scenarioText = fillScenario(t(`modules.${scenarioKey}`), {
    character: round.character,
    a: round.a,
    b: round.b,
    objeto: objetoLabel,
  });

  return (
    <div className="game-card">
      <div className="game-progress">
        {step + 1} / {rounds.length} · ⭐ {score}
      </div>
      <p className="math-scenario-text">
        {round.scenarioEmoji} {scenarioText}
      </p>
      <div className="game-emoji math-expression">
        {round.a} {round.op} {round.b} = ?
      </div>
      <p className="math-count-label">{t("modules.mathBalloonsInstru")}</p>
      <div className="balloon-field">
        {round.options.map((opt, i) => {
          const pos = layout[step][i];
          const isPopped = popped.has(i);
          const isCorrectPop = feedback === "correct" && opt === round.correct;
          return (
            <button
              key={i}
              type="button"
              className={"balloon" + (isPopped ? " balloon-popped" : "") + (isCorrectPop ? " balloon-correct" : "")}
              style={{
                left: pos.left + "%",
                top: pos.top + "%",
                background: pos.color,
                animationDuration: pos.duration + "s",
                animationDelay: pos.delay + "s",
              }}
              disabled={isPopped || !!feedback}
              onClick={() => handlePop(opt, i)}
            >
              <span className="balloon-number">{isPopped ? "💥" : opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Connective nudge shown in the Números tab, linking number-recognition
// practice to actual handwriting practice (Writing.jsx, owned by another
// agent). Writing.jsx doesn't currently accept a pre-selected character via
// query param, so this is the lighter-weight version: a plain link with a
// hint telling the child what to look for once there, rather than deep
// linking to a specific digit.
function WriteNumberLink({ t }) {
  const navigate = useNavigate();
  return (
    <div className="game-card math-write-link-card">
      <p className="page-intro">{t("modules.mathWriteNumberHint")}</p>
      <button type="button" className="big-btn" onClick={() => navigate("/writing")}>
        ✏️ {t("modules.mathWriteNumberCta")}
      </button>
    </div>
  );
}

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
  // Multiplication offers multiple-choice or the array/groups counting mode;
  // division offers multiple-choice or the sharing/partition counting mode.
  const [mulMode, setMulMode] = useState("choice");
  const [divMode, setDivMode] = useState("choice");

  function helpKeyFor(key) {
    if (key === "multiplication") {
      return mulMode === "choice" ? "mathHelpMultiplication" : "mathHelpMultiplicationGroups";
    }
    if (key === "division") {
      return divMode === "choice" ? "mathHelpDivision" : "mathHelpDivisionShare";
    }
    return HELP_KEY_BY_ACTIVITY[key];
  }

  const tabs = [
    { key: "counting", label: t("modules.mathCounting"), emoji: "🔢" },
    { key: "numbers", label: t("modules.mathNumbers"), emoji: "🔠" },
    { key: "addsub", label: t("modules.mathAddSub"), emoji: "➕" },
    { key: "multiplication", label: t("modules.mathMultiplication"), emoji: "✖️" },
    { key: "division", label: t("modules.mathDivision"), emoji: "➗" },
    { key: "balloons", label: t("modules.mathBalloons"), emoji: "🎈" },
    { key: "stories", label: t("modules.mathStories"), emoji: "📔" },
  ];

  // Only multiplication/division are age-gated for the youngest tier (per
  // product owner: they're conceptually harder — repeated groups/sharing —
  // than counting, number recognition, or simple add/subtract). Contar,
  // Números, Soma-Subtração and Balões (which reuses add/sub rounds) stay
  // available to every tier without an advisory.
  const GATED_ACTIVITIES = ["multiplication", "division"];

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
        <HelpButton text={t(`modules.${helpKeyFor(activity)}`)} langCode={pair.mother} />
      </div>
      <MascotBubble character="nina" reaction="curious" langCode={pair.mother}>
        {t("mascotLines.mathOpening")}
      </MascotBubble>

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
              text={`${tab.label}. ${t(`modules.${helpKeyFor(tab.key)}`)}`}
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
          pair={pair}
          t={t}
          moduleEvent="math_counting"
          onDone={restart}
          renderPrompt={(round) => (
            <div className="game-emoji">{round.emoji.repeat(round.correct)}</div>
          )}
        />
      )}

      {activity === "numbers" && (
        <>
          <QuizRunner
            key={"numbers-" + seed}
            rounds={buildNumberRounds(tier)}
            profile={profile}
            pair={pair}
            t={t}
            moduleEvent="math_numbers"
            onDone={restart}
            renderPrompt={(round) => (
              <div className="game-emoji">{round.emoji.repeat(round.correct)}</div>
            )}
          />
          <WriteNumberLink t={t} />
        </>
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
              pair={pair}
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
              pair={pair}
              t={t}
              moduleEvent="math_addsub"
              skillId="math-addsub"
              onDone={restart}
            />
          )}
        </>
      )}

      {activity === "multiplication" && (
        <>
          <div className="game-options math-mode-toggle">
            <button
              type="button"
              className={"big-btn game-option" + (mulMode === "choice" ? " correct" : "")}
              onClick={() => setMulMode("choice")}
            >
              🔘 {t("modules.mathModeChoice")}
            </button>
            <button
              type="button"
              className={"big-btn game-option" + (mulMode === "groups" ? " correct" : "")}
              onClick={() => setMulMode("groups")}
            >
              👆 {t("modules.mathModeGroups")}
            </button>
          </div>

          {mulMode === "choice" ? (
            <QuizRunner
              key={"multiplication-choice-" + seed}
              rounds={buildMultiplicationRounds(tier)}
              profile={profile}
              pair={pair}
              t={t}
              moduleEvent="math_multiplication"
              skillId="math-multiplication"
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
          ) : (
            <MultiplicationCountingQuiz
              key={"multiplication-groups-" + seed}
              rounds={buildMultiplicationCountingRounds(tier)}
              profile={profile}
              pair={pair}
              t={t}
              moduleEvent="math_multiplication"
              skillId="math-multiplication"
              onDone={restart}
            />
          )}
        </>
      )}

      {activity === "division" && (
        <>
          <div className="game-options math-mode-toggle">
            <button
              type="button"
              className={"big-btn game-option" + (divMode === "choice" ? " correct" : "")}
              onClick={() => setDivMode("choice")}
            >
              🔘 {t("modules.mathModeChoice")}
            </button>
            <button
              type="button"
              className={"big-btn game-option" + (divMode === "share" ? " correct" : "")}
              onClick={() => setDivMode("share")}
            >
              👆 {t("modules.mathModeShare")}
            </button>
          </div>

          {divMode === "choice" ? (
            <QuizRunner
              key={"division-choice-" + seed}
              rounds={buildDivisionRounds(tier)}
              profile={profile}
              pair={pair}
              t={t}
              moduleEvent="math_division"
              skillId="math-division"
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
          ) : (
            <DivisionCountingQuiz
              key={"division-share-" + seed}
              rounds={buildDivisionCountingRounds(tier)}
              profile={profile}
              pair={pair}
              t={t}
              moduleEvent="math_division"
              skillId="math-division"
              onDone={restart}
            />
          )}
        </>
      )}

      {activity === "balloons" && (
        <BalloonGame
          key={"balloons-" + seed}
          rounds={buildAddSubRounds(tier).slice(0, BALLOON_ROUNDS)}
          profile={profile}
          t={t}
          onDone={restart}
        />
      )}

      {activity === "stories" && (
        <QuizRunner
          key={"stories-" + seed}
          rounds={buildMathStoryRounds()}
          profile={profile}
          pair={pair}
          t={t}
          moduleEvent="math_stories"
          skillId="math-stories"
          onDone={restart}
          renderPrompt={(round) => {
            const storyText = t(`modules.${round.promptKey}`);
            return (
              <>
                <div className="game-emoji">{round.emoji}</div>
                <p className="math-scenario-text">
                  {storyText}
                  <SpeakButton text={storyText} langCode={pair.mother} />
                </p>
              </>
            );
          }}
        />
      )}
    </div>
  );
}
