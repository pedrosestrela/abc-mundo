// "Time to practice" daily reminder — local/foreground notifications only.
//
// RESEARCH NOTE (read before changing this file):
// Real cross-device Web Push that fires even with the browser/PWA fully
// closed needs (a) a backend push server holding VAPID keys and per-device
// subscriptions, and (b) on iOS Safari specifically, the PWA installed to
// the Home Screen (iOS 16.4+) before push even works at all — a plain
// browser tab on iOS cannot receive push. This app has no existing push
// infrastructure, is personal-use only, and its primary target device is
// an iPad/iPhone in Safari. Standing up a VAPID backend (key generation,
// a subscriptions table, a scheduler that wakes up at each parent's chosen
// local time and POSTs a push) is a lot of new server infrastructure to
// reliably reach exactly one household, AND it still silently fails unless
// that parent remembers to "Add to Home Screen" first — a real risk of
// building something that looks complete but quietly does nothing on the
// user's actual device.
//
// So instead this uses a simple, honest, cross-platform mechanism: while
// the app is open (foreground) or was recently open in a background tab,
// we check whether "now" has passed the parent's chosen reminder time and
// no reminder has fired yet today; if so, we show a notification. This is
// checked on load, whenever the tab becomes visible again, and every 60s
// while the tab stays alive. It reliably reaches the parent whenever they
// (or the child) open or return to the app around the chosen time, but it
// will NOT wake the device if the app/browser has been fully closed or the
// OS has suspended the tab — that limitation is stated plainly in the
// parent-facing UI copy (see modules.reminderLimitationNote in i18n)
// rather than being glossed over.
//
// periodicSync (a service-worker API that could in principle fire even
// with the tab closed) was deliberately NOT used: it has no support at all
// on iOS Safari — the primary device here — so building it would add real
// complexity for zero benefit on the device that matters, while risking
// parents believing it "just works" when it silently never fires.

import { getReminderSettings, setReminderSettings } from "./storage.js";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isPastReminderTime(timeStr) {
  const [h, m] = (timeStr || "17:00").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return now >= target;
}

async function fireNotification(title, body) {
  // Prefer showing via the active service worker registration when one is
  // available: it's the more broadly supported path (including installed
  // iOS Home Screen apps), and doesn't throw in contexts where the plain
  // `Notification` constructor is restricted.
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, { body, tag: "abcmundo-daily-reminder" });
        return true;
      }
    }
  } catch {
    // fall through to the plain constructor
  }

  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body, tag: "abcmundo-daily-reminder" });
    return true;
  } catch {
    return false;
  }
}

// Checks the parent's reminder setting against the current time and, if
// due, fires a notification and records today as already-shown so it only
// fires once per day. `t` is an i18next `t` function used to localize the
// notification text; safe to omit (falls back to a plain string).
export function checkAndFireReminder(t) {
  if (typeof Notification === "undefined") return;
  const settings = getReminderSettings();
  if (!settings.enabled) return;
  if (Notification.permission !== "granted") return;

  const today = todayStr();
  if (settings.lastShownDate === today) return;
  if (!isPastReminderTime(settings.time)) return;

  const title = t ? t("modules.reminderNotifTitle") : "ABC Mundo";
  const body = t ? t("modules.reminderNotifBody") : "";

  // Mark as shown first (best-effort UI, not a strict guarantee) so a slow
  // notification call can't cause a duplicate fire from the next tick.
  setReminderSettings({ lastShownDate: today });
  fireNotification(title, body);
}

let intervalId = null;
let listenerAttached = false;

// Starts the foreground reminder watcher: checks immediately, then every
// 60s while the tab/app stays alive, and again whenever the tab regains
// visibility (covers the common "left the app in another tab/backgrounded,
// comes back later" case). Safe to call more than once (e.g. on route
// changes) — it clears any previous interval first.
export function startReminderWatcher(t) {
  checkAndFireReminder(t);

  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => checkAndFireReminder(t), 60000);

  if (!listenerAttached && typeof document !== "undefined") {
    listenerAttached = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkAndFireReminder(t);
    });
  }
}
