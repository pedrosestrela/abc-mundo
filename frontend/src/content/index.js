// Central content loader: maps a language code to its content JSON files.
import alphabetPt from "./alphabet.pt.json";
import alphabetEn from "./alphabet.en.json";
import alphabetDe from "./alphabet.de.json";
import alphabetFr from "./alphabet.fr.json";
import alphabetZh from "./alphabet.zh.json";
import alphabetEs from "./alphabet.es.json";
import alphabetIt from "./alphabet.it.json";

import readingPt from "./reading.pt.json";
import readingEn from "./reading.en.json";
import readingDe from "./reading.de.json";
import readingFr from "./reading.fr.json";
import readingZh from "./reading.zh.json";
import readingEs from "./reading.es.json";
import readingIt from "./reading.it.json";

import syllablesPt from "./syllables.pt.json";
import syllablesEn from "./syllables.en.json";
import syllablesDe from "./syllables.de.json";
import syllablesFr from "./syllables.fr.json";
import syllablesZh from "./syllables.zh.json";
import syllablesEs from "./syllables.es.json";
import syllablesIt from "./syllables.it.json";

import phrasesPt from "./phrases.pt.json";
import phrasesEn from "./phrases.en.json";
import phrasesDe from "./phrases.de.json";
import phrasesFr from "./phrases.fr.json";
import phrasesZh from "./phrases.zh.json";
import phrasesEs from "./phrases.es.json";
import phrasesIt from "./phrases.it.json";

import countries from "./countries.json";
import portugalHistory from "./portugalHistory.json";

import missionsPt from "./missions.pt.json";
import missionsEn from "./missions.en.json";
import missionsDe from "./missions.de.json";
import missionsFr from "./missions.fr.json";
import missionsZh from "./missions.zh.json";
import missionsEs from "./missions.es.json";
import missionsIt from "./missions.it.json";

import phonicsPt from "./phonics.pt.json";
import phonicsEn from "./phonics.en.json";
import phonicsDe from "./phonics.de.json";
import phonicsFr from "./phonics.fr.json";
import phonicsZh from "./phonics.zh.json";
import phonicsEs from "./phonics.es.json";
import phonicsIt from "./phonics.it.json";

import songsPt from "./songs.pt.json";
import songsEn from "./songs.en.json";
import songsDe from "./songs.de.json";
import songsFr from "./songs.fr.json";
import songsZh from "./songs.zh.json";
import songsEs from "./songs.es.json";
import songsIt from "./songs.it.json";

import storiesPt from "./stories.pt.json";
import storiesEn from "./stories.en.json";
import storiesDe from "./stories.de.json";
import storiesFr from "./stories.fr.json";
import storiesZh from "./stories.zh.json";
import storiesEs from "./stories.es.json";
import storiesIt from "./stories.it.json";

import detectivePt from "./detective.pt.json";
import detectiveEn from "./detective.en.json";
import detectiveDe from "./detective.de.json";
import detectiveFr from "./detective.fr.json";
import detectiveZh from "./detective.zh.json";
import detectiveEs from "./detective.es.json";
import detectiveIt from "./detective.it.json";

import financialPt from "./financial.pt.json";
import financialEn from "./financial.en.json";
import financialDe from "./financial.de.json";
import financialFr from "./financial.fr.json";
import financialZh from "./financial.zh.json";
import financialEs from "./financial.es.json";
import financialIt from "./financial.it.json";

import whysPt from "./whys.pt.json";
import whysEn from "./whys.en.json";
import whysDe from "./whys.de.json";
import whysFr from "./whys.fr.json";
import whysZh from "./whys.zh.json";
import whysEs from "./whys.es.json";
import whysIt from "./whys.it.json";

import artPromptsPt from "./artPrompts.pt.json";
import artPromptsEn from "./artPrompts.en.json";
import artPromptsDe from "./artPrompts.de.json";
import artPromptsFr from "./artPrompts.fr.json";
import artPromptsZh from "./artPrompts.zh.json";
import artPromptsEs from "./artPrompts.es.json";
import artPromptsIt from "./artPrompts.it.json";

import sciencePt from "./science.pt.json";
import scienceEn from "./science.en.json";
import scienceDe from "./science.de.json";
import scienceFr from "./science.fr.json";
import scienceZh from "./science.zh.json";
import scienceEs from "./science.es.json";
import scienceIt from "./science.it.json";

import lifeSkillsPt from "./lifeSkills.pt.json";
import lifeSkillsEn from "./lifeSkills.en.json";
import lifeSkillsDe from "./lifeSkills.de.json";
import lifeSkillsFr from "./lifeSkills.fr.json";
import lifeSkillsZh from "./lifeSkills.zh.json";
import lifeSkillsEs from "./lifeSkills.es.json";
import lifeSkillsIt from "./lifeSkills.it.json";

import computingPt from "./computing.pt.json";
import computingEn from "./computing.en.json";
import computingDe from "./computing.de.json";
import computingFr from "./computing.fr.json";
import computingZh from "./computing.zh.json";
import computingEs from "./computing.es.json";
import computingIt from "./computing.it.json";

import computingSafetyPt from "./computingSafety.pt.json";
import computingSafetyEn from "./computingSafety.en.json";
import computingSafetyDe from "./computingSafety.de.json";
import computingSafetyFr from "./computingSafety.fr.json";
import computingSafetyZh from "./computingSafety.zh.json";
import computingSafetyEs from "./computingSafety.es.json";
import computingSafetyIt from "./computingSafety.it.json";

