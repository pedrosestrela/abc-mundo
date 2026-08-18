import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlphabet, SUPPORTED_LANGUAGES } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

function labelFor(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label || code;
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
            <div className="letter-big">
              <span>{motherLetter.upper}</span>
              <span className="letter-lower">{motherLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.printForm")}</div>
          </div>
          <div className="letter-form">
            <div className="letter-big font-handwritten">
              <span>{motherLetter.upper}</span>
              <span className="letter-lower">{motherLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.handwrittenForm")}</div>
          </div>
        </div>
        <div className="letter-emoji">{motherLetter.emoji}</div>
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
            <div className="letter-big">
              <span>{secondaryLetter.upper}</span>
              <span className="letter-lower">{secondaryLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.printForm")}</div>
          </div>
          <div className="letter-form">
            <div className="letter-big font-handwritten">
              <span>{secondaryLetter.upper}</span>
              <span className="letter-lower">{secondaryLetter.lower}</span>
            </div>
            <div className="letter-form-label">{t("modules.handwrittenForm")}</div>
          </div>
        </div>
        <div className="letter-emoji">{secondaryLetter.emoji}</div>
        <div className="letter-word">
          {secondaryLetter.exampleWord}
          <SpeakButton text={secondaryLetter.pronunciationHint} langCode={pair.secondary} />
        </div>
        <div className="lang-tag">{labelFor(pair.secondary)}</div>
      </div>

      <LetterQuiz key={motherLetter.upper} letters={motherLetters} target={motherLetter} pair={pair} profile={getProfile()} t={t} />

      <div className="letter-grid">
        {motherLetters.map((l, i) => (
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
