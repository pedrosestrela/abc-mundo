import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getLangPair,
  getProfile,
  getNatureDiary,
  addNatureDiaryEntry,
  getMoonDiary,
  addMoonDiaryEntry,
  pingProgress,
} from "../storage.js";
import DrawingCanvas from "../components/DrawingCanvas.jsx";
import HelpButton from "../components/HelpButton.jsx";

// "Diário da Natureza" + "Diário da Lua" — two time-based observation logs.
// Privacy-first by design: no camera, no geolocation. The child records
// what they saw either by drawing it (DrawingCanvas -> local data URL) or by
// picking a preset icon, then the entry (with today's date) is appended to
// a localStorage-backed log. `new Date()` is only ever called here, inside
// the browser component, at the moment the child taps "save" — never in any
// build/test script.

const NATURE_CATEGORIES = [
  { id: "plants", key: "natureDiaryCategory_plants", icons: ["🌸", "🌷", "🌳", "🌿", "🍄", "🌵"] },
  { id: "birds", key: "natureDiaryCategory_birds", icons: ["🐦", "🕊️", "🦉", "🦆", "🦜", "🐧"] },
  { id: "insects", key: "natureDiaryCategory_insects", icons: ["🐞", "🐝", "🦋", "🐜", "🦗", "🕷️"] },
  { id: "weather", key: "natureDiaryCategory_weather", icons: ["☀️", "🌧️", "⛅", "🌨️", "⛈️", "🌫️"] },
  { id: "seasons", key: "natureDiaryCategory_seasons", icons: ["🌸", "☀️", "🍂", "❄️"] },
];

const MOON_PHASES = [
  { id: "new", emoji: "🌑", key: "moonPhase_new" },
  { id: "waxingCrescent", emoji: "🌒", key: "moonPhase_waxingCrescent" },
  { id: "firstQuarter", emoji: "🌓", key: "moonPhase_firstQuarter" },
  { id: "waxingGibbous", emoji: "🌔", key: "moonPhase_waxingGibbous" },
  { id: "full", emoji: "🌕", key: "moonPhase_full" },
  { id: "waningGibbous", emoji: "🌖", key: "moonPhase_waningGibbous" },
  { id: "lastQuarter", emoji: "🌗", key: "moonPhase_lastQuarter" },
  { id: "waningCrescent", emoji: "🌘", key: "moonPhase_waningCrescent" },
];

