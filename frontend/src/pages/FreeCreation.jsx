import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getLangPair, getProfile, getFreeStories, saveFreeStory, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";

// "Criador Livre": a curated hub linking out to the free-creation tools that
// already exist in the app (drawing, music composing) plus one small,
// genuinely new tool — a free-writing story starter — since nothing else in
// the app offers open-ended "invent your own story" writing (Writing.jsx is
// letter/number tracing, Stories.jsx and completeTales are pre-written
// stories to read). Deliberately has NO scoring, NO correct answer, and NO
// ranking anywhere on this page or in the story tool below.
const PROMPT_COUNT = 8;

function pickRandomIndex(max) {
  return Math.floor(Math.random() * max);
}

function StoryStarterTool({ t, pair, profile }) {
  const [promptIndex, setPromptIndex] = useState(() => pickRandomIndex(PROMPT_COUNT));
  const [text, setText] = useState("");
  const [savedVersion, setSavedVersion] = useState(0);
  const [justSaved, setJustSaved] = useState(false);

  const prompt = t(`modules.freeCreationPrompt${promptIndex}`);
  const saved = useMemo(() => getFreeStories(profile?.name), [profile?.name, savedVersion]);

  function newPrompt() {
    setPromptIndex((i) => {
      let next = pickRandomIndex(PROMPT_COUNT);
      if (PROMPT_COUNT > 1) {
        while (next === i) next = pickRandomIndex(PROMPT_COUNT);
      }
      return next;
    });
    setText("");
    setJustSaved(false);
  }

  function handleSave() {
    if (!text.trim()) return;
    saveFreeStory(profile?.name, { promptId: `p${promptIndex}`, text: text.trim() });
    pingProgress({ profileName: profile?.name, module: "freecreation", event: "story_saved" });
    setSavedVersion((v) => v + 1);
    setJustSaved(true);
  }

  return (
    <div className="game-card">
      <p className="mission-badge science-topic-badge">✍️ {t("modules.freeCreationStoryTitle")}</p>
      <p className="mission-text">
        {prompt}
        <SpeakButton text={prompt} langCode={pair.mother} />
      </p>
      <textarea
        className="writing-story-textarea"
        style={{ width: "100%", minHeight: "120px", padding: "0.6rem", borderRadius: "12px", fontSize: "1rem" }}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setJustSaved(false);
        }}
        placeholder={t("modules.freeCreationStoryPlaceholder")}
      />
      <div className="robots-controls">
        <button type="button" className="big-btn" onClick={handleSave} disabled={!text.trim()}>
          💾 {t("modules.freeCreationStorySave")}
        </button>
        <button type="button" className="big-btn" onClick={newPrompt}>
          🎲 {t("modules.freeCreationStoryNewPrompt")}
        </button>
      </div>
      {justSaved && <div className="robots-feedback">{t("modules.freeCreationStorySaved")}</div>}
      {saved.length > 0 && (
        <h2 className="songs-heading">
          {t("modules.freeCreationStorySavedCount", { count: saved.length })}
        </h2>
      )}
    </div>
  );
}

export default function FreeCreation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();

  const LINKS = [
    { to: "/art", emoji: "🖌️", label: t("modules.freeCreationLinkDraw"), sub: t("modules.freeCreationLinkDrawSub") },
    { to: "/music", emoji: "🎶", label: t("modules.freeCreationLinkMusic"), sub: t("modules.freeCreationLinkMusicSub") },
  ];

  return (
    <div className="page">
      <h1>{t("modules.freeCreationTitle")} 🎨✨</h1>
      <p className="page-intro">{t("modules.freeCreationIntro")}</p>
      <MascotBubble character="milo" mood="happy" langCode={pair.mother}>
        {t("modules.freeCreationMascotIntro")}
      </MascotBubble>

      <div className="mundos-tile-grid">
        {LINKS.map((link) => (
          <button
            key={link.to}
            type="button"
            className="mission-card mundos-tile"
            onClick={() => navigate(link.to)}
          >
            <div className="mission-emoji">{link.emoji}</div>
            <div className="mission-text">{link.label}</div>
            <div className="mundos-tile-sub">{link.sub}</div>
          </button>
        ))}
      </div>

      <StoryStarterTool t={t} pair={pair} profile={profile} />
    </div>
  );
}
