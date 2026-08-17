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

export default function Phrases() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherPhrases = getPhrases(pair.mother);
  const secondaryPhrases = getPhrases(pair.secondary);
  const count = Math.min(motherPhrases.length, secondaryPhrases.length);
  const [showSyllables, setShowSyllables] = useState(false);
  const motherSyllabifiable = SYLLABIFIABLE_LANGS.has(pair.mother);
  const secondarySyllabifiable = SYLLABIFIABLE_LANGS.has(pair.secondary);

  function handleView(phrase) {
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "phrases", event: `phrase_viewed:${phrase}` });
    recordSkillEvent(profile?.name, "phrase-viewed", true);
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
              onClick={() => handleView(m.phrase)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleView(m.phrase);
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
