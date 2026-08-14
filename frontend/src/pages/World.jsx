import React, { Suspense, lazy, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCountries, getPackingChallenges, getTransportScenarios } from "../content/index.js";
import { getLangPair, getProfile, getVisitedCountries, visitCountry, getDifficultyTier, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";

const TRANSPORT_MODE_META = {
  walk: { emoji: "🚶", labelKey: "worldModeWalk" },
  bike: { emoji: "🚲", labelKey: "worldModeBike" },
  car: { emoji: "🚗", labelKey: "worldModeCar" },
  train: { emoji: "🚂", labelKey: "worldModeTrain" },
  plane: { emoji: "✈️", labelKey: "worldModePlane" },
  ship: { emoji: "🚢", labelKey: "worldModeShip" },
};

// Rough great-circle distance (km) from lat/lng — precision doesn't matter,
// this only drives a coarse "near / medium / far" band for kids.
function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceBand(km) {
  if (km < 2000) return "near";
  if (km < 7000) return "medium";
  return "far";
}

function climateBand(lat) {
  const abs = Math.abs(lat);
  if (abs < 23.5) return "hot";
  if (abs < 45) return "mild";
  return "cold";
}

// Very rough longitude-based UTC offset — real timezones don't follow
// meridians exactly, but /15 gives kids the right day/night intuition.
function tzOffsetHours(lng) {
  return Math.round(lng / 15);
}

function dayPhase(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 7 && h < 18) return "day";
  if ((h >= 5 && h < 7) || (h >= 18 && h < 20)) return "dusk";
  return "night";
}

const PHASE_EMOJI = { day: "☀️", night: "🌙", dusk: "🌆" };

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

// Randomly picks one of a country's animal entries (it may have a primary
// `animal` and an `additionalAnimal`) so repeated quizzes surface variety.
function pickAnimal(c) {
  const opts = [c.animal, c.additionalAnimal].filter(Boolean);
  if (!opts.length) return null;
  return opts[Math.floor(Math.random() * opts.length)];
}

// Attribute getters used both to build the quiz pool (countries that have
// this field) and to read the correct value for a round.
const QUIZ_FIELD_GETTERS = {
  flag: (c) => c.flag,
  capital: (c) => c.capital,
  food: (c) => c.food,
  landmark: (c) => c.landmark,
  climate: (c) => c.climate,
  language: (c) => c.language,
  animal: (c) => pickAnimal(c)?.name,
  landmarkReverse: (c) => c.landmark,
  animalReverse: (c) => pickAnimal(c)?.name,
};

// Types where the country is shown as the clue and the child guesses the
// attribute (flag/capital/animal/food/landmark/climate/language).
const QUIZ_FORWARD_TYPES = ["flag", "capital", "animal", "food", "landmark", "climate", "language"];
// Types where the attribute is shown as the clue and the child guesses the
// country ("Em que país encontras a Torre de Belém?").
const QUIZ_REVERSE_TYPES = ["landmarkReverse", "animalReverse"];

// Simpler recognition-only types for the youngest tier; the full mix
// (including the harder reverse/attribute types) unlocks from tier 2 up.
function quizTypesForTier(tier) {
  if (tier === 1) return ["flag", "capital"];
  return [...QUIZ_FORWARD_TYPES, ...QUIZ_REVERSE_TYPES];
}

