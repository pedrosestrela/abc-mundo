// localStorage helpers for profile + language-pair persistence, plus a
// best-effort fire-and-forget backend progress ping.

const PROFILE_KEY = "abcmundo.profile";
const LANG_PAIR_KEY = "abcmundo.langPair";

// --- Multi-profile support ---
// Newer, richer storage: an array of profile objects plus a pointer to
// whichever one is currently "active". `getProfile()`/`setProfile()` below
// are kept as the stable public API every page already calls — internally
// they now read/write whichever profile is active in this array, so ~20
// call sites across the app need no changes at all.

const PROFILES_KEY = "abcmundo.profiles";
const ACTIVE_PROFILE_KEY = "abcmundo.activeProfileName";

// Returns the array of saved profiles. On a device that still has the old
// single-profile key (`abcmundo.profile`) but has never had the new
// `abcmundo.profiles` array created yet, this transparently migrates that
// one profile into the array (one-time, on first read) so existing users
// never lose data. After migration it also makes that profile the active
// one, matching pre-migration behaviour exactly.
export function getProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to migration attempt below
  }

  // No profiles array yet — check for an old-style single profile to migrate.
  try {
    const oldRaw = localStorage.getItem(PROFILE_KEY);
    if (oldRaw) {
      const oldProfile = JSON.parse(oldRaw);
      if (oldProfile) {
        const migrated = [oldProfile];
        localStorage.setItem(PROFILES_KEY, JSON.stringify(migrated));
        if (!localStorage.getItem(ACTIVE_PROFILE_KEY) && oldProfile.name) {
          localStorage.setItem(ACTIVE_PROFILE_KEY, oldProfile.name);
        }
        return migrated;
      }
    }
  } catch {
    // ignore, fall through to empty array
  }

  return [];
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

// Adds (or, if a profile with the same name exists, replaces) a profile in
// the multi-profile array. Does not change which profile is active.
export function addProfile(profile) {
  const profiles = getProfiles();
  const idx = profiles.findIndex((p) => p.name === profile.name);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  saveProfiles(profiles);
  return profiles;
}

export function getActiveProfileName() {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || null;
  } catch {
    return null;
  }
}

export function setActiveProfileName(name) {
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, name);
  } catch {
    // ignore quota / privacy-mode errors
  }
}

// Backward-compatible API used unchanged by ~20 pages across the app.
// Internally these now resolve to whichever profile is "active" in the
// new multi-profile store, so switching profiles just works everywhere
// without touching any of those call sites.
export function getProfile() {
  const profiles = getProfiles();
  if (profiles.length === 0) return null;

  const activeName = getActiveProfileName();
  const active = activeName ? profiles.find((p) => p.name === activeName) : null;
  return active || profiles[0];
}

