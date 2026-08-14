import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRhymes } from "../content/index.js";
import { getLangPair, getProfile, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

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
                <SpeakButton text={s.text} langCode={pair.secondary} />
              </div>
              <div className="story-page-row secondary">
                <span className="story-page-text">{m.text}</span>
                <SpeakButton text={m.text} langCode={pair.mother} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
