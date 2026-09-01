// Small wrapper around the Web Speech API's speechSynthesis, with feature detection.
// Picks the most accurate voice for each language/accent (e.g. pt-PT, not a generic
// "pt" voice that might default to pt-BR) instead of leaving it to the browser default.

import { duckZenAmbience, isZenAmbiencePlaying } from "./music.js";
import { getLangPair } from "./storage.js";

const LANG_TO_BCP47 = {
  pt: "pt-PT",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  zh: "zh-CN",
  es: "es-ES",
  it: "it-IT",
  ja: "ja-JP",
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
// Ranked highest-to-lowest tier (checked in order, first match wins) rather
// than a single flat pattern, because some platforms expose more than one
// elevated-quality voice per language and the tiers aren't equal: on-device
// neural voices ("Natural"/"Neural"/WaveNet) are generally a clear step up
// in prosody/clarity over the older "Enhanced"/"Premium" hand-tuned voices,
// which are themselves a step up from the always-available compact default.
const VOICE_QUALITY_TIERS = [
  /natural|neural|wavenet/i,
  /enhanced|premium|siri/i,
];

function rankVoice(voice) {
  for (let i = 0; i < VOICE_QUALITY_TIERS.length; i++) {
    if (VOICE_QUALITY_TIERS[i].test(voice.name)) return VOICE_QUALITY_TIERS.length - i;
  }
  return 0;
}

// Picks the best-quality voice among a candidate list: highest quality tier
// first (per rankVoice), stable otherwise (keeps the browser's own ordering
// among voices of equal tier).
// Within the same quality tier, prefer an on-device (localService) voice
// over a network-dependent one: it keeps working offline (this is a PWA)
// and avoids the extra latency/failure mode of a remote TTS call.
function bestOf(candidates) {
  if (!candidates.length) return null;
  return candidates.reduce((best, v) => {
    const vRank = rankVoice(v);
    const bestRank = rankVoice(best);
    if (vRank !== bestRank) return vRank > bestRank ? v : best;
    if (v.localService !== best.localService) return v.localService ? v : best;
    return best;
  }, candidates[0]);
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
  let bcp47;
  if (langCode && langCode.includes("-")) {
    bcp47 = langCode;
  } else if (langCode && LANG_TO_BCP47[langCode]) {
    bcp47 = LANG_TO_BCP47[langCode];
  } else {
    // langCode is missing/empty or not one of our recognized short codes.
    // This is almost always a caller bug (forgot to pass langCode, or passed
    // something that isn't a real 2-letter app code) — surface it in the
    // console so it's easy to spot in dev, and NEVER silently fall back to
    // English in this PT-first app: fall back to the child's own mother
    // tongue (from the saved language pair) instead, defaulting to "pt"
    // only if no language pair has been chosen yet.
    console.warn(
      `speech.js: unrecognized langCode "${langCode}" — falling back to the mother language instead of English.`
    );
    const pair = getLangPair();
    const motherCode = pair?.mother && LANG_TO_BCP47[pair.mother] ? pair.mother : "pt";
    bcp47 = LANG_TO_BCP47[motherCode];
  }
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
    // Duck the zen ambient pad (see music.js) so narration stays clearly
    // audible over it, and bring it back up as soon as this utterance ends
    // (or immediately, if it's a no-op because ambience isn't playing).
    if (isZenAmbiencePlaying()) {
      // Generous safety-net duration in case onend/onerror never fires (some
      // browsers occasionally drop them) — restored sooner below regardless.
      duckZenAmbience(Math.max(2500, text.length * 90));
      const restore = () => duckZenAmbience(0);
      utterance.addEventListener("end", restore);
      utterance.addEventListener("error", restore);
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // Speech is a progressive enhancement; failures are non-fatal.
    console.warn("speechSynthesis failed", e);
  }
}

// Speaks `lines` one phrase at a time (e.g. song lyric lines), with a short
// pause between phrases so the result reads as rhythmic phrasing rather than
// one run-on paragraph. This is still plain TTS — the Web Speech API has no
// way to carry a melody or lock pitch to a backing track's key — but pacing
// speech line-by-line with brief gaps, plus a slightly warmer/more varied
// pitch than narration defaults, is the closest approximation reachable
// on-device with no paid service.
//
// `options`:
//  - onLineStart(index): called right before each line starts speaking, so
//    callers can highlight the current lyric line.
//  - onWordBoundary(charIndex): forwarded from the current line's utterance
//    `onboundary` event (see `speak()` above), for word-level highlighting
//    within the active line. charIndex is relative to that line's text.
//  - pauseMs: silence between lines (default 450ms — a reasonable fixed
//    approximation of a song beat; music.js's background loop doesn't expose
//    a reusable BPM, only a fixed 0.4s-per-note melody loop).
//  - rate / pitch: song-specific prosody defaults, tuned a little warmer/more
//    melodic-sounding than narration's speak() defaults (rate 0.9 / pitch 1.1).
export async function speakSequence(lines, langCode, options = {}) {
  const { onLineStart, onWordBoundary, pauseMs = 450, rate = 0.85, pitch = 1.15 } = options;
  if (!isSpeechAvailable()) return;
  const zenWasPlaying = isZenAmbiencePlaying();
  if (zenWasPlaying) {
    // Duck for the whole sequence up front (a generous estimate covering all
    // lines) so it doesn't pop back up between lines; restored for sure in
    // the `finally` below regardless of how the sequence ends.
    const totalChars = lines.reduce((sum, l) => sum + l.length, 0);
    duckZenAmbience(Math.max(3000, totalChars * 90 + lines.length * pauseMs));
  }
  try {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (typeof onLineStart === "function") onLineStart(i);
    await new Promise((resolve) => {
      const utterance = buildUtterance(line, langCode);
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (typeof onWordBoundary === "function") {
        utterance.onboundary = (event) => {
          if (event.name === "word" || event.name === undefined) {
            onWordBoundary(event.charIndex);
          }
        };
      }
      utterance.onend = resolve;
      utterance.onerror = resolve;
      window.speechSynthesis.speak(utterance);
    });
    if (pauseMs > 0 && i < lines.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, pauseMs));
    }
  }
  } finally {
    if (zenWasPlaying) duckZenAmbience(0);
  }
}

// Speaks a word's syllable chunks (e.g. ["BA", "NA", "NA"]) one at a time
// with a short pause between each, so "banana" is heard as "ba... na... na"
// instead of run together as one word. Thin wrapper over speakSequence with
// defaults tuned for syllable segmentation (a shorter, snappier pause than
// song lyrics, and a normal narration rate/pitch rather than speakSequence's
// warmer song defaults) — used by Syllables.jsx/Phonics.jsx wherever a word
// broken into syllable chunks is read aloud.
export async function speakSyllables(syllables, langCode, options = {}) {
  const { pauseMs = 350, rate = 0.85, pitch = 1.1, onSyllableStart } = options;
  if (!Array.isArray(syllables) || syllables.length === 0) return;
  return speakSequence(syllables, langCode, { pauseMs, rate, pitch, onLineStart: onSyllableStart });
}
