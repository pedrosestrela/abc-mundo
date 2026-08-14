// Central content loader: maps a language code to its content JSON files.
import alphabetPt from "./alphabet.pt.json";
import alphabetEn from "./alphabet.en.json";
import alphabetDe from "./alphabet.de.json";
import alphabetFr from "./alphabet.fr.json";
import alphabetZh from "./alphabet.zh.json";

import readingPt from "./reading.pt.json";
import readingEn from "./reading.en.json";
import readingDe from "./reading.de.json";
import readingFr from "./reading.fr.json";
import readingZh from "./reading.zh.json";

import songsPt from "./songs.pt.json";
import songsEn from "./songs.en.json";
import songsDe from "./songs.de.json";
import songsFr from "./songs.fr.json";
import songsZh from "./songs.zh.json";

export const SUPPORTED_LANGUAGES = [
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

const ALPHABET = { pt: alphabetPt, en: alphabetEn, de: alphabetDe, fr: alphabetFr, zh: alphabetZh };
const READING = { pt: readingPt, en: readingEn, de: readingDe, fr: readingFr, zh: readingZh };
const SONGS = { pt: songsPt, en: songsEn, de: songsDe, fr: songsFr, zh: songsZh };

// Normalizes zh's different shape ({hanzi,...}) to the same shape used by
// the Latin-alphabet languages ({letter, lower, upper, exampleWord, emoji}).
export function getAlphabet(langCode) {
  if (langCode === "zh") {
    return ALPHABET.zh.characters.map((c) => ({
      letter: c.hanzi,
      lower: c.hanzi,
      upper: c.hanzi,
      exampleWord: c.exampleWord,
      emoji: c.emoji,
      pronunciationHint: c.pinyin,
    }));
  }
  return ALPHABET[langCode] || [];
}

export function getReading(langCode) {
  return READING[langCode] || [];
}

export function getSongs(langCode) {
  return SONGS[langCode] || [];
}
