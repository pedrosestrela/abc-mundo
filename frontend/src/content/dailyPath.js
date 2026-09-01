// "Missão de Hoje" — a small, deterministic daily curriculum sequencer.
//
// Deliberately NOT a per-language content file (mirrors topicConnections.js):
// it holds no localized text of its own, only logic that picks WHICH items
// of the child's real, already-existing content (alphabet/syllables/reading)
// to show today, resolved at render time via the content/index.js getters
// for the profile's current mother language.
//
// This is intentionally simple for Phase 1: "next uncovered item in a fixed
// pedagogical order", not a spaced-repetition algorithm. The literacy order
// below follows the product owner's note: vowels + the easiest, most
// frequent consonants (M, P, L, S, T) first, then the rest of the alphabet.
import { getAlphabet, getSyllables, getReading } from "./index.js";

const PRIORITY_LETTERS = ["A", "E", "I", "O", "U", "M", "P", "L", "S", "T"];
const VOWELS = ["A", "E", "I", "O", "U"];

// Builds the full pedagogical letter order for a language: priority letters
// first (in the fixed order above, only the ones that actually exist in
// that language's alphabet content), then every remaining letter in the
// order the content file already lists them.
function buildLetterOrder(mother) {
  const alphabet = getAlphabet(mother);
  const byUpper = new Map(alphabet.map((l) => [l.upper, l]));
  const ordered = [];
  const seen = new Set();
  for (const letter of PRIORITY_LETTERS) {
    const entry = byUpper.get(letter);
    if (entry && !seen.has(letter)) {
      ordered.push(entry);
      seen.add(letter);
    }
  }
  for (const entry of alphabet) {
    if (!seen.has(entry.upper)) {
      ordered.push(entry);
      seen.add(entry.upper);
    }
  }
  return ordered;
}

// Finds a syllable formed from `letter` + a vowel, e.g. letter "M" -> "MA".
// If the letter itself is a vowel, instead looks for any existing syllable
// entry that starts with it (so e.g. letter "A" can still surface a real
// syllable like "AR" instead of a nonsensical "AA").
function findSyllableForLetter(letter, mother) {
  const syllables = getSyllables(mother);
  const upper = letter.upper.toUpperCase();
  if (!VOWELS.includes(upper)) {
    // Prefer the classic consonant+A combo pedagogically, but fall back to
    // whatever syllable the content actually has for this consonant.
    const preferred = syllables.find((s) => s.syllable?.toUpperCase() === `${upper}A`);
    if (preferred) return preferred;
    const anyMatch = syllables.find((s) => s.syllable?.toUpperCase().startsWith(upper));
    if (anyMatch) return anyMatch;
    return { syllable: `${upper}A`, exampleWord: null, emoji: letter.emoji, hint: null };
  }
  const match = syllables.find((s) => s.syllable?.toUpperCase().startsWith(upper));
  if (match) return match;
  return { syllable: upper, exampleWord: null, emoji: letter.emoji, hint: null };
}

// Finds the first reading word starting with the target syllable (case
// insensitive), for the current mother language.
function findWordForSyllable(syllableText, mother) {
  if (!syllableText) return null;
  const words = getReading(mother);
  const target = syllableText.toUpperCase();
  return words.find((w) => w.word?.toUpperCase().startsWith(target)) || null;
}

// Numbers slowly increase one per day, 1-10, plateauing (not wrapping) at
// 10 so the sequence stays a gentle, always-forward-feeling progression.
function numberForIndex(index) {
  return Math.min(10, index + 1);
}

// Builds today's bundle for a profile.
//   - mother: the child's mother-language code (from getLangPair().mother)
//   - dailyIndex: how many "days" of the path this profile has already
//     completed (see storage.js getDailyPathState/completeDailyMission) —
//     also used as the pointer into the letter order.
//   - tier: difficulty tier (1/2/3) from getDifficultyTier — tier 1 gets a
//     single new letter, tier 2/3 get two, per the product owner's note that
//     older kids can handle a slightly bigger bundle without forcing it.
export function buildDailyPath({ mother, dailyIndex = 0, tier = 1 }) {
  const letterOrder = buildLetterOrder(mother);
  if (letterOrder.length === 0) {
    return { letters: [], syllables: [], word: null, number: numberForIndex(dailyIndex) };
  }
  const lettersPerDay = tier >= 2 ? 2 : 1;
  const start = Math.min(dailyIndex * lettersPerDay, Math.max(0, letterOrder.length - lettersPerDay));
  const todaysLetters = letterOrder.slice(start, start + lettersPerDay);
  // Plateau: once every letter has been covered, keep re-showing the last
  // one or two rather than erroring out or going blank.
  if (todaysLetters.length === 0) {
    todaysLetters.push(...letterOrder.slice(-lettersPerDay));
  }

  const syllables = todaysLetters.map((letter) => findSyllableForLetter(letter, mother));
  const firstSyllableText = syllables[0]?.syllable || null;
  const word = findWordForSyllable(firstSyllableText, mother);
  const number = numberForIndex(dailyIndex);

  return { letters: todaysLetters, syllables, word, number, totalLetters: letterOrder.length };
}
