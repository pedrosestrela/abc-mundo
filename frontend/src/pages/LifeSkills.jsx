import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLifeSkills } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getTriedLifeSkills,
  tryLifeSkill,
  pingProgress,
  recordSkillEvent,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";
import { IllustrationHouse, IllustrationHeart } from "../components/illustrations/index.js";

const CATEGORY_ICONS = {
  cozinha: "🍳",
  agua: "💧",
  eletricidade: "🔌",
  casa: "🏠",
  seguranca: "🛟",
  convivio: "🤝",
};

// Every language file uses its own supervision word pair (see
// missions.<lang>.json for the same convention); the "adult" value never
// overlaps with the "alone" value across languages, so membership in this
// set is enough to detect adult-required cards regardless of language.
const ADULT_SUPERVISION_VALUES = new Set(["adulto", "adult", "erwachsener", "adulte", "大人"]);

// Fisher-Yates shuffle, returns a new array (never mutates the input).
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// "O que fazer primeiro?" — a tap-to-order mini-game shown inside a card's
// reveal panel, only when the card carries a genuine `steps` sequence.
function SequenceGame({ steps, pair, t }) {
  const scrambled = useMemo(() => {
    // Re-shuffle whenever the step list identity changes (i.e. a new card).
    let attempt = shuffle(steps.map((label, index) => ({ label, index })));
    // Avoid accidentally landing on the already-correct order for short lists.
    if (steps.length > 1 && attempt.every((s, i) => s.index === i)) {
      attempt = shuffle(attempt);
    }
    return attempt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  const [placed, setPlaced] = useState([]);
  const [shake, setShake] = useState(null);
  const done = placed.length === steps.length;
  const remaining = scrambled.filter((s) => !placed.includes(s.index));

  function tapStep(step) {
    if (done) return;
    const expectedIndex = placed.length;
    if (step.index === expectedIndex) {
      setPlaced((prev) => [...prev, step.index]);
    } else {
      setShake(step.index);
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <div className="game-card sequence-game">
      <p className="mission-badge science-topic-badge">
        🔢 {t("modules.lifeSkillsSequenceTitle")}
      </p>
      <p className="mission-text">{t("modules.lifeSkillsSequenceHint")}</p>

      <ol className="sequence-slots" style={{ textAlign: "left", paddingLeft: "1.2rem" }}>
        {steps.map((label, i) => (
          <li key={i} style={{ minHeight: "1.6em" }}>
            {i < placed.length ? steps[placed[i]] : "⬜️ …"}
          </li>
        ))}
      </ol>

      {!done && (
        <div className="game-options">
          {remaining.map((step) => (
            <button
              key={step.index}
              type="button"
              className={"big-btn game-option" + (shake === step.index ? " wrong-shake" : "")}
              onClick={() => tapStep(step)}
            >
              {step.label}
            </button>
          ))}
        </div>
      )}

      {done && (
        <p className="game-result">✅ {t("modules.lifeSkillsSequenceDone")}</p>
      )}
    </div>
  );
}

// "Sozinho ou com adulto?" — active-recall sorting quiz drawn straight from
// the cards' own `supervision` field, with the same anti-guessing pattern
// used by World.jsx's quizzes: a wrong tap disables that option and full
// skill credit is only granted within the first couple of attempts.
function SupervisionQuiz({ cards, pair, profile, t }) {
  const [rounds, setRounds] = useState(() => shuffle(cards));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wrongKeys, setWrongKeys] = useState(() => new Set());
  const [wrongCount, setWrongCount] = useState(0);

  const finished = step >= rounds.length;
  const card = rounds[step];

  function restart() {
    setRounds(shuffle(cards));
    setStep(0);
    setScore(0);
    setFeedback(null);
    setWrongKeys(new Set());
    setWrongCount(0);
  }

  function answer(choseAdult) {
    if (feedback || !card) return;
    const key = choseAdult ? "adult" : "alone";
    if (wrongKeys.has(key)) return;
    const isAdultCard = ADULT_SUPERVISION_VALUES.has(card.supervision);
    const correct = choseAdult === isAdultCard;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setScore((s) => s + 1);
      recordSkillEvent(profile?.name, "lifeskills-quiz", wrongCount < 2);
      pingProgress({ profileName: profile?.name, module: "lifeskills", event: `quiz_correct:${card.id}` });
      setTimeout(() => {
        setFeedback(null);
        setWrongKeys(new Set());
        setWrongCount(0);
        setStep((s) => s + 1);
      }, 900);
    } else {
      setWrongKeys((prev) => new Set(prev).add(key));
      setWrongCount((c) => c + 1);
      pingProgress({ profileName: profile?.name, module: "lifeskills", event: `quiz_wrong:${card.id}` });
      setTimeout(() => setFeedback(null), 500);
    }
  }

  if (rounds.length === 0) return null;

  return (
    <div className="game-card lifeskills-quiz">
      <p className="page-intro">{t("modules.lifeSkillsQuizIntro")}</p>

      {!finished && card && (
        <>
          <p className="mission-badge science-topic-badge">
            {CATEGORY_ICONS[card.category] || "✨"} {card.category}
          </p>
          <div className="mission-emoji">{card.emoji}</div>
          <p className="mission-text">
            {card.title}
            <SpeakButton text={card.title} langCode={pair.mother} />
          </p>
          <div className="game-options">
            <button
              type="button"
              className={"big-btn game-option" + (wrongKeys.has("alone") ? " disabled" : "")}
              disabled={wrongKeys.has("alone")}
              onClick={() => answer(false)}
            >
              {t("modules.lifeSkillsQuizAloneOption")}
            </button>
            <button
              type="button"
              className={"big-btn game-option" + (wrongKeys.has("adult") ? " disabled" : "")}
              disabled={wrongKeys.has("adult")}
              onClick={() => answer(true)}
            >
              {t("modules.lifeSkillsQuizAdultOption")}
            </button>
          </div>

          {feedback && (
            <p className="game-result">
              {feedback === "correct" ? t("modules.sciencePredictionCorrect") : t("modules.sciencePredictionWrong")}
            </p>
          )}

          <p className="mission-text">{t("modules.lifeSkillsQuizScore", { score, total: rounds.length })}</p>
        </>
      )}

      {finished && (
        <>
          <p className="game-result">{t("modules.lifeSkillsQuizFinished", { score, total: rounds.length })}</p>
          <button type="button" className="big-btn" onClick={restart}>
            🔁 {t("modules.scienceTryDifferent")}
          </button>
        </>
      )}
    </div>
  );
}

// "Já sei fazer" — a visible summary of tryLifeSkill/getTriedLifeSkills
// progress, grouped by category with a per-category progress indicator.
function ChecklistView({ cards, categories, tried, t }) {
  const triedSet = useMemo(() => new Set(tried), [tried]);

  return (
    <div>
      <p className="page-intro">{t("modules.lifeSkillsChecklistIntro")}</p>
      {categories.map((cat) => {
        const inCat = cards.filter((c) => c.category === cat);
        const done = inCat.filter((c) => triedSet.has(c.id)).length;
        const pct = inCat.length ? Math.round((done / inCat.length) * 100) : 0;
        return (
          <div key={cat} className="game-card checklist-category">
            <p className="mission-badge science-topic-badge">
              {CATEGORY_ICONS[cat] || "✨"} {cat} — {t("modules.lifeSkillsChecklistCategoryProgress", { done, total: inCat.length })}
            </p>
            <div style={{ background: "#eee", borderRadius: 8, height: 14, width: "100%", margin: "4px 0 10px" }}>
              <div
                style={{
                  background: "var(--pink, #ff6f91)",
                  height: "100%",
                  borderRadius: 8,
                  width: `${pct}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <ul style={{ textAlign: "left", paddingLeft: "1.2rem", margin: 0 }}>
              {inCat.map((c) => (
                <li key={c.id}>
                  {triedSet.has(c.id) ? "✅" : "⬜️"} {c.emoji} {c.title}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function LifeSkills() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const cards = getLifeSkills(pair.mother);
  const [openId, setOpenId] = useState(null);
  const [category, setCategory] = useState("all");
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState("cards");

  const tried = useMemo(() => getTriedLifeSkills(profile?.name), [profile?.name, version]);

  const categories = useMemo(() => {
    const set = new Set(cards.map((c) => c.category));
    return Array.from(set);
  }, [cards]);

  const visibleCards = category === "all" ? cards : cards.filter((c) => c.category === category);

  function handleOpen(card) {
    const wasOpen = openId === card.id;
    setOpenId(wasOpen ? null : card.id);
    if (!wasOpen) {
      tryLifeSkill(profile?.name, card.id);
      pingProgress({ profileName: profile?.name, module: "lifeskills", event: `skill_explored:${card.id}` });
      setVersion((v) => v + 1);
    }
  }

  return (
    <div className="page">
      <h1>{t("modules.lifeSkillsTitle")} 🌱</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.lifeSkillsHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.lifeSkillsIntro")}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <IllustrationHouse size={36} />
        <IllustrationHeart size={36} />
      </div>

      <h2 className="songs-heading">
        {t("modules.lifeSkillsTried")} ({tried.length}/{cards.length})
      </h2>

      <div className="phonics-tabs">
        <button
          type="button"
          className={"phonics-tab" + (tab === "cards" ? " selected" : "")}
          onClick={() => setTab("cards")}
        >
          <span className="phonics-tab-inner">
            🌟 {t("modules.lifeSkillsCardsTab")}
            <TabSpeakIcon text={t("modules.lifeSkillsCardsTab")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (tab === "quiz" ? " selected" : "")}
          onClick={() => setTab("quiz")}
        >
          <span className="phonics-tab-inner">
            🤔 {t("modules.lifeSkillsQuizTab")}
            <TabSpeakIcon text={t("modules.lifeSkillsQuizTab")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (tab === "checklist" ? " selected" : "")}
          onClick={() => setTab("checklist")}
        >
          <span className="phonics-tab-inner">
            📋 {t("modules.lifeSkillsChecklistTab")}
            <TabSpeakIcon text={t("modules.lifeSkillsChecklistTab")} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {tab === "cards" && (
        <>
          <div className="phonics-tabs">
            <button
              type="button"
              className={"phonics-tab" + (category === "all" ? " selected" : "")}
              onClick={() => setCategory("all")}
            >
              <span className="phonics-tab-inner">
                🌟 {t("nav.lifeskills")}
                <TabSpeakIcon text={t("nav.lifeskills")} langCode={pair.mother} />
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={"phonics-tab" + (category === cat ? " selected" : "")}
                onClick={() => setCategory(cat)}
              >
                <span className="phonics-tab-inner">
                  {CATEGORY_ICONS[cat] || "✨"} {cat}
                  <TabSpeakIcon text={cat} langCode={pair.mother} />
                </span>
              </button>
            ))}
          </div>

          {visibleCards.map((card) => {
            const isOpen = openId === card.id;
            const wasTried = tried.includes(card.id);
            const isAdult = ADULT_SUPERVISION_VALUES.has(card.supervision);
            return (
              <div key={card.id} className={"game-card mission-card" + (wasTried ? " done" : "")}>
                <div className="mission-badge">
                  {CATEGORY_ICONS[card.category] || "✨"} {card.category}
                </div>
                <div className="mission-emoji">{card.emoji}</div>
                <p className="mission-text">
                  {card.title}
                  <SpeakButton text={card.title} langCode={pair.mother} />
                </p>
                <div className="mission-supervision">
                  {isAdult ? "👨‍👧 " + t("modules.lifeSkillsWithAdult") : "🧒 " + t("modules.lifeSkillsAlone")}
                </div>

                {!isOpen && (
                  <button type="button" className="big-btn" onClick={() => handleOpen(card)}>
                    🔎 {t("modules.sciencePredict")}
                  </button>
                )}

                {isOpen && (
                  <div className="science-explanation">
                    <p className="mission-text">
                      💡 {card.explanation}
                      <SpeakButton text={card.explanation} langCode={pair.mother} />
                    </p>
                    {wasTried && <div className="mission-done-tag">✅ {t("modules.lifeSkillsTried")}</div>}

                    {Array.isArray(card.steps) && card.steps.length >= 3 && (
                      <SequenceGame steps={card.steps} pair={pair} t={t} />
                    )}

                    <div>
                      <button type="button" className="big-btn" onClick={() => handleOpen(card)}>
                        ➡️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {tab === "quiz" && (
        <SupervisionQuiz cards={cards} pair={pair} profile={profile} t={t} />
      )}

      {tab === "checklist" && (
        <ChecklistView cards={cards} categories={categories} tried={tried} t={t} />
      )}
    </div>
  );
}
