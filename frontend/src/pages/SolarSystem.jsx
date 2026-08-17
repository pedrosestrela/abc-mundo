import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSolarSystem } from "../content/index.js";
import { getLangPair, getProfile, getVisitedSolarSystemStages, visitSolarSystemStage, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import {
  IllustrationSun,
  IllustrationMercury,
  IllustrationVenus,
  IllustrationEarth,
  IllustrationMars,
  IllustrationJupiter,
  IllustrationSaturn,
  IllustrationUranus,
  IllustrationNeptune,
  IllustrationDwarfPlanets,
  IllustrationAsteroids,
} from "../components/illustrations/solarSystem.jsx";

// Picks which of the solar-system illustrations matches a given card id.
function bodyIllustration(bodyId) {
  switch (bodyId) {
    case "sun":
      return IllustrationSun;
    case "mercury":
      return IllustrationMercury;
    case "venus":
      return IllustrationVenus;
    case "earth":
      return IllustrationEarth;
    case "mars":
      return IllustrationMars;
    case "jupiter":
      return IllustrationJupiter;
    case "saturn":
      return IllustrationSaturn;
    case "uranus":
      return IllustrationUranus;
    case "neptune":
      return IllustrationNeptune;
    case "dwarf-planets":
      return IllustrationDwarfPlanets;
    case "asteroids-comets":
      return IllustrationAsteroids;
    default:
      return IllustrationSun;
  }
}

const CATEGORY_ICONS = {
  star: "⭐",
  rocky: "🪨",
  "gas-giant": "🌀",
  "ice-giant": "❄️",
  dwarf: "🌑",
  "small-bodies": "☄️",
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Picture+text multiple-choice mini-quiz shown after a body's card is
// opened, matching the HumanEvolution/TechHistory StageQuiz pattern: built
// entirely from data already present on the bodies, and wrong taps disable
// that option instead of allowing repeated blind guessing.
function StageQuiz({ body, bodies, pair, profile, t }) {
  const [options] = useState(() => {
    const others = shuffle(bodies.filter((b) => b.id !== body.id)).slice(0, 2);
    return shuffle([body, ...others]);
  });
  const [wrongIds, setWrongIds] = useState([]);
  const [solved, setSolved] = useState(false);

  function pick(option) {
    if (solved) return;
    if (option.id === body.id) {
      setSolved(true);
      recordSkillEvent(profile?.name, "solar-system-quiz", wrongIds.length === 0);
      pingProgress({ profileName: profile?.name, module: "solar-system", event: `quiz_solved:${body.id}` });
    } else {
      setWrongIds((prev) => (prev.includes(option.id) ? prev : [...prev, option.id]));
      pingProgress({ profileName: profile?.name, module: "solar-system", event: `quiz_attempt:${body.id}` });
    }
  }

  const prompt = t("modules.solarQuizPrompt");

  return (
    <div className="game-card">
      <div className="game-emoji">❓</div>
      <p className="mission-badge science-topic-badge">{t("modules.solarQuizTitle")}</p>
      <p className="page-intro">
        {prompt}
        <SpeakButton text={prompt} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.id}>
            <button
              type="button"
              disabled={solved || wrongIds.includes(opt.id)}
              className={
                "big-btn game-option" +
                (solved && opt.id === body.id ? " correct" : "") +
                (wrongIds.includes(opt.id) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.emoji} {opt.title}
            </button>
            <SpeakButton text={opt.title} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.solarQuizCorrect")}</p>
          <SpeakButton text={t("modules.solarQuizCorrect")} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

export default function SolarSystem() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const bodies = useMemo(() => getSolarSystem(pair.mother), [pair.mother]);

  const [openId, setOpenId] = useState(null);
  const [visitedVersion, setVisitedVersion] = useState(0);
  const visited = useMemo(() => getVisitedSolarSystemStages(profile?.name), [profile?.name, visitedVersion]);

  function toggleBody(body) {
    const opening = openId !== body.id;
    setOpenId(opening ? body.id : null);
    if (opening) {
      visitSolarSystemStage(profile?.name, body.id);
      pingProgress({ profileName: profile?.name, module: "solar-system", event: `body_visited:${body.id}` });
      recordSkillEvent(profile?.name, "solar-system-body-viewed", true);
      setVisitedVersion((v) => v + 1);
    }
  }

  return (
    <div className="page">
      <h1>{t("modules.solarTitle")} 🪐</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.solarHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.solarIntro")}</p>
      <MascotBubble character="nina" mood="happy" langCode={pair.mother}>
        {t("modules.solarMascotIntro")}
      </MascotBubble>

      <p className="page-intro">
        {t("modules.solarExplored")}: {visited.length}/{bodies.length}
      </p>

      <div className="history-timeline">
        {bodies.map((body) => {
          const isOpen = openId === body.id;
          const isVisited = visited.includes(body.id);
          const Illustration = bodyIllustration(body.id);
          return (
            <div key={body.id} className={"history-era-card" + (isVisited ? " visited" : "")}>
              <button type="button" className="history-era-header" onClick={() => toggleBody(body)}>
                <span className="history-year-badge">
                  {CATEGORY_ICONS[body.category] || "🪐"} {t(`modules.solarCategory_${body.category}`)}
                </span>
                <span className="history-era-emoji">{body.emoji}</span>
                <span className="history-era-title">{body.title}</span>
                {isVisited && <span className="history-era-check">✅</span>}
              </button>
              {isOpen && (
                <div className="history-era-body">
                  <div className="history-era-illustration">
                    <Illustration size={104} />
                  </div>
                  <p className="mission-badge science-topic-badge">{body.tagline}</p>
                  <p className="mission-text">
                    {body.description}
                    <SpeakButton text={body.description} langCode={pair.mother} />
                  </p>
                  <p className="mission-badge science-topic-badge">
                    📏 {t("modules.solarSizeLabel")}
                  </p>
                  <p className="mission-text">
                    {body.sizeFact}
                    <SpeakButton text={body.sizeFact} langCode={pair.mother} />
                  </p>
                  <p className="mission-badge science-topic-badge">🤔 {body.whyLabel}</p>
                  <p className="mission-text">
                    {body.whyFact}
                    <SpeakButton text={`${body.whyLabel} ${body.whyFact}`} langCode={pair.mother} />
                  </p>
                  <p className="mission-text science-try-home">
                    ✨ {t("modules.solarFunFact")}: {body.funFact}
                    <SpeakButton text={body.funFact} langCode={pair.mother} />
                  </p>
                  <StageQuiz key={body.id} body={body} bodies={bodies} pair={pair} profile={profile} t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
