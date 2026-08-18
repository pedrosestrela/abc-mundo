import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getReading } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import { IllustrationBook } from "../components/illustrations/index.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple picture+word multiple-choice mini-quiz shown once a reading card
// is opened, built entirely from data already present on the reading list
// (the emoji is the question, the matching word is the correct option, two
// other words become distractors) — no extra per-language content needed.
// Anti-guessing: wrong taps disable that option instead of allowing
// repeated blind clicks. Mirrors Whys/HumanEvolution's quiz pattern.
function WordQuiz({ words, target, pair, profile, t }) {
  const [options] = useState(() => {
    const others = shuffle(words.filter((w) => w.word !== target.word)).slice(0, 2);
    return shuffle([target, ...others]);
  });
  const [wrongWords, setWrongWords] = useState([]);
  const [solved, setSolved] = useState(false);

  if (options.length < 3) return null;

  function pick(option) {
    if (solved) return;
    if (option.word === target.word) {
      setSolved(true);
      recordSkillEvent(profile?.name, "reading-quiz", wrongWords.length === 0);
      pingProgress({ profileName: profile?.name, module: "reading", event: `quiz_solved:${target.word}` });
    } else {
      setWrongWords((prev) => (prev.includes(option.word) ? prev : [...prev, option.word]));
      pingProgress({ profileName: profile?.name, module: "reading", event: `quiz_attempt:${target.word}` });
    }
  }

  const prompt = t("modules.readingQuizPrompt");

  return (
    <div className="game-card">
      <div className="game-emoji">{target.emoji}</div>
      <p className="mission-badge science-topic-badge">{t("modules.readingQuizTitle")}</p>
      <p className="page-intro">
        {prompt}
        <SpeakButton text={prompt} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.word}>
            <button
              type="button"
              disabled={solved || wrongWords.includes(opt.word)}
              className={
                "big-btn game-option" +
                (solved && opt.word === target.word ? " correct" : "") +
                (wrongWords.includes(opt.word) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.word}
            </button>
            <SpeakButton text={opt.word} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.readingQuizCorrect")}</p>
          <SpeakButton text={t("modules.readingQuizCorrect")} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

export default function Reading() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const motherWords = getReading(pair.mother);
  const secondaryWords = getReading(pair.secondary);
  const count = Math.min(motherWords.length, secondaryWords.length);
  const [openIndex, setOpenIndex] = useState(null);

  function handleView(word, index) {
    pingProgress({ profileName: profile?.name, module: "reading", event: `word_viewed:${word}` });
    recordSkillEvent(profile?.name, "reading-word", true);
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="page">
      <h1>{t("modules.readingTitle")} 📖</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.readingHelpMain")} langCode={pair.mother} />
      </div>
      <IllustrationBook size={40} />
      <div className="reading-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherWords[i];
          const s = secondaryWords[i];
          return (
            <div
              className="reading-card"
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => handleView(m.word, i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleView(m.word, i);
                }
              }}
            >
              <div className="reading-emoji">{m.emoji}</div>
              <div className="reading-words">
                <div className="reading-word-row">
                  <span className="reading-word">{m.word}</span>
                  <SpeakButton text={m.hint} langCode={pair.mother} />
                </div>
                <div className="reading-word-row secondary">
                  <span className="reading-word">{s.word}</span>
                  <SpeakButton text={s.hint} langCode={pair.secondary} />
                </div>
              </div>
              {openIndex === i && (
                <div onClick={(e) => e.stopPropagation()}>
                  <WordQuiz key={m.word} words={motherWords} target={m} pair={pair} profile={profile} t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
