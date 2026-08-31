import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isMusicAvailable, startZenAmbience, stopZenAmbience } from "../music.js";

// Small, clearly-visible toggle for the optional "zen" ambient background
// pad (see startZenAmbience/stopZenAmbience in music.js) used by quiet,
// contemplative games (chess, checkers, memory, maze, traffic-school
// driving). Defaults to OFF — the ambience only ever starts from this
// explicit tap, never automatically, same "audio only after a tap" rule as
// every other sound in the app. Always stops the loop on unmount (e.g. when
// the player leaves the game tab) so it never keeps playing in the
// background unattended.
export default function ZenToggle() {
  const { t } = useTranslation();
  const [on, setOn] = useState(false);

  useEffect(() => {
    return () => stopZenAmbience();
  }, []);

  if (!isMusicAvailable()) return null;

  function toggle() {
    setOn((prev) => {
      const next = !prev;
      if (next) startZenAmbience();
      else stopZenAmbience();
      return next;
    });
  }

  return (
    <button
      type="button"
      className={"zen-toggle-btn" + (on ? " zen-toggle-on" : "")}
      onClick={toggle}
      aria-pressed={on}
      aria-label={t(on ? "modules.zenMusicOff" : "modules.zenMusicOn")}
      title={t(on ? "modules.zenMusicOff" : "modules.zenMusicOn")}
    >
      {on ? "🎵" : "🔇"}
    </button>
  );
}
