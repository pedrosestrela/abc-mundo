import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getDetectiveCards } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";
import { useNavigate } from "react-router-dom";

// Tier -> rounds: this module only makes sense from tier 2 (age 7+) up.
const TIER_CONFIG = {
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

function buildRounds(cards, tier) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG[2];
  const count = Math.min(config.rounds, cards.length);
  return shuffle(cards).slice(0, count);
}

// ----- Fact or Opinion (original mode) -----
function FactOpinionGame({ cards, tier, pair, profile, t }) {
  const [rounds] = useState(() => buildRounds(cards, tier));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);

  const round = rounds[step];
  const finished = step >= rounds.length;

  function handleAnswer(choseFact) {
    if (answered) return;
    const correct = choseFact === round.isFact;
    setAnswered({ correct, choseFact });
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "detective-fact-opinion", correct);
    pingProgress({
      profileName: profile?.name,
      module: "detective",
      event: correct ? "quiz_correct" : "quiz_wrong",
    });
  }

  function handleNext() {
    setAnswered(null);
    setStep((s) => s + 1);
  }

  function handleRestart() {
    setStep(0);
    setScore(0);
    setAnswered(null);
  }

  if (!round && !finished) return null;

  return !finished ? (
    <div className="game-card">
      <div className="game-progress">
        {step + 1} / {rounds.length} · ⭐ {score}
      </div>
      <div className="game-emoji">{round.emoji}</div>
      <p className="page-intro">
        {round.statement}
        <SpeakButton text={round.statement} langCode={pair.mother} />
      </p>

      {!answered ? (
        <div className="game-options">
          <button type="button" className="big-btn game-option" onClick={() => handleAnswer(true)}>
            ✅ {t("modules.detectiveFact")}
          </button>
          <button type="button" className="big-btn game-option" onClick={() => handleAnswer(false)}>
            💭 {t("modules.detectiveOpinion")}
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
        {t("modules.detectiveScore")}: {score} / {rounds.length}
      </p>
      <button type="button" className="big-btn" onClick={handleRestart}>
        {t("modules.detectivePlayAgain")} 🔁
      </button>
    </div>
  );
}

// ----- Observation case ("Caso das Pegadas" style) -----
function ObservationCase({ card, pair, profile, onSolved }) {
  const [pickedId, setPickedId] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const solved = pickedId === card.correctClueId;

  function pick(clueId) {
    if (solved) return;
    if (clueId === card.correctClueId) {
      setPickedId(clueId);
      recordSkillEvent(profile?.name, "detective-observation", wrongIds.length === 0);
      pingProgress({ profileName: profile?.name, module: "detective", event: "observation_solved:" + card.id });
      onSolved();
    } else {
      setWrongIds((prev) => (prev.includes(clueId) ? prev : [...prev, clueId]));
      pingProgress({ profileName: profile?.name, module: "detective", event: "observation_attempt:" + card.id });
    }
  }

  return (
    <div className="game-card">
      <div className="game-emoji">{card.emoji}</div>
      <p className="mission-badge science-topic-badge">{card.title}</p>
      <p className="page-intro">
        {card.scene}
        <SpeakButton text={card.scene} langCode={pair.mother} />
      </p>
      <p className="mission-text">
        {card.question}
        <SpeakButton text={card.question} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {card.clues.map((clue) => (
          <button
            key={clue.id}
            type="button"
            disabled={solved || wrongIds.includes(clue.id)}
            className={
              "big-btn game-option" +
              (pickedId === clue.id ? " correct" : "") +
              (wrongIds.includes(clue.id) ? " wrong" : "")
            }
            onClick={() => pick(clue.id)}
          >
            {clue.emoji} {clue.text}
          </button>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">🔎 {card.explanation}</p>
          <SpeakButton text={card.explanation} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

// ----- Deduction case ("Quem Comeu o Bolo?" style) -----
function DeductionCase({ card, pair, profile, onSolved }) {
  const [pickedId, setPickedId] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const solved = pickedId === card.solutionId;

  function pick(suspectId) {
    if (solved) return;
    if (suspectId === card.solutionId) {
      setPickedId(suspectId);
      recordSkillEvent(profile?.name, "detective-deduction", wrongIds.length === 0);
      pingProgress({ profileName: profile?.name, module: "detective", event: "deduction_solved:" + card.id });
      onSolved();
    } else {
      setWrongIds((prev) => (prev.includes(suspectId) ? prev : [...prev, suspectId]));
      pingProgress({ profileName: profile?.name, module: "detective", event: "deduction_attempt:" + card.id });
    }
  }

  return (
    <div className="game-card">
      <div className="game-emoji">{card.emoji}</div>
      <p className="mission-badge science-topic-badge">{card.title}</p>
      <p className="page-intro">
        {card.setup}
        <SpeakButton text={card.setup} langCode={pair.mother} />
      </p>
      <ul className="detective-statement-list">
        {card.statements.map((s, i) => (
          <li key={i} className="detective-statement">
            🔎 {s}
          </li>
        ))}
      </ul>
      <p className="mission-text">
        {card.question}
        <SpeakButton text={card.question} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {card.suspects.map((suspect) => (
          <button
            key={suspect.id}
            type="button"
            disabled={solved || wrongIds.includes(suspect.id)}
            className={
              "big-btn game-option" +
              (pickedId === suspect.id ? " correct" : "") +
              (wrongIds.includes(suspect.id) ? " wrong" : "")
            }
            onClick={() => pick(suspect.id)}
          >
            {suspect.emoji} {suspect.name}
          </button>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">🔎 {card.explanation}</p>
          <SpeakButton text={card.explanation} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

// ----- Sources case ("Será Verdade?" style) -----
function SourcesCase({ card, pair, profile, onSolved }) {
  const [pickedId, setPickedId] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const solved = pickedId === card.correctSourceId;
  const options = [
    { id: "a", ...card.sourceA },
    { id: "b", ...card.sourceB },
  ];

  function pick(sourceId) {
    if (solved) return;
    if (sourceId === card.correctSourceId) {
      setPickedId(sourceId);
      recordSkillEvent(profile?.name, "detective-sources", wrongIds.length === 0);
      pingProgress({ profileName: profile?.name, module: "detective", event: "sources_solved:" + card.id });
      onSolved();
    } else {
      setWrongIds((prev) => (prev.includes(sourceId) ? prev : [...prev, sourceId]));
      pingProgress({ profileName: profile?.name, module: "detective", event: "sources_attempt:" + card.id });
    }
  }

  return (
    <div className="game-card">
      <div className="game-emoji">{card.emoji}</div>
      <p className="mission-badge science-topic-badge">{card.title}</p>
      <p className="page-intro">
        {card.claim}
        <SpeakButton text={card.claim} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={solved || wrongIds.includes(opt.id)}
            className={
              "big-btn game-option" +
              (pickedId === opt.id ? " correct" : "") +
              (wrongIds.includes(opt.id) ? " wrong" : "")
            }
            onClick={() => pick(opt.id)}
          >
            <strong>{opt.label}</strong>
            <br />
            {opt.text}
          </button>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">🔎 {card.explanation}</p>
          <SpeakButton text={card.explanation} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

// ----- AI error case ("A IA Enganou-se" style) -----
function AiErrorCase({ card, pair, profile, t, onSolved }) {
  const [judged, setJudged] = useState(false);
  const [wasWrongGuess, setWasWrongGuess] = useState(false);

  function judge(choseOk) {
    if (judged) return;
    if (choseOk) {
      // Wrong first guess (AI answer is always wrong in this mode); allow one retry.
      setWasWrongGuess(true);
      pingProgress({ profileName: profile?.name, module: "detective", event: "aierror_attempt:" + card.id });
    } else {
      setJudged(true);
      recordSkillEvent(profile?.name, "detective-ai-error", !wasWrongGuess);
      pingProgress({ profileName: profile?.name, module: "detective", event: "aierror_solved:" + card.id });
      onSolved();
    }
  }

  return (
    <div className="game-card">
      <div className="game-emoji">{card.emoji}</div>
      <p className="mission-badge science-topic-badge">{card.title}</p>
      <p className="mission-text">
        ❓ {card.aiQuestion}
        <SpeakButton text={card.aiQuestion} langCode={pair.mother} />
      </p>
      <p className="page-intro">
        🤖 {card.aiAnswer}
        <SpeakButton text={card.aiAnswer} langCode={pair.mother} />
      </p>

      {!judged ? (
        <div className="game-options">
          <button
            type="button"
            disabled={wasWrongGuess}
            className={"big-btn game-option" + (wasWrongGuess ? " wrong" : "")}
            onClick={() => judge(true)}
          >
            👍 {t("modules.detectiveAiOk")}
          </button>
          <button type="button" className="big-btn game-option" onClick={() => judge(false)}>
            🕵️ {t("modules.detectiveAiWrong")}
          </button>
        </div>
      ) : (
        <div className="science-explanation">
          <p className="game-result">✅ {card.correctAnswer}</p>
          <p className="game-result">💡 {card.explanation}</p>
          <SpeakButton text={`${card.correctAnswer} ${card.explanation}`} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

function GenericModeSection({ mode, cards, pair, profile, t }) {
  const [solvedIds, setSolvedIds] = useState([]);
  const [index, setIndex] = useState(0);
  const card = cards[index];

  function handleSolved() {
    setSolvedIds((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
  }

  if (!cards.length) return null;

  const Comp =
    mode === "observation"
      ? ObservationCase
      : mode === "deduction"
      ? DeductionCase
      : mode === "sources"
      ? SourcesCase
      : AiErrorCase;

  return (
    <div>
      <div className="game-progress">
        {index + 1} / {cards.length} · ⭐ {solvedIds.length}
      </div>
      <Comp key={card.id} card={card} pair={pair} profile={profile} t={t} onSolved={handleSolved} />
      {solvedIds.includes(card.id) && index < cards.length - 1 && (
        <button type="button" className="big-btn" onClick={() => setIndex((i) => i + 1)}>
          ➡️
        </button>
      )}
      {solvedIds.includes(card.id) && index === cards.length - 1 && (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {t("modules.detectiveScore")}: {solvedIds.length} / {cards.length}
          </p>
          <button
            type="button"
            className="big-btn"
            onClick={() => {
              setIndex(0);
              setSolvedIds([]);
            }}
          >
            {t("modules.detectivePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}

const MODE_TABS = [
  { id: "factOpinion", icon: "✅", labelKey: "detectiveModeFactOpinion", helpKey: "detectiveHelp" },
  { id: "observation", icon: "👣", labelKey: "detectiveModeObservation", helpKey: "detectiveObservationHelp" },
  { id: "deduction", icon: "🎂", labelKey: "detectiveModeDeduction", helpKey: "detectiveDeductionHelp" },
  { id: "sources", icon: "📚", labelKey: "detectiveModeSources", helpKey: "detectiveSourcesHelp" },
  { id: "aiError", icon: "🤖", labelKey: "detectiveModeAiError", helpKey: "detectiveAiErrorHelp" },
];

export default function Detective() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const allCards = getDetectiveCards(pair.mother);

  const factOpinionCards = allCards.filter((c) => !c.type || c.type === "factOpinion");
  const observationCards = allCards.filter((c) => c.type === "observation");
  const deductionCards = allCards.filter((c) => c.type === "deduction");
  const sourcesCards = allCards.filter((c) => c.type === "sources");
  const aiErrorCards = allCards.filter((c) => c.type === "aiError");

  const [tab, setTab] = useState("factOpinion");
  const [confirmed, setConfirmed] = useState(tier > 1);

  if (tier === 1 && !confirmed) {
    return (
      <div className="page">
        <h1>{t("modules.detectiveTitle")} 🕵️</h1>
        <AgeAdvisory langCode={pair.mother} onAccept={() => setConfirmed(true)} onDecline={() => navigate("/mundos")} />
      </div>
    );
  }

  const activeTab = MODE_TABS.find((m) => m.id === tab) || MODE_TABS[0];

  return (
    <div className="page">
      <h1>{t("modules.detectiveTitle")} 🕵️</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules." + activeTab.helpKey)} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.detectiveIntro")}</p>

      <div className="phonics-tabs">
        {MODE_TABS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={"phonics-tab" + (tab === m.id ? " selected" : "")}
            onClick={() => setTab(m.id)}
          >
            <span className="phonics-tab-inner">
              {m.icon} {t("modules." + m.labelKey)}
              <TabSpeakIcon text={`${t("modules." + m.labelKey)}. ${t("modules." + m.helpKey)}`} langCode={pair.mother} />
            </span>
          </button>
        ))}
      </div>

      {tab === "factOpinion" && (
        <FactOpinionGame cards={factOpinionCards} tier={tier} pair={pair} profile={profile} t={t} />
      )}
      {tab === "observation" && (
        <GenericModeSection mode="observation" cards={observationCards} pair={pair} profile={profile} t={t} />
      )}
      {tab === "deduction" && (
        <GenericModeSection mode="deduction" cards={deductionCards} pair={pair} profile={profile} t={t} />
      )}
      {tab === "sources" && (
        <GenericModeSection mode="sources" cards={sourcesCards} pair={pair} profile={profile} t={t} />
      )}
      {tab === "aiError" && (
        <GenericModeSection mode="aiError" cards={aiErrorCards} pair={pair} profile={profile} t={t} />
      )}
    </div>
  );
}
