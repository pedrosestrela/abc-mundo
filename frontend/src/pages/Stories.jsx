import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStories } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import { playDrumPad } from "../music.js";

// A small rotation of pleasant page backgrounds + a decorative "scene" emoji
// pair, cycled by page index so the book feels illustrated rather than a
// blank white block, without depending on any story-specific art.
const PAGE_SCENES = [
  { gradient: "linear-gradient(160deg, #fff6d6 0%, #ffe0ac 100%)", deco: "☀️" },
  { gradient: "linear-gradient(160deg, #d7f4ff 0%, #aee3ff 100%)", deco: "🌤️" },
  { gradient: "linear-gradient(160deg, #e3ffe0 0%, #bdf2c0 100%)", deco: "🌳" },
  { gradient: "linear-gradient(160deg, #ffe3f0 0%, #ffc2dd 100%)", deco: "🌸" },
  { gradient: "linear-gradient(160deg, #ece0ff 0%, #d4bdff 100%)", deco: "✨" },
  { gradient: "linear-gradient(160deg, #fff0e0 0%, #ffd3ad 100%)", deco: "🦋" },
];

// Splits a page's text into words while keeping track of each word's start
// character offset, so a `charIndex` reported by the Web Speech API's
// `onboundary` event can be matched back to a word to highlight.
function splitWords(text) {
  const words = [];
  const re = /\S+/g;
  let match;
  while ((match = re.exec(text))) {
    words.push({ word: match[0], start: match.index });
  }
  return words;
}

export default function Stories() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherStories = getStories(pair.mother);
  const secondaryStories = getStories(pair.secondary);
  const count = Math.min(motherStories.length, secondaryStories.length);

  const [openIndex, setOpenIndex] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeWord, setActiveWord] = useState(-1);
  const [poked, setPoked] = useState(false);

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

  // Reset per-page reading/interaction state whenever the page changes.
  useEffect(() => {
    setActiveWord(-1);
    setPoked(false);
  }, [openIndex, pageIndex]);

  function openStory(index) {
    setOpenIndex(index);
    setPageIndex(0);
  }

  function closeStory() {
    setOpenIndex(null);
    setPageIndex(0);
  }

  function goPrev() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  function goNext(totalPages) {
    setPageIndex((i) => Math.min(totalPages - 1, i + 1));
  }

  function pokeDeco() {
    setPoked(true);
    playDrumPad("hihat");
    setTimeout(() => setPoked(false), 700);
  }

  const words = useMemo(() => {
    if (!secondaryStory) return [];
    const sPage = secondaryStory.pages[pageIndex];
    return sPage ? splitWords(sPage.text) : [];
  }, [secondaryStory, pageIndex]);

  function handleWordBoundary(charIndex) {
    // Find the last word whose start offset is <= the reported charIndex.
    let idx = -1;
    for (let i = 0; i < words.length; i++) {
      if (words[i].start <= charIndex) idx = i;
      else break;
    }
    setActiveWord(idx);
  }

  if (openIndex !== null && motherStory && secondaryStory) {
    const totalPages = Math.min(motherStory.pages.length, secondaryStory.pages.length);
    const mPage = motherStory.pages[pageIndex];
    const sPage = secondaryStory.pages[pageIndex];
    const scene = PAGE_SCENES[pageIndex % PAGE_SCENES.length];

    return (
      <div className="page">
        <h1>
          {secondaryStory.emoji} {secondaryStory.title}
        </h1>
        <div className="help-btn-corner">
          <HelpButton text={t("modules.storiesHelpReader")} langCode={pair.mother} />
        </div>
        <div className="story-reader" style={{ background: scene.gradient }}>
          <div className="story-page-body">
            <div className="story-page-scene">
              <span
                className={`story-page-deco${poked ? " poked" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={t("modules.storiesTapHint")}
                onClick={pokeDeco}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pokeDeco()}
              >
                {scene.deco}
              </span>
              <div className="story-page-emoji">{sPage.emoji}</div>
            </div>

            <div className="story-page-row">
              <span className="story-page-text">
                {words.map((w, i) => (
                  <span key={i} className={i === activeWord ? "story-word active" : "story-word"}>
                    {w.word}{" "}
                  </span>
                ))}
              </span>
              <SpeakButton text={sPage.text} langCode={pair.secondary} onWordBoundary={handleWordBoundary} />
            </div>
            <div className="story-page-row secondary">
              <span className="story-page-text">{mPage.text}</span>
              <SpeakButton text={mPage.text} langCode={pair.mother} />
            </div>

            {/* Tap-left / tap-right page-turn zones, scoped to the illustrated
                text area only so nav/speak buttons below stay clickable. */}
            <div className="story-tap-zones" aria-hidden="true">
              <button type="button" className="story-tap-zone left" onClick={goPrev} disabled={pageIndex === 0} tabIndex={-1} />
              <button
                type="button"
                className="story-tap-zone right"
                onClick={() => goNext(totalPages)}
                disabled={pageIndex >= totalPages - 1}
                tabIndex={-1}
              />
            </div>
          </div>

          <div className="story-page-indicator">
            {t("modules.storiesPage")} {pageIndex + 1} {t("modules.storiesPageOf")} {totalPages}
          </div>
          <div className="story-nav">
            <button type="button" className="big-btn" onClick={goPrev} disabled={pageIndex === 0}>
              ◀ {t("modules.storiesPrev")}
            </button>
            <button
              type="button"
              className="big-btn"
              onClick={() => goNext(totalPages)}
              disabled={pageIndex >= totalPages - 1}
            >
              {t("modules.storiesNext")} ▶
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
      <div className="help-btn-corner">
        <HelpButton text={t("modules.storiesHelpMain")} langCode={pair.mother} />
      </div>
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
