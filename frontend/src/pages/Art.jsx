import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getArtPrompts } from "../content/index.js";
import { getLangPair, getProfile, getTriedArtPrompts, tryArtPrompt, pingProgress } from "../storage.js";
import DrawingCanvas from "../components/DrawingCanvas.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

// Picks a deterministic "prompt of the day" so it doesn't change every
// re-render, but still rotates day to day without needing a backend.
// Mirrors the same hashing approach used by Missions.jsx.
function pickDailyIndex(length, dateSeed) {
  if (length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < dateSeed.length; i++) {
    hash = (hash * 31 + dateSeed.charCodeAt(i)) % 100000;
  }
  return hash % length;
}

export default function Art() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const prompts = getArtPrompts(pair.mother);
  const [triedVersion, setTriedVersion] = useState(0);

  const todaySeed = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  const dailyIndex = useMemo(() => pickDailyIndex(prompts.length, todaySeed), [prompts.length, todaySeed]);
  const dailyPrompt = prompts[dailyIndex];

  const [activePrompt, setActivePrompt] = useState(null);

  const tried = useMemo(() => getTriedArtPrompts(profile?.name), [profile?.name, triedVersion]);

  function handleSelectPrompt(prompt) {
    setActivePrompt(prompt);
    tryArtPrompt(profile?.name, prompt.id);
    pingProgress({ profileName: profile?.name, module: "art", event: `prompt_tried:${prompt.id}` });
    setTriedVersion((v) => v + 1);
  }

  if (!dailyPrompt) return null;

  const shown = activePrompt || dailyPrompt;

  return (
    <div className="page">
      <h1>{t("modules.artTitle")} 🎨</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.artHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.artIntro")}</p>

      <div className="mission-card mission-card-today art-active-card">
        <div className="mission-badge">
          {activePrompt ? t("modules.artPromptOfDay") : t("modules.artPromptOfDay")}
        </div>
        <div className="mission-emoji">{shown.emoji}</div>
        <p className="mission-text">
          {shown.prompt}
          <SpeakButton text={shown.prompt} langCode={pair.mother} />
        </p>
        {!tried.includes(shown.id) && (
          <button type="button" className="big-btn" onClick={() => handleSelectPrompt(shown)}>
            🎨 {t("modules.artTried")}
          </button>
        )}
      </div>

      <DrawingCanvas />

      <h2 className="songs-heading">
        {t("modules.artTried")} ({tried.length}/{prompts.length})
      </h2>
      <div className="mission-grid">
        {prompts.map((p) => {
          const done = tried.includes(p.id);
          const active = shown.id === p.id;
          return (
            <div
              key={p.id}
              className={"mission-tile" + (done ? " done" : "") + (active ? " active" : "")}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectPrompt(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleSelectPrompt(p);
              }}
            >
              <div className="mission-tile-emoji">{p.emoji}</div>
              {done && <div className="mission-tile-check">✅</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
