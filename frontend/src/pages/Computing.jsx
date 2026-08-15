import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getComputing, getComputingSafety, getInternetSafety, getAiLab, getComputingPasswords, getComputingInternetJourney } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getDifficultyTier,
  getExploredComputing,
  exploreComputingCard,
  getExploredInternetJourney,
  exploreInternetJourneyStep,
  recordSkillEvent,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";

const TOPIC_ICONS = {
  hardware: "🔧",
  software: "💽",
  internet: "🌐",
  safety: "🛡️",
};

// Tier -> rounds: the safety quiz only makes sense from tier 2 (age 7+) up.
const TIER_CONFIG = {
  2: { rounds: 8 },
  3: { rounds: 9 },
};

// The Internet School scenarios are for older kids (tier 2+), same as the
// safety quiz - richer multiple-choice scenarios instead of a binary quiz.
const SCHOOL_TIER_CONFIG = {
  2: { rounds: 8 },
  3: { rounds: 12 },
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRounds(cards, tier, tierConfig) {
  const config = tierConfig[tier] || tierConfig[2];
  const count = Math.min(config.rounds, cards.length);
  return shuffle(cards).slice(0, count);
}

// --- AI Lab shape data --------------------------------------------------
// Small fixed set of shapes (emoji stand-ins for circle/square) used to
// teach the "garbage in, garbage out" intuition. Not a real ML simulation -
// just one clear, playable "aha" moment.
const TRAIN_SHAPES = [
  { id: "t1", type: "circle", emoji: "⭕" },
  { id: "t2", type: "square", emoji: "🔲" },
  { id: "t3", type: "circle", emoji: "🟠" },
  { id: "t4", type: "square", emoji: "🟪" },
  { id: "t5", type: "circle", emoji: "🔵" },
  { id: "t6", type: "square", emoji: "🟨" },
];
// Indices (within TRAIN_SHAPES) that get secretly mislabeled in round 2 -
// simulating a distracted helper, never the child's own mistake.
const MISLABELED_INDEXES = [1, 4];

const TEST_SHAPES = [
  { id: "x1", type: "circle", emoji: "🟢" },
  { id: "x2", type: "square", emoji: "🟥" },
  { id: "x3", type: "circle", emoji: "⚪" },
  { id: "x4", type: "square", emoji: "⬛" },
  { id: "x5", type: "circle", emoji: "🔴" },
  { id: "x6", type: "square", emoji: "🟦" },
];

function buildAiLabRound(mislabel) {
  return TRAIN_SHAPES.map((shape, idx) => {
    const forced = mislabel && MISLABELED_INDEXES.includes(idx);
    return {
      ...shape,
      forcedWrong: forced,
      forcedLabel: forced ? (shape.type === "circle" ? "square" : "circle") : null,
    };
  });
}

export default function Computing() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const cards = getComputing(pair.mother);
  const safetyCards = getComputingSafety(pair.mother);
  const schoolScenarios = getInternetSafety(pair.mother);
  const aiLabText = getAiLab(pair.mother);
  const passwordCards = getComputingPasswords(pair.mother);
  const journeySteps = getComputingInternetJourney(pair.mother);
  const matchPairs = useMemo(() => cards.filter((c) => !!c.match), [cards]);

  const [tab, setTab] = useState("concepts");

  const [openId, setOpenId] = useState(null);
  const [version, setVersion] = useState(0);
  const explored = useMemo(() => getExploredComputing(profile?.name), [profile?.name, version]);

  const [rounds] = useState(() => buildRounds(safetyCards, tier, TIER_CONFIG));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [safetyConfirmed, setSafetyConfirmed] = useState(tier > 1);
  const [showAdvisory, setShowAdvisory] = useState(false);

  const [schoolRounds] = useState(() => buildRounds(schoolScenarios, tier, SCHOOL_TIER_CONFIG));
  const [schoolStep, setSchoolStep] = useState(0);
  const [schoolScore, setSchoolScore] = useState(0);
  const [schoolAnswered, setSchoolAnswered] = useState(null);
  const [schoolConfirmed, setSchoolConfirmed] = useState(tier > 1);
  const [showSchoolAdvisory, setShowSchoolAdvisory] = useState(false);

  // AI Lab state machine: train1 -> test1 -> train2 -> test2 -> done
  const [labPhase, setLabPhase] = useState("train1");
  const [labTrainIdx, setLabTrainIdx] = useState(0);
  const [labTags, setLabTags] = useState([]);
  const [labTestIdx, setLabTestIdx] = useState(0);
  const [labTestResults, setLabTestResults] = useState([]);
  const labRound = useMemo(() => buildAiLabRound(labPhase === "train2" || labPhase === "test2"), [labPhase === "train2" || labPhase === "test2"]);

  // --- "Liga as peças" hardware matching state ---
  const [shuffledTerms] = useState(() => shuffle(matchPairs));
  const [shuffledDefs] = useState(() => shuffle(matchPairs));
  const [matchSelectedId, setMatchSelectedId] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [matchWrongDefs, setMatchWrongDefs] = useState({}); // { termId: Set(defId) }
  const [matchAttempts, setMatchAttempts] = useState({}); // { termId: count }
  const [matchScore, setMatchScore] = useState(0);
  const matchFinished = matchPairs.length > 0 && matchedIds.length === matchPairs.length;

  // --- "Password forte ou fraca?" state ---
  const [pwOrder] = useState(() => shuffle(passwordCards));
  const [pwStep, setPwStep] = useState(0);
  const [pwScore, setPwScore] = useState(0);
  const [pwAnswered, setPwAnswered] = useState(null);
  const [pwAttempts, setPwAttempts] = useState(0);
  const pwFinished = pwStep >= pwOrder.length;

  // --- "Como funciona a Internet?" journey state ---
  const [journeyOpenId, setJourneyOpenId] = useState(null);
  const [journeyRevealed, setJourneyRevealed] = useState([]);
  const [journeyVersion, setJourneyVersion] = useState(0);
  const journeyExplored = useMemo(
    () => getExploredInternetJourney(profile?.name),
    [profile?.name, journeyVersion]
  );

  function handleOpen(card) {
    const nowOpen = card.id !== openId;
    setOpenId(nowOpen ? card.id : null);
    if (nowOpen) {
      exploreComputingCard(profile?.name, card.id);
      recordSkillEvent(profile?.name, "computing-" + card.topic, true);
      pingProgress({ profileName: profile?.name, module: "computing", event: `concept_explored:${card.id}` });
      setVersion((v) => v + 1);
    }
  }

  function handleAnswer(choseSafe) {
    if (answered) return;
    const round = rounds[step];
    const correct = choseSafe === round.isSafe;
    setAnswered({ correct, choseSafe });
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "computing-safety", correct);
    pingProgress({
      profileName: profile?.name,
      module: "computing",
      event: correct ? "safety_quiz_correct" : "safety_quiz_wrong",
    });
  }

  function handleNext() {
    setAnswered(null);
    setStep((s) => s + 1);
  }

  function handleRestart() {
    window.location.reload();
  }

  function handleSchoolAnswer(option) {
    if (schoolAnswered) return;
    setSchoolAnswered(option);
    if (option.correct) setSchoolScore((s) => s + 1);
    recordSkillEvent(profile?.name, "internet-safety", !!option.correct);
    pingProgress({
      profileName: profile?.name,
      module: "computing",
      event: option.correct ? "internet_school_correct" : "internet_school_wrong",
    });
  }

  function handleSchoolNext() {
    setSchoolAnswered(null);
    setSchoolStep((s) => s + 1);
  }

  // --- AI Lab handlers ---
  function handleLabTag(tag) {
    const shape = labRound[labTrainIdx];
    if (shape.forcedWrong) return; // locked, pre-labeled example
    const nextTags = [...labTags, { shapeId: shape.id, type: shape.type, tag }];
    setLabTags(nextTags);
    if (labTrainIdx + 1 < labRound.length) {
      setLabTrainIdx(labTrainIdx + 1);
    } else {
      // Move into testing this "robot" using the accuracy of its training data.
      runLabTest(nextTags, labRound);
    }
  }

  function runLabTest(tags, round) {
    const forcedEntries = round
      .filter((s) => s.forcedWrong)
      .map((s) => ({ shapeId: s.id, type: s.type, tag: s.forcedLabel }));
    const allTraining = [...tags, ...forcedEntries];
    const correctCount = allTraining.filter((entry) => entry.tag === entry.type).length;
    const accuracy = allTraining.length ? correctCount / allTraining.length : 1;

    // Deterministically apply the training accuracy to the test set so the
    // number of correct predictions matches the demonstrated accuracy.
    const wrongCount = Math.round((1 - accuracy) * TEST_SHAPES.length);
    const shuffledIdx = shuffle(TEST_SHAPES.map((_, i) => i)).slice(0, wrongCount);
    const results = TEST_SHAPES.map((shape, idx) => {
      const wrong = shuffledIdx.includes(idx);
      const predicted = wrong ? (shape.type === "circle" ? "square" : "circle") : shape.type;
      return { ...shape, predicted, correct: predicted === shape.type };
    });
    setLabTestResults(results);
    setLabPhase(labPhase === "train1" ? "test1" : "test2");
    pingProgress({
      profileName: profile?.name,
      module: "computing",
      event: labPhase === "train1" ? "ai_lab_round1" : "ai_lab_round2",
    });
    recordSkillEvent(profile?.name, "ai-lab", labPhase === "train1");
  }

  function startRound2() {
    setLabPhase("train2");
    setLabTrainIdx(0);
    setLabTags([]);
  }

  function handleLabRestart() {
    setLabPhase("train1");
    setLabTrainIdx(0);
    setLabTags([]);
    setLabTestIdx(0);
    setLabTestResults([]);
  }

  // --- Match handlers ---
  function handleMatchTermTap(termId) {
    if (matchedIds.includes(termId)) return;
    setMatchSelectedId(termId === matchSelectedId ? null : termId);
  }

  function handleMatchDefTap(defCard) {
    if (!matchSelectedId) return;
    if (matchedIds.includes(matchSelectedId)) return;
    const wrongSet = matchWrongDefs[matchSelectedId] || new Set();
    if (wrongSet.has(defCard.id)) return; // already tried & wrong - disabled

    const correct = defCard.id === matchSelectedId;
    const attemptsSoFar = matchAttempts[matchSelectedId] || 0;
    if (correct) {
      // Full XP only within the first attempt for this pair (anti-guessing).
      const firstTry = attemptsSoFar === 0;
      setMatchedIds((ids) => [...ids, matchSelectedId]);
      setMatchScore((s) => s + (firstTry ? 1 : 0.5));
      recordSkillEvent(profile?.name, "computing-match", firstTry);
      pingProgress({ profileName: profile?.name, module: "computing", event: "match_correct" });
      setMatchSelectedId(null);
    } else {
      const nextWrong = new Set(wrongSet);
      nextWrong.add(defCard.id);
      setMatchWrongDefs((all) => ({ ...all, [matchSelectedId]: nextWrong }));
      setMatchAttempts((all) => ({ ...all, [matchSelectedId]: attemptsSoFar + 1 }));
      recordSkillEvent(profile?.name, "computing-match", false);
    }
  }

  function handleMatchRestart() {
    window.location.reload();
  }

  // --- Password strength handlers ---
  function handlePwAnswer(guessStrong) {
    if (pwAnswered) return;
    const card = pwOrder[pwStep];
    const correct = guessStrong === (card.strength === "strong");
    setPwAnswered({ correct });
    if (correct) {
      // Full XP only within the first 1-2 attempts on this round overall.
      setPwScore((s) => s + (pwAttempts < 2 ? 1 : 0.5));
    }
    recordSkillEvent(profile?.name, "computing-password", correct);
    pingProgress({
      profileName: profile?.name,
      module: "computing",
      event: correct ? "password_correct" : "password_wrong",
    });
    if (!correct) setPwAttempts((a) => a + 1);
  }

  function handlePwNext() {
    setPwAnswered(null);
    setPwStep((s) => s + 1);
  }

  function handlePwRestart() {
    window.location.reload();
  }

  // --- Journey handlers ---
  function handleJourneyOpen(stepItem) {
    const nowOpen = stepItem.id !== journeyOpenId;
    setJourneyOpenId(nowOpen ? stepItem.id : null);
  }

  function handleJourneyReveal(stepItem) {
    if (!journeyRevealed.includes(stepItem.id)) {
      setJourneyRevealed((r) => [...r, stepItem.id]);
      exploreInternetJourneyStep(profile?.name, stepItem.id);
      recordSkillEvent(profile?.name, "computing-internet-journey", true);
      pingProgress({ profileName: profile?.name, module: "computing", event: `journey_step:${stepItem.id}` });
      setJourneyVersion((v) => v + 1);
    }
  }

  const round = rounds[step];
  const finished = step >= rounds.length;

  const schoolRound = schoolRounds[schoolStep];
  const schoolFinished = schoolStep >= schoolRounds.length;

  const labAccuracyPct = labTestResults.length
    ? Math.round((labTestResults.filter((r) => r.correct).length / labTestResults.length) * 100)
    : null;

  return (
    <div className="page">
      <h1>{t("modules.computingTitle")} 💻</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.computingHelpConcepts")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.computingIntro")}</p>
      <MascotBubble character="bit" mood="happy" langCode={pair.mother}>
        {t("modules.computingMascotIntro")}
      </MascotBubble>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "concepts" ? " selected" : "")} onClick={() => setTab("concepts")}>
          <span className="phonics-tab-inner">🧠 {t("modules.computingTabConcepts")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "safety" ? " selected" : "")} onClick={() => setTab("safety")}>
          <span className="phonics-tab-inner">🕵️ {t("modules.computingTabSafety")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "school" ? " selected" : "")} onClick={() => setTab("school")}>
          <span className="phonics-tab-inner">🏫 {t("modules.computingTabInternetSchool")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "ailab" ? " selected" : "")} onClick={() => setTab("ailab")}>
          <span className="phonics-tab-inner">🤖 {t("modules.computingTabAiLab")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "match" ? " selected" : "")} onClick={() => setTab("match")}>
          <span className="phonics-tab-inner">
            🧩 {t("modules.computingTabMatch")}
            <TabSpeakIcon text={`${t("modules.computingTabMatch")}. ${t("modules.computingMatchHelp")}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "password" ? " selected" : "")} onClick={() => setTab("password")}>
          <span className="phonics-tab-inner">
            🔐 {t("modules.computingTabPassword")}
            <TabSpeakIcon text={`${t("modules.computingTabPassword")}. ${t("modules.computingPasswordHelp")}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "journey" ? " selected" : "")} onClick={() => setTab("journey")}>
          <span className="phonics-tab-inner">
            🌐 {t("modules.computingTabJourney")}
            <TabSpeakIcon text={`${t("modules.computingTabJourney")}. ${t("modules.computingJourneyHelp")}`} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {tab === "concepts" && (
        <>
          <h3 className="songs-heading">
            {t("modules.computingExplored")} ({explored.length}/{cards.length})
          </h3>

          <div className="computing-grid">
            {cards.map((card) => {
              const wasExplored = explored.includes(card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  className={"computing-term-btn" + (wasExplored ? " done" : "")}
                  onClick={() => handleOpen(card)}
                >
                  <span className="computing-term-emoji">{card.emoji}</span>
                  {card.term}
                </button>
              );
            })}
          </div>

          {cards
            .filter((card) => card.id === openId)
            .map((card) => (
              <div key={card.id} className={"game-card computing-card done"}>
                <div className="mission-badge computing-topic-badge">
                  {TOPIC_ICONS[card.topic] || "💻"} {card.topic}
                </div>
                <div className="game-emoji">{card.emoji}</div>
                <p className="mission-text">{card.term}</p>
                <div className="computing-explanation">
                  <p className="game-result">{card.explanation}</p>
                  <SpeakButton text={card.explanation} langCode={pair.mother} />
                </div>
                <div>
                  <button type="button" className="big-btn" onClick={() => handleOpen(card)}>
                    ✅
                  </button>
                </div>
              </div>
            ))}
        </>
      )}

      {tab === "safety" && (
        <>
          <div className="help-btn-corner">
            <HelpButton text={t("modules.computingHelpSafety")} langCode={pair.mother} />
          </div>

          {showAdvisory && (
            <AgeAdvisory
              langCode={pair.mother}
              onAccept={() => {
                setSafetyConfirmed(true);
                setShowAdvisory(false);
              }}
              onDecline={() => setShowAdvisory(false)}
            />
          )}

          {tier === 1 && !safetyConfirmed ? (
            <div className="game-card">
              <div className="game-emoji">🕵️</div>
              <button type="button" className="big-btn" onClick={() => setShowAdvisory(true)}>
                ▶️ {t("modules.computingSafetyGame")}
              </button>
            </div>
          ) : !finished ? (
            <div className="game-card">
              <div className="game-progress">
                {step + 1} / {rounds.length} · ⭐ {score}
              </div>
              <div className="game-emoji">{round.emoji}</div>
              <p className="page-intro">
                {round.scenario}
                <SpeakButton text={round.scenario} langCode={pair.mother} />
              </p>

              {!answered ? (
                <div className="game-options">
                  <button type="button" className="big-btn game-option" onClick={() => handleAnswer(true)}>
                    {t("modules.computingSafe")}
                  </button>
                  <button type="button" className="big-btn game-option" onClick={() => handleAnswer(false)}>
                    {t("modules.computingAskAdult")}
                  </button>
                </div>
              ) : (
                <div className="game-card">
                  <p className="game-result">
                    {answered.correct ? "⭐" : "🤔"} {round.explanation}
                    <SpeakButton text={round.explanation} langCode={pair.mother} />
                  </p>
                  <button type="button" className="big-btn" onClick={handleNext}>
                    ➡️
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="game-card">
              <div className="game-emoji">🏆</div>
              <p className="game-result">
                {t("modules.computingScore")}: {score} / {rounds.length}
              </p>
              <button type="button" className="big-btn" onClick={handleRestart}>
                {t("modules.computingPlayAgain")} 🔁
              </button>
            </div>
          )}
        </>
      )}

      {tab === "school" && (
        <>
          <p className="page-intro">
            {t("modules.internetSchoolIntro")}
            <SpeakButton text={t("modules.internetSchoolIntro")} langCode={pair.mother} />
          </p>
          <div className="help-btn-corner">
            <HelpButton text={t("modules.internetSchoolHelp")} langCode={pair.mother} />
          </div>

          {showSchoolAdvisory && (
            <AgeAdvisory
              langCode={pair.mother}
              onAccept={() => {
                setSchoolConfirmed(true);
                setShowSchoolAdvisory(false);
              }}
              onDecline={() => setShowSchoolAdvisory(false)}
            />
          )}

          {tier === 1 && !schoolConfirmed ? (
            <div className="game-card">
              <div className="game-emoji">🏫</div>
              <button type="button" className="big-btn" onClick={() => setShowSchoolAdvisory(true)}>
                ▶️ {t("modules.internetSchoolTitle")}
              </button>
            </div>
          ) : schoolRounds.length === 0 ? null : !schoolFinished ? (
            <div className="game-card">
              <div className="game-progress">
                {schoolStep + 1} / {schoolRounds.length} · ⭐ {schoolScore}
              </div>
              <div className="game-emoji">{schoolRound.emoji}</div>
              <p className="page-intro">
                {schoolRound.scenario}
                <SpeakButton text={schoolRound.scenario} langCode={pair.mother} />
              </p>

              {!schoolAnswered ? (
                <>
                  <p className="mission-text">{t("modules.internetSchoolQuestion")}</p>
                  <div className="game-options">
                    {schoolRound.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        className="big-btn game-option"
                        onClick={() => handleSchoolAnswer(opt)}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="game-card">
                  <p className="game-result">
                    {schoolAnswered.correct ? "⭐" : "🤔"} {schoolAnswered.feedback}
                    <SpeakButton text={schoolAnswered.feedback} langCode={pair.mother} />
                  </p>
                  <button type="button" className="big-btn" onClick={handleSchoolNext}>
                    ➡️ {t("modules.internetSchoolNext")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="game-card">
              <div className="game-emoji">🏆</div>
              <p className="game-result">{t("modules.internetSchoolDone")}</p>
              <p className="game-result">
                {t("modules.internetSchoolScore")}: {schoolScore} / {schoolRounds.length}
              </p>
              <button type="button" className="big-btn" onClick={handleRestart}>
                {t("modules.internetSchoolRestart")} 🔁
              </button>
            </div>
          )}
        </>
      )}

      {tab === "ailab" && (
        <>
          <p className="page-intro">
            {aiLabText.intro}
            <SpeakButton text={aiLabText.intro} langCode={pair.mother} />
          </p>
          <div className="help-btn-corner">
            <HelpButton text={t("modules.aiLabHelp")} langCode={pair.mother} />
          </div>

          {(labPhase === "train1" || labPhase === "train2") && (
            <div className="game-card">
              <p className="mission-text">
                {t(labPhase === "train1" ? "modules.aiLabTrainTitle" : "modules.aiLabTrainTitle2")}
              </p>
              <p className="page-intro">
                {labPhase === "train1" ? aiLabText.trainInstructions : aiLabText.badDataIntro}
              </p>
              <div className="game-progress">
                {labTrainIdx + 1} / {labRound.length}
              </div>
              <div className="game-emoji">{labRound[labTrainIdx].emoji}</div>
              {labRound[labTrainIdx].forcedWrong ? (
                <p className="game-result">
                  {aiLabText.mislabeledNote}: {labRound[labTrainIdx].forcedLabel === "circle" ? aiLabText.circleLabel : aiLabText.squareLabel}
                </p>
              ) : (
                <div className="game-options">
                  <button type="button" className="big-btn game-option" onClick={() => handleLabTag("circle")}>
                    ⭕ {aiLabText.circleLabel}
                  </button>
                  <button type="button" className="big-btn game-option" onClick={() => handleLabTag("square")}>
                    🔲 {aiLabText.squareLabel}
                  </button>
                </div>
              )}
              {labRound[labTrainIdx].forcedWrong && (
                <button
                  type="button"
                  className="big-btn"
                  onClick={() => {
                    if (labTrainIdx + 1 < labRound.length) setLabTrainIdx(labTrainIdx + 1);
                    else runLabTest(labTags, labRound);
                  }}
                >
                  ➡️ {t("modules.aiLabContinue")}
                </button>
              )}
            </div>
          )}

          {(labPhase === "test1" || labPhase === "test2") && (
            <div className="game-card">
              <p className="mission-text">{t("modules.aiLabTestTitle")}</p>
              <div className="computing-grid">
                {labTestResults.map((r) => (
                  <div key={r.id} className={"computing-term-btn done"}>
                    <span className="computing-term-emoji">{r.emoji}</span>
                    {r.correct ? "✅" : "❌"}
                  </div>
                ))}
              </div>
              <p className="game-result">
                🤖 {t("modules.aiLabAccuracy")}: {labAccuracyPct}%
              </p>
              <p className="page-intro">
                {labPhase === "test1" ? aiLabText.goodDataExplain : aiLabText.badDataExplain}
                <SpeakButton text={labPhase === "test1" ? aiLabText.goodDataExplain : aiLabText.badDataExplain} langCode={pair.mother} />
              </p>
              {labPhase === "test1" ? (
                <button type="button" className="big-btn" onClick={startRound2}>
                  ➡️ {t("modules.aiLabContinue")}
                </button>
              ) : (
                <>
                  <p className="page-intro">
                    {aiLabText.conclusion}
                    <SpeakButton text={aiLabText.conclusion} langCode={pair.mother} />
                  </p>
                  <button type="button" className="big-btn" onClick={handleLabRestart}>
                    {t("modules.aiLabRestart")} 🔁
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {tab === "match" && (
        <>
          <p className="page-intro">
            {t("modules.computingMatchIntro")}
            <SpeakButton text={t("modules.computingMatchIntro")} langCode={pair.mother} />
          </p>
          <div className="help-btn-corner">
            <HelpButton text={t("modules.computingMatchHelp")} langCode={pair.mother} />
          </div>

          {matchPairs.length === 0 ? null : !matchFinished ? (
            <div className="game-card">
              <div className="game-progress">
                {matchedIds.length} / {matchPairs.length} · ⭐ {matchScore}
              </div>
              <div className="computing-grid">
                {shuffledTerms.map((card) => {
                  const done = matchedIds.includes(card.id);
                  const selected = matchSelectedId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      disabled={done}
                      className={
                        "computing-term-btn" +
                        (done ? " done" : "") +
                        (selected ? " selected" : "")
                      }
                      onClick={() => handleMatchTermTap(card.id)}
                    >
                      <span className="computing-term-emoji">{card.emoji}</span>
                      {card.term}
                    </button>
                  );
                })}
              </div>
              <div className="computing-grid">
                {shuffledDefs.map((card) => {
                  const done = matchedIds.includes(card.id);
                  const wrong = matchSelectedId && (matchWrongDefs[matchSelectedId] || new Set()).has(card.id);
                  return (
                    <button
                      key={"def-" + card.id}
                      type="button"
                      disabled={done || wrong}
                      className={"computing-term-btn" + (done ? " done" : "") + (wrong ? " wrong" : "")}
                      onClick={() => handleMatchDefTap(card)}
                    >
                      {card.match}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="game-card">
              <div className="game-emoji">🏆</div>
              <p className="game-result">
                {t("modules.computingMatchDone")} ⭐ {matchScore}/{matchPairs.length}
              </p>
              <button type="button" className="big-btn" onClick={handleMatchRestart}>
                {t("modules.computingMatchPlayAgain")} 🔁
              </button>
            </div>
          )}
        </>
      )}

      {tab === "password" && (
        <>
          <p className="page-intro">
            {t("modules.computingPasswordIntro")}
            <SpeakButton text={t("modules.computingPasswordIntro")} langCode={pair.mother} />
          </p>
          <div className="help-btn-corner">
            <HelpButton text={t("modules.computingPasswordHelp")} langCode={pair.mother} />
          </div>

          {pwOrder.length === 0 ? null : !pwFinished ? (
            <div className="game-card">
              <div className="game-progress">
                {pwStep + 1} / {pwOrder.length} · ⭐ {pwScore}
              </div>
              <p className="mission-text">
                🔑 <code>{pwOrder[pwStep].password}</code>
              </p>
              <p className="page-intro">{t("modules.computingPasswordQuestion")}</p>

              {!pwAnswered ? (
                <div className="game-options">
                  <button type="button" className="big-btn game-option" onClick={() => handlePwAnswer(false)}>
                    {t("modules.computingPasswordWeak")}
                  </button>
                  <button type="button" className="big-btn game-option" onClick={() => handlePwAnswer(true)}>
                    {t("modules.computingPasswordStrong")}
                  </button>
                </div>
              ) : (
                <div className="game-card">
                  <p className="game-result">
                    {pwAnswered.correct ? "⭐" : "🤔"} {pwOrder[pwStep].reason}
                    <SpeakButton text={pwOrder[pwStep].reason} langCode={pair.mother} />
                  </p>
                  <button type="button" className="big-btn" onClick={handlePwNext}>
                    ➡️
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="game-card">
              <div className="game-emoji">🏆</div>
              <p className="game-result">
                {t("modules.computingPasswordDone")} ⭐ {pwScore}/{pwOrder.length}
              </p>
              <button type="button" className="big-btn" onClick={handlePwRestart}>
                {t("modules.computingPasswordPlayAgain")} 🔁
              </button>
            </div>
          )}
        </>
      )}

      {tab === "journey" && (
        <>
          <p className="page-intro">
            {t("modules.computingJourneyIntro")}
            <SpeakButton text={t("modules.computingJourneyIntro")} langCode={pair.mother} />
          </p>
          <div className="help-btn-corner">
            <HelpButton text={t("modules.computingJourneyHelp")} langCode={pair.mother} />
          </div>

          <h3 className="songs-heading">
            {journeyExplored.length}/{journeySteps.length}
          </h3>

          <div className="computing-grid">
            {journeySteps.map((step, idx) => {
              const wasExplored = journeyExplored.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  className={"computing-term-btn" + (wasExplored ? " done" : "")}
                  onClick={() => handleJourneyOpen(step)}
                >
                  <span className="computing-term-emoji">{step.icon}</span>
                  {idx + 1}. {step.label}
                </button>
              );
            })}
          </div>

          {journeySteps
            .filter((step) => step.id === journeyOpenId)
            .map((step) => (
              <div key={step.id} className="game-card computing-card done">
                <div className="game-emoji">{step.icon}</div>
                <p className="mission-text">
                  {step.prompt}
                  <SpeakButton text={step.prompt} langCode={pair.mother} />
                </p>
                {!journeyRevealed.includes(step.id) ? (
                  <button type="button" className="big-btn" onClick={() => handleJourneyReveal(step)}>
                    🔎 {t("modules.computingJourneyReveal")}
                  </button>
                ) : (
                  <div className="computing-explanation">
                    <p className="game-result">{step.explanation}</p>
                    <SpeakButton text={step.explanation} langCode={pair.mother} />
                  </div>
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
