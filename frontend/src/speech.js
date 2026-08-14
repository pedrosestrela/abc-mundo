// Small wrapper around the Web Speech API's speechSynthesis, with feature detection.

const LANG_TO_BCP47 = {
  pt: "pt-PT",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  zh: "zh-CN",
  es: "es-ES",
  it: "it-IT",
};

export function isSpeechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text, langCode) {
  if (!isSpeechAvailable() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_TO_BCP47[langCode] || "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // Speech is a progressive enhancement; failures are non-fatal.
    console.warn("speechSynthesis failed", e);
  }
}

export async function speakSequence(lines, langCode) {
  if (!isSpeechAvailable()) return;
  for (const line of lines) {
    await new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = LANG_TO_BCP47[langCode] || "en-US";
      utterance.rate = 0.85;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });
  }
}
