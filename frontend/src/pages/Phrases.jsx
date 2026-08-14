import React from "react";
import { useTranslation } from "react-i18next";
import { getPhrases } from "../content/index.js";
import { getLangPair, getProfile, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

export default function Phrases() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherPhrases = getPhrases(pair.mother);
  const secondaryPhrases = getPhrases(pair.secondary);
  const count = Math.min(motherPhrases.length, secondaryPhrases.length);

  function handleView(phrase) {
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "phrases", event: `phrase_viewed:${phrase}` });
  }

  return (
    <div className="page">
      <h1>{t("modules.phrasesTitle")} 💬</h1>
      <div className="reading-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherPhrases[i];
          const s = secondaryPhrases[i];
          return (
            <div className="reading-card phrase-card" key={i} onClick={() => handleView(m.phrase)}>
              <div className="reading-emoji">{m.emoji}</div>
              <div className="reading-words">
                <div className="reading-word-row phrase-row">
                  <span className="reading-word">{m.phrase}</span>
                  <SpeakButton text={m.hint} langCode={pair.mother} />
                </div>
                <div className="reading-word-row secondary phrase-row">
                  <span className="reading-word">{s.phrase}</span>
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