export function setProfile(profile) {
  addProfile(profile);
  setActiveProfileName(profile.name);
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
// --- "Hora de Dormir" (Bedtime / Calm) mode ---
// A single device-wide, parent-controlled preference (not per-profile,
// mirroring how LANG_PAIR_KEY works) for the warm/dim low-stimulation
// visual theme. Defaults OFF.

const BEDTIME_MODE_KEY = "abcmundo.bedtimeMode";

export function getBedtimeMode() {
  try {
    return localStorage.getItem(BEDTIME_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setBedtimeMode(on) {
  try {
    localStorage.setItem(BEDTIME_MODE_KEY, on ? "1" : "0");
  } catch {
    // ignore quota / privacy-mode errors
  }
}

// --- Daily practice reminder ---
// A single device-wide, parent-controlled preference (not per-profile,
// mirroring BEDTIME_MODE_KEY above) for the local "time to practice"
// reminder: whether it's on, what time of day, and the last date a
// reminder was actually shown (so it only fires once per day). See
// reminders.js for the mechanism that reads/updates this.

const REMINDER_SETTINGS_KEY = "abcmundo.reminderSettings";

function defaultReminderSettings() {
  return { enabled: false, time: "17:00", lastShownDate: null };
}

export function getReminderSettings() {
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    return raw ? { ...defaultReminderSettings(), ...JSON.parse(raw) } : defaultReminderSettings();
  } catch {
    return defaultReminderSettings();
  }
}

export function setReminderSettings(partial) {
  const next = { ...getReminderSettings(), ...partial };
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / privacy-mode errors
  }
  return next;
}

export function getDifficultyTier(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a <= 6) return 1;
  if (a <= 8) return 2;
  return 3;
}

// --- Real-world missions ("Passaporte do Conhecimento") ---
// Completed missions are tracked separately from skill XP: they represent
// something the child actually did away from the screen, confirmed by an
// adult, not a quiz answer — so they're stored as a simple id list per profile.

const MISSIONS_KEY = "abcmundo.missionsDone";

function loadMissionsDone() {
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMissionsDone(all) {
  try {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedMissions(profileName) {
  const all = loadMissionsDone();
  return all[profileName || "Explorer"] || [];
}

export function completeMission(profileName, missionId, reaction) {
  const name = profileName || "Explorer";
  const all = loadMissionsDone();
  const done = new Set(all[name] || []);
  done.add(missionId);
  all[name] = Array.from(done);
  saveMissionsDone(all);
  if (reaction) {
    saveMissionReaction(name, missionId, reaction);
  }
  return all[name];
}

// Optional "como foi?" reaction (emoji) the child picks after completing a
// mission, stored separately from the plain completed-id list above so the
// existing completeMission/getCompletedMissions shape never changes for
// callers that don't care about reactions.
const MISSION_REACTIONS_KEY = "abcmundo.missionReactions";

function loadMissionReactions() {
  try {
    const raw = localStorage.getItem(MISSION_REACTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMissionReactionsAll(all) {
  try {
    localStorage.setItem(MISSION_REACTIONS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function saveMissionReaction(profileName, missionId, reaction) {
  const name = profileName || "Explorer";
  const all = loadMissionReactions();
  const forProfile = all[name] || {};
  forProfile[missionId] = reaction;
  all[name] = forProfile;
  saveMissionReactionsAll(all);
  return all[name];
}

export function getMissionReactions(profileName) {
  const all = loadMissionReactions();
  return all[profileName || "Explorer"] || {};
}

// --- World Explorer ("Passaporte do Explorador") ---
// Tracks which country ISO codes the child has explored (viewed the detail
// card for), separate from quiz skill tracking.

const VISITED_COUNTRIES_KEY = "abcmundo.visitedCountries";

function loadVisitedCountries() {
  try {
    const raw = localStorage.getItem(VISITED_COUNTRIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVisitedCountries(all) {
  try {
    localStorage.setItem(VISITED_COUNTRIES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getVisitedCountries(profileName) {
  const all = loadVisitedCountries();
  return all[profileName || "Explorer"] || [];
}

export function visitCountry(profileName, iso) {
  const name = profileName || "Explorer";
  const all = loadVisitedCountries();
  const visited = new Set(all[name] || []);
  visited.add(iso);
  all[name] = Array.from(visited);
  saveVisitedCountries(all);
  return all[name];
}

// --- Atelier da Imaginação ("Art") ---
// Tracks which creative prompt ids the child has opened/tried, separate from
// skill XP — there's no right/wrong answer here, just exploration.

const ART_PROMPTS_TRIED_KEY = "abcmundo.artPromptsTried";

function loadArtPromptsTried() {
  try {
    const raw = localStorage.getItem(ART_PROMPTS_TRIED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveArtPromptsTried(all) {
  try {
    localStorage.setItem(ART_PROMPTS_TRIED_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getTriedArtPrompts(profileName) {
  const all = loadArtPromptsTried();
  return all[profileName || "Explorer"] || [];
}

export function tryArtPrompt(profileName, promptId) {
  const name = profileName || "Explorer";
  const all = loadArtPromptsTried();
  const tried = new Set(all[name] || []);
  tried.add(promptId);
  all[name] = Array.from(tried);
  saveArtPromptsTried(all);
  return all[name];
}

// --- Science Lab ("Laboratório das Descobertas") ---
// Tracks which experiment ids the child has explored (opened the prediction
// + explanation for), separate from quiz skill tracking.

const EXPLORED_SCIENCE_KEY = "abcmundo.exploredScience";

function loadExploredScience() {
  try {
    const raw = localStorage.getItem(EXPLORED_SCIENCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredScience(all) {
  try {
    localStorage.setItem(EXPLORED_SCIENCE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredScience(profileName) {
  const all = loadExploredScience();
  return all[profileName || "Explorer"] || [];
}

export function exploreScienceCard(profileName, cardId) {
  const name = profileName || "Explorer";
  const all = loadExploredScience();
  const explored = new Set(all[name] || []);
  explored.add(cardId);
  all[name] = Array.from(explored);
  saveExploredScience(all);
  return all[name];
}

// --- Cybercidade (digital literacy) ---
// Tracks which computing concept card ids the child has explored (opened
// the explanation for), separate from quiz skill tracking.

const EXPLORED_COMPUTING_KEY = "abcmundo.exploredComputing";

function loadExploredComputing() {
  try {
    const raw = localStorage.getItem(EXPLORED_COMPUTING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredComputing(all) {
  try {
    localStorage.setItem(EXPLORED_COMPUTING_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredComputing(profileName) {
  const all = loadExploredComputing();
  return all[profileName || "Explorer"] || [];
}

export function exploreComputingCard(profileName, cardId) {
  const name = profileName || "Explorer";
  const all = loadExploredComputing();
  const explored = new Set(all[name] || []);
  explored.add(cardId);
  all[name] = Array.from(explored);
  saveExploredComputing(all);
  return all[name];
}

// Tracks which "Como funciona a Internet?" journey step ids the child has
// tapped/explored, mirroring the exploreComputingCard/getExploredComputing
// pair shape above.

const EXPLORED_INTERNET_JOURNEY_KEY = "abcmundo.exploredInternetJourney";

function loadExploredInternetJourney() {
  try {
    const raw = localStorage.getItem(EXPLORED_INTERNET_JOURNEY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredInternetJourney(all) {
  try {
    localStorage.setItem(EXPLORED_INTERNET_JOURNEY_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredInternetJourney(profileName) {
  const all = loadExploredInternetJourney();
  return all[profileName || "Explorer"] || [];
}

export function exploreInternetJourneyStep(profileName, stepId) {
  const name = profileName || "Explorer";
  const all = loadExploredInternetJourney();
  const explored = new Set(all[name] || []);
  explored.add(stepId);
  all[name] = Array.from(explored);
  saveExploredInternetJourney(all);
  return all[name];
}

// --- Aprender a Aprender (learning strategies / metacognition) ---
// Tracks which learning-activity ids (as "type:id") the child has completed
// across the module's five areas (memory, attention, error, strategy,
// teach-back), mirroring the exploredComputing pattern above.

const COMPLETED_LEARNING_ACTIVITIES_KEY = "abcmundo.completedLearningActivities";

function loadCompletedLearningActivities() {
  try {
    const raw = localStorage.getItem(COMPLETED_LEARNING_ACTIVITIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedLearningActivities(all) {
  try {
    localStorage.setItem(COMPLETED_LEARNING_ACTIVITIES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedLearningActivities(profileName) {
  const all = loadCompletedLearningActivities();
  return all[profileName || "Explorer"] || [];
}

export function completeLearningActivity(profileName, activityId) {
  const name = profileName || "Explorer";
  const all = loadCompletedLearningActivities();
  const completed = new Set(all[name] || []);
  completed.add(activityId);
  all[name] = Array.from(completed);
  saveCompletedLearningActivities(all);
  return all[name];
}

// --- O Mundo por Dentro (how things work) ---
// Tracks which part ids (as "objectId:partId") the child has explored, for
// each object of the "how things work" module.

const EXPLORED_THING_PARTS_KEY = "abcmundo.exploredThingParts";

function loadExploredThingParts() {
  try {
    const raw = localStorage.getItem(EXPLORED_THING_PARTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredThingParts(all) {
  try {
    localStorage.setItem(EXPLORED_THING_PARTS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredThingParts(profileName) {
  const all = loadExploredThingParts();
  return all[profileName || "Explorer"] || [];
}

export function exploreThingPart(profileName, objectId, partId) {
  const name = profileName || "Explorer";
  const all = loadExploredThingParts();
  const explored = new Set(all[name] || []);
  explored.add(`${objectId}:${partId}`);
  all[name] = Array.from(explored);
  saveExploredThingParts(all);
  return all[name];
}

// --- O Que Há Dentro? (object teardown) ---
// Tracks which teardown part ids (as "objectId:partId") the child has tapped
// open, per object of the "object teardown" module. Same shape as
// exploredThingParts above, kept as its own key since it's a separate module.

const EXPLORED_TEARDOWN_PARTS_KEY = "abcmundo.exploredTeardownParts";

function loadExploredTeardownParts() {
  try {
    const raw = localStorage.getItem(EXPLORED_TEARDOWN_PARTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredTeardownParts(all) {
  try {
    localStorage.setItem(EXPLORED_TEARDOWN_PARTS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredTeardownParts(profileName) {
  const all = loadExploredTeardownParts();
  return all[profileName || "Explorer"] || [];
}

export function exploreTeardownPart(profileName, objectId, partId) {
  const name = profileName || "Explorer";
  const all = loadExploredTeardownParts();
  const explored = new Set(all[name] || []);
  explored.add(`${objectId}:${partId}`);
  all[name] = Array.from(explored);
  saveExploredTeardownParts(all);
  return all[name];
}

// --- Eu Por Dentro (human body organs) + Hospital dos Brinquedos ---
// Same "explored ids per profile" pattern as the object-teardown module
// above, kept as its own key since it's a separate module.

const EXPLORED_BODY_ORGANS_KEY = "abcmundo.exploredBodyOrgans";

function loadExploredBodyOrgans() {
  try {
    const raw = localStorage.getItem(EXPLORED_BODY_ORGANS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredBodyOrgans(all) {
  try {
    localStorage.setItem(EXPLORED_BODY_ORGANS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredBodyOrgans(profileName) {
  const all = loadExploredBodyOrgans();
  return all[profileName || "Explorer"] || [];
}

export function exploreBodyOrgan(profileName, organId) {
  const name = profileName || "Explorer";
  const all = loadExploredBodyOrgans();
  const explored = new Set(all[name] || []);
  explored.add(organId);
  all[name] = Array.from(explored);
  saveExploredBodyOrgans(all);
  return all[name];
}

const COMPLETED_HOSPITAL_SCENARIOS_KEY = "abcmundo.completedHospitalScenarios";

function loadCompletedHospitalScenarios() {
  try {
    const raw = localStorage.getItem(COMPLETED_HOSPITAL_SCENARIOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedHospitalScenarios(all) {
  try {
    localStorage.setItem(COMPLETED_HOSPITAL_SCENARIOS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedHospitalScenarios(profileName) {
  const all = loadCompletedHospitalScenarios();
  return all[profileName || "Explorer"] || [];
}

export function completeHospitalScenario(profileName, scenarioId) {
  const name = profileName || "Explorer";
  const all = loadCompletedHospitalScenarios();
  const done = new Set(all[name] || []);
  done.add(scenarioId);
  all[name] = Array.from(done);
  saveCompletedHospitalScenarios(all);
  return all[name];
}

// --- Os Cinco Sentidos (senses missions) ---
// Real-world, trust-based missions like the main Missions module: the child
// does something away from the screen, then confirms "Já fiz!" — no
// automated check. Tracked as a separate completed-id list (own storage key)
// so it doesn't mix with the main mission passport's ids/counts.

const SENSES_MISSIONS_DONE_KEY = "abcmundo.sensesMissionsDone";

function loadSensesMissionsDone() {
  try {
    const raw = localStorage.getItem(SENSES_MISSIONS_DONE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSensesMissionsDone(all) {
  try {
    localStorage.setItem(SENSES_MISSIONS_DONE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedSensesMissions(profileName) {
  const all = loadSensesMissionsDone();
  return all[profileName || "Explorer"] || [];
}

export function completeSensesMission(profileName, missionId) {
  const name = profileName || "Explorer";
  const all = loadSensesMissionsDone();
  const done = new Set(all[name] || []);
  done.add(missionId);
  all[name] = Array.from(done);
  saveSensesMissionsDone(all);
  return all[name];
}

// --- Portugal History Timeline ("Castelo do Tempo") ---
// Tracks which era ids the child has explored (opened the detail card for).

const VISITED_ERAS_KEY = "abcmundo.visitedEras";

function loadVisitedEras() {
  try {
    const raw = localStorage.getItem(VISITED_ERAS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVisitedEras(all) {
  try {
    localStorage.setItem(VISITED_ERAS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getVisitedEras(profileName) {
  const all = loadVisitedEras();
  return all[profileName || "Explorer"] || [];
}

export function visitEra(profileName, eraId) {
  const name = profileName || "Explorer";
  const all = loadVisitedEras();
  const visited = new Set(all[name] || []);
  visited.add(eraId);
  all[name] = Array.from(visited);
  saveVisitedEras(all);
  return all[name];
}

// Session-length tracking, kept in memory only (never persisted). A
// "session" is just however long this tab has been open — reloading the
// page starts a fresh session. Used by the gentle session-end nudge.
let sessionStartTime = null;

export function getSessionStartTime() {
  if (sessionStartTime === null) {
    sessionStartTime = Date.now();
  }
  return sessionStartTime;
}

export function getSessionElapsedMinutes() {
  return (Date.now() - getSessionStartTime()) / 60000;
}

const EXPLORED_WHYS_KEY = "abcmundo.exploredWhys";

export function exploreWhy(profileName, whyId) {
  try {
    const raw = localStorage.getItem(EXPLORED_WHYS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const list = all[profileName] || [];
    if (!list.includes(whyId)) {
      all[profileName] = [...list, whyId];
      localStorage.setItem(EXPLORED_WHYS_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore
  }
}

export function getExploredWhys(profileName) {
  try {
    const raw = localStorage.getItem(EXPLORED_WHYS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[profileName] || [];
  } catch {
    return [];
  }
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

// --- Escola da Vida (Life Skills) ---
// Tracks which life-skill card ids the child has opened/tried, separate
// from quiz skill tracking, mirroring exploreScienceCard/getExploredScience.

const TRIED_LIFE_SKILLS_KEY = "abcmundo.triedLifeSkills";

function loadTriedLifeSkills() {
  try {
    const raw = localStorage.getItem(TRIED_LIFE_SKILLS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTriedLifeSkills(all) {
  try {
    localStorage.setItem(TRIED_LIFE_SKILLS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getTriedLifeSkills(profileName) {
  const all = loadTriedLifeSkills();
  return all[profileName || "Explorer"] || [];
}

export function tryLifeSkill(profileName, skillId) {
  const name = profileName || "Explorer";
  const all = loadTriedLifeSkills();
  const tried = new Set(all[name] || []);
  tried.add(skillId);
  all[name] = Array.from(tried);
  saveTriedLifeSkills(all);
  return all[name];
}

// --- Academia do Pensamento (Thinking Academy) ---
// Tracks which exercise ids the child has completed, across all exercise
// types (fact-or-assumption, cause-or-coincidence, missing-info,
// contradiction, estimation, puzzles), mirroring exploreScienceCard's shape.

const COMPLETED_THINKING_KEY = "abcmundo.completedThinking";

function loadCompletedThinking() {
  try {
    const raw = localStorage.getItem(COMPLETED_THINKING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedThinking(all) {
  try {
    localStorage.setItem(COMPLETED_THINKING_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedThinking(profileName) {
  const all = loadCompletedThinking();
  return all[profileName || "Explorer"] || [];
}

export function completeThinkingExercise(profileName, exerciseId) {
  const name = profileName || "Explorer";
  const all = loadCompletedThinking();
  const done = new Set(all[name] || []);
  done.add(exerciseId);
  all[name] = Array.from(done);
  saveCompletedThinking(all);
  return all[name];
}

// --- Redação ABC (Newsroom) ---
// Tracks which news scenario ids the child has fully completed (all
// who/what/where/when questions plus the fact-vs-assumption question),
// mirroring completeThinkingExercise's shape.

const COMPLETED_NEWSROOM_KEY = "abcmundo.completedNewsroom";

function loadCompletedNewsroom() {
  try {
    const raw = localStorage.getItem(COMPLETED_NEWSROOM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedNewsroom(all) {
  try {
    localStorage.setItem(COMPLETED_NEWSROOM_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedNewsroom(profileName) {
  const all = loadCompletedNewsroom();
  return all[profileName || "Explorer"] || [];
}

export function completeNewsroomScenario(profileName, scenarioId) {
  const name = profileName || "Explorer";
  const all = loadCompletedNewsroom();
  const done = new Set(all[name] || []);
  done.add(scenarioId);
  all[name] = Array.from(done);
  saveCompletedNewsroom(all);
  return all[name];
}

// --- Academia da Comunicação (Communication Academy) ---
// Tracks which instruction-sequencing challenge ids the child has solved
// (given the robot a fully clear, correctly ordered set of steps).

const COMPLETED_ACADEMY_KEY = "abcmundo.completedAcademy";

function loadCompletedAcademy() {
  try {
    const raw = localStorage.getItem(COMPLETED_ACADEMY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedAcademy(all) {
  try {
    localStorage.setItem(COMPLETED_ACADEMY_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedAcademy(profileName) {
  const all = loadCompletedAcademy();
  return all[profileName || "Explorer"] || [];
}

export function completeAcademyChallenge(profileName, challengeId) {
  const name = profileName || "Explorer";
  const all = loadCompletedAcademy();
  const done = new Set(all[name] || []);
  done.add(challengeId);
  all[name] = Array.from(done);
  saveCompletedAcademy(all);
  return all[name];
}

// --- Diário da Natureza (Nature Diary) ---
// An ongoing, time-based observation log the child adds to over days/weeks:
// plants, birds, insects, weather, seasons. Each entry is either a drawing
// (a data URL from DrawingCanvas) or a picked preset icon — never a photo or
// location, per the privacy-first design of this module. Stored as an
// append-only list per profile, mirroring the id-list pattern used elsewhere
// in this file but keeping full entry objects since order/date matters here.

const NATURE_DIARY_KEY = "abcmundo.natureDiary";

function loadNatureDiary() {
  try {
    const raw = localStorage.getItem(NATURE_DIARY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNatureDiary(all) {
  try {
    localStorage.setItem(NATURE_DIARY_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getNatureDiary(profileName) {
  const all = loadNatureDiary();
  return all[profileName || "Explorer"] || [];
}

// entry: { id, category, date, drawing?: dataURL, icon?: string }
export function addNatureDiaryEntry(profileName, entry) {
  const name = profileName || "Explorer";
  const all = loadNatureDiary();
  const list = all[name] || [];
  const withId = { id: entry.id || `nd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...entry };
  all[name] = [withId, ...list];
  saveNatureDiary(all);
  return all[name];
}

// --- Diário da Lua (Moon Diary) ---
// A month-long observation activity: the child picks or draws the Moon's
// current shape once a day. Same append-only, per-profile storage shape as
// the Nature Diary above, kept separate since the two logs are browsed and
// reflected on independently (moon phase pattern-finding needs its own list).

const MOON_DIARY_KEY = "abcmundo.moonDiary";

function loadMoonDiary() {
  try {
    const raw = localStorage.getItem(MOON_DIARY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMoonDiary(all) {
  try {
    localStorage.setItem(MOON_DIARY_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getMoonDiary(profileName) {
  const all = loadMoonDiary();
  return all[profileName || "Explorer"] || [];
}

// entry: { id, date, phase?: string, drawing?: dataURL }
export function addMoonDiaryEntry(profileName, entry) {
  const name = profileName || "Explorer";
  const all = loadMoonDiary();
  const list = all[name] || [];
  const withId = { id: entry.id || `md-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...entry };
  all[name] = [withId, ...list];
  saveMoonDiary(all);
  return all[name];
}

// --- Ateliê: Pixel Art ---
// Tracks which pixel-art grids the child has saved, per profile. Mirrors
// the exploreComputingCard/getExploredComputing pair shape (list of ids),
// but here the "id" is a self-generated save id since pixel art pieces
// aren't drawn from a fixed content bank.

const ART_PIXEL_SAVES_KEY = "abcmundo.artPixelSaves";

function loadArtPixelSaves() {
  try {
    const raw = localStorage.getItem(ART_PIXEL_SAVES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveArtPixelSaves(all) {
  try {
    localStorage.setItem(ART_PIXEL_SAVES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getArtPixelArtSaves(profileName) {
  const all = loadArtPixelSaves();
  return all[profileName || "Explorer"] || [];
}

// entry: { id, grid: string[] (cell colors), createdAt }
export function saveArtPixelArt(profileName, entry) {
  const name = profileName || "Explorer";
  const all = loadArtPixelSaves();
  const list = all[name] || [];
  const withId = {
    id: entry.id || `pa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt || Date.now(),
    ...entry,
  };
  all[name] = [withId, ...list];
  saveArtPixelSaves(all);
  return all[name];
}

// --- Ateliê: Criar Personagem (character builder) ---
// Tracks custom characters the child has assembled and saved, per profile.
// Same append-only shape as the pixel art saves above.

const ART_CHARACTER_SAVES_KEY = "abcmundo.artCharacterSaves";

function loadArtCharacterSaves() {
  try {
    const raw = localStorage.getItem(ART_CHARACTER_SAVES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveArtCharacterSaves(all) {
  try {
    localStorage.setItem(ART_CHARACTER_SAVES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getArtCharacterSaves(profileName) {
  const all = loadArtCharacterSaves();
  return all[profileName || "Explorer"] || [];
}

// entry: { id, head, eyes, mouth, color, accessory, createdAt }
export function saveArtCharacter(profileName, entry) {
  const name = profileName || "Explorer";
  const all = loadArtCharacterSaves();
  const list = all[name] || [];
  const withId = {
    id: entry.id || `ac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt || Date.now(),
    ...entry,
  };
  all[name] = [withId, ...list];
  saveArtCharacterSaves(all);
  return all[name];
}

// --- Escola de Trânsito: explored traffic signs ---
// Tracks which traffic-sign card ids the child has tapped/revealed (i.e. read
// the explanation for), mirroring the exploreComputingCard/getExploredComputing
// pair shape exactly.

const EXPLORED_TRAFFIC_SIGNS_KEY = "abcmundo.exploredTrafficSigns";

function loadExploredTrafficSigns() {
  try {
    const raw = localStorage.getItem(EXPLORED_TRAFFIC_SIGNS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredTrafficSigns(all) {
  try {
    localStorage.setItem(EXPLORED_TRAFFIC_SIGNS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredTrafficSigns(profileName) {
  const all = loadExploredTrafficSigns();
  return all[profileName || "Explorer"] || [];
}

export function exploreTrafficSign(profileName, signId) {
  const name = profileName || "Explorer";
  const all = loadExploredTrafficSigns();
  const explored = new Set(all[name] || []);
  explored.add(signId);
  all[name] = Array.from(explored);
  saveExploredTrafficSigns(all);
  return all[name];
}

// --- A Evolução do Homem: visited timeline stages ---
// Tracks which human-evolution timeline stage ids the child has tapped/opened,
// mirroring the exploreComputingCard/getExploredComputing pair shape exactly.

const VISITED_EVOLUTION_STAGES_KEY = "abcmundo.visitedEvolutionStages";

function loadVisitedEvolutionStages() {
  try {
    const raw = localStorage.getItem(VISITED_EVOLUTION_STAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVisitedEvolutionStages(all) {
  try {
    localStorage.setItem(VISITED_EVOLUTION_STAGES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getVisitedEvolutionStages(profileName) {
  const all = loadVisitedEvolutionStages();
  return all[profileName || "Explorer"] || [];
}

export function visitEvolutionStage(profileName, stageId) {
  const name = profileName || "Explorer";
  const all = loadVisitedEvolutionStages();
  const visited = new Set(all[name] || []);
  visited.add(stageId);
  all[name] = Array.from(visited);
  saveVisitedEvolutionStages(all);
  return all[name];
}

// --- Sistema Solar: visited card ids ---
// Tracks which solar-system card ids the child has tapped/opened, mirroring
// visitEvolutionStage/getVisitedEvolutionStages exactly.

const VISITED_SOLAR_SYSTEM_STAGES_KEY = "abcmundo.visitedSolarSystemStages";

function loadVisitedSolarSystemStages() {
  try {
    const raw = localStorage.getItem(VISITED_SOLAR_SYSTEM_STAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVisitedSolarSystemStages(all) {
  try {
    localStorage.setItem(VISITED_SOLAR_SYSTEM_STAGES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getVisitedSolarSystemStages(profileName) {
  const all = loadVisitedSolarSystemStages();
  return all[profileName || "Explorer"] || [];
}

export function visitSolarSystemStage(profileName, stageId) {
  const name = profileName || "Explorer";
  const all = loadVisitedSolarSystemStages();
  const visited = new Set(all[name] || []);
  visited.add(stageId);
  all[name] = Array.from(visited);
  saveVisitedSolarSystemStages(all);
  return all[name];
}

// --- Tech History (car, lightbulb/electricity, ways to produce electricity):
// visited timeline/topic stage ids ---
// Tracks which tech-history stage ids the child has tapped/opened, keyed by
// profile + topic (e.g. "automobile", "electricity", "production"), mirroring
// visitEvolutionStage/getVisitedEvolutionStages exactly but scoped per topic.

const VISITED_TECH_HISTORY_KEY = "abcmundo.visitedTechHistory";

function loadVisitedTechHistory() {
  try {
    const raw = localStorage.getItem(VISITED_TECH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveVisitedTechHistory(all) {
  try {
    localStorage.setItem(VISITED_TECH_HISTORY_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getVisitedTechHistoryStages(profileName, topicId) {
  const all = loadVisitedTechHistory();
  const name = profileName || "Explorer";
  return (all[name] && all[name][topicId]) || [];
}

export function visitTechHistoryStage(profileName, topicId, stageId) {
  const name = profileName || "Explorer";
  const all = loadVisitedTechHistory();
  const forName = all[name] || {};
  const visited = new Set(forName[topicId] || []);
  visited.add(stageId);
  forName[topicId] = Array.from(visited);
  all[name] = forName;
  saveVisitedTechHistory(all);
  return forName[topicId];
}

// --- Mini Chef ---
// Tracks which recipe ids the child has finished cooking, per profile.

const COOKED_RECIPES_KEY = "abcmundo.cookedRecipes";

function loadCookedRecipes() {
  try {
    const raw = localStorage.getItem(COOKED_RECIPES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCookedRecipes(all) {
  try {
    localStorage.setItem(COOKED_RECIPES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCookedRecipes(profileName) {
  const all = loadCookedRecipes();
  return all[profileName || "Explorer"] || [];
}

export function cookRecipe(profileName, recipeId) {
  const name = profileName || "Explorer";
  const all = loadCookedRecipes();
  const cooked = new Set(all[name] || []);
  cooked.add(recipeId);
  all[name] = Array.from(cooked);
  saveCookedRecipes(all);
  return all[name];
}

// --- Circuit Lab ---
// Tracks which circuit challenge ids the child has successfully completed.

const COMPLETED_CIRCUITS_KEY = "abcmundo.completedCircuits";

function loadCompletedCircuits() {
  try {
    const raw = localStorage.getItem(COMPLETED_CIRCUITS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedCircuits(all) {
  try {
    localStorage.setItem(COMPLETED_CIRCUITS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

// --- Museu ABC ---
// Tracks which exhibit ids (as "roomId:exhibitId") the child has opened and
// guessed on, per profile. Same shape/pattern as exploredTeardownParts above.

const EXPLORED_MUSEUM_EXHIBITS_KEY = "abcmundo.exploredMuseumExhibits";

function loadExploredMuseumExhibits() {
  try {
    const raw = localStorage.getItem(EXPLORED_MUSEUM_EXHIBITS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExploredMuseumExhibits(all) {
  try {
    localStorage.setItem(EXPLORED_MUSEUM_EXHIBITS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getExploredMuseumExhibits(profileName) {
  const all = loadExploredMuseumExhibits();
  return all[profileName || "Explorer"] || [];
}

export function exploreMuseumExhibit(profileName, roomId, exhibitId) {
  const name = profileName || "Explorer";
  const all = loadExploredMuseumExhibits();
  const explored = new Set(all[name] || []);
  explored.add(`${roomId}:${exhibitId}`);
  all[name] = Array.from(explored);
  saveExploredMuseumExhibits(all);
  return all[name];
}

// --- Pequeno Arqueólogo (excavation) ---
// Tracks which excavation scenario ids the child has fully dug (all
// artifacts revealed + reasoning question answered), per profile.

const COMPLETED_EXCAVATIONS_KEY = "abcmundo.completedExcavations";

function loadCompletedExcavations() {
  try {
    const raw = localStorage.getItem(COMPLETED_EXCAVATIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedExcavations(all) {
  try {
    localStorage.setItem(COMPLETED_EXCAVATIONS_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedExcavations(profileName) {
  const all = loadCompletedExcavations();
  return all[profileName || "Explorer"] || [];
}

export function completeExcavation(profileName, scenarioId) {
  const name = profileName || "Explorer";
  const all = loadCompletedExcavations();
  const done = new Set(all[name] || []);
  done.add(scenarioId);
  all[name] = Array.from(done);
  saveCompletedExcavations(all);
  return all[name];
}

// --- Desafio Zero Desperdício ---
// Tracks which zero-waste scenario ids the child has resolved with the best
// (greenest) choice, mirroring exploreComputingCard/getExploredComputing's
// id-list shape. Picking the non-best option is never recorded as a
// "failure" anywhere — the whole module has no wrong-answer penalty, only a
// gentle nudge to try again, so there's nothing here to track for that case.

const COMPLETED_ZERO_WASTE_KEY = "abcmundo.completedZeroWaste";

function loadCompletedZeroWaste() {
  try {
    const raw = localStorage.getItem(COMPLETED_ZERO_WASTE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedZeroWaste(all) {
  try {
    localStorage.setItem(COMPLETED_ZERO_WASTE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedZeroWaste(profileName) {
  const all = loadCompletedZeroWaste();
  return all[profileName || "Explorer"] || [];
}

export function completeZeroWasteScenario(profileName, scenarioId) {
  const name = profileName || "Explorer";
  const all = loadCompletedZeroWaste();
  const done = new Set(all[name] || []);
  done.add(scenarioId);
  all[name] = Array.from(done);
  saveCompletedZeroWaste(all);
  return all[name];
}

// --- Trabalho em Equipa ---
// Tracks which cooperation scenario ids the child has solved (assigned the
// best-matching character to the task), same id-list shape as above.

const COMPLETED_TEAMWORK_KEY = "abcmundo.completedTeamwork";

function loadCompletedTeamwork() {
  try {
    const raw = localStorage.getItem(COMPLETED_TEAMWORK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompletedTeamwork(all) {
  try {
    localStorage.setItem(COMPLETED_TEAMWORK_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getCompletedTeamwork(profileName) {
  const all = loadCompletedTeamwork();
  return all[profileName || "Explorer"] || [];
}

export function completeTeamworkScenario(profileName, scenarioId) {
  const name = profileName || "Explorer";
  const all = loadCompletedTeamwork();
  const done = new Set(all[name] || []);
  done.add(scenarioId);
  all[name] = Array.from(done);
  saveCompletedTeamwork(all);
  return all[name];
}

// --- Criador Livre: free-writing story starters ---
// No scoring, no "correct" story — just an append-only list of story drafts
// the child has written from a rotating prompt, per profile. Mirrors the
// Nature Diary / Moon Diary append-only entry shape above.

const FREE_STORIES_KEY = "abcmundo.freeStories";

function loadFreeStories() {
  try {
    const raw = localStorage.getItem(FREE_STORIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFreeStories(all) {
  try {
    localStorage.setItem(FREE_STORIES_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function getFreeStories(profileName) {
  const all = loadFreeStories();
  return all[profileName || "Explorer"] || [];
}

// entry: { id, promptId, text, createdAt }
export function saveFreeStory(profileName, entry) {
  const name = profileName || "Explorer";
  const all = loadFreeStories();
  const list = all[name] || [];
  const withId = {
    id: entry.id || `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: entry.createdAt || Date.now(),
    ...entry,
  };
  all[name] = [withId, ...list];
  saveFreeStories(all);
  return all[name];
}

const DAILY_PATH_KEY = "abcmundo.dailyPath";

// --- Backup / device-to-device sync ---
// Exports every localStorage key this file owns (all profiles + all their
// per-module progress data) into one plain JSON-serializable object, and
// merges such an object back in on the receiving device. Kept intentionally
// dumb about the *shape* of each key's value — it just carries whatever is
// already in localStorage across, so it never needs updating when a new
// module's storage key is added above.
const SYNC_STORAGE_KEYS = [
  PROFILES_KEY,
  ACTIVE_PROFILE_KEY,
  LANG_PAIR_KEY,
  MISSIONS_KEY,
  MISSION_REACTIONS_KEY,
  VISITED_COUNTRIES_KEY,
  ART_PROMPTS_TRIED_KEY,
  EXPLORED_SCIENCE_KEY,
  EXPLORED_COMPUTING_KEY,
  EXPLORED_INTERNET_JOURNEY_KEY,
  COMPLETED_LEARNING_ACTIVITIES_KEY,
  EXPLORED_THING_PARTS_KEY,
  VISITED_ERAS_KEY,
  EXPLORED_WHYS_KEY,
  PROGRESS_KEY,
  TRIED_LIFE_SKILLS_KEY,
  COMPLETED_THINKING_KEY,
  COMPLETED_NEWSROOM_KEY,
  COMPLETED_ACADEMY_KEY,
  NATURE_DIARY_KEY,
  MOON_DIARY_KEY,
  ART_PIXEL_SAVES_KEY,
  ART_CHARACTER_SAVES_KEY,
  EXPLORED_TRAFFIC_SIGNS_KEY,
  VISITED_EVOLUTION_STAGES_KEY,
  VISITED_SOLAR_SYSTEM_STAGES_KEY,
  VISITED_TECH_HISTORY_KEY,
  COOKED_RECIPES_KEY,
  COMPLETED_CIRCUITS_KEY,
  EXPLORED_MUSEUM_EXHIBITS_KEY,
  COMPLETED_EXCAVATIONS_KEY,
  COMPLETED_ZERO_WASTE_KEY,
  COMPLETED_TEAMWORK_KEY,
  FREE_STORIES_KEY,
  DAILY_PATH_KEY,
];

// Gathers every profile's full data from this device into one JSON-friendly
// object, ready to POST to /api/sync/upload.
export function exportAllData() {
  const out = {};
  for (const key of SYNC_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) out[key] = JSON.parse(raw);
    } catch {
      // skip unreadable key rather than fail the whole export
    }
  }
  return out;
}

// Merges an object previously produced by exportAllData() (retrieved from
// /api/sync/download/{code}) into this device's localStorage, without
// destroying anything already here.
//
// Merge strategy:
// - PROFILES_KEY (array of profile objects): profiles are merged by name.
//   A name that doesn't exist locally is added as-is. A name that already
//   exists locally is left untouched if the incoming profile looks
//   identical (same JSON), otherwise the incoming one is added under a
//   suffixed name ("Name (2)", "Name (3)", ...) so no data is silently
//   overwritten or lost.
// - ACTIVE_PROFILE_KEY / LANG_PAIR_KEY: left untouched if this device
//   already has a value (these are single-value device settings, not data
//   to merge); adopted from the import only if unset locally.
// - Every other key is a "per-profile-name object" (profileName -> data).
//   Local entries win; a profile name present only in the incoming data is
//   added. If a profile name was renamed above (collision), the same
//   renamed key is used here so its progress data stays attached to it.
export function mergeImportedData(imported) {
  if (!imported || typeof imported !== "object") {
    return { importedProfiles: 0, renamedProfiles: [] };
  }

  const nameRemap = {}; // incoming name -> name actually used locally
  const renamedProfiles = [];
  let importedProfiles = 0;

  // 1. Merge profiles first, so we know the final name for every incoming profile.
  const localProfiles = getProfiles();
  const localByName = new Map(localProfiles.map((p) => [p.name, p]));
  const incomingProfiles = Array.isArray(imported[PROFILES_KEY]) ? imported[PROFILES_KEY] : [];

  for (const incoming of incomingProfiles) {
    if (!incoming || !incoming.name) continue;
    const existing = localByName.get(incoming.name);
    if (!existing) {
      localProfiles.push(incoming);
      localByName.set(incoming.name, incoming);
      nameRemap[incoming.name] = incoming.name;
      importedProfiles += 1;
      continue;
    }
    if (JSON.stringify(existing) === JSON.stringify(incoming)) {
      // Identical profile already present locally: nothing to do.
      nameRemap[incoming.name] = incoming.name;
      continue;
    }
    // Name collision with different data: keep both, suffix the incoming one.
    let n = 2;
    let candidate = `${incoming.name} (${n})`;
    while (localByName.has(candidate)) {
      n += 1;
      candidate = `${incoming.name} (${n})`;
    }
    const renamed = { ...incoming, name: candidate };
    localProfiles.push(renamed);
    localByName.set(candidate, renamed);
    nameRemap[incoming.name] = candidate;
    renamedProfiles.push({ from: incoming.name, to: candidate });
    importedProfiles += 1;
  }
  saveProfiles(localProfiles);

  if (!getActiveProfileName() && localProfiles.length > 0) {
    setActiveProfileName(localProfiles[0].name);
  }

  // 2. Merge every other per-profile-name-keyed object, honoring the same
  // name remap so a renamed profile's progress stays with it.
  for (const key of SYNC_STORAGE_KEYS) {
    if (key === PROFILES_KEY || key === ACTIVE_PROFILE_KEY || key === LANG_PAIR_KEY) continue;
    const incomingForKey = imported[key];
    if (!incomingForKey || typeof incomingForKey !== "object") continue;

    let localForKey;
    try {
      const raw = localStorage.getItem(key);
      localForKey = raw ? JSON.parse(raw) : {};
    } catch {
      localForKey = {};
    }

    for (const [profileName, value] of Object.entries(incomingForKey)) {
      const finalName = nameRemap[profileName] || profileName;
      if (!(finalName in localForKey)) {
        localForKey[finalName] = value;
      }
      // If it already exists locally, local data wins (no overwrite).
    }

    try {
      localStorage.setItem(key, JSON.stringify(localForKey));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }

  if (!getLangPair() && imported[LANG_PAIR_KEY]) {
    setLangPair(imported[LANG_PAIR_KEY]);
  }

  return { importedProfiles, renamedProfiles };
}

// --- Missão de Hoje (daily guided path) ---
// Tracks, per profile, how many "days" of the daily curriculum sequencer
// (see content/dailyPath.js) have been completed, plus the date the child
// last completed today's mission — so revisiting the same day shows the
// "already done, come back tomorrow" state instead of repeating content.
// Deliberately a plain date-string comparison (todayStr(), reused from the
// XP/streak engine above), not `new Date()` math, to keep this simple and
// timezone-boring.

function loadDailyPath() {
  try {
    const raw = localStorage.getItem(DAILY_PATH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDailyPath(all) {
  try {
    localStorage.setItem(DAILY_PATH_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function defaultDailyPathState() {
  return { index: 0, lastCompletedDate: null };
}

// { index, lastCompletedDate } — `index` is how many days of the path this
// profile has completed, used by dailyPath.js to pick which letters/number
// come next.
export function getDailyPathState(profileName) {
  const all = loadDailyPath();
  return all[profileName || "Explorer"] || defaultDailyPathState();
}

// True if today's mission was already marked done for this profile.
export function getDailyMissionStatus(profileName) {
  const state = getDailyPathState(profileName);
  return { doneToday: state.lastCompletedDate === todayStr(), index: state.index };
}

// Marks today's mission complete: advances the day index by one (so
// tomorrow's bundle picks the next letters/number) and stamps today's date
// so the page shows the "already done" state if revisited. Safe to call
// more than once on the same day — it only advances the index the first
// time that day.
export function completeDailyMission(profileName) {
  const name = profileName || "Explorer";
  const all = loadDailyPath();
  const state = all[name] || defaultDailyPathState();
  const today = todayStr();
  if (state.lastCompletedDate !== today) {
    state.index = (state.index || 0) + 1;
    state.lastCompletedDate = today;
  }
  all[name] = state;
  saveDailyPath(all);
  return state;
}

export function getCompletedCircuits(profileName) {
  const all = loadCompletedCircuits();
  return all[profileName || "Explorer"] || [];
}

export function completeCircuit(profileName, challengeId) {
  const name = profileName || "Explorer";
  const all = loadCompletedCircuits();
  const done = new Set(all[name] || []);
  done.add(challengeId);
  all[name] = Array.from(done);
  saveCompletedCircuits(all);
  return all[name];
}
