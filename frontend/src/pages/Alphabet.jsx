import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlphabet, SUPPORTED_LANGUAGES } from "../content/index.js";
import { getLangPair, getProfile, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

function labelFor(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label || code;
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
  }

  if (!motherLetter || !secondaryLetter) return null;

  return (
    <div className="page">
      <h1>{t("modules.alphabetTitle")} 🔤</h1>

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
