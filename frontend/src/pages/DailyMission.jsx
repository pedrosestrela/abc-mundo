import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildDailyPath } from "../content/dailyPath.js";
import { getOffScreenMissions } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getDifficultyTier,
  getDailyMissionStatus,
  completeDailyMission,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

// Deterministic-per-day pick of one off-screen mission template, so the
// child sees the same one all day (not a new random one on every reload)
// but a different one tomorrow. No XP/streak/reward language here — Phase 1
// keeps this calm and effort-focused, per the product owner's brief.
function pickOffScreenTemplate(mother, dailyIndex) {
  const templates = getOffScreenMissions(mother);
  if (templates.length === 0) return null;
  return templates[dailyIndex % templates.length];
}

function fillTemplate(template, letter, number) {
  return template.replace(/\{letter\}/g, letter).replace(/\{number\}/g, String(number));
}

export default function DailyMission() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);

  const { doneToday, index } = getDailyMissionStatus(profile?.name);

  const bundle = useMemo(
    () => buildDailyPath({ mother: pair.mother, dailyIndex: index, tier }),
    [pair.mother, index, tier]
  );

  const offScreen = useMemo(
    () => pickOffScreenTemplate(pair.mother, index),
    [pair.mother, index]
  );

  const mainLetter = bundle.letters[0];
  const offScreenText = offScreen && mainLetter
    ? fillTemplate(offScreen.template, mainLetter.upper, bundle.number)
    : null;

  function handleComplete() {
    completeDailyMission(profile?.name);
    pingProgress({ profileName: profile?.name, module: "daily-mission", event: "completed" });
    navigate("/");
  }

  if (doneToday) {
    return (
      <div className="page">
        <h1>{t("dailyMission.title")} 🌟</h1>
        <div className="game-card">
          <p className="page-intro">{t("dailyMission.alreadyDone")}</p>
          <button type="button" className="big-btn" onClick={() => navigate("/mundos")}>
            🗺️ {t("dailyMission.goToWorlds")}
          </button>
        </div>
      </div>
    );
  }

  if (!mainLetter) {
    return (
      <div className="page">
        <h1>{t("dailyMission.title")} 🌟</h1>
        <p className="page-intro">{t("dailyMission.allDone")}</p>
        <button type="button" className="big-btn" onClick={() => navigate("/mundos")}>
          🗺️ {t("dailyMission.goToWorlds")}
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{t("dailyMission.title")} 🌟</h1>
      <p className="page-intro">{t("dailyMission.intro")}</p>
      <div className="help-btn-corner">
        <HelpButton text={t("dailyMission.help")} langCode={pair.mother} />
      </div>

      <div className="reading-list">
        {bundle.letters.map((letter, i) => (
          <div className="letter-card" key={letter.upper}>
            <div className="reading-emoji">{letter.emoji}</div>
            <span style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
              {letter.upper}{letter.lower}
            </span>
            <span>{letter.exampleWord}</span>
            <SpeakButton text={letter.exampleWord} langCode={pair.mother} />
          </div>
        ))}

        {bundle.syllables.map((syl, i) => (
          <div className="reading-card" key={`syl-${i}`}>
            <div className="reading-emoji">{syl.emoji || "🧩"}</div>
            <div className="reading-words">
              <span className="syllable-badge">{syl.syllable}</span>
              {syl.exampleWord && <span className="reading-word">{syl.exampleWord}</span>}
              <SpeakButton text={syl.syllable} langCode={pair.mother} />
            </div>
          </div>
        ))}

        {bundle.word && (
          <div className="reading-card">
            <div className="reading-emoji">{bundle.word.emoji}</div>
            <div className="reading-words">
              <span className="reading-word">{bundle.word.word}</span>
              <SpeakButton text={bundle.word.word} langCode={pair.mother} />
            </div>
          </div>
        )}

        <div className="reading-card">
          <div className="reading-emoji">🔢</div>
          <div className="reading-words">
            <span style={{ fontSize: "2rem", fontWeight: "bold" }}>{bundle.number}</span>
            <SpeakButton text={String(bundle.number)} langCode={pair.mother} />
          </div>
        </div>
      </div>

      {offScreenText && (
        <div className="game-card">
          <p className="mission-badge science-topic-badge">
            🌟 {t("dailyMission.offScreenTitle")}
          </p>
          <p className="page-intro">
            {offScreenText}
            <SpeakButton text={offScreenText} langCode={pair.mother} />
          </p>
        </div>
      )}

      <div className="reading-list" style={{ marginTop: "1rem" }}>
        <button type="button" className="nav-link" onClick={() => navigate("/alphabet")}>
          🔤 {t("dailyMission.goToAlphabet")}
        </button>
        <button type="button" className="nav-link" onClick={() => navigate("/syllables")}>
          🧩 {t("dailyMission.goToSyllables")}
        </button>
        <button type="button" className="nav-link" onClick={() => navigate("/reading")}>
          📖 {t("dailyMission.goToReading")}
        </button>
        <button type="button" className="nav-link" onClick={() => navigate("/math")}>
          🔢 {t("dailyMission.goToMath")}
        </button>
      </div>

      <button type="button" className="big-btn" onClick={handleComplete}>
        ✅ {t("dailyMission.complete")}
      </button>
    </div>
  );
}
