import React, { Suspense, lazy, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCountries } from "../content/index.js";
import { getLangPair, getProfile, getVisitedCountries, visitCountry, getDifficultyTier, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";

// Lazy-loaded: pulls in three.js/globe.gl (~650KB gzipped), only needed
// when the child actually opens the 3D Globe tab.
const Globe3D = lazy(() => import("../components/Globe3D.jsx"));

const CONTINENTS = ["europe", "asia", "africa", "north-america", "south-america", "oceania"];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuizRounds(countries, tier, mode) {
  const count = tier === 1 ? 5 : tier === 2 ? 8 : 10;
  const pool = shuffle(countries).slice(0, Math.min(count, countries.length));
  return pool.map((correct) => {
    const distractors = shuffle(countries.filter((c) => c.iso !== correct.iso)).slice(0, 2);
    return { correct, options: shuffle([correct, ...distractors]), mode };
  });
}

export default function World() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const countries = getCountries(pair.mother);

  const [tab, setTab] = useState("explore");
  const [selected, setSelected] = useState(null);
  const [visitedVersion, setVisitedVersion] = useState(0);
  const visited = useMemo(() => getVisitedCountries(profile?.name), [profile?.name, visitedVersion]);

  const [quizMode, setQuizMode] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  function openCountry(c) {
    setSelected(c);
    visitCountry(profile?.name, c.iso);
    pingProgress({ profileName: profile?.name, module: "world", event: `country_visited:${c.iso}` });
    recordSkillEvent(profile?.name, "world-country-viewed", true);
    setVisitedVersion((v) => v + 1);
  }

  function startQuiz(mode) {
    setQuizMode(mode);
    setRounds(buildQuizRounds(countries, tier, mode));
    setStep(0);
    setScore(0);
    setFeedback(null);
  }

  function handleAnswer(option) {
    if (feedback) return;
    const round = rounds[step];
    const correct = option.iso === round.correct.iso;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    pingProgress({
      profileName: profile?.name,
      module: "world",
      event: `quiz_${quizMode}_${correct ? "correct" : "wrong"}`,
    });
    setTimeout(() => {
      setFeedback(null);
      setStep((s) => s + 1);
    }, 900);
  }

  const quizFinished = quizMode && step >= rounds.length;
  const round = rounds[step];

  const helpTextByTab = {
    globe: t("modules.worldHelpGlobe"),
    explore: t("modules.worldHelpExplore"),
    quiz: t("modules.worldHelpQuiz"),
  };

  return (
    <div className="page">
      <h1>{t("modules.worldTitle")} 🗺️</h1>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "globe" ? " selected" : "")} onClick={() => setTab("globe")}>
          <span className="phonics-tab-inner">
            🌐 {t("modules.worldGlobe")}
            <TabSpeakIcon text={`${t("modules.worldGlobe")}. ${helpTextByTab.globe}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "explore" ? " selected" : "")} onClick={() => { setTab("explore"); setQuizMode(null); }}>
          <span className="phonics-tab-inner">
            🔎 {t("modules.worldExplore")}
            <TabSpeakIcon text={`${t("modules.worldExplore")}. ${helpTextByTab.explore}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "quiz" ? " selected" : "")} onClick={() => setTab("quiz")}>
          <span className="phonics-tab-inner">
            🎮 {t("modules.worldQuiz")}
            <TabSpeakIcon text={`${t("modules.worldQuiz")}. ${helpTextByTab.quiz}`} langCode={pair.mother} />
          </span>
        </button>
      </div>

      <div className="help-btn-corner">
        <HelpButton text={helpTextByTab[tab]} langCode={pair.mother} />
      </div>

      <p className="page-intro">
        {t("modules.worldPassport")}: {visited.length}/{countries.length}
      </p>

      {tab === "globe" && (
        <>
          <Suspense fallback={<div className="globe-3d-container globe-3d-loading">🌐</div>}>
            <Globe3D countries={countries} visited={visited} onSelect={openCountry} />
          </Suspense>
          {selected && (
            <div className="mission-card country-card">
              <div className="mission-emoji">{selected.flag}</div>
              <h2>
                {selected.name}
                <SpeakButton text={selected.name} langCode={pair.mother} />
                {selected.nativeName && selected.nativeLangCode && (
                  <SpeakButton
                    text={selected.nativeName}
                    langCode={selected.nativeLangCode}
                    label={selected.nativeName}
                  />
                )}
              </h2>
              {selected.nativeName && selected.nativeName !== selected.name && (
                <p className="country-native-name">{selected.nativeName}</p>
              )}
              <div className="country-facts-row">
                <span>🏛️ {selected.capital}</span>
                <span>💰 {selected.currency}</span>
              </div>
              {selected.emojiScene && (
                <div className="world-emoji-scene">{selected.emojiScene.join(" ")}</div>
              )}
              <p className="mission-text">
                {selected.fact}
                <SpeakButton text={selected.fact} langCode={pair.mother} />
              </p>
              {selected.music && (
                <p className="mission-text">
                  🎵 {selected.music}
                  <SpeakButton text={selected.music} langCode={pair.mother} />
                </p>
              )}
              {selected.landmark && (
                <p className="mission-text">
                  {t("modules.worldLandmark")}: 🏛️ {selected.landmark}
                  <SpeakButton text={selected.landmark} langCode={pair.mother} />
                </p>
              )}
              {selected.food && (
                <p className="mission-text">
                  {t("modules.worldFood")}: 🍽️ {selected.food}
                  <SpeakButton text={selected.food} langCode={pair.mother} />
                </p>
              )}
              {selected.animal && (
                <p className="mission-text">
                  {t("modules.worldAnimal")}: {selected.animal.emoji} {selected.animal.name}
                </p>
              )}
              {selected.tradition && (
                <p className="mission-text">
                  {t("modules.worldTradition")}: {selected.tradition}
                  <SpeakButton text={selected.tradition} langCode={pair.mother} />
                </p>
              )}
              {selected.language && selected.greeting && (
                <p className="mission-text">
                  {t("modules.worldLanguage")}: {selected.language} — {t("modules.worldGreeting")}: “{selected.greeting}”
                  <SpeakButton text={selected.greeting} langCode={pair.mother} />
                  {selected.greetingTranslation && (
                    <> ({t("modules.worldGreetingMeaning")}: “{selected.greetingTranslation}”)</>
                  )}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {tab === "explore" && (
        <>
          <div className="world-grid">
            {countries.map((c) => (
              <button
                key={c.iso}
                type="button"
                className={"world-tile" + (visited.includes(c.iso) ? " visited" : "")}
                onClick={() => openCountry(c)}
              >
                <span className="world-tile-flag">{c.flag}</span>
                <span className="world-tile-name">{c.name}</span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="mission-card country-card">
              <div className="mission-emoji">{selected.flag}</div>
              <h2>
                {selected.name}
                <SpeakButton text={selected.name} langCode={pair.mother} />
                {selected.nativeName && selected.nativeLangCode && (
                  <SpeakButton
                    text={selected.nativeName}
                    langCode={selected.nativeLangCode}
                    label={selected.nativeName}
                  />
                )}
              </h2>
              {selected.nativeName && selected.nativeName !== selected.name && (
                <p className="country-native-name">{selected.nativeName}</p>
              )}
              <div className="country-facts-row">
                <span>🏛️ {selected.capital}</span>
                <span>💰 {selected.currency}</span>
              </div>
              {selected.emojiScene && (
                <div className="world-emoji-scene">{selected.emojiScene.join(" ")}</div>
              )}
              <p className="mission-text">
                {selected.fact}
                <SpeakButton text={selected.fact} langCode={pair.mother} />
              </p>
              {selected.music && (
                <p className="mission-text">
                  🎵 {selected.music}
                  <SpeakButton text={selected.music} langCode={pair.mother} />
                </p>
              )}
              {selected.landmark && (
                <p className="mission-text">
                  {t("modules.worldLandmark")}: 🏛️ {selected.landmark}
                  <SpeakButton text={selected.landmark} langCode={pair.mother} />
                </p>
              )}
              {selected.food && (
                <p className="mission-text">
                  {t("modules.worldFood")}: 🍽️ {selected.food}
                  <SpeakButton text={selected.food} langCode={pair.mother} />
                </p>
              )}
              {selected.animal && (
                <p className="mission-text">
                  {t("modules.worldAnimal")}: {selected.animal.emoji} {selected.animal.name}
                </p>
              )}
              {selected.tradition && (
                <p className="mission-text">
                  {t("modules.worldTradition")}: {selected.tradition}
                  <SpeakButton text={selected.tradition} langCode={pair.mother} />
                </p>
              )}
              {selected.language && selected.greeting && (
                <p className="mission-text">
                  {t("modules.worldLanguage")}: {selected.language} — {t("modules.worldGreeting")}: “{selected.greeting}”
                  <SpeakButton text={selected.greeting} langCode={pair.mother} />
                  {selected.greetingTranslation && (
                    <> ({t("modules.worldGreetingMeaning")}: “{selected.greetingTranslation}”)</>
                  )}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {tab === "quiz" && !quizMode && (
        <div className="world-quiz-picker">
          <button type="button" className="big-btn" onClick={() => startQuiz("flag")}>
            🏴 {t("modules.worldFlagQuiz")}
          </button>
          <button type="button" className="big-btn" onClick={() => startQuiz("capital")}>
            🏛️ {t("modules.worldCapitalQuiz")}
          </button>
        </div>
      )}

      {tab === "quiz" && quizMode && !quizFinished && round && (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          <div className="game-emoji">{quizMode === "flag" ? round.correct.flag : "🏛️ " + round.correct.capital}</div>
          <p className="page-intro">{quizMode === "flag" ? t("modules.worldFlagPrompt") : t("modules.worldCapitalPrompt")}</p>
          <div className="game-options">
            {round.options.map((opt) => (
              <button
                key={opt.iso}
                type="button"
                className={"big-btn game-option" + (feedback && opt.iso === round.correct.iso ? " correct" : "")}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "quiz" && quizFinished && (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={() => startQuiz(quizMode)}>
            🔁 {t("modules.gamePlayAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
