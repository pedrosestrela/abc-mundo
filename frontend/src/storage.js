// localStorage helpers for profile + language-pair persistence, plus a
// best-effort fire-and-forget backend progress ping.

const PROFILE_KEY = "abcmundo.profile";
const LANG_PAIR_KEY = "abcmundo.langPair";
const PROGRESS_KEY = "abcmundo.progress";
const XP_PER_LEVEL = 100;
const MASTERY_ATTEMPTS = 5;
const MASTERY_ACCURACY = 0.8;
const HISTORY_LIMIT = 200;

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getLangPair() {
  try {
    const raw = localStorage.getItem(LANG_PAIR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLangPair(pair) {
  try {
    localStorage.setItem(LANG_PAIR_KEY, JSON.stringify(pair));
  } catch {
    // ignore
  }
}

function readAllProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAllProgress(all) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = new Date(b + "T00:00:00") - new Date(a + "T00:00:00");
  return Math.round(ms / 86400000);
}

function emptyProfileProgress() {
  return { xp: 0, lastActiveDate: null, streak: 0, skills: {}, history: [] };
}

// Returns progress for every profile that has recorded activity locally.
// Shape: { [profileName]: { xp, lastActiveDate, streak, skills: { [skillId]: {correct, attempts, streak, mastered} }, history: [...] } }
export function getAllProfilesProgress() {
  return readAllProgress();
}

// Returns progress for a single profile (never null; returns an empty shape).
export function getProgress(profileName) {
  if (!profileName) return emptyProfileProgress();
  const all = readAllProgress();
  return all[profileName] || emptyProfileProgress();
}

// XP -> level, 100 XP per level, starting at level 1.
export function getLevel(xp) {
  return Math.floor((xp || 0) / XP_PER_LEVEL) + 1;
}

// Records one answer attempt for a skill and persists it locally.
// Also updates streak (consecutive days active) and awards a small amount of XP.
export function recordSkillEvent(profileName, skill, correct) {
  if (!profileName || !skill) return;
  try {
    const all = readAllProgress();
    const profile = all[profileName] || emptyProfileProgress();
    const skillEntry = profile.skills[skill] || { correct: 0, attempts: 0, streak: 0, mastered: false };

    skillEntry.attempts += 1;
    if (correct) {
      skillEntry.correct += 1;
      skillEntry.streak += 1;
    } else {
      skillEntry.streak = 0;
    }
    const accuracy = skillEntry.correct / skillEntry.attempts;
    skillEntry.mastered = skillEntry.attempts >= MASTERY_ATTEMPTS && accuracy >= MASTERY_ACCURACY;
    profile.skills[skill] = skillEntry;

    const date = todayISO();
    profile.history.push({ date, skill, correct: !!correct });
    if (profile.history.length > HISTORY_LIMIT) {
      profile.history = profile.history.slice(-HISTORY_LIMIT);
    }

    if (!profile.lastActiveDate) {
      profile.streak = 1;
    } else if (profile.lastActiveDate !== date) {
      const gap = daysBetween(profile.lastActiveDate, date);
      profile.streak = gap === 1 ? profile.streak + 1 : gap === 0 ? profile.streak : 1;
    }
    profile.lastActiveDate = date;
    profile.xp = (profile.xp || 0) + (correct ? 10 : 2);

    all[profileName] = profile;
    writeAllProgress(all);
  } catch {
    // Never let progress logging break the app.
  }
}

// Array of skill id strings the profile has mastered.
export function getMasteredSkills(profileName) {
  const progress = getProgress(profileName);
  return Object.keys(progress.skills).filter((skill) => progress.skills[skill].mastered);
}

// Array of { skill, accuracy, attempts } sorted worst-accuracy-first, excluding mastered skills.
export function getWeakestSkills(profileName, limit = 5) {
  const progress = getProgress(profileName);
  const rows = Object.entries(progress.skills)
    .filter(([, s]) => !s.mastered && s.attempts > 0)
    .map(([skill, s]) => ({ skill, accuracy: s.correct / s.attempts, attempts: s.attempts }))
    .sort((a, b) => a.accuracy - b.accuracy);
  return rows.slice(0, limit);
}

export function pingProgress({ profileName, module, event }) {
  try {
    fetch("/api/progress/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_name: profileName, module, event }),
    }).catch(() => {});
  } catch {
    // Never let progress logging break the app.
  }
}