export const SUPPORTED_LANGUAGES = [
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

const ALPHABET = { pt: alphabetPt, en: alphabetEn, de: alphabetDe, fr: alphabetFr, zh: alphabetZh, es: alphabetEs, it: alphabetIt };
const READING = { pt: readingPt, en: readingEn, de: readingDe, fr: readingFr, zh: readingZh, es: readingEs, it: readingIt };
const SYLLABLES = { pt: syllablesPt, en: syllablesEn, de: syllablesDe, fr: syllablesFr, zh: syllablesZh, es: syllablesEs, it: syllablesIt };
const PHRASES = { pt: phrasesPt, en: phrasesEn, de: phrasesDe, fr: phrasesFr, zh: phrasesZh, es: phrasesEs, it: phrasesIt };
const SONGS = { pt: songsPt, en: songsEn, de: songsDe, fr: songsFr, zh: songsZh, es: songsEs, it: songsIt };
const STORIES = { pt: storiesPt, en: storiesEn, de: storiesDe, fr: storiesFr, zh: storiesZh, es: storiesEs, it: storiesIt };
const FINANCIAL = { pt: financialPt, en: financialEn, de: financialDe, fr: financialFr, zh: financialZh, es: financialEs, it: financialIt };
const PHONICS = { pt: phonicsPt, en: phonicsEn, de: phonicsDe, fr: phonicsFr, zh: phonicsZh, es: phonicsEs, it: phonicsIt };
const MISSIONS = { pt: missionsPt, en: missionsEn, de: missionsDe, fr: missionsFr, zh: missionsZh, es: missionsEs, it: missionsIt };
const DETECTIVE = { pt: detectivePt, en: detectiveEn, de: detectiveDe, fr: detectiveFr, zh: detectiveZh, es: detectiveEs, it: detectiveIt };
const WHYS = { pt: whysPt, en: whysEn, de: whysDe, fr: whysFr, zh: whysZh, es: whysEs, it: whysIt };
const ART_PROMPTS = { pt: artPromptsPt, en: artPromptsEn, de: artPromptsDe, fr: artPromptsFr, zh: artPromptsZh, es: artPromptsEs, it: artPromptsIt };
const SCIENCE = { pt: sciencePt, en: scienceEn, de: scienceDe, fr: scienceFr, zh: scienceZh, es: scienceEs, it: scienceIt };
const LIFE_SKILLS = { pt: lifeSkillsPt, en: lifeSkillsEn, de: lifeSkillsDe, fr: lifeSkillsFr, zh: lifeSkillsZh, es: lifeSkillsEs, it: lifeSkillsIt };
const COMPUTING = { pt: computingPt, en: computingEn, de: computingDe, fr: computingFr, zh: computingZh, es: computingEs, it: computingIt };
const COMPUTING_SAFETY = { pt: computingSafetyPt, en: computingSafetyEn, de: computingSafetyDe, fr: computingSafetyFr, zh: computingSafetyZh, es: computingSafetyEs, it: computingSafetyIt };

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

export function getSyllables(langCode) {
  return SYLLABLES[langCode] || [];
}

export function getPhrases(langCode) {
  return PHRASES[langCode] || [];
}

export function getSongs(langCode) {
  return SONGS[langCode] || [];
}

export function getStories(langCode) {
  return STORIES[langCode] || [];
}

export function getFinancial(langCode) {
  return FINANCIAL[langCode] || [];
}

export function getPhonics(langCode) {
  return PHONICS[langCode] || [];
}

export function getMissions(langCode) {
  return MISSIONS[langCode] || [];
}

export function getDetectiveCards(langCode) {
  return DETECTIVE[langCode] || [];
}

export function getArtPrompts(langCode) {
  return ART_PROMPTS[langCode] || [];
}

export function getScience(langCode) {
  return SCIENCE[langCode] || [];
}

export function getLifeSkills(langCode) {
  return LIFE_SKILLS[langCode] || [];
}

export function getComputing(langCode) {
  return COMPUTING[langCode] || [];
}

export function getComputingSafety(langCode) {
  return COMPUTING_SAFETY[langCode] || [];
}

// Countries are language-agnostic in shape (name/fact are per-language
// dictionaries inside each entry); langCode picks which strings to surface.
export function getCountries(langCode) {
  return countries.map((c) => ({
    iso: c.iso,
    flag: c.flag,
    capital: c.capital,
    continent: c.continent,
    currency: c.currency,
    lat: c.lat,
    lng: c.lng,
    name: c.name[langCode] || c.name.en,
    fact: c.fact[langCode] || c.fact.en,
  }));
}

export function getWhys(langCode) {
  return WHYS[langCode] || [];
}

// Portugal history timeline entries: same language-agnostic shape as
// countries (title/description are per-language dictionaries); langCode
// picks which strings to surface. Falls back to pt since the content is
// written primarily for Portuguese children.
export function getPortugalHistory(langCode) {
  return portugalHistory.map((e) => ({
    id: e.id,
    year: e.year,
    emoji: e.emoji,
    title: e.title[langCode] || e.title.pt,
    description: e.description[langCode] || e.description.pt,
  }));
}
