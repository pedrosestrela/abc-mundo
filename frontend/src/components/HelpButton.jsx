import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { speak, isSpeechAvailable } from "../speech.js";

// Reusable "Ajuda" (Help) button for any game/activity page.
//
// Renders a small, friendly "?" button in a consistent spot (wrap it in a
// container with class "help-btn-corner" to anchor it top-right of a card).
// On tap it (a) speaks the given help text aloud via the existing
// speech.js/SpeakButton infra, honoring the "audio only on explicit tap"
// rule, and (b) shows the same text visually in a small bubble so a parent
// or older child glancing at the screen (or a browser without speech
// support) still gets the explanation.
//
// `text` must be the fully-resolved instructional string for the CURRENT
// game/mode (short, one or two sentences) - callers are responsible for
// picking the right per-mode i18n key before passing it in.
export default function HelpButton({ text, langCode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  function handleTap() {
    setOpen((o) => !o);
    if (!open) speak(text, langCode);
  }

  if (!text) return null;

  return (
    <div className="help-btn-wrap">
      <button
        type="button"
        className="help-btn"
        onClick={handleTap}
        aria-expanded={open}
        aria-label={t("modules.helpButtonLabel")}
      >
        🤔 {t("modules.helpButtonLabel")}
      </button>
      {open && (
        <div className="help-btn-bubble" role="note">
          <p>{text}</p>
          {isSpeechAvailable() && (
            <button type="button" className="speak-btn help-btn-bubble-speak" onClick={() => speak(text, langCode)} aria-label={t("modules.play")}>
              🔊
            </button>
          )}
        </div>
      )}
    </div>
  );
}
