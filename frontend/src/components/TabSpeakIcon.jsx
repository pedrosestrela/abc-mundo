import React from "react";
import { useTranslation } from "react-i18next";
import { speak, isSpeechAvailable } from "../speech.js";

// Small speaker icon meant to sit inside a mode/tab/game-selector button.
// Tapping it speaks the tab's label + one-line description WITHOUT
// triggering the tab's own onClick (selection) - audio only plays on this
// explicit, dedicated tap, never automatically when the tab is selected.
export default function TabSpeakIcon({ text, langCode }) {
  const { t } = useTranslation();
  if (!isSpeechAvailable() || !text) return null;
  return (
    <button
      type="button"
      className="phonics-tab-speak"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, langCode);
      }}
      aria-label={t("modules.play")}
    >
      🔊
    </button>
  );
}
