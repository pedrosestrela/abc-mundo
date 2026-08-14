import React from "react";
import { useTranslation } from "react-i18next";
import { getReading } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

export default function Reading() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherWords = getReading(pair.mother);
  const secondaryWords = getReading(pair.secondary);
  const count = Math.min(motherWords.length, secondaryWords.length);

  function handleView(word) {
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "reading", event: `word_viewed:${word}` });
    recordSkillEvent(profile?.name, "reading-word", true);
  }

  return (
    <div className="page">
      <h1>{t("modules.readingTitle")} 📖</h1>
      <div className="reading-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherWords[i];
          const s = secondaryWords[i];
          return (
            <div className="reading-card" key={i} onClick={() => handleView(m.word)}>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
