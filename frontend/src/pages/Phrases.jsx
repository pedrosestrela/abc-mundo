import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getPhrases } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import { syllabifyPhrase, SYLLABIFIABLE_LANGS } from "../utils/syllabify.js";

function PhraseWords({ phrase, langCode, className, secondary }) {
  const canSyllabify = SYLLABIFIABLE_LANGS.has(langCode);
  const breakdown = canSyllabify ? syllabifyPhrase(phrase, langCode) : [];
  return (
    <div className={`syllable-breakdown${secondary ? " secondary" : ""} ${className || ""}`}>
      {breakdown.map(({ word, syllables }, wi) => (
        <span key={wi} className="phrase-syllable-word">
          {syllables.map((chunk, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="syllable-sep">-</span>}
              <span className="syllable-part">{chunk}</span>
            </React.Fragment>
          ))}
        </span>
      ))}
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple picture+phrase multiple-choice mini-quiz shown once a phrase card
// is opened, built entirely from data already present on the phrases list
// (the emoji is the question, the matching phrase is the correct option,
// two other phrases become distractors) — no extra per-language content
// needed. Anti-guessing: wrong taps disable that option instead of
// allowing repeated blind clicks. Mirrors Whys/HumanEvolution's quiz
// pattern.
function PhraseQuiz({ phrases, target, pair, profile, t }) {
  const [options] = useState(() => {
    const others = shuffle(phrases.filter((p) => p.phrase !== target.phrase)).slice(0, 2);
    return shuffle([target, ...others]);
  });
  const [wrongPhrases, setWrongPhrases] = useState([]);
  const [solved, setSolved] = useState(false);

  if (options.length < 3) return null;

  function pick(option) {
    if (solved) return;
    if (option.phrase === target.phrase) {
      setSolved(true);
      recordSkillEvent(profile?.name, "phrases-quiz", wrongPhrases.length === 0);
      pingProgress({ profileName: profile?.name, module: "phrases", event: `quiz_solved:${target.phrase}` });
    } else {
      setWrongPhrases((prev) => (prev.includes(option.phrase) ? prev : [...prev, option.phrase]));
      pingProgress({ profileName: profile?.name, module: "phrases", event: `quiz_attempt:${target.phrase}` });
    }
  }

  const prompt = t("modules.phrasesQuizPrompt");

  return (
    <div className="game-card">
      <div className="game-emoji">{target.emoji}</div>
      <p className="mission-badge science-topic-badge">{t("modules.phrasesQuizTitle")}</p>
      <p className="page-intro">
        {prompt}
        <SpeakButton text={prompt} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.phrase}>
            <button
              type="button"
              disabled={solved || wrongPhrases.includes(opt.phrase)}
              className={
                "big-btn game-option" +
                (solved && opt.phrase === target.phrase ? " correct" : "") +
                (wrongPhrases.includes(opt.phrase) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.phrase}
            </button>
            <SpeakButton text={opt.phrase} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.phrasesQuizCorrect")}</p>
          <SpeakButton text={t("modules.phrasesQuizCorrect")} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

export default function Phrases() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const motherPhrases = getPhrases(pair.mother);
  const secondaryPhrases = getPhrases(pair.secondary);
  const count = Math.min(motherPhrases.length, secondaryPhrases.length);
  const [showSyllables, setShowSyllables] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const motherSyllabifiable = SYLLABIFIABLE_LANGS.has(pair.mother);
  const secondarySyllabifiable = SYLLABIFIABLE_LANGS.has(pair.secondary);

  function handleView(phrase, index) {
    pingProgress({ profileName: profile?.name, module: "phrases", event: `phrase_viewed:${phrase}` });
    recordSkillEvent(profile?.name, "phrase-viewed", true);
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="page">
      <h1>{t("modules.phrasesTitle")} 💬</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.phrasesHelpMain")} langCode={pair.mother} />
      </div>
      {motherSyllabifiable && (
        <div className="phrase-syllable-toggle-row">
          <button
            type="button"
            className="phrase-syllable-toggle"
            onClick={() => setShowSyllables((v) => !v)}
          >
            {showSyllables ? t("modules.phrasesHideSyllables") : t("modules.phrasesShowSyllables")}
          </button>
        </div>
      )}
      <div className="reading-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherPhrases[i];
          const s = secondaryPhrases[i];
          return (
            <div
              className="reading-card phrase-card"
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => handleView(m.phrase, i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleView(m.phrase, i);
                }
              }}
            >
              <div className="reading-emoji">{m.emoji}</div>
              <div className="reading-words">
                <div className="reading-word-row phrase-row">
                  {showSyllables && motherSyllabifiable ? (
                    <PhraseWords phrase={m.phrase} langCode={pair.mother} />
                  ) : (
                    <span className="reading-word">{m.phrase}</span>
                  )}
                  <SpeakButton text={m.hint} langCode={pair.mother} />
                </div>
                <div className="reading-word-row secondary phrase-row">
                  {showSyllables && secondarySyllabifiable ? (
                    <PhraseWords phrase={s.phrase} langCode={pair.secondary} secondary />
                  ) : (
                    <span className="reading-word">{s.phrase}</span>
                  )}
                  <SpeakButton text={s.hint} langCode={pair.secondary} />
                </div>
              </div>
              {openIndex === i && (
                <div onClick={(e) => e.stopPropagation()}>
                  <PhraseQuiz key={m.phrase} phrases={motherPhrases} target={m} pair={pair} profile={profile} t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
