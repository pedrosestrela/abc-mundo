// European Portuguese syllabification helper (best-effort, algorithmic).
//
// Rules implemented (standard PT syllable-division heuristics):
// - Vowels (incl. accented) form the nucleus of each syllable.
// - Digraphs NH, LH, CH, QU, GU (+ vowel) are treated as inseparable units.
// - Common diphthongs/vowel clusters (ai, au, ei, eu, iu, oi, ou, ui, ão, ãe,
//   õe, etc.) are kept together as a single nucleus.
// - A single consonant between two vowels goes with the following vowel
//   (VC-V -> V-CV), e.g. "gato" -> GA-TO.
// - Two consonants between vowels split apart UNLESS they form a valid
//   inseparable onset cluster (a stop/f/v + r/l, e.g. PR, BR, TR, DR, CR,
//   GR, FR, PL, BL, CL, GL, FL), in which case they stay together with the
//   following vowel, e.g. "livro" -> LI-VRO.
//
// This is not a linguistically exhaustive syllabifier - it targets the
// common/regular cases used by early-reader content in this app.

const VOWELS = "aeiouáéíóúâêîôûãõàAEIOUÁÉÍÓÚÂÊÎÔÛÃÕÀ";

function isVowel(ch) {
  return VOWELS.includes(ch);
}

// Inseparable onset clusters: consonant + r/l.
const ONSET_CLUSTERS = new Set([
  "pr", "br", "tr", "dr", "cr", "gr", "fr", "vr",
  "pl", "bl", "cl", "gl", "fl",
]);

// Digraphs that must never be split, matched case-insensitively.
const DIGRAPHS = ["nh", "lh", "ch", "qu", "gu"];

function tokenize(word) {
  // Split the word into an array of "letter groups": digraphs stay as one
  // token, everything else is a single character.
  const tokens = [];
  let i = 0;
  const lower = word.toLowerCase();
  while (i < word.length) {
    const two = lower.slice(i, i + 2);
    if (DIGRAPHS.includes(two) && i + 1 < word.length) {
      tokens.push(word.slice(i, i + 2));
      i += 2;
    } else {
      tokens.push(word[i]);
      i += 1;
    }
  }
  return tokens;
}

function tokenIsVowel(tok) {
  // A digraph token is never a vowel; single-char tokens follow isVowel.
  return tok.length === 1 && isVowel(tok);
}

export function syllabifyPt(word) {
  if (!word || typeof word !== "string") return [word];
  // Strip surrounding punctuation, syllabify the core word, keep punctuation
  // attached to the syllabified result's last/first chunk.
  const leadingMatch = word.match(/^[^\p{L}]+/u);
  const trailingMatch = word.match(/[^\p{L}]+$/u);
  const leading = leadingMatch ? leadingMatch[0] : "";
  const trailing = trailingMatch ? trailingMatch[0] : "";
  const core = word.slice(leading.length, word.length - trailing.length);
  if (!core) return [word];

  const tokens = tokenize(core);
  if (tokens.length <= 1) return [word];

  // Group tokens into syllables.
  const syllables = [];
  let current = [];
  let i = 0;

  while (i < tokens.length) {
    current.push(tokens[i]);
    const isVow = tokenIsVowel(tokens[i]);

    if (isVow) {
      // Peek ahead: absorb a following vowel token into the same nucleus
      // (diphthong), unless it's followed by another vowel too (hiatus is
      // rare enough in early-reader vocabulary to ignore here).
      if (i + 1 < tokens.length && tokenIsVowel(tokens[i + 1])) {
        current.push(tokens[i + 1]);
        i += 1;
      }

      // Now decide where to cut before the next syllable begins.
      const rest = tokens.slice(i + 1);
      if (rest.length === 0) {
        // End of word.
        syllables.push(current);
        current = [];
        i += 1;
        continue;
      }

      // Count consonant tokens until the next vowel token.
      let consCount = 0;
      while (consCount < rest.length && !tokenIsVowel(rest[consCount])) {
        consCount += 1;
      }

      if (consCount === 0) {
        // Next token is a vowel -> boundary right here.
        syllables.push(current);
        current = [];
        i += 1;
      } else if (consCount === 1) {
        // V-CV: single consonant moves to next syllable.
        syllables.push(current);
        current = [];
        i += 1;
      } else {
        // Multiple consonants before next vowel.
        const c1 = rest[0].toLowerCase();
        const c2 = rest[1].toLowerCase();
        const cluster = c1 + c2;
        if (consCount === 2 && ONSET_CLUSTERS.has(cluster)) {
          // Keep together, both move to next syllable.
          syllables.push(current);
          current = [];
          i += 1;
        } else {
          // Split: first consonant closes this syllable, rest move on.
          current.push(rest[0]);
          syllables.push(current);
          current = [];
          i += 2;
        }
      }
    } else {
      i += 1;
    }
  }

  if (current.length) {
    if (syllables.length) {
      syllables[syllables.length - 1] = syllables[syllables.length - 1].concat(current);
    } else {
      syllables.push(current);
    }
  }

  const parts = syllables.map((chunk) => chunk.join(""));
  if (parts.length === 0) return [word];
  parts[0] = leading + parts[0];
  parts[parts.length - 1] = parts[parts.length - 1] + trailing;
  return parts;
}

// Languages we have a working algorithmic syllabifier for.
export const SYLLABIFIABLE_LANGS = new Set(["pt"]);

export function syllabifyWord(word, langCode) {
  if (langCode === "pt") return syllabifyPt(word);
  return [word];
}

// Splits a full phrase into per-word syllable breakdowns.
// Returns an array of { word, syllables } - syllables has length 1 when no
// breakdown is available/needed (e.g. punctuation-only or unsupported lang).
export function syllabifyPhrase(phrase, langCode) {
  if (!phrase) return [];
  const words = phrase.split(/\s+/).filter(Boolean);
  return words.map((word) => ({
    word,
    syllables: syllabifyWord(word, langCode),
  }));
}
