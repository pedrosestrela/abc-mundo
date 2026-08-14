import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getArtPrompts } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getTriedArtPrompts,
  tryArtPrompt,
  pingProgress,
  saveArtPixelArt,
  getArtPixelArtSaves,
  saveArtCharacter,
  getArtCharacterSaves,
} from "../storage.js";
import DrawingCanvas from "../components/DrawingCanvas.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";

const PIXEL_GRID_SIZE = 8;
const PIXEL_PALETTE = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e67e22", "#1abc9c", "#2c3e50", "#ffffff"];
const EMPTY_CELL = "#ffffff";

const CHAR_HEADS = ["😀", "🧑", "👧", "🐻", "🐱", "🦊"];
const CHAR_EYES = ["👀", "😉", "✨", "😊"];
const CHAR_MOUTHS = ["😁", "😐", "😮", "😛"];
const CHAR_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6"];
const CHAR_ACCESSORIES = ["🎩", "👑", "🕶️", "🎀", "🚫"];

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
  const [mode, setMode] = useState("draw");

  const MODES = [
    { id: "draw", label: t("modules.artModeDraw"), emoji: "🖌️", help: t("modules.artHelpMain") },
    { id: "pixel", label: t("modules.artModePixel"), emoji: "🟪", help: t("modules.artPixelHelp") },
    { id: "character", label: t("modules.artModeCharacter"), emoji: "🧸", help: t("modules.artCharHelp") },
  ];
  const activeModeInfo = MODES.find((m) => m.id === mode) || MODES[0];

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
        <HelpButton text={activeModeInfo.help} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.artIntro")}</p>

      <div className="robots-controls">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={"big-btn game-option" + (mode === m.id ? " correct" : "")}
            onClick={() => setMode(m.id)}
          >
            {m.emoji} {m.label}
            <TabSpeakIcon text={m.label} langCode={pair.mother} />
          </button>
        ))}
      </div>

      {mode === "pixel" && <PixelArtMode t={t} pair={pair} profile={profile} />}
      {mode === "character" && <CharacterBuilderMode t={t} pair={pair} profile={profile} />}

      {mode === "draw" && (
        <>
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
        </>
      )}
    </div>
  );
}

function PixelArtMode({ t, pair, profile }) {
  const [color, setColor] = useState(PIXEL_PALETTE[0]);
  const [grid, setGrid] = useState(() => Array(PIXEL_GRID_SIZE * PIXEL_GRID_SIZE).fill(EMPTY_CELL));
  const [savedVersion, setSavedVersion] = useState(0);
  const [justSaved, setJustSaved] = useState(false);

  const saves = useMemo(() => getArtPixelArtSaves(profile?.name), [profile?.name, savedVersion]);

  function paintCell(i) {
    setJustSaved(false);
    setGrid((g) => {
      const next = [...g];
      next[i] = next[i] === color ? EMPTY_CELL : color;
      return next;
    });
  }

  function clearGrid() {
    setJustSaved(false);
    setGrid(Array(PIXEL_GRID_SIZE * PIXEL_GRID_SIZE).fill(EMPTY_CELL));
  }

  function handleSave() {
    saveArtPixelArt(profile?.name, { grid });
    pingProgress({ profileName: profile?.name, module: "art", event: "pixel_art_saved" });
    setSavedVersion((v) => v + 1);
    setJustSaved(true);
  }

  return (
    <div>
      <h2 className="songs-heading">{t("modules.artPixelTitle")}</h2>
      <div
        className="pixel-art-grid"
        style={{ gridTemplateColumns: `repeat(${PIXEL_GRID_SIZE}, 30px)` }}
      >
        {grid.map((cellColor, i) => (
          <button
            key={i}
            type="button"
            className="pixel-art-cell"
            style={{ background: cellColor }}
            onClick={() => paintCell(i)}
            aria-label={`pixel-${i}`}
          />
        ))}
      </div>

      <div className="pixel-art-palette">
        {PIXEL_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            className={"pixel-art-swatch" + (c === color ? " active" : "")}
            style={{ background: c, borderColor: c === color ? undefined : "#eee" }}
            onClick={() => setColor(c)}
            aria-label={c}
          />
        ))}
      </div>

      <div className="robots-controls">
        <button type="button" className="big-btn" onClick={handleSave}>
          💾 {t("modules.artPixelSave")}
        </button>
        <button type="button" className="big-btn" onClick={clearGrid}>
          🗑️ {t("modules.artPixelClear")}
        </button>
      </div>

      {justSaved && <div className="robots-feedback">{t("modules.artPixelSaved")}</div>}

      {saves.length > 0 && (
        <h2 className="songs-heading">
          {t("modules.artTried")} ({saves.length})
        </h2>
      )}
    </div>
  );
}

