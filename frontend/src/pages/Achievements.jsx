import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getProfile,
  getLangPair,
  getProgress,
  getLevel,
  getMasteredSkills,
  getWeakestSkills,
  getCompletedMissions,
  getVisitedCountries,
  getVisitedEras,
  getExploredScience,
  getTriedArtPrompts,
  getExploredWhys,
  getTriedLifeSkills,
  getExploredComputing,
} from "../storage.js";
import HelpButton from "../components/HelpButton.jsx";
import {
  getAlphabet,
  getMissions,
  getCountries,
  getPortugalHistory,
  getScience,
  getArtPrompts,
  getWhys,
  getLifeSkills,
  getComputing,
} from "../content/index.js";

// Heuristics used below are intentionally forgiving: the local progress
// engine (recordSkillEvent) is brand new and not every module writes to it
// yet, so every badge tries a "real" signal first (skills/history from
// storage.js) and otherwise simply stays locked instead of guessing. As
// modules adopt recordSkillEvent, more badges will light up automatically
// with no changes needed here.

// Skill ids that other modules may log under (see storage.recordSkillEvent
// call sites) - matched loosely by substring so this keeps working even if
// naming conventions drift a bit between modules.
const VOWEL_HINTS = ["vowel", "vogal", "voyelle", "vokal"];
const ALPHABET_HINTS = ["alphabet", "alfabeto", "letter", "letra"];
const SYLLABLE_HINTS = ["syllable", "sílaba", "silaba"];
const READING_HINTS = ["reading", "word", "leitura", "palavra"];
const PHRASE_HINTS = ["phrase", "frase"];
const STORY_HINTS = ["story", "stories", "história", "historia"];
const GAME_HINTS = ["game", "jogo"];

function skillEntries(progress) {
  return Object.entries(progress.skills || {});
}

function matchesAny(skillId, hints) {
  const lower = skillId.toLowerCase();
  return hints.some((h) => lower.includes(h));
}

function countHistory(progress, hints, onlyCorrect = false) {
  return (progress.history || []).filter(
    (h) => matchesAny(h.skill || "", hints) && (!onlyCorrect || h.correct)
  ).length;
}

function hasAnyActivity(progress, hints) {
  const inSkills = skillEntries(progress).some(([id, v]) => matchesAny(id, hints) && v.attempts > 0);
  if (inSkills) return true;
  return countHistory(progress, hints) > 0;
}

function masteredCount(progress, hints) {
  return skillEntries(progress).filter(([id, v]) => matchesAny(id, hints) && v.mastered).length;
}

