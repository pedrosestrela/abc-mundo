import React from "react";
import { useTranslation } from "react-i18next";
import { isSpeechAvailable, speakSyllables } from "../speech.js";

// Like SpeakButton, but for a word already broken into syllable chunks
// (e.g. ["BA", "NA", "NA"]): speaks each chunk as its own utterance with a
// short pause between, so the child hears "ba... na... na" instead of the
// whole word run together. Falls back to nothing (not even the plain-text
// "speech unavailable" notice SpeakButton shows) when there's fewer than 2
// syllables, since a single-chunk word has nothing to pause between.
export default function SyllableSpeakButton({ syllables, langCode, label }) {
  const { t } = useTranslation();
  if (!Array.isArray(syllables) || syllables.length < 2) return null;
  if (!isSpeechAvailable()) return null;
  return (
    <button
      type="button"
      className="speak-btn syllable-speak-btn"
      onClick={() => speakSyllables(syllables, langCode)}
      aria-label={label || t("modules.syllablesSpeakSlow")}
      title={label || t("modules.syllablesSpeakSlow")}
    >
      👏🔊
    </button>
  );
}
