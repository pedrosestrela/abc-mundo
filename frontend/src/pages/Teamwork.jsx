import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTeamwork } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getCompletedTeamwork,
  completeTeamworkScenario,
  pingProgress,
  recordSkillEvent,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";

// "Trabalho em Equipa": no online multiplayer here — instead, the child
// assigns one of four fictional characters (each with one clear strength) to
// a task, learning to match strengths to what a task actually needs. Picking
// the wrong character never shows a shaming "fail" state; it just explains
// why the character it was looking for fits better and lets the child pick
// again, same guilt-free feedback pattern as ZeroWaste.jsx.
export default function Teamwork() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const data = useMemo(() => getTeamwork(pair.mother), [pair.mother]);
  const characters = data.characters || [];
  const scenarios = data.scenarios || [];

  const [index, setIndex] = useState(0);
  const [pickedId, setPickedId] = useState(null);
  const [version, setVersion] = useState(0);

  const completed = useMemo(
    () => getCompletedTeamwork(profile?.name),
    [profile?.name, version]
  );

  const scenario = scenarios[index];
  const isCorrect = pickedId === scenario?.correct;
  const correctCharacter = characters.find((c) => c.id === scenario?.correct);

  function handlePick(character) {
    setPickedId(character.id);
    if (character.id === scenario.correct) {
      completeTeamworkScenario(profile?.name, scenario.id);
      recordSkillEvent(profile?.name, "teamwork", true);
      pingProgress({ profileName: profile?.name, module: "teamwork", event: `match_correct:${scenario.id}` });
      setVersion((v) => v + 1);
    } else {
      pingProgress({ profileName: profile?.name, module: "teamwork", event: `match_try:${scenario.id}` });
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
      <h1>{t("modules.teamworkTitle")} 🤝</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.teamworkHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.teamworkIntro")}</p>
      <MascotBubble character="lumi" mood="happy" langCode={pair.mother}>
        {t("modules.teamworkMascotIntro")}
      </MascotBubble>

      <h2 className="songs-heading">
        {t("modules.teamworkProgress", { done: completed.length, total: scenarios.length })}
      </h2>

      <div className="mundos-tile-grid" style={{ marginBottom: "1rem" }}>
        {characters.map((c) => (
          <div key={c.id} className="mission-card mundos-tile" style={{ cursor: "default" }}>
            <div className="mission-emoji">{c.icon}</div>
            <div className="mission-text">{c.name}</div>
            <div className="mundos-tile-sub">{c.trait}</div>
          </div>
        ))}
      </div>

      <div className="game-card mission-card">
        <div className="mission-badge">
          {scenario.icon} {t("modules.teamworkSceneLabel", { current: index + 1, total: scenarios.length })}
        </div>
        <div className="mission-emoji">{scenario.icon}</div>
        <p className="mission-text">
          {scenario.task}
          <SpeakButton text={scenario.task} langCode={pair.mother} />
        </p>
        <p className="page-intro">{t("modules.teamworkWhoQuestion")}</p>

        {!pickedId && (
          <div className="game-options">
            {characters.map((c) => (
              <button
                key={c.id}
                type="button"
                className="big-btn game-option"
                onClick={() => handlePick(c)}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        )}

        {pickedId && (
          <div className="science-explanation">
            {isCorrect ? (
              <p className="game-result">
                🌟 {scenario.explanation}
                <SpeakButton text={scenario.explanation} langCode={pair.mother} />
              </p>
            ) : (
              <p className="game-result">
                🙂 {t("modules.teamworkGentleFeedback", { name: correctCharacter?.name })}
                <SpeakButton
                  text={t("modules.teamworkGentleFeedback", { name: correctCharacter?.name }) + " " + scenario.explanation}
                  langCode={pair.mother}
                />
                {" "}
                {scenario.explanation}
              </p>
            )}

            <div className="robots-controls">
              {!isCorrect && (
                <button type="button" className="big-btn" onClick={handleTryAgain}>
                  🔁 {t("modules.teamworkTryAgain")}
                </button>
              )}
              <button type="button" className="big-btn" onClick={handleNext}>
                ➡️ {t("modules.teamworkNext")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
