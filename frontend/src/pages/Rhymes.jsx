import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRhymes } from "../content/index.js";
import { getLangPair, getProfile, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { playRealAudio } from "../audioPlayback.js";

// Real recorded-voice narration for rhymes (Piper TTS, generated offline
// and bundled as static files — see frontend/public/audio/rhymes/NOTICE.md).
// Only covers Portuguese so far; falls back to the regular SpeakButton
// (Web Speech) when no file exists for a given item+language.
const REAL_AUDIO = import.meta.glob("/public/audio/rhymes/*/*.mp3", { eager: true, query: "?url", import: "default" });
function realAudioUrl(itemId, langCode) {
  const key = `/public/audio/rhymes/${langCode}/${itemId}.mp3`;
  return REAL_AUDIO[key] || null;
}

// A SpeakButton look-alike that plays a real recorded audio file when one
// is available for this item+language, falling back to the plain
// SpeakButton (Web Speech synthesis) otherwise.
function RhymeSpeakButton({ item, langCode }) {
  const audioUrl = realAudioUrl(item.id, langCode);
  if (!audioUrl) return <SpeakButton text={item.text} langCode={langCode} />;
  return (
    <button type="button" className="speak-btn" onClick={() => playRealAudio(audioUrl)} aria-label="play">
      🔊🎙️
    </button>
  );
}

const TABS = [
  { key: "lengalengas", emoji: "🎈", label: "rhymesTabLengalengas" },
  { key: "travalinguas", emoji: "👅", label: "rhymesTabTravalinguas" },
  { key: "rimas", emoji: "📜", label: "rhymesTabRimas" },
];

export default function Rhymes() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherRhymes = getRhymes(pair.mother);
  const secondaryRhymes = getRhymes(pair.secondary);

  const [tab, setTab] = useState("lengalengas");

  const motherItems = motherRhymes[tab] || [];
  const secondaryItems = secondaryRhymes[tab] || [];
  const count = Math.min(motherItems.length, secondaryItems.length);

  useEffect(() => {
    const profile = getProfile();
    pingProgress({
      profileName: profile?.name,
      module: "rhymes",
      event: `tab_viewed:${tab}`,
    });
  }, [tab]);

  function handleOpen(id) {
    const profile = getProfile();
    pingProgress({
      profileName: profile?.name,
      module: "rhymes",
      event: `item_viewed:${tab}:${id}`,
    });
  }

  return (
    <div className="page">
      <h1>{t("modules.rhymesTitle")} 🎭</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.rhymesHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.rhymesIntro", "")}</p>
      <MascotBubble character="milo" mood="happy" langCode={pair.mother}>
        {t("modules.rhymesMascotIntro")}
      </MascotBubble>

      <div className="phonics-tabs">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            className={"phonics-tab" + (tab === tabDef.key ? " selected" : "")}
            onClick={() => setTab(tabDef.key)}
          >
            <span className="phonics-tab-inner">
              {tabDef.emoji} {t(`modules.${tabDef.label}`)}
            </span>
          </button>
        ))}
      </div>

      <div className="song-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherItems[i];
          const s = secondaryItems[i];
          return (
            <div
              className="song-card story-card rhyme-card"
              key={s.id}
              onClick={() => handleOpen(s.id)}
            >
              <div className="story-card-emoji">{s.emoji}</div>
              <h2>{s.title}</h2>
              <div className="story-page-row">
                <span className="story-page-text">{s.text}</span>
                <RhymeSpeakButton item={s} langCode={pair.secondary} />
              </div>
              <div className="story-page-row secondary">
                <span className="story-page-text">{m.text}</span>
                <RhymeSpeakButton item={m} langCode={pair.mother} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