export default function Achievements() {
  const { t } = useTranslation();
  const profile = getProfile();
  const langPair = getLangPair();
  const [celebrating, setCelebrating] = useState(null);

  const progress = useMemo(() => getProgress(profile?.name), [profile?.name]);
  const level = getLevel(progress.xp);
  const alphabetLength = useMemo(() => getAlphabet(langPair?.mother || "pt").length, [langPair?.mother]);

  const lettersKnown = useMemo(() => {
    // Prefer counting distinct letter-ish skills actually recorded; fall
    // back to distinct alphabet history entries.
    const fromSkills = skillEntries(progress).filter(([id]) => matchesAny(id, ALPHABET_HINTS)).length;
    if (fromSkills > 0) return fromSkills;
    const seen = new Set();
    (progress.history || []).forEach((h) => {
      if (matchesAny(h.skill || "", ALPHABET_HINTS)) seen.add(h.skill);
    });
    return seen.size;
  }, [progress]);

  const badges = useMemo(() => {
    const list = [];

    list.push({
      id: "vowels",
      icon: "⭐",
      label: t("modules.achievementVowels"),
      unlocked: masteredCount(progress, VOWEL_HINTS) > 0 || hasAnyActivity(progress, VOWEL_HINTS),
    });

    list.push({
      id: "letters10",
      icon: "⭐",
      label: t("modules.achievementLetters10"),
      unlocked: lettersKnown >= 10,
    });

    list.push({
      id: "alphabetComplete",
      icon: "⭐",
      label: t("modules.achievementAlphabetComplete"),
      unlocked: alphabetLength > 0 && lettersKnown >= alphabetLength,
    });

    list.push({
      id: "syllables",
      icon: "⭐",
      label: t("modules.achievementSyllables"),
      unlocked: hasAnyActivity(progress, SYLLABLE_HINTS),
    });

    list.push({
      id: "words20",
      icon: "⭐",
      label: t("modules.achievementWords20"),
      unlocked: countHistory(progress, READING_HINTS) >= 20,
    });

    list.push({
      id: "phrase",
      icon: "⭐",
      label: t("modules.achievementPhrase"),
      unlocked: hasAnyActivity(progress, PHRASE_HINTS),
    });

    list.push({
      id: "story",
      icon: "🏆",
      label: t("modules.achievementStory"),
      unlocked: hasAnyActivity(progress, STORY_HINTS),
    });

    list.push({
      id: "streak",
      icon: "🔥",
      label: t("modules.achievementStreak", { count: progress.streak || 0 }),
      unlocked: (progress.streak || 0) > 0,
    });

    list.push({
      id: "game",
      icon: "🎮",
      label: t("modules.achievementGame"),
      unlocked: hasAnyActivity(progress, GAME_HINTS),
    });

    // XP-based badge so the page never feels completely empty for a brand
    // new profile still waiting on module-level tracking to catch up.
    list.push({
      id: "explorer",
      icon: "🌟",
      label: t("modules.achievementExplorer"),
      unlocked: level >= 2,
    });

    return list;
  }, [progress, level, lettersKnown, alphabetLength, t]);

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  // getCountries/getPortugalHistory are async (lazy-loaded single-file
  // datasets, see content/index.js), unlike every other getter used below
  // in passportStats which stays synchronous. Fetch just their lengths here
  // in a small dedicated effect and merge the totals into passportStats,
  // rather than making the whole useMemo async — keeps the sync getters
  // simple and avoids the Passaporte cards ever rendering NaN/undefined
  // (they start at 0 and update once the async totals resolve).
  const [asyncTotals, setAsyncTotals] = useState({ countries: 0, eras: 0 });
  useEffect(() => {
    let cancelled = false;
    const mother = langPair?.mother || "pt";
    Promise.all([getCountries(mother), getPortugalHistory(mother)]).then(
      ([countries, eras]) => {
        if (cancelled) return;
        setAsyncTotals({ countries: countries.length, eras: eras.length });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [langPair?.mother]);

  // --- Passaporte de Competências: a read-only aggregation of every
  // per-module tracker in storage.js, each paired with its content-derived
  // total so it renders as "X / Y" without hardcoding any denominators.
  const passportStats = useMemo(() => {
    const mother = langPair?.mother || "pt";
    const name = profile?.name;
    return [
      {
        id: "missions",
        icon: "🧭",
        label: t("modules.passportMissions"),
        count: getCompletedMissions(name).length,
        total: getMissions(mother).length,
      },
      {
        id: "countries",
        icon: "🌍",
        label: t("modules.passportCountries"),
        count: getVisitedCountries(name).length,
        total: asyncTotals.countries,
      },
      {
        id: "eras",
        icon: "🏰",
        label: t("modules.passportEras"),
        count: getVisitedEras(name).length,
        total: asyncTotals.eras,
      },
      {
        id: "science",
        icon: "🔬",
        label: t("modules.passportScience"),
        count: getExploredScience(name).length,
        total: getScience(mother).length,
      },
      {
        id: "art",
        icon: "🎨",
        label: t("modules.passportArt"),
        count: getTriedArtPrompts(name).length,
        total: getArtPrompts(mother).length,
      },
      {
        id: "whys",
        icon: "❓",
        label: t("modules.passportWhys"),
        count: getExploredWhys(name).length,
        total: getWhys(mother).length,
      },
      {
        id: "lifeSkills",
        icon: "🧑‍🍳",
        label: t("modules.passportLifeSkills"),
        count: getTriedLifeSkills(name).length,
        total: getLifeSkills(mother).length,
      },
      {
        id: "computing",
        icon: "💻",
        label: t("modules.passportComputing"),
        count: getExploredComputing(name).length,
        total: getComputing(mother).length,
      },
    ];
  }, [profile?.name, langPair?.mother, t, asyncTotals]);

  const masteredSkills = useMemo(() => getMasteredSkills(profile?.name), [profile?.name]);
  const weakestSkills = useMemo(() => getWeakestSkills(profile?.name), [profile?.name]);

  return (
    <div className="page achievements-page">
      <h1>{t("modules.achievementsTitle")}</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.achievementsHelp")} langCode={langPair?.mother} />
      </div>
      <p className="page-intro">{t("modules.achievementsIntro")}</p>

      <div className="achievements-header">
        <div className="achievements-avatar">{profile?.avatar || "🦄"}</div>
        <div className="achievements-header-info">
          <div className="achievements-name">{profile?.name || t("home.newProfile")}</div>
          <div className="achievements-pills">
            <span className="achievements-pill level-pill">
              {t("modules.achievementLevel", { level })}
            </span>
            <span className="achievements-pill xp-pill">{progress.xp || 0} XP</span>
            {(progress.streak || 0) > 0 && (
              <span className="achievements-pill streak-pill">
                🔥 {progress.streak}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="achievements-count">
        {t("modules.achievementsProgress", { unlocked: unlockedCount, total: badges.length })}
      </p>

      <div className="achievements-grid">
        {badges.map((b) => (
          <button
            key={b.id}
            type="button"
            className={
              "achievement-badge" +
              (b.unlocked ? " unlocked" : " locked") +
              (celebrating === b.id ? " celebrating" : "")
            }
            disabled={!b.unlocked}
            onClick={() => {
              if (!b.unlocked) return;
              setCelebrating(b.id);
              setTimeout(() => setCelebrating(null), 600);
            }}
          >
            <span className="achievement-icon">{b.unlocked ? b.icon : "🔒"}</span>
            <span className="achievement-label">{b.label}</span>
          </button>
        ))}
      </div>

      <div className="passport-section">
        <h2 className="passport-title">{t("modules.passportTitle")}</h2>
        <p className="page-intro">{t("modules.passportSubtitle")}</p>

        <div className="passport-grid">
          {passportStats.map((s) => (
            <div key={s.id} className="passport-stat-card">
              <span className="passport-stat-icon">{s.icon}</span>
              <span className="passport-stat-label">{s.label}</span>
              <span className="passport-stat-count">
                {s.count} / {s.total}
              </span>
            </div>
          ))}
        </div>

        <div className="passport-skills-row">
          <div className="passport-skills-col">
            <h3 className="passport-skills-title">{t("modules.passportMastered")}</h3>
            {masteredSkills.length > 0 ? (
              <ul className="passport-skills-list">
                {masteredSkills.map((skill) => (
                  <li key={skill} className="passport-skill-chip mastered">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="passport-skills-empty">{t("modules.passportMasteredEmpty")}</p>
            )}
          </div>

          <div className="passport-skills-col">
            <h3 className="passport-skills-title">{t("modules.passportWeakest")}</h3>
            {weakestSkills.length > 0 ? (
              <ul className="passport-skills-list">
                {weakestSkills.map((w) => (
                  <li key={w.skill} className="passport-skill-chip weakest">
                    {w.skill}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="passport-skills-empty">{t("modules.passportWeakestEmpty")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
