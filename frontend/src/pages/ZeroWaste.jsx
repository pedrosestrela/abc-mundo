import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getZeroWaste } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getCompletedZeroWaste,
  completeZeroWasteScenario,
  pingProgress,
  recordSkillEvent,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";

// "Desafio Zero Desperdício": a fictional family's day, shown as a series of
// small waste-reduction decision points (food, packaging, water,
// electricity). Deliberately guilt-free: picking the non-best option never
// scores as "wrong" or shows a red/fail state — it just gently explains why
// the other choice helps a bit more, and lets the child try again. There is
// no running score and no way to "lose".
export default function ZeroWaste() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const scenarios = useMemo(() => getZeroWaste(pair.mother), [pair.mother]);

  const [index, setIndex] = useState(0);
  const [pickedId, setPickedId] = useState(null);
  const [version, setVersion] = useState(0);

  const completed = useMemo(
    () => getCompletedZeroWaste(profile?.name),
    [profile?.name, version]
  );

  const scenario = scenarios[index];
  const pickedOption = scenario?.options.find((o) => o.id === pickedId);
  const isBest = pickedOption?.best === true;

  function handlePick(option) {
    setPickedId(option.id);
    if (option.best) {
      completeZeroWasteScenario(profile?.name, scenario.id);
      recordSkillEvent(profile?.name, "zerowaste", true);
      pingProgress({ profileName: profile?.name, module: "zerowaste", event: `best_choice:${scenario.id}` });
      setVersion((v) => v + 1);
    } else {
      pingProgress({ profileName: profile?.name, module: "zerowaste", event: `gentle_choice:${scenario.id}` });
    }
  }

  function handleTryAgain() {
    setPickedId(null);
  }

  function handleNext() {
    setPickedId(null);
    setIndex((i) => (i + 1) % scenarios.length);
  }

  if (!scenario) return null;

  return (
    <div className="page">
      <h1>{t("modules.zeroWasteTitle")} ♻️</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.zeroWasteHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.zeroWasteIntro")}</p>
      <MascotBubble character="pipa" mood="happy" langCode={pair.mother}>
        {t("modules.zeroWasteMascotIntro")}
      </MascotBubble>

      <h2 className="songs-heading">
        {t("modules.zeroWasteProgress", { done: completed.length, total: scenarios.length })}
      </h2>

      <div className="game-card mission-card">
        <div className="mission-badge">
          {scenario.icon} {t("modules.zeroWasteSceneLabel", { current: index + 1, total: scenarios.length })}
        </div>
        <div className="mission-emoji">{scenario.icon}</div>
        <p className="mission-text">
          {scenario.scene}
          <SpeakButton text={scenario.scene} langCode={pair.mother} />
        </p>
        <p className="mission-text">
          {scenario.prompt}
          <SpeakButton text={scenario.prompt} langCode={pair.mother} />
        </p>

        {!pickedId && (
          <div className="game-options">
            {scenario.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="big-btn game-option"
                onClick={() => handlePick(option)}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>
        )}

        {pickedId && (
          <div className="science-explanation">
            {isBest ? (
              <p className="game-result">
                🌟 {scenario.feedbackBest}
                <SpeakButton text={scenario.feedbackBest} langCode={pair.mother} />
              </p>
            ) : (
              <p className="game-result">
                🙂 {scenario.feedbackGentle}
                <SpeakButton text={scenario.feedbackGentle} langCode={pair.mother} />
              </p>
            )}

            <div className="robots-controls">
              {!isBest && (
                <button type="button" className="big-btn" onClick={handleTryAgain}>
                  🔁 {t("modules.zeroWasteTryAgain")}
                </button>
              )}
              <button type="button" className="big-btn" onClick={handleNext}>
                ➡️ {t("modules.zeroWasteNext")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
