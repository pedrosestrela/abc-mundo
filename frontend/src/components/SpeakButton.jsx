import React from "react";
import { useTranslation } from "react-i18next";
import { isSpeechAvailable, speak } from "../speech.js";

export default function SpeakButton({ text, langCode, label, onWordBoundary }) {
  const { t } = useTranslation();
  if (!isSpeechAvailable()) {
    return <span className="speech-unavailable">{t("modules.speechUnavailable")}</span>;
  }
  return (
    <button
      type="button"
      className="speak-btn"
      onClick={() => speak(text, langCode, onWordBoundary)}
      aria-label={label || t("modules.play")}
    >
      🔊
    </button>
  );
}
