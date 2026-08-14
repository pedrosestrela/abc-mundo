import React from "react";
import { useTranslation } from "react-i18next";
import { getSyllables } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

export default function Syllables() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherSyllables = getSyllables(pair.mother);
  const secondarySyllables = getSyllables(pair.secondary);
  const count = Math.min(motherSyllables.length, secondarySyllables.length);

  function handleView(syllable) {
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "syllables", event: `syllable_viewed:${syllable}` });
    recordSkillEvent(profile?.name, "syllable-viewed", true);
  }

  return (
    <div className="page">
      <h1>{t("modules.syllablesTitle")} 🧩</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.syllablesHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.syllablesIntro")}</p>
      <div className="reading-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherSyllables[i];
          const s = secondarySyllables[i];
          return (
            <div className="reading-card" key={i} onClick={() => handleView(m.syllable)}>
              <div className="reading-emoji">{m.emoji}</div>
              <div className="reading-words">
                <div className="reading-word-row">
                  <span className="syllable-badge">{m.syllable}</span>
                  <span className="reading-word">{m.exampleWord}</span>
                  <SpeakButton text={m.hint} langCode={pair.mother} />
                </div>
                <div className="reading-word-row secondary">
                  <span className="syllable-badge secondary">{s.syllable}</span>
                  <span className="reading-word">{s.exampleWord}</span>
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
