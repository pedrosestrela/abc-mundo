import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";
import { SUPPORTED_LANGUAGES } from "../content/index.js";
import { getLangPair, setLangPair, pingProgress } from "../storage.js";
import { getProfile } from "../storage.js";

export default function LanguagePicker() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const existing = getLangPair();
  const [mother, setMother] = useState(existing?.mother || "pt");
  const [secondary, setSecondary] = useState(existing?.secondary || "en");

  function handleContinue() {
    setLangPair({ mother, secondary });
    i18n.changeLanguage(mother);
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "languages", event: "pair_selected" });
    navigate("/alphabet");
  }

  return (
    <div className="page">
      <h1>{t("languagePicker.title")}</h1>

      <h3>{t("languagePicker.mother")}</h3>
      <div className="lang-grid">
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            className={"lang-btn" + (mother === l.code ? " selected" : "")}
            onClick={() => setMother(l.code)}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <h3>{t("languagePicker.secondary")}</h3>
      <div className="lang-grid">
        {SUPPORTED_LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            className={"lang-btn" + (secondary === l.code ? " selected" : "")}
            onClick={() => setSecondary(l.code)}
          >
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <button type="button" className="big-btn" onClick={handleContinue}>
        {t("languagePicker.continue")} ➡️
      </button>
    </div>
  );
}
