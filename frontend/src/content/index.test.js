import { describe, expect, test } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  getAlphabet,
  getReading,
  getSyllables,
  getPhrases,
  getSongs,
  getStories,
  getFinancial,
  getPhonics,
  getMissions,
  getDetectiveCards,
  getCountries,
  getWhys,
  getScience,
  getArtPrompts,
  getPortugalHistory,
} from "./index.js";

const LANG_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

// Content-type getters that take a langCode and are expected to return a
// non-empty array for every supported language.
const PER_LANGUAGE_GETTERS = {
  getAlphabet,
  getReading,
  getSyllables,
  getPhrases,
  getSongs,
  getFinancial,
  getPhonics,
  getMissions,
  getDetectiveCards,
  getWhys,
  getScience,
  getArtPrompts,
};

describe("SUPPORTED_LANGUAGES", () => {
  test("includes all 7 expected language codes", () => {
    expect(LANG_CODES.sort()).toEqual(["de", "en", "es", "fr", "it", "pt", "zh"]);
  });
});

describe.each(Object.entries(PER_LANGUAGE_GETTERS))("%s", (name, getter) => {
  test.each(LANG_CODES)("returns a non-empty array for lang=%s", (code) => {
    const result = getter(code);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("getStories", () => {
  test.each(LANG_CODES)("returns a non-empty array for lang=%s", async (code) => {
    const result = await getStories(code);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("caches results for repeated calls with the same language", async () => {
    const first = await getStories("pt");
    const second = await getStories("pt");
    expect(second).toBe(first);
  });
});

describe("getCountries", () => {
  test.each(LANG_CODES)("returns non-empty array with localized name/fact for lang=%s", async (code) => {
    const result = await getCountries(code);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const c of result) {
      expect(typeof c.name).toBe("string");
      expect(c.name.length).toBeGreaterThan(0);
      expect(typeof c.fact).toBe("string");
      expect(c.fact.length).toBeGreaterThan(0);
    }
  });
});

describe("getPortugalHistory", () => {
  test.each(LANG_CODES)("returns non-empty array with localized title/description for lang=%s", async (code) => {
    const result = await getPortugalHistory(code);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const e of result) {
      expect(typeof e.title).toBe("string");
      expect(e.title.length).toBeGreaterThan(0);
      expect(typeof e.description).toBe("string");
      expect(e.description.length).toBeGreaterThan(0);
    }
  });
});
