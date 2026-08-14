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

// Maps a child's age to a difficulty tier used to size/scale game content:
// tier 1 (5-6y): small pools, short quizzes; tier 2 (7-8y): medium; tier 3 (9y+): full pools, longer quizzes.
export function getDifficultyTier(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a <= 6) return 1;
  if (a <= 8) return 2;
  return 3;
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

// --- Local progress engine (XP, daily streak, per-skill mastery) ---
// Everything here is stored client-side in localStorage, keyed by the
// current profile's name, so it works fully offline and needs no backend.

const PROGRESS_KEY = "abcmundo.progress";
const XP_PER_CORRECT = 10;
const MASTERY_THRESHOLD = 5; // consecutive-ish correct answers to consider a skill "mastered"

function todayStr() {
  // Uses the profile-independent local date, format YYYY-MM-DD.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    // ignore quota / privacy-mode errors
  }
}

function emptyProgress() {
  return { xp: 0, lastActiveDate: null, streak: 0, skills: {}, history: [] };
}

export function getProgress(profileName) {
  const all = loadAllProgress();
  return all[profileName || "Explorer"] || emptyProgress();
}

// Bumps the daily streak: +1 if the child was last active yesterday, keeps
// the streak if already active today, resets to 1 after a gap of 2+ days.
function bumpStreak(progress) {
  const today = todayStr();
  if (progress.lastActiveDate === today) return progress;
  const yesterday = new Date(Date.now() - 86400000);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  progress.streak = progress.lastActiveDate === yStr ? progress.streak + 1 : 1;
  progress.lastActiveDate = today;
  return progress;
}

// Records one exercise attempt for a skill (e.g. "alphabet", "syllable-ma",
// "phonics-initial-sound"). Awards XP for correct answers, tracks a rolling
// per-skill correct/total count, and marks the skill "mastered" once its
// recent accuracy crosses MASTERY_THRESHOLD consecutive-ish correct answers.
export function recordSkillEvent(profileName, skill, correct) {
  const name = profileName || "Explorer";
  const all = loadAllProgress();
  const progress = all[name] || emptyProgress();
  bumpStreak(progress);

  if (!progress.skills[skill]) {
    progress.skills[skill] = { correct: 0, attempts: 0, streak: 0, mastered: false };
  }
  const s = progress.skills[skill];
  s.attempts += 1;
  if (correct) {
    s.correct += 1;
    s.streak += 1;
    progress.xp += XP_PER_CORRECT;
  } else {
    s.streak = 0;
  }
  if (s.streak >= MASTERY_THRESHOLD) s.mastered = true;

  progress.history.push({ date: todayStr(), skill, correct });
  if (progress.history.length > 500) progress.history = progress.history.slice(-500);

  all[name] = progress;
  saveAllProgress(all);
  return progress;
}

// Simple level curve: 100 XP per level, level 1 minimum.
export function getLevel(xp) {
  return Math.max(1, Math.floor((xp || 0) / 100) + 1);
}

export function getMasteredSkills(profileName) {
  const progress = getProgress(profileName);
  return Object.entries(progress.skills)
    .filter(([, v]) => v.mastered)
    .map(([skill]) => skill);
}

// Weakest skills = attempted skills with the lowest accuracy, used to drive
// the adaptive "give more practice on what's failing" behaviour without
// ever exposing it to the child as a penalty.
export function getWeakestSkills(profileName, limit = 3) {
  const progress = getProgress(profileName);
  return Object.entries(progress.skills)
    .filter(([, v]) => v.attempts >= 3 && !v.mastered)
    .map(([skill, v]) => ({ skill, accuracy: v.correct / v.attempts, attempts: v.attempts }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

export function getAllProfilesProgress() {
  return loadAllProgress();
}
