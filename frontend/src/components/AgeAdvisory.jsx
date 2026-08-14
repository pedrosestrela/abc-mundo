import React from "react";
import { useTranslation } from "react-i18next";
import { speak, isSpeechAvailable } from "../speech.js";

// Reusable soft advisory shown instead of a hard age/tier lock. Mirrors the
// SessionEndOverlay's card/backdrop pattern. Never auto-plays audio - the
// child must tap the small speaker icon to hear the advisory read aloud.
//
// onAccept: let the child continue into the content as normal.
// onDecline: send the child back to where they'd naturally go (previous tab/page).
export default function AgeAdvisory({ langCode, onAccept, onDecline }) {
  const { t } = useTranslation();
  const text = t("modules.ageAdvisoryText");

  return (
    <div className="session-end-backdrop" role="dialog" aria-modal="true">
      <div className="session-end-card age-advisory-card">
        <p className="session-end-title">{t("modules.ageAdvisoryTitle")}</p>
        <div className="age-advisory-body-row">
          <p className="session-end-body">{text}</p>
          {isSpeechAvailable() && (
            <button
              type="button"
              className="speak-btn"
              onClick={() => speak(text, langCode)}
              aria-label={t("modules.play")}
            >
              🔊
            </button>
          )}
        </div>
        <div className="age-advisory-actions">
          <div className="age-advisory-choice">
            <button type="button" className="big-btn" onClick={onAccept}>
              😃 {t("modules.ageAdvisoryAccept")}
            </button>
            {isSpeechAvailable() && (
              <button
                type="button"
                className="speak-btn"
                onClick={() => speak(t("modules.ageAdvisoryAccept"), langCode)}
                aria-label={t("modules.play")}
              >
                🔊
              </button>
            )}
          </div>
          <div className="age-advisory-choice">
            <button type="button" className="session-end-continue-btn" onClick={onDecline}>
              {t("modules.ageAdvisoryDecline")}
            </button>
            {isSpeechAvailable() && (
              <button
                type="button"
                className="speak-btn"
                onClick={() => speak(t("modules.ageAdvisoryDecline"), langCode)}
                aria-label={t("modules.play")}
              >
                🔊
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