function buildQuizRounds(countries, tier, type) {
  const count = tier === 1 ? 5 : tier === 2 ? 8 : 10;
  const getter = QUIZ_FIELD_GETTERS[type] || QUIZ_FIELD_GETTERS.flag;
  const pool = countries.filter((c) => {
    const v = getter(c);
    return v !== undefined && v !== null && v !== "";
  });
  const shuffledPool = shuffle(pool).slice(0, Math.min(count, pool.length));
  const reverse = QUIZ_REVERSE_TYPES.includes(type);

  return shuffledPool.map((correct) => {
    const value = getter(correct);
    if (reverse) {
      // The clue (e.g. a landmark name) is shown; options are countries.
      const distractors = shuffle(countries.filter((c) => c.iso !== correct.iso)).slice(0, 2);
      return { type, correct, value, options: shuffle([correct, ...distractors]) };
    }
    // The country is shown; options are attribute values (text), one of
    // which is correct. Distractors are real values sampled from other
    // countries in the dataset, never invented text.
    const otherValues = pool.filter((c) => c.iso !== correct.iso && getter(c) !== value);
    const distractorValues = shuffle(otherValues).slice(0, 2).map((c) => getter(c));
    const options = shuffle([value, ...distractorValues]).map((label, i) => ({
      key: `${correct.iso}-${type}-${i}`,
      label,
      correct: label === value,
    }));
    return { type, correct, value, options };
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
  // Anti-guessing (same pattern as MathGame/Phonics): once an option is
  // clicked wrong it stays visible but disabled, so the child can't just
  // spam through every option. Full XP is only awarded within the first
  // couple of attempts.
  const [wrongKeys, setWrongKeys] = useState(() => new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const quizTypes = useMemo(() => quizTypesForTier(tier), [tier]);

  // --- Trip planner ("Planeia uma Viagem") ---
  const defaultFrom = countries.find((c) => c.iso === "PT") || countries[0];
  const defaultTo = countries.find((c) => c.iso !== defaultFrom?.iso) || countries[1] || countries[0];
  const [fromIso, setFromIso] = useState(defaultFrom?.iso);
  const [toIso, setToIso] = useState(defaultTo?.iso);
  const fromCountry = countries.find((c) => c.iso === fromIso) || defaultFrom;
  const toCountry = countries.find((c) => c.iso === toIso) || defaultTo;

  // --- Timezones ("Hoje no Outro Lado do Mundo") ---
  const [hourHere, setHourHere] = useState(14);
  const timezoneCountries = useMemo(() => countries.slice(0, 3), [countries]);

  // --- Packing ("Faz a Mala") ---
  const packingDestinations = getPackingChallenges(pair.mother);
  const [packingDestId, setPackingDestId] = useState(null);
  const [packedItems, setPackedItems] = useState(new Set());
  const [packingChecked, setPackingChecked] = useState(false);
  const packingDest = packingDestinations.find((d) => d.id === packingDestId);

  function pickPackingDest(id) {
    setPackingDestId(id);
    setPackedItems(new Set());
    setPackingChecked(false);
  }

  function togglePackItem(id) {
    if (packingChecked) return;
    setPackedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function checkPacking() {
    if (!packingDest) return;
    const correctCount = packingDest.items.filter((it) => packedItems.has(it.id) === it.correct).length;
    setPackingChecked(true);
    pingProgress({ profileName: profile?.name, module: "world", event: `packing_${packingDest.id}:${correctCount}/${packingDest.items.length}` });
    recordSkillEvent(profile?.name, "world-packing", correctCount === packingDest.items.length);
  }

  // --- Transport ("Como Chegamos Lá?") ---
  const transportScenarios = getTransportScenarios(pair.mother);
  const [transportStep, setTransportStep] = useState(0);
  const [transportFeedback, setTransportFeedback] = useState(null);
  const transportScenario = transportScenarios[transportStep];
  const transportFinished = transportStep >= transportScenarios.length;

  function answerTransport(mode) {
    if (transportFeedback === "correct" || !transportScenario) return;
    const correct = mode === transportScenario.correct;
    setTransportFeedback(correct ? "correct" : "wrong");
    pingProgress({ profileName: profile?.name, module: "world", event: `transport_${transportScenario.id}_${correct ? "correct" : "wrong"}` });
    recordSkillEvent(profile?.name, "world-transport", correct);
    if (correct) {
      setTimeout(() => {
        setTransportFeedback(null);
        setTransportStep((s) => s + 1);
      }, 1100);
    }
  }

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
    setWrongKeys(new Set());
    setWrongCount(0);
  }

  // Works for both "forward" rounds (options are {key,label,correct}) and
  // "reverse" rounds (options are country objects) — optionKey() picks the
  // right identity, isCorrectOption() the right correctness check.
  function optionKey(option) {
    return option.iso ?? option.key;
  }
  function isCorrectOption(round, option) {
    return option.iso !== undefined ? option.iso === round.correct.iso : !!option.correct;
  }

  function handleAnswer(option) {
    if (feedback) return;
    const round = rounds[step];
    const key = optionKey(option);
    if (wrongKeys.has(key)) return;
    const correct = isCorrectOption(round, option);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setScore((s) => s + 1);
      // Full skill/XP credit only if answered right within the first
      // couple of attempts, not after guessing through every option.
      recordSkillEvent(profile?.name, "world-quiz", wrongCount < 2);
    } else {
      setWrongKeys((prev) => new Set(prev).add(key));
      setWrongCount((c) => c + 1);
    }
    pingProgress({
      profileName: profile?.name,
      module: "world",
      event: `quiz_${quizMode}_${correct ? "correct" : "wrong"}`,
    });
    if (correct) {
      setTimeout(() => {
        setFeedback(null);
        setWrongKeys(new Set());
        setWrongCount(0);
        setStep((s) => s + 1);
      }, 900);
    } else {
      setTimeout(() => setFeedback(null), 500);
    }
  }

  const quizFinished = quizMode && step >= rounds.length;
  const round = rounds[step];

  const QUIZ_TYPE_META = {
    flag: { icon: "🏴", labelKey: "worldFlagQuiz", promptKey: "worldFlagPrompt" },
    capital: { icon: "🏛️", labelKey: "worldCapitalQuiz", promptKey: "worldCapitalPrompt" },
    animal: { icon: "🐾", labelKey: "worldAnimalQuiz", promptKey: "worldAnimalPrompt" },
    food: { icon: "🍽️", labelKey: "worldFoodQuiz", promptKey: "worldFoodPrompt" },
    landmark: { icon: "🏰", labelKey: "worldLandmarkQuiz", promptKey: "worldLandmarkPrompt" },
    climate: { icon: "🌡️", labelKey: "worldClimateQuiz", promptKey: "worldClimatePrompt" },
    language: { icon: "🗣️", labelKey: "worldLanguageQuiz", promptKey: "worldLanguagePrompt" },
    landmarkReverse: { icon: "🧭", labelKey: "worldLandmarkReverseQuiz", promptKey: "worldLandmarkReversePrompt" },
    animalReverse: { icon: "🔎", labelKey: "worldAnimalReverseQuiz", promptKey: "worldAnimalReversePrompt" },
  };

  function quizPrompt(r) {
    if (!r) return "";
    const meta = QUIZ_TYPE_META[r.type];
    if (QUIZ_REVERSE_TYPES.includes(r.type)) {
      return t(`modules.${meta.promptKey}`, { value: r.value });
    }
    return t(`modules.${meta.promptKey}`, { country: r.correct.name });
  }

  const helpTextByTab = {
    globe: t("modules.worldHelpGlobe"),
    explore: t("modules.worldHelpExplore"),
    quiz: t("modules.worldHelpQuiz"),
    trip: t("modules.worldHelpTrip"),
    timezone: t("modules.worldHelpTimezone"),
    packing: t("modules.worldHelpPacking"),
    transport: t("modules.worldHelpTransport"),
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
        <button type="button" className={"phonics-tab" + (tab === "trip" ? " selected" : "")} onClick={() => setTab("trip")}>
          <span className="phonics-tab-inner">
            🧳 {t("modules.worldTripTab")}
            <TabSpeakIcon text={`${t("modules.worldTripTab")}. ${helpTextByTab.trip}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "timezone" ? " selected" : "")} onClick={() => setTab("timezone")}>
          <span className="phonics-tab-inner">
            🕐 {t("modules.worldTimezoneTab")}
            <TabSpeakIcon text={`${t("modules.worldTimezoneTab")}. ${helpTextByTab.timezone}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "packing" ? " selected" : "")} onClick={() => setTab("packing")}>
          <span className="phonics-tab-inner">
            🎒 {t("modules.worldPackingTab")}
            <TabSpeakIcon text={`${t("modules.worldPackingTab")}. ${helpTextByTab.packing}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "transport" ? " selected" : "")} onClick={() => { setTab("transport"); setTransportStep(0); setTransportFeedback(null); }}>
          <span className="phonics-tab-inner">
            🚦 {t("modules.worldTransportTab")}
            <TabSpeakIcon text={`${t("modules.worldTransportTab")}. ${helpTextByTab.transport}`} langCode={pair.mother} />
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
                  <SpeakButton text={t("modules.worldLandmarkSentence", { landmark: selected.landmark })} langCode={pair.mother} />
                </p>
              )}
              {selected.food && (
                <p className="mission-text">
                  {t("modules.worldFood")}: 🍽️ {selected.food}
                  <SpeakButton text={t("modules.worldFoodSentence", { food: selected.food })} langCode={pair.mother} />
                </p>
              )}
              {selected.animal && (
                <p className="mission-text">
                  {t("modules.worldAnimal")}: {selected.animal.emoji} {selected.animal.name}
                  <SpeakButton text={t("modules.worldAnimalSentence", { animal: selected.animal.name })} langCode={pair.mother} />
                </p>
              )}
              {selected.additionalAnimal && (
                <p className="mission-text">
                  {t("modules.worldAdditionalAnimal")}: {selected.additionalAnimal.emoji} {selected.additionalAnimal.name}
                  <SpeakButton text={t("modules.worldAnimalSentence", { animal: selected.additionalAnimal.name })} langCode={pair.mother} />
                </p>
              )}
              {selected.tradition && (
                <p className="mission-text">
                  {t("modules.worldTradition")}: 🎉 {selected.tradition}
                  <SpeakButton text={selected.tradition} langCode={pair.mother} />
                </p>
              )}
              {selected.climate && (
                <p className="mission-text">
                  {t("modules.worldClimate")}: 🌡️ {selected.climate}
                  <SpeakButton text={selected.climate} langCode={pair.mother} />
                </p>
              )}
              {selected.population && (
                <p className="mission-text">
                  {t("modules.worldPopulation")}: 👥 {selected.population}
                  <SpeakButton text={selected.population} langCode={pair.mother} />
                </p>
              )}
              {selected.funCuriosity && (
                <p className="mission-text">
                  {t("modules.worldFunCuriosity")}: 💡 {selected.funCuriosity}
                  <SpeakButton text={selected.funCuriosity} langCode={pair.mother} />
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
                  <SpeakButton text={t("modules.worldLandmarkSentence", { landmark: selected.landmark })} langCode={pair.mother} />
                </p>
              )}
              {selected.food && (
                <p className="mission-text">
                  {t("modules.worldFood")}: 🍽️ {selected.food}
                  <SpeakButton text={t("modules.worldFoodSentence", { food: selected.food })} langCode={pair.mother} />
                </p>
              )}
              {selected.animal && (
                <p className="mission-text">
                  {t("modules.worldAnimal")}: {selected.animal.emoji} {selected.animal.name}
                  <SpeakButton text={t("modules.worldAnimalSentence", { animal: selected.animal.name })} langCode={pair.mother} />
                </p>
              )}
              {selected.additionalAnimal && (
                <p className="mission-text">
                  {t("modules.worldAdditionalAnimal")}: {selected.additionalAnimal.emoji} {selected.additionalAnimal.name}
                  <SpeakButton text={t("modules.worldAnimalSentence", { animal: selected.additionalAnimal.name })} langCode={pair.mother} />
                </p>
              )}
              {selected.tradition && (
                <p className="mission-text">
                  {t("modules.worldTradition")}: 🎉 {selected.tradition}
                  <SpeakButton text={selected.tradition} langCode={pair.mother} />
                </p>
              )}
              {selected.climate && (
                <p className="mission-text">
                  {t("modules.worldClimate")}: 🌡️ {selected.climate}
                  <SpeakButton text={selected.climate} langCode={pair.mother} />
                </p>
              )}
              {selected.population && (
                <p className="mission-text">
                  {t("modules.worldPopulation")}: 👥 {selected.population}
                  <SpeakButton text={selected.population} langCode={pair.mother} />
                </p>
              )}
              {selected.funCuriosity && (
                <p className="mission-text">
                  {t("modules.worldFunCuriosity")}: 💡 {selected.funCuriosity}
                  <SpeakButton text={selected.funCuriosity} langCode={pair.mother} />
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
          {quizTypes.map((qtype) => {
            const meta = QUIZ_TYPE_META[qtype];
            return (
              <button type="button" className="big-btn" key={qtype} onClick={() => startQuiz(qtype)}>
                {meta.icon} {t(`modules.${meta.labelKey}`)}
              </button>
            );
          })}
        </div>
      )}

      {tab === "quiz" && quizMode && !quizFinished && round && (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          <div className="game-emoji">
            {QUIZ_REVERSE_TYPES.includes(round.type)
              ? QUIZ_TYPE_META[round.type].icon
              : round.type === "flag"
              ? round.correct.flag
              : QUIZ_TYPE_META[round.type].icon}
          </div>
          <p className="page-intro">
            {quizPrompt(round)}
            <SpeakButton text={quizPrompt(round)} langCode={pair.mother} />
          </p>
          <div className="game-options">
            {round.options.map((opt) => {
              const key = optionKey(opt);
              const label = opt.iso !== undefined ? opt.name : opt.label;
              const isCorrect = isCorrectOption(round, opt);
              return (
                <button
                  key={key}
                  type="button"
                  className={
                    "big-btn game-option" +
                    (feedback && isCorrect ? " correct" : "") +
                    (wrongKeys.has(key) ? " disabled" : "")
                  }
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback || wrongKeys.has(key)}
                >
                  {label}
                </button>
              );
            })}
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

      {tab === "trip" && fromCountry && toCountry && (
        <div className="mission-card">
          <h2>{t("modules.worldTripTitle")} 🧳</h2>
          <div className="world-trip-pickers">
            <label>
              {t("modules.worldTripFrom")}
              <select value={fromIso} onChange={(e) => setFromIso(e.target.value)}>
                {countries.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="world-trip-arrow">➡️</span>
            <label>
              {t("modules.worldTripTo")}
              <select value={toIso} onChange={(e) => setToIso(e.target.value)}>
                {countries.map((c) => (
                  <option key={c.iso} value={c.iso}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {fromIso === toIso ? (
            <p className="page-intro">{fromCountry.flag} → {toCountry.flag}</p>
          ) : (
            (() => {
              const km = haversineKm(fromCountry.lat, fromCountry.lng, toCountry.lat, toCountry.lng);
              const band = distanceBand(km);
              const climate = climateBand(toCountry.lat);
              let tzDiff = tzOffsetHours(toCountry.lng) - tzOffsetHours(fromCountry.lng);
              const packSuggestion =
                climate === "hot"
                  ? packingDestinations.find((d) => d.id === "beach") || packingDestinations.find((d) => d.id === "desert")
                  : climate === "cold"
                  ? packingDestinations.find((d) => d.id === "snow")
                  : packingDestinations.find((d) => d.id === "mountain") || packingDestinations.find((d) => d.id === "rainy");
              const travelMode =
                band === "near" ? "train" : band === "medium" ? "plane" : "plane";

              pingProgress({ profileName: profile?.name, module: "world", event: `trip_planned:${fromIso}->${toIso}` });

              return (
                <div className="mission-card country-card">
                  <div className="country-facts-row">
                    <span>🌍 {t("modules.worldTripContinent")}: {toCountry.continent}</span>
                    <span>💰 {t("modules.worldTripCurrency")}: {toCountry.currency}</span>
                  </div>
                  {toCountry.language && (
                    <p className="mission-text">{t("modules.worldTripLanguage")}: {toCountry.language}</p>
                  )}
                  <p className="mission-text">
                    {t("modules.worldTripDistance")}: {t(`modules.worldTripDistance${band === "near" ? "Near" : band === "medium" ? "Medium" : "Far"}`)}
                  </p>
                  <p className="mission-text">
                    {t("modules.worldTripTimezone")}:{" "}
                    {tzDiff === 0
                      ? t("modules.worldTripTimezoneSame")
                      : `${Math.abs(tzDiff)} ${tzDiff > 0 ? t("modules.worldTripTimezoneAhead") : t("modules.worldTripTimezoneBehind")}`}
                  </p>
                  <p className="mission-text">
                    {t("modules.worldTripClimate")}: {t(`modules.worldTripClimate${climate === "hot" ? "Hot" : climate === "mild" ? "Mild" : "Cold"}`)}
                  </p>
                  {packSuggestion && (
                    <p className="mission-text">
                      {t("modules.worldTripPacking")}: {packSuggestion.icon} {packSuggestion.name}
                    </p>
                  )}
                  <p className="mission-text">
                    {t("modules.worldTripHow")}: {TRANSPORT_MODE_META[travelMode].emoji} {t(`modules.${TRANSPORT_MODE_META[travelMode].labelKey}`)}
                  </p>
                </div>
              );
            })()
          )}
        </div>
      )}

      {tab === "timezone" && (
        <div className="mission-card">
          <h2>{t("modules.worldTimezoneTitle")} 🕐</h2>
          <p className="page-intro">{t("modules.worldTimezoneIntro")}</p>
          <div className="world-timezone-here">
            <span>
              {PHASE_EMOJI[dayPhase(hourHere)]} {fromCountry?.flag} {t("modules.worldTimezoneHere")}: {String(hourHere).padStart(2, "0")}:00
            </span>
            <input
              type="range"
              min="0"
              max="23"
              value={hourHere}
              onChange={(e) => setHourHere(Number(e.target.value))}
            />
          </div>
          <div className="world-timezone-grid">
            {timezoneCountries.map((c) => {
              const diff = tzOffsetHours(c.lng) - tzOffsetHours(fromCountry?.lng ?? 0);
              const otherHour = hourHere + diff;
              const phase = dayPhase(otherHour);
              return (
                <div key={c.iso} className="world-timezone-card">
                  <div className="mission-emoji">{c.flag}</div>
                  <div>{c.name}</div>
                  <div className="world-timezone-phase">
                    {PHASE_EMOJI[phase]}{" "}
                    {t(`modules.worldTimezone${phase === "day" ? "Day" : phase === "night" ? "Night" : "Dusk"}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "packing" && !packingDest && (
        <div className="mission-card">
          <h2>{t("modules.worldPackingTitle")} 🎒</h2>
          <p className="page-intro">{t("modules.worldPackingIntro")}</p>
          <div className="world-quiz-picker">
            {packingDestinations.map((d) => (
              <button key={d.id} type="button" className="big-btn" onClick={() => pickPackingDest(d.id)}>
                {d.icon} {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "packing" && packingDest && (
        <div className="game-card">
          <div className="game-emoji">{packingDest.icon} {packingDest.name}</div>
          <div className="world-grid">
            {packingDest.items.map((it) => {
              const picked = packedItems.has(it.id);
              const showFeedback = packingChecked;
              const good = showFeedback && picked === it.correct;
              return (
                <button
                  key={it.id}
                  type="button"
                  className={
                    "world-tile" +
                    (picked ? " visited" : "") +
                    (showFeedback ? (good ? " correct" : " wrong") : "")
                  }
                  onClick={() => togglePackItem(it.id)}
                  disabled={packingChecked}
                >
                  <span className="world-tile-flag">{it.icon}</span>
                  <span className="world-tile-name">{it.name}</span>
                </button>
              );
            })}
          </div>
          {!packingChecked ? (
            <button type="button" className="big-btn" onClick={checkPacking}>
              🧾 {t("modules.worldPackingCheck")}
            </button>
          ) : (
            <>
              <p className="game-result">
                {t("modules.worldPackingResult", {
                  correct: packingDest.items.filter((it) => packedItems.has(it.id) === it.correct).length,
                  total: packingDest.items.length,
                })}
              </p>
              <button type="button" className="big-btn" onClick={() => pickPackingDest(null)}>
                🔁 {t("modules.worldPackingReset")}
              </button>
            </>
          )}
        </div>
      )}

      {tab === "transport" && !transportFinished && transportScenario && (
        <div className="game-card">
          <div className="game-progress">
            {transportStep + 1} / {transportScenarios.length}
          </div>
          <div className="game-emoji">{transportScenario.icon}</div>
          <p className="page-intro">
            {transportScenario.prompt}
            <SpeakButton text={transportScenario.prompt} langCode={pair.mother} />
          </p>
          <div className="game-options">
            {transportScenario.modes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={
                  "big-btn game-option" +
                  (transportFeedback && mode === transportScenario.correct ? " correct" : "")
                }
                onClick={() => answerTransport(mode)}
                disabled={transportFeedback === "correct"}
              >
                {TRANSPORT_MODE_META[mode].emoji} {t(`modules.${TRANSPORT_MODE_META[mode].labelKey}`)}
              </button>
            ))}
          </div>
          {transportFeedback && (
            <p className="mission-text">
              {transportFeedback === "correct" ? "✅ " + t("modules.worldTransportCorrect") : "🤔 " + t("modules.worldTransportWrong")}
              {" "}
              {transportScenario.explanation}
            </p>
          )}
        </div>
      )}

      {tab === "transport" && transportFinished && (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">{t("modules.worldTransportDone")}</p>
          <button
            type="button"
            className="big-btn"
            onClick={() => {
              setTransportStep(0);
              setTransportFeedback(null);
            }}
          >
            🔁 {t("modules.gamePlayAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
