import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSyllables } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import SyllableSpeakButton from "../components/SyllableSpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { pickLine } from "../components/mascots/reactionLines.js";

// Consonant-cluster/digraph fragments used to pick out the "special sound"
// syllable inside a `digraph: true` word, per mother-tongue language.
const DIGRAPH_FRAGMENTS = {
  pt: ["nh", "lh", "ch"],
  en: ["sh", "ch", "th", "wh"],
  de: ["sch", "ch"],
  fr: ["ch", "gn"],
  es: ["ll", "ch", "ñ"],
  it: ["gn", "gl", "sc"],
  zh: [],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TIER_ROUNDS = { 1: 4, 2: 6, 3: 8 };

// Same "vowels + easiest, most frequent consonants first" pedagogical set as
// content/dailyPath.js's PRIORITY_LETTERS (the source of truth) — mirrored
// locally like Alphabet.jsx does, since this is about list display, not the
// daily-mission sequencer itself.
const PRIORITY_LETTERS = ["A", "E", "I", "O", "U", "M", "P", "L", "S", "T"];

function isBeginnerSyllable(entry) {
  const first = entry?.syllable?.[0]?.toUpperCase();
  return first ? PRIORITY_LETTERS.includes(first) : false;
}

function multiSyllableWords(words) {
  return words.filter((w) => Array.isArray(w.syllables) && w.syllables.length >= 2);
}

function buildOrderRounds(words, count) {
  const pool = shuffle(multiSyllableWords(words));
  const rounds = [];
  for (const target of pool) {
    if (rounds.length >= count) break;
    let order = shuffle(target.syllables.map((s, i) => ({ value: s, id: i })));
    if (order.length > 1 && order.every((c, i) => c.value === target.syllables[i])) {
      order = shuffle(order);
    }
    rounds.push({ target, chips: order });
  }
  return rounds;
}

function buildMissingRounds(words, count, optionCount) {
  const pool = shuffle(multiSyllableWords(words));
  const rounds = [];
  for (const target of pool) {
    if (rounds.length >= count) break;
    const blankIndex = Math.floor(Math.random() * target.syllables.length);
    const correct = target.syllables[blankIndex];
    const distractorPool = shuffle(
      words.flatMap((w) => (w === target ? [] : w.syllables || [])).filter((s) => s !== correct)
    );
    const distractors = [];
    for (const d of distractorPool) {
      if (distractors.length >= optionCount - 1) break;
      if (!distractors.includes(d)) distractors.push(d);
    }
    if (distractors.length < optionCount - 1) continue;
    rounds.push({
      target,
      blankIndex,
      options: shuffle([correct, ...distractors]),
    });
  }
  return rounds;
}

function buildSplitRounds(words, count) {
  const pool = shuffle(multiSyllableWords(words));
  const rounds = [];
  for (const target of pool) {
    if (rounds.length >= count) break;
    const letters = target.syllables.join("");
    const correct = target.syllables.join("-");
    const wrongJoined = letters; // no dashes at all
    const wrongLetters = letters.split("").join("-"); // every letter its own chunk
    const wrongOptions = [wrongJoined, wrongLetters].filter((o) => o !== correct);
    if (wrongOptions.length < 2) continue;
    rounds.push({ target, options: shuffle([correct, ...wrongOptions.slice(0, 2)]) });
  }
  return rounds;
}

function buildDigraphRounds(words, count, fragments) {
  if (!fragments.length) return [];
  const pool = shuffle(multiSyllableWords(words).filter((w) => w.digraph));
  const rounds = [];
  for (const target of pool) {
    if (rounds.length >= count) break;
    const targetIndex = target.syllables.findIndex((chunk) =>
      fragments.some((f) => chunk.toLowerCase().includes(f))
    );
    if (targetIndex < 0) continue;
    rounds.push({ target, options: shuffle(target.syllables), correctChunk: target.syllables[targetIndex] });
  }
  return rounds;
}

export default function Syllables() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const roundCount = TIER_ROUNDS[tier] || TIER_ROUNDS[1];
  const optionCount = tier >= 3 ? 4 : 3;

  const motherSyllables = getSyllables(pair.mother);
  const secondarySyllables = getSyllables(pair.secondary);
  const listCount = Math.min(motherSyllables.length, secondarySyllables.length);
  const fragments = DIGRAPH_FRAGMENTS[pair.mother] || [];

  const [mode, setMode] = useState("list");
  const [beginnerFirst, setBeginnerFirst] = useState(true);
  const beginnerIndexes = useMemo(() => {
    const idxs = [];
    for (let i = 0; i < Math.min(motherSyllables.length, secondarySyllables.length); i++) {
      if (isBeginnerSyllable(motherSyllables[i])) idxs.push(i);
    }
    return idxs;
  }, [motherSyllables, secondarySyllables]);
  const hasBeginnerSubset = beginnerIndexes.length > 0 && beginnerIndexes.length < listCount;

  const helpTextByMode = {
    list: t("modules.syllablesHelpMain"),
    build: t("modules.syllablesHelpBuild"),
    missing: t("modules.syllablesHelpMissing"),
    split: t("modules.syllablesHelpSplit"),
    digraph: t("modules.syllablesHelpDigraph"),
  };

  const orderRounds = useMemo(
    () => buildOrderRounds(motherSyllables, roundCount),
    [motherSyllables, roundCount, mode]
  );
  const missingRounds = useMemo(
    () => buildMissingRounds(motherSyllables, roundCount, optionCount),
    [motherSyllables, roundCount, optionCount, mode]
  );
  const splitRounds = useMemo(
    () => buildSplitRounds(motherSyllables, roundCount),
    [motherSyllables, roundCount, mode]
  );
  const digraphRounds = useMemo(
    () => buildDigraphRounds(motherSyllables, roundCount, fragments),
    [motherSyllables, roundCount, fragments, mode]
  );

  const hasDigraph = digraphRounds.length > 0 || fragments.length > 0;

  function handleView(syllable) {
    pingProgress({ profileName: profile?.name, module: "syllables", event: `syllable_viewed:${syllable}` });
    recordSkillEvent(profile?.name, "syllable-viewed", true);
  }

  return (
    <div className="page">
      <h1>{t("modules.syllablesTitle")} 🧩</h1>
      <p className="page-intro">{t("modules.syllablesIntro")}</p>
      <MascotBubble character="lumi" reaction="curious" langCode={pair.mother}>
        {t("mascotLines.syllablesOpening")}
      </MascotBubble>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (mode === "list" ? " selected" : "")} onClick={() => setMode("list")}>
          <span className="phonics-tab-inner">
            📖 {t("modules.syllablesTabList")}
            <TabSpeakIcon text={`${t("modules.syllablesTabList")}. ${helpTextByMode.list}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (mode === "build" ? " selected" : "")} onClick={() => setMode("build")}>
          <span className="phonics-tab-inner">
            🧱 {t("modules.syllablesTabBuild")}
            <TabSpeakIcon text={`${t("modules.syllablesTabBuild")}. ${helpTextByMode.build}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (mode === "missing" ? " selected" : "")} onClick={() => setMode("missing")}>
          <span className="phonics-tab-inner">
            ❓ {t("modules.syllablesTabMissing")}
            <TabSpeakIcon text={`${t("modules.syllablesTabMissing")}. ${helpTextByMode.missing}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (mode === "split" ? " selected" : "")} onClick={() => setMode("split")}>
          <span className="phonics-tab-inner">
            ✂️ {t("modules.syllablesTabSplit")}
            <TabSpeakIcon text={`${t("modules.syllablesTabSplit")}. ${helpTextByMode.split}`} langCode={pair.mother} />
          </span>
        </button>
        {hasDigraph && (
          <button type="button" className={"phonics-tab" + (mode === "digraph" ? " selected" : "")} onClick={() => setMode("digraph")}>
            <span className="phonics-tab-inner">
              🔤 {t("modules.syllablesTabDigraph")}
              <TabSpeakIcon text={`${t("modules.syllablesTabDigraph")}. ${helpTextByMode.digraph}`} langCode={pair.mother} />
            </span>
          </button>
        )}
      </div>

      <div className="help-btn-corner">
        <HelpButton text={helpTextByMode[mode]} langCode={pair.mother} />
      </div>

      {mode === "list" && (
        <>
          {hasBeginnerSubset && (
            <div className="phonics-tabs">
              <button
                type="button"
                className={"phonics-tab" + (beginnerFirst ? " selected" : "")}
                onClick={() => setBeginnerFirst(true)}
              >
                🌱 {t("modules.syllablesBeginnerFirst")}
              </button>
              <button
                type="button"
                className={"phonics-tab" + (!beginnerFirst ? " selected" : "")}
                onClick={() => setBeginnerFirst(false)}
              >
                🧩 {t("modules.syllablesFullList")}
              </button>
            </div>
          )}
          <div className="reading-list">
          {(beginnerFirst && hasBeginnerSubset ? beginnerIndexes : Array.from({ length: listCount }, (_, i) => i)).map((i) => {
            const m = motherSyllables[i];
            const s = secondarySyllables[i];
            return (
              <div
                className="reading-card"
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => handleView(m.syllable)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleView(m.syllable);
                  }
                }}
              >
                <div className="reading-emoji">{m.emoji}</div>
                <div className="reading-words">
                  <div className="reading-word-row">
                    <span className="syllable-badge">{m.syllable}</span>
                    <span className="reading-word">{m.exampleWord}</span>
                    <SpeakButton text={m.hint} langCode={pair.mother} />
                  </div>
                  {Array.isArray(m.syllables) && m.syllables.length >= 2 && (
                    <div className="syllable-breakdown">
                      {m.syllables.map((chunk, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span className="syllable-sep">-</span>}
                          <span className="syllable-part">{chunk}</span>
                        </React.Fragment>
                      ))}
                      <SyllableSpeakButton syllables={m.syllables} langCode={pair.mother} />
                    </div>
                  )}
                  <div className="reading-word-row secondary">
                    <span className="syllable-badge secondary">{s.syllable}</span>
                    <span className="reading-word">{s.exampleWord}</span>
                    <SpeakButton text={s.hint} langCode={pair.secondary} />
                  </div>
                  {Array.isArray(s.syllables) && s.syllables.length >= 2 && (
                    <div className="syllable-breakdown secondary">
                      {s.syllables.map((chunk, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span className="syllable-sep">-</span>}
                          <span className="syllable-part">{chunk}</span>
                        </React.Fragment>
                      ))}
                      <SyllableSpeakButton syllables={s.syllables} langCode={pair.secondary} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {mode === "build" && <BuildGame rounds={orderRounds} pair={pair} profile={profile} t={t} />}
      {mode === "missing" && <MissingGame rounds={missingRounds} pair={pair} profile={profile} t={t} />}
      {mode === "split" && <SplitGame rounds={splitRounds} pair={pair} profile={profile} t={t} />}
      {mode === "digraph" && hasDigraph && (
        <DigraphGame rounds={digraphRounds} pair={pair} profile={profile} t={t} />
      )}
    </div>
  );
}

function ScoreFooter({ score, total, done, onReplay, pair, t }) {
  if (!done) return null;
  return (
    <div className="game-card">
      <p>
        {t("modules.phonicsScore")}: {score} / {total}
      </p>
      {pair && (
        <MascotBubble character="lumi" reaction="resting" langCode={pair.mother}>
          {t("mascotLines.genericClosing")}
        </MascotBubble>
      )}
      <button type="button" className="big-btn" onClick={onReplay}>
        {t("modules.phonicsPlayAgain")}
      </button>
    </div>
  );
}

// "Juntar sílabas" / "ordenar sílabas": tap syllable chips (scrambled) in the
// correct order to build the target word. Wrong taps grey out just that chip
// (still visible, not removed) rather than letting the child spam every chip.
function BuildGame({ rounds, pair, profile, t }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);
  const [builtCount, setBuiltCount] = useState(0);
  const [wrongIds, setWrongIds] = useState([]);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [complete, setComplete] = useState(false);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];

  function resetRoundState() {
    setBuiltCount(0);
    setWrongIds([]);
    setWrongTaps(0);
    setComplete(false);
  }

  function handleTapChip(chip) {
    if (complete || wrongIds.includes(chip.id)) return;
    const expected = round.target.syllables[builtCount];
    if (chip.value === expected) {
      const next = builtCount + 1;
      setBuiltCount(next);
      if (next >= round.target.syllables.length) {
        const success = wrongTaps <= 1;
        setComplete(true);
        if (success) setScore((s) => s + 1);
        recordSkillEvent(profile?.name, "syllable-build", success);
        pingProgress({ profileName: profile?.name, module: "syllables", event: `build:${success ? "correct" : "wrong"}` });
        setTimeout(() => {
          if (roundIndex + 1 >= rounds.length) setDone(true);
          else {
            setRoundIndex((r) => r + 1);
            resetRoundState();
          }
        }, 900);
      }
    } else {
      setWrongIds((w) => [...w, chip.id]);
      setWrongTaps((n) => n + 1);
    }
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setDone(false);
    resetRoundState();
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-prompt-row">
        <span className="game-option-emoji">{round.target.emoji}</span>
        <SpeakButton text={round.target.exampleWord} langCode={pair.mother} />
        <SyllableSpeakButton syllables={round.target.syllables} langCode={pair.mother} />
      </div>
      <div className="syllable-slots">
        {round.target.syllables.map((s, i) => (
          <span key={i} className="syllable-slot">
            {i < builtCount ? s : ""}
          </span>
        ))}
      </div>
      <div className="syllable-chip-row">
        {round.chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={"syllable-chip" + (wrongIds.includes(chip.id) ? " wrong" : "")}
            onClick={() => handleTapChip(chip)}
            disabled={wrongIds.includes(chip.id) || complete}
          >
            {chip.value}
          </button>
        ))}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} pair={pair} t={t} />
    </div>
  );
}

// "Sílaba em falta": multiple choice fill-in-the-blank. Wrong options grey out
// and stay disabled (visible, not removed); XP only awarded if correct within
// the first two attempts.
function MissingGame({ rounds, pair, profile, t }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);
  const [wrongOptions, setWrongOptions] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];
  const correct = round.target.syllables[round.blankIndex];

  function handleAnswer(option) {
    if (solved || wrongOptions.includes(option)) return;
    if (option === correct) {
      const success = attempts < 2;
      setSolved(true);
      if (success) setScore((s) => s + 1);
      recordSkillEvent(profile?.name, "syllable-missing", success);
      pingProgress({ profileName: profile?.name, module: "syllables", event: `missing:${success ? "correct" : "wrong"}` });
      setTimeout(() => {
        if (roundIndex + 1 >= rounds.length) setDone(true);
        else {
          setRoundIndex((r) => r + 1);
          setWrongOptions([]);
          setAttempts(0);
          setSolved(false);
        }
      }, 900);
    } else {
      setWrongOptions((w) => [...w, option]);
      setAttempts((n) => n + 1);
    }
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setDone(false);
    setWrongOptions([]);
    setAttempts(0);
    setSolved(false);
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-prompt-row">
        <span className="game-option-emoji">{round.target.emoji}</span>
        <SpeakButton text={round.target.exampleWord} langCode={pair.mother} />
        <SyllableSpeakButton syllables={round.target.syllables} langCode={pair.mother} />
      </div>
      <div className="syllable-slots">
        {round.target.syllables.map((s, i) => (
          <span key={i} className={"syllable-slot" + (i === round.blankIndex ? " blank" : "")}>
            {i === round.blankIndex ? (solved ? s : "?") : s}
          </span>
        ))}
      </div>
      <div className="game-options">
        {round.options.map((opt, i) => (
          <button
            key={opt + i}
            type="button"
            className={"game-option" + (wrongOptions.includes(opt) ? " wrong" : "") + (solved && opt === correct ? " correct" : "")}
            onClick={() => handleAnswer(opt)}
            disabled={wrongOptions.includes(opt) || solved}
          >
            {opt}
          </button>
        ))}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} pair={pair} t={t} />
    </div>
  );
}

// "Separar palavra em sílabas": pick the correctly hyphenated syllable split
// among a few plausible-looking options.
function SplitGame({ rounds, pair, profile, t }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);
  const [wrongOptions, setWrongOptions] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];
  const correct = round.target.syllables.join("-");

  function handleAnswer(option) {
    if (solved || wrongOptions.includes(option)) return;
    if (option === correct) {
      const success = attempts < 2;
      setSolved(true);
      if (success) setScore((s) => s + 1);
      recordSkillEvent(profile?.name, "syllable-split", success);
      pingProgress({ profileName: profile?.name, module: "syllables", event: `split:${success ? "correct" : "wrong"}` });
      setTimeout(() => {
        if (roundIndex + 1 >= rounds.length) setDone(true);
        else {
          setRoundIndex((r) => r + 1);
          setWrongOptions([]);
          setAttempts(0);
          setSolved(false);
        }
      }, 900);
    } else {
      setWrongOptions((w) => [...w, option]);
      setAttempts((n) => n + 1);
    }
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setDone(false);
    setWrongOptions([]);
    setAttempts(0);
    setSolved(false);
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-prompt-row">
        <span className="game-option-emoji">{round.target.emoji}</span>
        <span className="game-prompt">{round.target.exampleWord}</span>
        <SpeakButton text={round.target.exampleWord} langCode={pair.mother} />
        <SyllableSpeakButton syllables={round.target.syllables} langCode={pair.mother} />
      </div>
      <div className="game-options">
        {round.options.map((opt, i) => (
          <button
            key={opt + i}
            type="button"
            className={"game-option" + (wrongOptions.includes(opt) ? " wrong" : "") + (solved && opt === correct ? " correct" : "")}
            onClick={() => handleAnswer(opt)}
            disabled={wrongOptions.includes(opt) || solved}
          >
            {opt}
          </button>
        ))}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} pair={pair} t={t} />
    </div>
  );
}

// "Encontros consonantais / dígrafos": tap the syllable chunk that carries
// the special two-letter sound (NH, LH, CH, SCH, GN, LL, ...).
function DigraphGame({ rounds, pair, profile, t }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0);
  const [wrongOptions, setWrongOptions] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];

  function handleAnswer(opt, i) {
    const key = opt + i;
    if (solved || wrongOptions.includes(key)) return;
    if (opt === round.correctChunk) {
      const success = attempts < 2;
      setSolved(true);
      if (success) setScore((s) => s + 1);
      recordSkillEvent(profile?.name, "syllable-digraph", success);
      pingProgress({ profileName: profile?.name, module: "syllables", event: `digraph:${success ? "correct" : "wrong"}` });
      setTimeout(() => {
        if (roundIndex + 1 >= rounds.length) setDone(true);
        else {
          setRoundIndex((r) => r + 1);
          setWrongOptions([]);
          setAttempts(0);
          setSolved(false);
        }
      }, 900);
    } else {
      setWrongOptions((w) => [...w, key]);
      setAttempts((n) => n + 1);
    }
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setDone(false);
    setWrongOptions([]);
    setAttempts(0);
    setSolved(false);
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-prompt-row">
        <span className="game-option-emoji">{round.target.emoji}</span>
        <span className="game-prompt">{round.target.exampleWord}</span>
        <SpeakButton text={round.target.exampleWord} langCode={pair.mother} />
        <SyllableSpeakButton syllables={round.target.syllables} langCode={pair.mother} />
      </div>
      <div className="game-options">
        {round.options.map((opt, i) => {
          const key = opt + i;
          return (
            <button
              key={key}
              type="button"
              className={"game-option" + (wrongOptions.includes(key) ? " wrong" : "") + (solved && opt === round.correctChunk ? " correct" : "")}
              onClick={() => handleAnswer(opt, i)}
              disabled={wrongOptions.includes(key) || solved}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} pair={pair} t={t} />
    </div>
  );
}