function CharacterBuilderMode({ t, pair, profile }) {
  const [headIdx, setHeadIdx] = useState(0);
  const [eyesIdx, setEyesIdx] = useState(0);
  const [mouthIdx, setMouthIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [accessoryIdx, setAccessoryIdx] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  const [justSaved, setJustSaved] = useState(false);

  const saves = useMemo(() => getArtCharacterSaves(profile?.name), [profile?.name, savedVersion]);

  function cycle(setIdx, length) {
    setJustSaved(false);
    setIdx((i) => (i + 1) % length);
  }

  function handleSave() {
    saveArtCharacter(profile?.name, {
      head: CHAR_HEADS[headIdx],
      eyes: CHAR_EYES[eyesIdx],
      mouth: CHAR_MOUTHS[mouthIdx],
      color: CHAR_COLORS[colorIdx],
      accessory: CHAR_ACCESSORIES[accessoryIdx],
    });
    pingProgress({ profileName: profile?.name, module: "art", event: "character_saved" });
    setSavedVersion((v) => v + 1);
    setJustSaved(true);
  }

  function handleNew() {
    setHeadIdx(0);
    setEyesIdx(0);
    setMouthIdx(0);
    setColorIdx(0);
    setAccessoryIdx(0);
    setJustSaved(false);
  }

  return (
    <div>
      <h2 className="songs-heading">{t("modules.artCharTitle")}</h2>

      <div className="char-builder-stage" style={{ background: CHAR_COLORS[colorIdx] + "22" }}>
        <span>{CHAR_HEADS[headIdx]}</span>
        {CHAR_ACCESSORIES[accessoryIdx] !== "🚫" && (
          <span style={{ position: "absolute", top: 6 }}>{CHAR_ACCESSORIES[accessoryIdx]}</span>
        )}
      </div>

      <div className="char-builder-row">
        <button type="button" className="char-builder-part-btn" onClick={() => cycle(setHeadIdx, CHAR_HEADS.length)}>
          <span>{CHAR_HEADS[headIdx]}</span>
          <span className="char-builder-part-label">{t("modules.artCharHead")}</span>
        </button>
        <button type="button" className="char-builder-part-btn" onClick={() => cycle(setEyesIdx, CHAR_EYES.length)}>
          <span>{CHAR_EYES[eyesIdx]}</span>
          <span className="char-builder-part-label">{t("modules.artCharEyes")}</span>
        </button>
        <button type="button" className="char-builder-part-btn" onClick={() => cycle(setMouthIdx, CHAR_MOUTHS.length)}>
          <span>{CHAR_MOUTHS[mouthIdx]}</span>
          <span className="char-builder-part-label">{t("modules.artCharMouth")}</span>
        </button>
        <button
          type="button"
          className="char-builder-part-btn"
          onClick={() => cycle(setColorIdx, CHAR_COLORS.length)}
        >
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: CHAR_COLORS[colorIdx], display: "inline-block" }} />
          <span className="char-builder-part-label">{t("modules.artCharColor")}</span>
        </button>
        <button
          type="button"
          className="char-builder-part-btn"
          onClick={() => cycle(setAccessoryIdx, CHAR_ACCESSORIES.length)}
        >
          <span>{CHAR_ACCESSORIES[accessoryIdx]}</span>
          <span className="char-builder-part-label">{t("modules.artCharAccessory")}</span>
        </button>
      </div>

      <div className="robots-controls">
        <button type="button" className="big-btn" onClick={handleSave}>
          💾 {t("modules.artCharSave")}
        </button>
        <button type="button" className="big-btn" onClick={handleNew}>
          🆕 {t("modules.artCharNew")}
        </button>
      </div>

      {justSaved && <div className="robots-feedback">{t("modules.artCharSaved")}</div>}

      {saves.length > 0 && (
        <div className="char-builder-saved-grid">
          {saves.map((s) => (
            <div key={s.id} className="char-builder-saved-item" style={{ background: s.color + "22", borderRadius: 14 }}>
              {s.head}
              {s.accessory !== "🚫" ? s.accessory : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
