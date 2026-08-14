import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getHowThingsWork } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getExploredThingParts,
  exploreThingPart,
  recordSkillEvent,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

export default function HowThingsWork() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const objects = getHowThingsWork(pair.mother);

  const [openId, setOpenId] = useState(null);
  const [partIndex, setPartIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [version, setVersion] = useState(0);

  const explored = useMemo(() => getExploredThingParts(profile?.name), [profile?.name, version]);

  function handleOpenObject(obj) {
    const nowOpen = obj.id !== openId;
    setOpenId(nowOpen ? obj.id : null);
    setPartIndex(0);
    setRevealed(false);
    if (nowOpen) {
      pingProgress({ profileName: profile?.name, module: "howThingsWork", event: `object_opened:${obj.id}` });
    }
  }

  function handleReveal(obj, part) {
    setRevealed(true);
    exploreThingPart(profile?.name, obj.id, part.id);
    recordSkillEvent(profile?.name, "how-things-work", true);
    pingProgress({ profileName: profile?.name, module: "howThingsWork", event: `part_explored:${obj.id}:${part.id}` });
    setVersion((v) => v + 1);
  }

  function handleNextPart(obj) {
    if (partIndex + 1 < obj.parts.length) {
      setPartIndex(partIndex + 1);
      setRevealed(false);
    } else {
      // Finished all parts - move to the summary view.
      setPartIndex(obj.parts.length);
    }
  }

  function objectExploredCount(obj) {
    return obj.parts.filter((p) => explored.includes(`${obj.id}:${p.id}`)).length;
  }

  const openObject = objects.find((o) => o.id === openId);
  const currentPart = openObject && partIndex < openObject.parts.length ? openObject.parts[partIndex] : null;
  const finishedAllParts = openObject && partIndex >= openObject.parts.length;

  return (
    <div className="page">
      <h1>{t("modules.howThingsWorkTitle")} 🔧</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.howThingsWorkHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.howThingsWorkIntro")}</p>

      {!openObject && (
        <div className="computing-grid">
          {objects.map((obj) => {
            const count = objectExploredCount(obj);
            const done = count === obj.parts.length;
            return (
              <button
                key={obj.id}
                type="button"
                className={"computing-term-btn" + (done ? " done" : "")}
                onClick={() => handleOpenObject(obj)}
              >
                <span className="computing-term-emoji">{obj.emoji}</span>
                {obj.title}
                <span className="mundos-tile-sub">
                  {count}/{obj.parts.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {openObject && !finishedAllParts && currentPart && (
        <div className="game-card">
          <div className="game-progress">
            {partIndex + 1} / {openObject.parts.length}
          </div>
          <div className="game-emoji">{openObject.emoji}</div>
          <p className="mission-text">{openObject.title}</p>

          <div className="mission-badge computing-topic-badge">
            {currentPart.emoji} {currentPart.label}
          </div>

          {!revealed ? (
            <>
              <p className="page-intro">
                {currentPart.predictionPrompt}
                <SpeakButton text={currentPart.predictionPrompt} langCode={pair.mother} />
              </p>
              <button type="button" className="big-btn" onClick={() => handleReveal(openObject, currentPart)}>
                🔎 {t("modules.howThingsWorkReveal")}
              </button>
            </>
          ) : (
            <>
              <p className="game-result">
                {currentPart.explanation}
                <SpeakButton text={currentPart.explanation} langCode={pair.mother} />
              </p>
              <button type="button" className="big-btn" onClick={() => handleNextPart(openObject)}>
                ➡️ {t("modules.howThingsWorkNext")}
              </button>
            </>
          )}

          <div>
            <button type="button" className="big-btn" onClick={() => handleOpenObject(openObject)}>
              ✅
            </button>
          </div>
        </div>
      )}

      {openObject && finishedAllParts && (
        <div className="game-card done">
          <div className="game-emoji">{openObject.emoji}</div>
          <p className="mission-text">🏆 {t("modules.howThingsWorkSummaryHeading")}</p>
          <p className="game-result">
            {openObject.summary}
            <SpeakButton text={openObject.summary} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={() => handleOpenObject(openObject)}>
            ✅ {t("modules.howThingsWorkBack")}
          </button>
        </div>
      )}
    </div>
  );
}
