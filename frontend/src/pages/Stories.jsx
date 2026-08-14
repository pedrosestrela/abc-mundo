import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStories } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

export default function Stories() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherStories = getStories(pair.mother);
  const secondaryStories = getStories(pair.secondary);
  const count = Math.min(motherStories.length, secondaryStories.length);

  const [openIndex, setOpenIndex] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);

  const motherStory = openIndex !== null ? motherStories[openIndex] : null;
  const secondaryStory = openIndex !== null ? secondaryStories[openIndex] : null;

  useEffect(() => {
    if (openIndex === null || !secondaryStory) return;
    const profile = getProfile();
    pingProgress({
      profileName: profile?.name,
      module: "stories",
      event: `page_viewed:${secondaryStory.id}:${pageIndex}`,
    });
    recordSkillEvent(profile?.name, "story-page-viewed", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, pageIndex]);

  function openStory(index) {
    setOpenIndex(index);
    setPageIndex(0);
  }

  function closeStory() {
    setOpenIndex(null);
    setPageIndex(0);
  }

  if (openIndex !== null && motherStory && secondaryStory) {
    const totalPages = Math.min(motherStory.pages.length, secondaryStory.pages.length);
    const mPage = motherStory.pages[pageIndex];
    const sPage = secondaryStory.pages[pageIndex];

    return (
      <div className="page">
        <h1>
          {secondaryStory.emoji} {secondaryStory.title}
        </h1>
        <div className="story-reader">
          <div className="story-page-emoji">{sPage.emoji}</div>
          <div className="story-page-row">
            <span className="story-page-text">{sPage.text}</span>
            <SpeakButton text={sPage.text} langCode={pair.secondary} />
          </div>
          <div className="story-page-row secondary">
            <span className="story-page-text">{mPage.text}</span>
            <SpeakButton text={mPage.text} langCode={pair.mother} />
          </div>
          <div className="story-page-indicator">
            {t("modules.storiesPage")} {pageIndex + 1} / {totalPages}
          </div>
          <div className="story-nav">
            <button
              type="button"
              className="big-btn"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={pageIndex === 0}
            >
              ⬅️ {t("modules.storiesPrev")}
            </button>
            <button
              type="button"
              className="big-btn"
              onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
              disabled={pageIndex >= totalPages - 1}
            >
              {t("modules.storiesNext")} ➡️
            </button>
          </div>
          <button type="button" className="big-btn story-close" onClick={closeStory}>
            {t("modules.storiesTitle")} 📚
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{t("modules.storiesTitle")} 📚</h1>
      <div className="song-list">
        {Array.from({ length: count }).map((_, i) => {
          const s = secondaryStories[i];
          return (
            <div className="song-card story-card" key={s.id} onClick={() => openStory(i)}>
              <div className="story-card-emoji">{s.emoji}</div>
              <h2>{s.title}</h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}
