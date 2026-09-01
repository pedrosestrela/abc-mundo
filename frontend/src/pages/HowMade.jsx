import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { getHowMade, getFoodOrigin } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { pickLine } from "../components/mascots/reactionLines.js";
import { getVascoLines } from "../content/vascoLines.js";
import TeachBackPrompt from "../components/TeachBackPrompt.jsx";
import RelatedLinks from "../components/RelatedLinks.jsx";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Simple picture+text multiple-choice mini-quiz shown after a chain card is
// opened, built entirely from data already present on the items (the item's
// own prompt is the clue, its name/icon the correct option, two sibling
// items' names the distractors) — no extra per-language content needed.
// Mirrors City.jsx's SystemQuiz.
function ChainQuiz({ item, items, pair, profile, t, skillId, eventPrefix }) {
  const [options] = useState(() => {
    const others = shuffle(items.filter((i) => i.id !== item.id)).slice(0, 2);
    return shuffle([item, ...others]);
  });
  const [wrongIds, setWrongIds] = useState([]);
  const [solved, setSolved] = useState(false);
  const [lastResult, setLastResult] = useState(null); // null | "correct" | "wrong"

  if (options.length < 3) return null;

  function pick(option) {
    if (solved) return;
    if (option.id === item.id) {
      setSolved(true);
      setLastResult("correct");
      recordSkillEvent(profile?.name, skillId, wrongIds.length === 0);
      pingProgress({ profileName: profile?.name, module: "how-made", event: `${eventPrefix}_quiz_solved:${item.id}` });
    } else {
      setWrongIds((prev) => (prev.includes(option.id) ? prev : [...prev, option.id]));
      setLastResult("wrong");
      pingProgress({ profileName: profile?.name, module: "how-made", event: `${eventPrefix}_quiz_attempt:${item.id}` });
    }
  }

  return (
    <div className="science-explanation">
      <p className="mission-badge computing-topic-badge">❓ {t("modules.howMadeQuizTitle")}</p>
      <p className="mission-text">
        {t("modules.howMadeQuizPrompt")}
        <SpeakButton text={t("modules.howMadeQuizPrompt")} langCode={pair.mother} />
      </p>
      <p className="page-intro">
        {item.prompt}
        <SpeakButton text={item.prompt} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.id}>
            <button
              type="button"
              disabled={solved || wrongIds.includes(opt.id)}
              className={
                "big-btn game-option" +
                (solved && opt.id === item.id ? " correct" : "") +
                (wrongIds.includes(opt.id) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.icon} {opt.name}
            </button>
            <SpeakButton text={opt.name} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {lastResult && !solved && (
        <MascotBubble character="vasco" reaction="encouraging" size={56}>
          {pickLine(getVascoLines("howMade", pair.mother).encouraging)}
        </MascotBubble>
      )}
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.howMadeQuizCorrect")}</p>
          <SpeakButton text={t("modules.howMadeQuizCorrect")} langCode={pair.mother} />
          <MascotBubble character="vasco" reaction="happy" langCode={pair.mother}>
            {`${pickLine(getVascoLines("howMade", pair.mother).correct)} ${pickLine(getVascoLines("howMade", pair.mother).closing)}`}
          </MascotBubble>
        </div>
      )}
    </div>
  );
}

