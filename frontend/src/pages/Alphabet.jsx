import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlphabet, SUPPORTED_LANGUAGES } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

function labelFor(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label || code;
}

// Same "vowels + easiest, most frequent consonants first" pedagogical order
// as content/dailyPath.js's PRIORITY_LETTERS (the source of truth for this
// product decision) — kept as a small local mirror rather than importing
// dailyPath.js, since dailyPath.js is about the daily-mission sequencer, not
// letter-grid display, and this list is tiny/stable.
const PRIORITY_LETTERS = ["A", "E", "I", "O", "U", "M", "P", "L", "S", "T"];

// Reorders the letter grid tiles (priority letters first, in that order,
// then the rest as-is) WITHOUT touching the underlying motherLetters array
// or its indices — tiles still carry their original array index so tapping
// one still correctly selects the matching secondary-language letter.
function beginnerTileOrder(letters) {
  const withIndex = letters.map((l, i) => ({ l, i }));
  const byUpper = new Map(withIndex.map((e) => [e.l.upper, e]));
  const ordered = [];
  const seen = new Set();
  for (const letter of PRIORITY_LETTERS) {
    const entry = byUpper.get(letter);
    if (entry && !seen.has(letter)) {
      ordered.push(entry);
      seen.add(letter);
    }
  }
  for (const entry of withIndex) {
    if (!seen.has(entry.l.upper)) {
      ordered.push(entry);
      seen.add(entry.l.upper);
    }
  }
  return ordered;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple picture+word multiple-choice mini-quiz shown below the currently
// selected letter, built entirely from data already present on the
// alphabet entries (each letter's own exampleWord/emoji becomes the
// question, two other letters become distractors) — no extra per-language
// content needed. Anti-guessing: wrong taps disable that option instead of
// allowing repeated blind clicks. Mirrors HumanEvolution/Whys' quiz pattern.
function LetterQuiz({ letters, target, pair, profile, t }) {
  const [options] = useState(() => {
    const others = shuffle(letters.filter((l) => l.upper !== target.upper)).slice(0, 2);
    return shuffle([target, ...others]);
  });
  const [wrongUppers, setWrongUppers] = useState([]);
  const [solved, setSolved] = useState(false);

  if (options.length < 3) return null;

  function pick(option) {
    if (solved) return;
    if (option.upper === target.upper) {
      setSolved(true);
      recordSkillEvent(profile?.name, "alphabet-quiz", wrongUppers.length === 0);
      pingProgress({ profileName: profile?.name, module: "alphabet", event: `quiz_solved:${target.upper}` });
    } else {
      setWrongUppers((prev) => (prev.includes(option.upper) ? prev : [...prev, option.upper]));
      pingProgress({ profileName: profile?.name, module: "alphabet", event: `quiz_attempt:${target.upper}` });
    }
  }

  const prompt = t("modules.alphabetQuizPrompt");

  return (
    <div className="game-card">
      <div className="game-emoji">{target.emoji}</div>
      <p className="mission-badge science-topic-badge">{t("modules.alphabetQuizTitle")}</p>
      <p className="page-intro">
        {target.exampleWord} — {prompt}
        <SpeakButton text={`${target.exampleWord}. ${prompt}`} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.upper}>
            <button
              type="button"
              disabled={solved || wrongUppers.includes(opt.upper)}
              className={
                "big-btn game-option" +
                (solved && opt.upper === target.upper ? " correct" : "") +
                (wrongUppers.includes(opt.upper) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.upper}
            </button>
            <SpeakButton text={opt.upper} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.alphabetQuizCorrect")}</p>
          <SpeakButton text={t("modules.alphabetQuizCorrect")} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

export default function Alphabet() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherLetters = getAlphabet(pair.mother);
  const secondaryLetters = getAlphabet(pair.secondary);
  const [index, setIndex] = useState(0);
  const [beginnerFirst, setBeginnerFirst] = useState(true);
  const tileOrder = beginnerFirst ? beginnerTileOrder(motherLetters) : motherLetters.map((l, i) => ({ l, i }));

  const motherLetter = motherLetters[index];
  const secondaryLetter = secondaryLetters[index];

  function handleSelect(i) {
    setIndex(i);
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "alphabet", event: "letter_viewed" });
    recordSkillEvent(profile?.name, "alphabet-letter", true);
  }

  if (!motherLetter || !secondaryLetter) return null;

  return (
    <div className="page">
      <h1>{t("modules.alphabetTitle")} 🔤</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.alphabetHelp")} langCode={pair.mother} />
      </div>

      <div className="letter-card">
        <div className="letter-forms">
          <div className="letter-form">
            <div className="letter-big letter-come-alive" key={"mother-print-" + motherLetter.upper}>
              <span>{motherLetter.upper}</span>
              <span className="letter-lower">{motherLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.printForm")}</div>
          </div>
          <div className="letter-form">
            <div className="letter-big font-handwritten letter-come-alive" key={"mother-hand-" + motherLetter.upper}>
              <span>{motherLetter.upper}</span>
              <span className="letter-lower">{motherLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.handwrittenForm")}</div>
          </div>
        </div>
        <div className="letter-emoji letter-emoji-alive" key={"mother-emoji-" + motherLetter.upper}>{motherLetter.emoji}</div>
        <div className="letter-word">
          {motherLetter.exampleWord}
          <SpeakButton text={motherLetter.pronunciationHint} langCode={pair.mother} />
        </div>
        <div className="lang-tag">{labelFor(pair.mother)}</div>
      </div>

      <div className="letter-divider">/</div>

      <div className="letter-card secondary">
        <div className="letter-forms">
          <div className="letter-form">
            <div className="letter-big letter-come-alive" key={"secondary-print-" + secondaryLetter.upper}>
              <span>{secondaryLetter.upper}</span>
              <span className="letter-lower">{secondaryLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.printForm")}</div>
          </div>
          <div className="letter-form">
            <div className="letter-big font-handwritten letter-come-alive" key={"secondary-hand-" + secondaryLetter.upper}>
              <span>{secondaryLetter.upper}</span>
              <span className="letter-lower">{secondaryLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.handwrittenForm")}</div>
          </div>
        </div>
        <div className="letter-emoji letter-emoji-alive" key={"secondary-emoji-" + secondaryLetter.upper}>{secondaryLetter.emoji}</div>
        <div className="letter-word">
          {secondaryLetter.exampleWord}
          <SpeakButton text={secondaryLetter.pronunciationHint} langCode={pair.secondary} />
        </div>
        <div className="lang-tag">{labelFor(pair.secondary)}</div>
      </div>

      <LetterQuiz key={motherLetter.upper} letters={motherLetters} target={motherLetter} pair={pair} profile={getProfile()} t={t} />

      <div className="phonics-tabs">
        <button
          type="button"
          className={"phonics-tab" + (beginnerFirst ? " selected" : "")}
          onClick={() => setBeginnerFirst(true)}
        >
          🌱 {t("modules.alphabetBeginnerFirst")}
        </button>
        <button
          type="button"
          className={"phonics-tab" + (!beginnerFirst ? " selected" : "")}
          onClick={() => setBeginnerFirst(false)}
        >
          🔤 {t("modules.alphabetFullOrder")}
        </button>
      </div>

      <div className="letter-grid">
        {tileOrder.map(({ l, i }) => (
          <button
            key={l.letter + i}
            type="button"
            className={"letter-tile" + (i === index ? " selected" : "")}
            onClick={() => handleSelect(i)}
          >
            {l.upper}
          </button>
        ))}
      </div>
    </div>
  );
}
