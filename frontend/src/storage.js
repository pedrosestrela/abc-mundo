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