function todayLabel() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function NatureDiaryTab({ profile, t }) {
  const [version, setVersion] = useState(0);
  const [category, setCategory] = useState(null);
  const [method, setMethod] = useState(null); // "draw" | "icon"
  const entries = useMemo(() => getNatureDiary(profile?.name), [profile?.name, version]);

  function saveEntry(payload) {
    addNatureDiaryEntry(profile?.name, {
      category: category.id,
      date: todayLabel(),
      ...payload,
    });
    pingProgress({ profileName: profile?.name, module: "natureDiary", event: `entry_added:${category.id}` });
    setCategory(null);
    setMethod(null);
    setVersion((v) => v + 1);
  }

  return (
    <>
      <p className="page-intro">{t("modules.natureDiaryIntro")}</p>

      {!category && (
        <>
          <h2 className="songs-heading">{t("modules.natureDiaryPickCategory")}</h2>
          <div className="game-options">
            {NATURE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="big-btn game-option"
                onClick={() => {
                  setCategory(c);
                  setMethod(null);
                }}
              >
                {t(`modules.${c.key}`)}
              </button>
            ))}
          </div>
        </>
      )}

      {category && !method && (
        <div className="game-card science-card">
          <div className="game-emoji">{t(`modules.${category.key}`).split(" ")[0]}</div>
          <h2 className="songs-heading">{t("modules.natureDiaryChooseMethod")}</h2>
          <div className="game-options">
            <button type="button" className="big-btn game-option" onClick={() => setMethod("draw")}>
              {t("modules.natureDiaryDrawIt")}
            </button>
            <button type="button" className="big-btn game-option" onClick={() => setMethod("icon")}>
              {t("modules.natureDiaryPickIcon")}
            </button>
          </div>
          <button type="button" className="big-btn" onClick={() => setCategory(null)}>
            ⬅️
          </button>
        </div>
      )}

      {category && method === "draw" && (
        <div className="game-card science-card">
          <DrawingCanvas onSave={(dataUrl) => saveEntry({ drawing: dataUrl })} saveLabel={t("modules.natureDiarySave")} />
        </div>
      )}

      {category && method === "icon" && (
        <div className="game-card science-card">
          <div className="game-options">
            {category.icons.map((icon) => (
              <button
                key={icon}
                type="button"
                className="big-btn game-option"
                onClick={() => saveEntry({ icon })}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      <h2 className="songs-heading">{t("modules.natureDiaryTimeline")}</h2>
      {entries.length === 0 && <p className="page-intro">{t("modules.natureDiaryEmpty")}</p>}
      <div className="game-options">
        {entries.map((e) => (
          <div key={e.id} className="mission-card">
            <div className="mission-emoji">
              {e.icon || (e.drawing ? <img src={e.drawing} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} /> : "🌿")}
            </div>
            <div className="mundos-tile-sub">{t(`modules.natureDiaryCategory_${e.category}`)}</div>
            <div className="mundos-tile-sub">{e.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function MoonDiaryTab({ profile, t }) {
  const [version, setVersion] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const entries = useMemo(() => getMoonDiary(profile?.name), [profile?.name, version]);

  function saveEntry(payload) {
    addMoonDiaryEntry(profile?.name, { date: todayLabel(), ...payload });
    pingProgress({ profileName: profile?.name, module: "moonDiary", event: "entry_added" });
    setDrawing(false);
    setVersion((v) => v + 1);
  }

  return (
    <>
      <p className="page-intro">{t("modules.moonDiaryIntro")}</p>
      <div className="game-card science-card">
        <div className="game-emoji">🌙</div>
        <p className="mission-text">{t("modules.moonDiaryPrompt")}</p>

        {!drawing && (
          <>
            <h2 className="songs-heading">{t("modules.moonDiaryPickPhase")}</h2>
            <div className="game-options">
              {MOON_PHASES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="big-btn game-option"
                  onClick={() => saveEntry({ phase: p.id })}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
            <button type="button" className="big-btn" onClick={() => setDrawing(true)}>
              {t("modules.moonDiaryDrawPhase")}
            </button>
          </>
        )}

        {drawing && (
          <DrawingCanvas onSave={(dataUrl) => saveEntry({ drawing: dataUrl })} saveLabel={t("modules.moonDiarySave")} />
        )}
      </div>

      {entries.length >= 4 && (
        <div className="game-card science-card">
          <h2 className="songs-heading">{t("modules.moonDiaryPatternQuestion")}</h2>
          <p className="mission-text">{t("modules.moonDiaryPatternAnswer")}</p>
          <div className="science-explanation">
            <p className="game-result">{t("modules.moonDiaryExplanationTitle")}</p>
            <p className="mission-text">{t("modules.moonDiaryExplanation")}</p>
          </div>
        </div>
      )}

      <h2 className="songs-heading">{t("modules.moonDiaryTimeline")}</h2>
      {entries.length === 0 && <p className="page-intro">{t("modules.moonDiaryEmpty")}</p>}
      <div className="game-options">
        {entries.map((e) => (
          <div key={e.id} className="mission-card">
            <div className="mission-emoji">
              {e.phase
                ? MOON_PHASES.find((p) => p.id === e.phase)?.emoji
                : e.drawing
                ? <img src={e.drawing} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />
                : "🌙"}
            </div>
            <div className="mundos-tile-sub">{e.date}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function NatureDiary() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const [tab, setTab] = useState("nature");

  return (
    <div className="page">
      <h1>{t("modules.natureDiaryTitle")} 📔</h1>
      <div className="help-btn-corner">
        <HelpButton
          text={tab === "nature" ? t("modules.natureDiaryHelpMain") : t("modules.moonDiaryHelpMain")}
          langCode={pair.mother}
        />
      </div>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "nature" ? " selected" : "")} onClick={() => setTab("nature")}>
          <span className="phonics-tab-inner">🌳 {t("modules.natureDiaryTabNature")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "moon" ? " selected" : "")} onClick={() => setTab("moon")}>
          <span className="phonics-tab-inner">🌙 {t("modules.natureDiaryTabMoon")}</span>
        </button>
      </div>

      {tab === "nature" && <NatureDiaryTab profile={profile} t={t} />}
      {tab === "moon" && <MoonDiaryTab profile={profile} t={t} />}
    </div>
  );
}
