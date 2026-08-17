import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getBedtimeMode, setBedtimeMode } from "../storage.js";

// Small sun/moon toggle for "Hora de Dormir" (Bedtime / Calm) mode: a
// parent-controlled, warm/dim/low-stimulation visual theme for evening use.
// Mirrors ZenToggle.jsx's shape (a tiny always-visible icon button with
// aria-pressed + title/aria-label), but this one is a global, persisted
// setting rather than a per-session audio toggle, so it applies the
// `data-theme="bedtime"` attribute to <html> directly on toggle/mount.
export default function BedtimeToggle() {
  const { t } = useTranslation();
  const [on, setOn] = useState(getBedtimeMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", on ? "bedtime" : "default");
  }, [on]);

  function toggle() {
    setOn((prev) => {
      const next = !prev;
      setBedtimeMode(next);
      return next;
    });
  }

  return (
    <button
      type="button"
      className={"bedtime-toggle-btn" + (on ? " bedtime-toggle-on" : "")}
      onClick={toggle}
      aria-pressed={on}
      aria-label={t(on ? "modules.bedtimeModeOff" : "modules.bedtimeModeOn")}
      title={t(on ? "modules.bedtimeModeOff" : "modules.bedtimeModeOn")}
    >
      {on ? "🌙" : "☀️"}
    </button>
  );
}
