// localStorage helpers for profile + language-pair persistence, plus a
// best-effort fire-and-forget backend progress ping.

const PROFILE_KEY = "abcmundo.profile";
const LANG_PAIR_KEY = "abcmundo.langPair";

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

const PROGRESS_KEY = "abcmundo.progress";

// Age-based difficulty tier for exercises: tier 1 = youngest (fewer/simpler
// rounds), tier 3 = oldest (more/harder rounds).
export function getDifficultyTier(age) {
  const a = Number(age);
  if (!a || a <= 6) return 1;
  if (a <= 8) return 2;
  return 3;
}

function loadAllProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllProgress(all) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

// Records one exercise attempt for a given skill under the given profile.
// Correct answers grant more XP than incorrect ones (participation still
// counts a little, to keep young children encouraged).
export function recordSkillEvent(profileName, skill, correct) {
  const key = profileName || "guest";
  const all = loadAllProgress();
  const entry = all[key] || { xp: 0, skills: {} };
  const skillEntry = entry.skills[skill] || { correct: 0, attempts: 0 };
  skillEntry.attempts += 1;
  if (correct) skillEntry.correct += 1;
  entry.skills[skill] = skillEntry;
  entry.xp += correct ? 10 : 2;
  all[key] = entry;
  saveAllProgress(all);
  return entry;
}

export function getProgress(profileName) {
  const key = profileName || "guest";
  const all = loadAllProgress();
  return all[key] || { xp: 0, skills: {} };
}

// Simple level curve: 100xp per level, starting at level 1.
export function getLevel(xp) {
  return Math.floor((xp || 0) / 100) + 1;
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
