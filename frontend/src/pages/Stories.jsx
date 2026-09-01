import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getStories, getCompleteTales } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import { playDrumPad } from "../music.js";
import { speakSequence } from "../speech.js";
import { playRealAudio, segmentIndexForProgress } from "../audioPlayback.js";

// Real recorded-voice narration for stories (Piper TTS, generated offline
// and bundled as static files — see frontend/public/audio/stories/NOTICE.md).
// Only covers Portuguese so far, so lookups fall back to speechSynthesis
// (read page-by-page via speakSequence) when no file exists.
const REAL_AUDIO = import.meta.glob("/public/audio/stories/*/*.mp3", { eager: true, query: "?url", import: "default" });
function realAudioUrl(storyId, langCode) {
  const key = `/public/audio/stories/${langCode}/${storyId}.mp3`;
  return REAL_AUDIO[key] || null;
}

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

// Resolves a bilingual EN/PT title suffix for a story, on top of whichever
// title is already shown from the child's chosen mother/secondary language
// pair. Only adds whichever of PT/EN isn't already visible from that pair,
// so e.g. a pt/en pair never shows the same title twice.
function resolveBilingualTitle(storyId, motherCode, secondaryCode, ptList, enList) {
  const extras = [];
  if (motherCode !== "pt" && secondaryCode !== "pt") {
    const pt = ptList.find((s) => s.id === storyId);
    if (pt) extras.push(pt.title);
  }
  if (motherCode !== "en" && secondaryCode !== "en") {
    const en = enList.find((s) => s.id === storyId);
    if (en) extras.push(en.title);
  }
  return extras.length ? extras.join(" / ") : "";
}

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
  const [tab, setTab] = useState("short");

  // Short stories are the largest per-language dataset and are lazy-loaded
  // (see content/index.js getStories), so they're fetched asynchronously.
  const [motherShort, setMotherShort] = useState([]);
  const [secondaryShort, setSecondaryShort] = useState([]);
  const [shortLoading, setShortLoading] = useState(true);

  // Complete tales are a much smaller dataset and load synchronously.
  const motherComplete = getCompleteTales(pair.mother);
  const secondaryComplete = getCompleteTales(pair.secondary);

  const motherStories = tab === "complete" ? motherComplete : motherShort;
  const secondaryStories = tab === "complete" ? secondaryComplete : secondaryShort;
  const loading = tab === "short" && shortLoading;
  const count = Math.min(motherStories.length, secondaryStories.length);

  // Bilingual EN/PT titles: fetched purely to read `.title` by id, regardless
  // of the child's chosen language pair (see resolveBilingualTitle above).
  const ptCompleteAll = getCompleteTales("pt");
  const enCompleteAll = getCompleteTales("en");
  const [ptShortAll, setPtShortAll] = useState([]);
  const [enShortAll, setEnShortAll] = useState([]);
  const ptTitleList = tab === "complete" ? ptCompleteAll : ptShortAll;
  const enTitleList = tab === "complete" ? enCompleteAll : enShortAll;

  const [openIndex, setOpenIndex] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeWord, setActiveWord] = useState(-1);
  const [poked, setPoked] = useState(false);
  const [readingWhole, setReadingWhole] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setShortLoading(true);
    Promise.all([getStories(pair.mother), getStories(pair.secondary)]).then(
      ([mother, secondary]) => {
        if (cancelled) return;
        setMotherShort(mother);
        setSecondaryShort(secondary);
        setShortLoading(false);
        setOpenIndex(null);
        setPageIndex(0);
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.mother, pair.secondary]);

  // Fetch PT + EN short-story titles (cached lazy-loaded chunks, so this is
  // cheap) purely to build bilingual titles regardless of the chosen pair.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getStories("pt"), getStories("en")]).then(([pt, en]) => {
      if (cancelled) return;
      setPtShortAll(pt);
      setEnShortAll(en);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Briefly toggles a "turning" class on the page whenever it changes, to
  // drive a book-like page-flip CSS animation (see .story-page-body.turning
  // in styles.css). Skips the very first render of an opened story so the
  // book doesn't "flip" when it first opens.
  const [turning, setTurning] = useState(false);
  const isFirstPageRender = React.useRef(true);
  useEffect(() => {
    if (isFirstPageRender.current) {
      isFirstPageRender.current = false;
      return;
    }
    setTurning(true);
    const timer = setTimeout(() => setTurning(false), 380);
    return () => clearTimeout(timer);
  }, [pageIndex]);
  useEffect(() => {
    isFirstPageRender.current = true;
  }, [openIndex]);

  function switchTab(next) {
    setTab(next);
    setOpenIndex(null);
    setPageIndex(0);
  }

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

  // Reads the whole open story front-to-back, turning pages as it goes.
  // Prefers a real recorded-voice audio file (one per story+language) when
  // available, syncing page turns to elapsed playback time; falls back to
  // speaking each page's text in sequence via Web Speech otherwise.
  async function playWholeStory(story, langCode, pages) {
    if (readingWhole) return;
    setReadingWhole(true);
    const audioUrl = realAudioUrl(story.id, langCode);
    const texts = pages.map((p) => p.text);
    if (audioUrl) {
      await playRealAudio(audioUrl, {
        onProgress: (frac) => setPageIndex(segmentIndexForProgress(texts, frac)),
      });
    } else {
      await speakSequence(texts, langCode, {
        onLineStart: (idx) => setPageIndex(idx),
      });
    }
    setReadingWhole(false);
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

  if (loading) {
    return (
      <div className="page">
        <h1>{t("modules.storiesTitle")} 📚</h1>
        <p>...</p>
      </div>
    );
  }

  if (openIndex !== null && motherStory && secondaryStory) {
    const totalPages = Math.min(motherStory.pages.length, secondaryStory.pages.length);
    const mPage = motherStory.pages[pageIndex];
    const sPage = secondaryStory.pages[pageIndex];
    const scene = PAGE_SCENES[pageIndex % PAGE_SCENES.length];
    const bilingualTitle = resolveBilingualTitle(secondaryStory.id, pair.mother, pair.secondary, ptTitleList, enTitleList);

    return (
      <div className="page">
        <h1>
          {secondaryStory.emoji} {secondaryStory.title}
          {bilingualTitle ? <span className="story-title-bilingual"> ({bilingualTitle})</span> : null}
        </h1>
        <div className="help-btn-corner">
          <HelpButton text={t("modules.storiesHelpReader")} langCode={pair.mother} />
        </div>
        <div className="story-reader" style={{ background: scene.gradient }}>
          <div className={`story-page-body${turning ? " turning" : ""}`}>
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
            <button
              type="button"
              className="big-btn"
              onClick={() => playWholeStory(secondaryStory, pair.secondary, secondaryStory.pages)}
              disabled={readingWhole}
            >
              ▶️ {t("modules.play")}
              {realAudioUrl(secondaryStory.id, pair.secondary) ? " 🎙️" : ""}
            </button>
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
      <MascotBubble character="pipa" mood="happy" langCode={pair.mother}>
        {t("modules.storiesMascotIntro")}
      </MascotBubble>
      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "short" ? " selected" : "")} onClick={() => switchTab("short")}>
          <span className="phonics-tab-inner">📖 {t("modules.storiesTabShort")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "complete" ? " selected" : "")} onClick={() => switchTab("complete")}>
          <span className="phonics-tab-inner">📜 {t("modules.storiesTabComplete")}</span>
        </button>
      </div>
      <div className="song-list">
        {Array.from({ length: count }).map((_, i) => {
          const s = secondaryStories[i];
          const bilingualTitle = resolveBilingualTitle(s.id, pair.mother, pair.secondary, ptTitleList, enTitleList);
          return (
            <div
              className="song-card story-card"
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => openStory(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openStory(i);
                }
              }}
            >
              <div className="story-card-emoji">{s.emoji}</div>
              <h2>
                {s.title}
                {bilingualTitle ? <span className="story-title-bilingual"> ({bilingualTitle})</span> : null}
              </h2>
            </div>
          );
        })}
      </div>
    </div>
  );
}
