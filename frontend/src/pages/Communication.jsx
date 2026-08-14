import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getNewsroom, getCommunication } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getDifficultyTier,
  recordSkillEvent,
  pingProgress,
  getCompletedNewsroom,
  completeNewsroomScenario,
  getCompletedAcademy,
  completeAcademyChallenge,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";

// Both exercises lean on reading comprehension (piecing together a short
// scenario, reasoning about vague vs precise instructions), so — like
// Detective/Thinking — this module only really makes sense from tier 2
// (age 7+) up. Tier 3 gets the full scenario/challenge pool, tier 2 a
// shorter one.
const NEWSROOM_TIER_CONFIG = { 2: { count: 4 }, 3: { count: 7 } };
const ACADEMY_TIER_CONFIG = { 2: { count: 2 }, 3: { count: 4 } };

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Communication() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const [confirmed, setConfirmed] = useState(tier > 1);
  const [tab, setTab] = useState("newsroom");

  if (tier === 1 && !confirmed) {
    return (
      <div className="page">
        <h1>{t("modules.communicationTitle")} 🗣️</h1>
        <AgeAdvisory
          langCode={pair.mother}
          onAccept={() => setConfirmed(true)}
          onDecline={() => navigate("/mundos")}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{t("modules.communicationTitle")} 🗣️</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.communicationHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.communicationIntro")}</p>

      <div className="phonics-tabs">
        <button
          type="button"
          className={"phonics-tab" + (tab === "newsroom" ? " selected" : "")}
          onClick={() => setTab("newsroom")}
        >
          <span className="phonics-tab-inner">
            📰 {t("modules.newsroomTitle")}
            <TabSpeakIcon text={t("modules.newsroomTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (tab === "academy" ? " selected" : "")}
          onClick={() => setTab("academy")}
        >
          <span className="phonics-tab-inner">
            🤖 {t("modules.academyTitle")}
            <TabSpeakIcon text={t("modules.academyTitle")} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {tab === "newsroom" ? (
        <Newsroom pair={pair} profile={profile} tier={tier} />
      ) : (
        <Academy pair={pair} profile={profile} tier={tier} />
      )}
    </div>
  );
}

// --- Redação ABC ("Newsroom") ---
// The child pieces together a short news scenario by answering who/what/
// where/when questions, then decides whether a final statement about the
// scenario is a fact (stated/observed) or an assumption (just a guess).

function buildNewsroomRounds(scenarios, tier) {
  const config = NEWSROOM_TIER_CONFIG[tier] || NEWSROOM_TIER_CONFIG[2];
  const chosen = shuffle(scenarios).slice(0, Math.min(config.count, scenarios.length));
  const rounds = [];
  chosen.forEach((scenario) => {
    scenario.questions.forEach((q) => rounds.push({ kind: "mcq", scenario, ...q }));
    rounds.push({ kind: "factcheck", scenario, ...scenario.factCheck });
  });
  return rounds;
}

function Newsroom({ pair, profile, tier }) {
  const { t } = useTranslation();
  const scenarios = getNewsroom(pair.mother);
  const [version, setVersion] = useState(0);
  const [rounds] = useState(() => buildNewsroomRounds(scenarios, tier));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const completed = useMemo(() => getCompletedNewsroom(profile?.name), [profile?.name, version]);

  const round = rounds[step];
  const finished = step >= rounds.length;

  function markScenarioIfDone(scenario) {
    // The scenario counts as "done" once its final fact-check round has
    // been answered — that's always the last round emitted for it.
    completeNewsroomScenario(profile?.name, scenario.id);
    setVersion((v) => v + 1);
  }

  function handleMcqAnswer(index) {
    if (answered) return;
    const correct = index === round.correctIndex;
    setAnswered({ correct });
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "newsroom-5w", correct);
    pingProgress({
      profileName: profile?.name,
      module: "newsroom",
      event: `${round.type}:${correct ? "correct" : "wrong"}:${round.scenario.id}`,
    });
  }

  function handleFactAnswer(choseFact) {
    if (answered) return;
    const correct = choseFact === round.isFact;
    setAnswered({ correct });
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "newsroom-fact-assumption", correct);
    pingProgress({
      profileName: profile?.name,
      module: "newsroom",
      event: `factcheck:${correct ? "correct" : "wrong"}:${round.scenario.id}`,
    });
    markScenarioIfDone(round.scenario);
  }

  function handleNext() {
    setAnswered(null);
    setStep((s) => s + 1);
  }

  function handleRestart() {
    window.location.reload();
  }

  if (!round && !finished) return null;

  return (
    <div>
      <p className="page-intro">{t("modules.newsroomIntro")}</p>
      <div className="whys-progress">
        {t("modules.newsroomCompleted")}: {completed.length}
      </div>

      {!finished ? (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          <div className="game-emoji">{round.scenario.emoji}</div>
          <p className="page-intro">
            {round.scenario.facts}
            <SpeakButton text={round.scenario.facts} langCode={pair.mother} />
          </p>

          {round.kind === "mcq" && (
            <>
              <p className="mission-text">
                {round.question}
                <SpeakButton text={round.question} langCode={pair.mother} />
              </p>
              {!answered ? (
                <div className="game-options">
                  {round.options.map((opt, i) => (
                    <button
                      key={opt}
                      type="button"
                      className="big-btn game-option"
                      onClick={() => handleMcqAnswer(i)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="game-result">
                  {answered.correct ? "⭐" : "🤔"} {round.options[round.correctIndex]}
                </p>
              )}
            </>
          )}

          {round.kind === "factcheck" && (
            <>
              <p className="mission-text">
                {round.statement}
                <SpeakButton text={round.statement} langCode={pair.mother} />
              </p>
              {!answered ? (
                <div className="game-options">
                  <button type="button" className="big-btn game-option" onClick={() => handleFactAnswer(true)}>
                    ✅ {t("modules.newsroomFact")}
                  </button>
                  <button type="button" className="big-btn game-option" onClick={() => handleFactAnswer(false)}>
                    💭 {t("modules.newsroomAssumption")}
                  </button>
                </div>
              ) : (
                <p className="game-result">
                  {answered.correct ? "⭐" : "🤔"} {round.explanation}
                  <SpeakButton text={round.explanation} langCode={pair.mother} />
                </p>
              )}
            </>
          )}

          {answered && (
            <button type="button" className="big-btn" onClick={handleNext}>
              ➡️
            </button>
          )}
        </div>
      ) : (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.newsroomScore")}: {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={handleRestart}>
            {t("modules.newsroomPlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}

// --- Academia da Comunicação ("Academy") ---
// The child picks and orders instruction "cards" from a shuffled pool
// (precise steps, vague versions of those same steps, and irrelevant
// distractor steps) to give a robot a clear, ordered set of instructions
// for an everyday task. Picking a vague step makes the robot ask a
// clarifying question instead of succeeding.

function buildAcademyChallenges(challenges, tier) {
  const config = ACADEMY_TIER_CONFIG[tier] || ACADEMY_TIER_CONFIG[2];
  return shuffle(challenges).slice(0, Math.min(config.count, challenges.length));
}

function buildPool(challenge) {
  const options = [];
  challenge.steps.forEach((step, i) => {
    options.push({ key: `${step.id}-precise`, text: step.precise, type: "precise", stepIndex: i });
    options.push({ key: `${step.id}-vague`, text: step.vague, type: "vague", stepIndex: i, vagueQuestion: step.vagueQuestion });
  });
  challenge.distractors.forEach((text, i) => {
    options.push({ key: `distractor-${i}`, text, type: "distractor", stepIndex: -1 });
  });
  return shuffle(options);
}

function Academy({ pair, profile, tier }) {
  const { t } = useTranslation();
  const challenges = getCommunication(pair.mother);
  const [version, setVersion] = useState(0);
  const [rounds] = useState(() => buildAcademyChallenges(challenges, tier));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const completed = useMemo(() => getCompletedAcademy(profile?.name), [profile?.name, version]);

  const challenge = rounds[step];
  const finished = step >= rounds.length;

  function handleSolved() {
    completeAcademyChallenge(profile?.name, challenge.id);
    recordSkillEvent(profile?.name, "academy-instructions", true);
    pingProgress({ profileName: profile?.name, module: "communication", event: `academy_solved:${challenge.id}` });
    setScore((s) => s + 1);
    setVersion((v) => v + 1);
  }

  function handleNext() {
    setStep((s) => s + 1);
  }

  function handleRestart() {
    window.location.reload();
  }

  if (!challenge && !finished) return null;

  return (
    <div>
      <p className="page-intro">{t("modules.academyIntro")}</p>
      <div className="whys-progress">
        {t("modules.academyCompleted")}: {completed.length}
      </div>

      {!finished ? (
        <ChallengeRunner
          key={challenge.id}
          challenge={challenge}
          pair={pair}
          progress={`${step + 1} / ${rounds.length} · ⭐ ${score}`}
          onSolved={handleSolved}
          onNext={handleNext}
        />
      ) : (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.academyScore")}: {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={handleRestart}>
            {t("modules.academyPlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}

function ChallengeRunner({ challenge, pair, progress, onSolved, onNext }) {
  const { t } = useTranslation();
  const [pool, setPool] = useState(() => buildPool(challenge));
  const [chosen, setChosen] = useState([]);
  const [feedback, setFeedback] = useState(null); // { kind: "clarify"|"wrong"|"success", text? }

  const neededCount = challenge.steps.length;

  function pick(option) {
    if (feedback) return;
    const nextChosen = [...chosen, option];
    setChosen(nextChosen);
    setPool((p) => p.filter((o) => o.key !== option.key));

    if (nextChosen.length < neededCount) return;

    // Full sequence picked - evaluate it.
    const perfect = nextChosen.every((o, i) => o.type === "precise" && o.stepIndex === i);
    if (perfect) {
      setFeedback({ kind: "success" });
      onSolved();
      return;
    }
    const firstBad = nextChosen.findIndex((o, i) => !(o.type === "precise" && o.stepIndex === i));
    const bad = nextChosen[firstBad];
    if (bad.type === "vague" && bad.stepIndex === firstBad) {
      setFeedback({ kind: "clarify", text: bad.vagueQuestion });
    } else {
      setFeedback({ kind: "wrong" });
    }
  }

  function resetAttempt() {
    setPool(buildPool(challenge));
    setChosen([]);
    setFeedback(null);
  }

  function undoLast() {
    if (chosen.length === 0) return;
    const last = chosen[chosen.length - 1];
    setChosen((c) => c.slice(0, -1));
    setPool((p) => shuffle([...p, last]));
  }

  return (
    <div className="game-card">
      <div className="game-progress">{progress}</div>
      <div className="game-emoji">{challenge.emoji}</div>
      <p className="page-intro">
        {challenge.task}
        <SpeakButton text={challenge.task} langCode={pair.mother} />
      </p>

      <p className="mission-text">
        {t("modules.academyYourSteps")} ({chosen.length}/{neededCount})
      </p>
      <ol className="mundos-tile-sub">
        {chosen.map((c) => (
          <li key={c.key}>{c.text}</li>
        ))}
      </ol>

      {feedback?.kind === "success" && (
        <div className="game-result">
          🤖✅ {challenge.successMessage}
          <SpeakButton text={challenge.successMessage} langCode={pair.mother} />
        </div>
      )}

      {feedback?.kind === "clarify" && (
        <div className="game-result">
          🤖❓ {t("modules.academyRobotAsks")}: {feedback.text}
          <SpeakButton text={feedback.text} langCode={pair.mother} />
        </div>
      )}

      {feedback?.kind === "wrong" && (
        <div className="game-result">🤖😕 {t("modules.academyRobotConfused")}</div>
      )}

      {!feedback && (
        <>
          <p className="mission-text">{t("modules.academyPickHint")}</p>
          <div className="game-options">
            {pool.map((option) => (
              <button key={option.key} type="button" className="big-btn game-option" onClick={() => pick(option)}>
                {option.text}
              </button>
            ))}
          </div>
          {chosen.length > 0 && (
            <button type="button" className="big-btn" onClick={undoLast}>
              ↩️ {t("modules.academyUndo")}
            </button>
          )}
        </>
      )}

      {feedback && feedback.kind !== "success" && (
        <button type="button" className="big-btn" onClick={resetAttempt}>
          🔁 {t("modules.academyTryAgain")}
        </button>
      )}

      {feedback?.kind === "success" && (
        <button type="button" className="big-btn" onClick={onNext}>
          ➡️
        </button>
      )}
    </div>
  );
}
