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
