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

// Name-pattern hints for the higher-quality voice tiers that browsers/OSes ship
// alongside the always-available "compact"/robotic default per language:
//  - iOS/macOS Safari: "Enhanced" or "Premium" suffix on system voices (e.g.
//    "Joana (Enhanced)"), plus Siri voices ("Siri Voice 1/2/3") which are
//    consistently higher quality than the classic compact voices.
//  - Chrome/Android: "Natural" (e.g. "Google US English Natural"), and on
//    Android the "Neural"/"Enhanced" network/on-device WaveNet-style voices.
//  - Windows/Edge: "Online (Natural)" suffix on Microsoft neural voices, or
//    plain "Neural" in the name (e.g. "Microsoft Ana Online (Natural)").
// This is heuristic, not authoritative — the Web Speech API exposes no
// standard "quality tier" field, only `name`, so we match known conventions.
const HIGH_QUALITY_VOICE_PATTERN = /enhanced|premium|siri|natural|neural|online \(natural\)|wavenet/i;

function rankVoice(voice) {
  return HIGH_QUALITY_VOICE_PATTERN.test(voice.name) ? 1 : 0;
}

// Picks the best-quality voice among a candidate list: highest quality tier
// first (per rankVoice), stable otherwise (keeps the browser's own ordering
// among voices of equal tier).
function bestOf(candidates) {
  if (!candidates.length) return null;
  return candidates.reduce((best, v) => (rankVoice(v) > rankVoice(best) ? v : best), candidates[0]);
}

// Prefers an exact BCP-47 match (e.g. "pt-PT"), then any voice starting with the
// same base language, then falls back to null (caller leaves utterance.voice
// unset so the browser uses its own default for that utterance.lang).
// Within each match tier, prefers known higher-quality voice names (Enhanced/
// Premium/Siri/Natural/Neural/WaveNet — see HIGH_QUALITY_VOICE_PATTERN above)
// over the plain/compact voice that's always available.
function pickVoice(bcp47) {
  const voices = loadVoices();
  if (!voices.length) return null;
  const base = bcp47.split("-")[0];
  const exactMatches = voices.filter((v) => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (exactMatches.length) return bestOf(exactMatches);
  const sameBase = voices.filter((v) => v.lang.toLowerCase().startsWith(base + "-") || v.lang.toLowerCase() === base);
  if (!sameBase.length) return null;
  return bestOf(sameBase);
}

export function isSpeechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function buildUtterance(text, langCode) {
  // langCode is usually one of our short app codes ("pt", "en", ...), but
  // callers may also pass an already-fully-qualified BCP-47 tag directly
  // (e.g. a country's nativeLangCode like "ja-JP") — use it as-is.
  const bcp47 = langCode && langCode.includes("-") ? langCode : LANG_TO_BCP47[langCode] || "en-US";
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;
  const voice = pickVoice(bcp47);
  if (voice) utterance.voice = voice;
  return utterance;
}

// `onWordBoundary(charIndex)` is optional: when provided, it's wired to the
// utterance's `onboundary` event (fired per word/character on browsers/voices
// that support it) so callers can highlight the word being spoken. Not all
// browsers/voices fire this event — when it never fires, the callback simply
// never runs, so playback itself is unaffected either way.
export function speak(text, langCode, onWordBoundary) {
  if (!isSpeechAvailable() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = buildUtterance(text, langCode);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    if (typeof onWordBoundary === "function") {
      utterance.onboundary = (event) => {
        if (event.name === "word" || event.name === undefined) {
          onWordBoundary(event.charIndex);
        }
      };
    }
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
