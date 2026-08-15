import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPortugalHistory } from "../content/index.js";
import { getLangPair, getProfile, getVisitedEras, visitEra, getDifficultyTier, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";
import Illustration from "../components/Illustrations.jsx";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuizRounds(eras, tier) {
  const count = tier === 2 ? 5 : 8;
  const pool = shuffle(eras).slice(0, Math.min(count, eras.length));
  return pool.map((correct) => {
    const distractors = shuffle(eras.filter((e) => e.id !== correct.id)).slice(0, 2);
    return { correct, options: shuffle([correct, ...distractors]) };
  });
}

export default function PortugalHistory() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const [eras, setEras] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getPortugalHistory(pair.mother).then((data) => {
      if (!cancelled) setEras(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.mother]);

  const [tab, setTab] = useState("timeline");
  const [openId, setOpenId] = useState(null);
  const [visitedVersion, setVisitedVersion] = useState(0);
  const visited = useMemo(() => getVisitedEras(profile?.name), [profile?.name, visitedVersion]);

  const [rounds, setRounds] = useState([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizConfirmed, setQuizConfirmed] = useState(tier >= 2);
  const [showAdvisory, setShowAdvisory] = useState(false);

  const canQuiz = true;

  function toggleEra(era) {
    const opening = openId !== era.id;
    setOpenId(opening ? era.id : null);
    if (opening) {
      visitEra(profile?.name, era.id);
      pingProgress({ profileName: profile?.name, module: "history", event: `era_visited:${era.id}` });
      recordSkillEvent(profile?.name, "history-era-viewed", true);
      setVisitedVersion((v) => v + 1);
    }
  }

  function startQuiz() {
    setRounds(buildQuizRounds(eras, tier));
    setStep(0);
    setScore(0);
    setFeedback(null);
    setQuizStarted(true);
  }

  function handleAnswer(option) {
    if (feedback) return;
    const round = rounds[step];
    const correct = option.id === round.correct.id;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    pingProgress({
      profileName: profile?.name,
      module: "history",
      event: `quiz_${correct ? "correct" : "wrong"}`,
    });
    setTimeout(() => {
      setFeedback(null);
      setStep((s) => s + 1);
    }, 900);
  }

  const quizFinished = quizStarted && step >= rounds.length;
  const round = rounds[step];

  return (
    <div className="page">
      <h1>{t("modules.historyTitle")} 🏰</h1>
      <div className="help-btn-corner">
        <HelpButton text={tab === "quiz" ? t("modules.historyHelpQuiz") : t("modules.historyHelpTimeline")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.historyIntro")}</p>

      {showAdvisory && (
        <AgeAdvisory
          langCode={pair.mother}
          onAccept={() => {
            setQuizConfirmed(true);
            setShowAdvisory(false);
            setTab("quiz");
          }}
          onDecline={() => setShowAdvisory(false)}
        />
      )}

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "timeline" ? " selected" : "")} onClick={() => { setTab("timeline"); setQuizStarted(false); }}>
          <span className="phonics-tab-inner">
            🕰️ {t("modules.historyTitle")}
            <TabSpeakIcon text={`${t("modules.historyTitle")}. ${t("modules.historyHelpTimeline")}`} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (tab === "quiz" ? " selected" : "")}
          onClick={() => {
            if (tier < 2 && !quizConfirmed) {
              setShowAdvisory(true);
              return;
            }
            setTab("quiz");
          }}
        >
          <span className="phonics-tab-inner">
            🎮 {t("modules.historyQuiz")}
            <TabSpeakIcon text={`${t("modules.historyQuiz")}. ${t("modules.historyHelpQuiz")}`} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {tab === "timeline" && (
        <>
          <p className="page-intro">
            {t("modules.historyExplored")}: {visited.length}/{eras.length}
          </p>
          <div className="history-timeline">
            {eras.map((era) => {
              const isOpen = openId === era.id;
              const isVisited = visited.includes(era.id);
              return (
                <div key={era.id} className={"history-era-card" + (isVisited ? " visited" : "")}>
                  <button type="button" className="history-era-header" onClick={() => toggleEra(era)}>
                    <span className="history-year-badge">{era.year}</span>
                    <span className="history-era-emoji">{era.emoji}</span>
                    <span className="history-era-title">{era.title}</span>
                    {isVisited && <span className="history-era-check">✅</span>}
                  </button>
                  {isOpen && (
                    <div className="history-era-body">
                      <div className="history-era-illustration">
                        <Illustration illustrationId={era.id} />
                      </div>
                      <p className="mission-text">
                        {era.description}
                        <SpeakButton text={era.description} langCode={pair.mother} />
                      </p>
                      {era.relatedSong && (
                        <div className="history-related-song">
                          <h3>{t("modules.historySongSection")}</h3>
                          <p className="history-related-song-title">
                            🎵 {era.relatedSong.title}
                            {era.relatedSong.composer ? ` — ${era.relatedSong.composer}` : ""}
                          </p>
                          <p className="mission-text">
                            {era.relatedSong.historicalNote}
                            <SpeakButton text={era.relatedSong.historicalNote} langCode={pair.mother} />
                          </p>
                          {era.relatedSong.canPlayFull && (
                            <Link className="big-btn" to="/songs">
                              {t("modules.historySongListenFull")}
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "quiz" && canQuiz && !quizStarted && (
        <div className="world-quiz-picker">
          <button type="button" className="big-btn" onClick={startQuiz}>
            🏰 {t("modules.historyQuiz")}
          </button>
        </div>
      )}

      {tab === "quiz" && canQuiz && quizStarted && !quizFinished && round && (
        <div className="game-card">
          <div className="game-progress">
            {step + 1} / {rounds.length} · ⭐ {score}
          </div>
          <div className="game-emoji">{round.correct.emoji} {round.correct.year}</div>
          <p className="page-intro">{round.correct.title}</p>
          <div className="game-options">
            {round.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={"big-btn game-option" + (feedback && opt.id === round.correct.id ? " correct" : "")}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
              >
                {opt.year}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "quiz" && canQuiz && quizFinished && (
        <div className="game-card">
          <div className="game-emoji">🏆</div>
          <p className="game-result">
            {score} / {rounds.length}
          </p>
          <button type="button" className="big-btn" onClick={startQuiz}>
            🔁 {t("modules.gamePlayAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