export default function HowMade() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const howMade = getHowMade(pair.mother);
  const foodOrigin = getFoodOrigin(pair.mother);

  const [tab, setTab] = useState("howMade");
  const [openHowMadeId, setOpenHowMadeId] = useState(null);
  const [openFoodId, setOpenFoodId] = useState(null);
  // Picked once per page visit so the greeting doesn't reshuffle on every
  // unrelated re-render.
  const [openingLine] = useState(() => pickLine(getVascoLines("howMade", pair.mother).opening));

  function handleOpenHowMade(item) {
    const nowOpen = item.id !== openHowMadeId;
    setOpenHowMadeId(nowOpen ? item.id : null);
    if (nowOpen) {
      pingProgress({ profileName: profile?.name, module: "how-made", event: `how_made_explored:${item.id}` });
    }
  }

  function handleOpenFood(item) {
    const nowOpen = item.id !== openFoodId;
    setOpenFoodId(nowOpen ? item.id : null);
    if (nowOpen) {
      pingProgress({ profileName: profile?.name, module: "how-made", event: `food_origin_explored:${item.id}` });
    }
  }

  // Deep-link support for RelatedLinks: arriving via { state: { openId } }
  // (e.g. from Science/Whys) opens the matching "how made" chain card.
  const location = useLocation();
  useEffect(() => {
    const openId = location.state?.openId;
    if (openId && howMade.some((h) => h.id === openId)) {
      setTab("howMade");
      setOpenHowMadeId(openId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <div className="page">
      <h1>{t("modules.howMadeTitle")} 🏭</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.howMadeHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.howMadeIntro")}</p>
      <MascotBubble character="vasco" reaction="curious" langCode={pair.mother}>
        {openingLine}
      </MascotBubble>

      <div className="game-options city-tabs">
        <button
          type="button"
          className={"big-btn game-option" + (tab === "howMade" ? " done" : "")}
          onClick={() => setTab("howMade")}
        >
          🏭 {t("modules.howMadeTabMade")}
        </button>
        <button
          type="button"
          className={"big-btn game-option" + (tab === "food" ? " done" : "")}
          onClick={() => setTab("food")}
        >
          🌾 {t("modules.howMadeTabFood")}
        </button>
      </div>

      {tab === "howMade" && (
        <>
          <h2 className="songs-heading">🏭 {t("modules.howMadeMadeTitle")}</h2>
          <p className="page-intro">{t("modules.howMadeMadeIntro")}</p>

          <div className="computing-grid">
            {howMade.map((item) => {
              const isOpen = item.id === openHowMadeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={"computing-term-btn" + (isOpen ? " done" : "")}
                  onClick={() => handleOpenHowMade(item)}
                >
                  <span className="computing-term-emoji">{item.icon}</span>
                  {item.name}
                </button>
              );
            })}
          </div>

          {howMade
            .filter((item) => item.id === openHowMadeId)
            .map((item) => (
              <div key={item.id} className="game-card science-card done">
                <div className="game-emoji">{item.icon}</div>
                <p className="mission-text">
                  {item.prompt}
                  <SpeakButton text={item.prompt} langCode={pair.mother} />
                </p>
                <div className="science-explanation">
                  {item.steps.map((step, idx) => (
                    <p key={idx} className="game-result">
                      {step}
                    </p>
                  ))}
                  <SpeakButton text={item.steps.join(" ")} langCode={pair.mother} />
                </div>
                <ChainQuiz
                  key={item.id}
                  item={item}
                  items={howMade}
                  pair={pair}
                  profile={profile}
                  t={t}
                  skillId="how-made-quiz"
                  eventPrefix="how_made"
                />
                <RelatedLinks module="howMade" itemId={item.id} pair={pair} profile={profile} />
                <TeachBackPrompt
                  module="how-made"
                  itemId={item.id}
                  topicText={item.prompt}
                  profile={profile}
                  pair={pair}
                  character="tomas"
                />
                <div>
                  <button
                    type="button"
                    className="big-btn"
                    onClick={() => handleOpenHowMade(item)}
                    aria-label={t("modules.howMadeCloseCard")}
                  >
                    ✅
                  </button>
                </div>
              </div>
            ))}
        </>
      )}

      {tab === "food" && (
        <>
          <h2 className="songs-heading">🌾 {t("modules.howMadeFoodTitle")}</h2>
          <p className="page-intro">{t("modules.howMadeFoodIntro")}</p>

          <div className="computing-grid">
            {foodOrigin.map((item) => {
              const isOpen = item.id === openFoodId;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={"computing-term-btn" + (isOpen ? " done" : "")}
                  onClick={() => handleOpenFood(item)}
                >
                  <span className="computing-term-emoji">{item.icon}</span>
                  {item.name}
                </button>
              );
            })}
          </div>

          {foodOrigin
            .filter((item) => item.id === openFoodId)
            .map((item) => (
              <div key={item.id} className="game-card science-card done">
                <div className="game-emoji">{item.icon}</div>
                <p className="mission-text">
                  {item.prompt}
                  <SpeakButton text={item.prompt} langCode={pair.mother} />
                </p>
                <div className="science-explanation">
                  {item.steps.map((step, idx) => (
                    <p key={idx} className="game-result">
                      {step}
                    </p>
                  ))}
                  <SpeakButton text={item.steps.join(" ")} langCode={pair.mother} />
                </div>
                <ChainQuiz
                  key={item.id}
                  item={item}
                  items={foodOrigin}
                  pair={pair}
                  profile={profile}
                  t={t}
                  skillId="food-origin-quiz"
                  eventPrefix="food_origin"
                />
                <div>
                  <button
                    type="button"
                    className="big-btn"
                    onClick={() => handleOpenFood(item)}
                    aria-label={t("modules.howMadeCloseCard")}
                  >
                    ✅
                  </button>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
