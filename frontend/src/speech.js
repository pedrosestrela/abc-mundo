// Small wrapper around the Web Speech API's speechSynthesis, with feature detection.
// Picks the most accurate voice for each language/accent (e.g. pt-PT, not a generic
// "pt" voice that might default to pt-BR) instead of leaving it to the browser default.

const LANG_TO_BCP47 = {
  pt: "pt-PT",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  zh: "zh-CN",
  es: "es-ES",
  it: "it-IT",
};

let cachedVoices = [];

function loadVoices() {
  if (!isSpeechAvailable()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Prefers an exact BCP-47 match (e.g. "pt-PT"), then any voice starting with the
// same base language, then falls back to the browser's default for that utterance.lang.
function pickVoice(bcp47) {
  const voices = loadVoices();
  if (!voices.length) return null;
  const base = bcp47.split("-")[0];
  const exact = voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (exact) return exact;
  const sameBase = voices.filter((v) => v.lang.toLowerCase().startsWith(base + "-") || v.lang.toLowerCase() === base);
  if (!sameBase.length) return null;
  const enhanced = sameBase.find((v) => /natural|enhanced|premium|neural/i.test(v.name));
  return enhanced || sameBase[0];
}

export function isSpeechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function buildUtterance(text, langCode) {
  const bcp47 = LANG_TO_BCP47[langCode] || "en-US";
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;
  const voice = pickVoice(bcp47);
  if (voice) utterance.voice = voice;
  return utterance;
}

export function speak(text, langCode) {
  if (!isSpeechAvailable() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = buildUtterance(text, langCode);
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
      const utterance = buildUtterance(line, langCode);
      utterance.rate = 0.85;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });
  }
}
