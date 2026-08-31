import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { getWhys } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, exploreWhy, getExploredWhys, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import TeachBackPrompt from "../components/TeachBackPrompt.jsx";
import RelatedLinks from "../components/RelatedLinks.jsx";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Simple picture+text multiple-choice mini-quiz shown after a "why" card is
// opened, built entirely from data already present on the whys (each
// card's quickAnswer becomes the correct option, two other cards' quick
// answers become distractors) — no extra per-language content needed.
// Anti-guessing: wrong taps disable that option instead of allowing
// repeated blind clicks. Mirrors HumanEvolution/TechHistory's StageQuiz.
function WhyQuiz({ why, whys, pair, profile, t }) {
  const [options] = useState(() => {
    const others = shuffle(whys.filter((w) => w.id !== why.id && w.quickAnswer)).slice(0, 2);
    return shuffle([why, ...others]);
  });
  const [wrongIds, setWrongIds] = useState([]);
  const [solved, setSolved] = useState(false);

  if (options.length < 3) return null;

  function pick(option) {
    if (solved) return;
    if (option.id === why.id) {
      setSolved(true);
      recordSkillEvent(profile?.name, "whys-quiz", wrongIds.length === 0);
      pingProgress({ profileName: profile?.name, module: "whys", event: `quiz_solved:${why.id}` });
    } else {
      setWrongIds((prev) => (prev.includes(option.id) ? prev : [...prev, option.id]));
      pingProgress({ profileName: profile?.name, module: "whys", event: `quiz_attempt:${why.id}` });
    }
  }

  const prompt = t("modules.whysQuizPrompt");

  return (
    <div className="why-tier">
      <strong>❓ {t("modules.whysQuizTitle")}</strong>
      <div className="why-tier-header">
        <p>{prompt}</p>
        <SpeakButton text={prompt} langCode={pair.mother} />
      </div>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.id}>
            <button
              type="button"
              disabled={solved || wrongIds.includes(opt.id)}
              className={
                "big-btn game-option" +
                (solved && opt.id === why.id ? " correct" : "") +
                (wrongIds.includes(opt.id) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.emoji} {opt.quickAnswer}
            </button>
            <SpeakButton text={opt.quickAnswer} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.whysQuizCorrect")}</p>
          <SpeakButton text={t("modules.whysQuizCorrect")} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

export default function Whys() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherWhys = getWhys(pair.mother);
  const secondaryWhys = getWhys(pair.secondary);
  const whys = motherWhys.map((m, i) => ({ ...m, secondary: secondaryWhys[i] }));
  const whyById = {};
  whys.forEach((w) => {
    whyById[w.id] = w;
  });
  const profile = getProfile();
  const [explored, setExplored] = useState(() => getExploredWhys(profile?.name));
  const [openId, setOpenId] = useState(null);
  const [tiers, setTiers] = useState({}); // { [whyId]: { more: bool, experiment: bool } }
  const cardRefs = React.useRef({});

  function handleOpen(why) {
    const alreadyOpen = openId === why.id;
    setOpenId(alreadyOpen ? null : why.id);
    if (!explored.includes(why.id)) {
      exploreWhy(profile?.name, why.id);
      pingProgress({ profileName: profile?.name, module: "whys", event: `why_explored:${why.id}` });
      setExplored((prev) => [...prev, why.id]);
    }
  }

  function handleRelatedTap(relatedId) {
    const target = whyById[relatedId];
    if (!target) return;
    setOpenId(target.id);
    if (!explored.includes(target.id)) {
      exploreWhy(profile?.name, target.id);
      pingProgress({ profileName: profile?.name, module: "whys", event: `why_explored:${target.id}` });
      setExplored((prev) => [...prev, target.id]);
    }
    const el = cardRefs.current[relatedId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function revealTier(whyId, tier) {
    setTiers((prev) => ({
      ...prev,
      [whyId]: { ...prev[whyId], [tier]: true },
    }));
  }

  // Deep-link support for RelatedLinks: when another module navigates here
  // with { state: { openId } } (e.g. Science's "flutua-afunda" card linking
  // to the "barco" why), open that card and scroll it into view.
  const location = useLocation();
  React.useEffect(() => {
    const openId = location.state?.openId;
    if (openId && whyById[openId]) {
      handleOpen(whyById[openId]);
      const el = cardRefs.current[openId];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  return (
    <div className="page">
      <h1>{t("modules.whysTitle")} ❓</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.whysHelpMain")} langCode={pair.secondary} />
      </div>
      <p className="page-intro">{t("modules.whysIntro")}</p>
      <MascotBubble character="lumi" mood="thinking" langCode={pair.mother}>
        {t("modules.whysMascotIntro")}
      </MascotBubble>
      <div className="whys-progress">
        {t("modules.whysExplored")}: {explored.length} / {whys.length}
      </div>
      <div className="whys-grid">
        {whys.map((why) => {
          const isOpen = openId === why.id;
          const tierState = tiers[why.id] || {};
          return (
            <div
              className={`why-card${isOpen ? " why-card-open" : ""}`}
              key={why.id}
              ref={(el) => {
                cardRefs.current[why.id] = el;
              }}
            >
              <button type="button" className="why-question-btn" onClick={() => handleOpen(why)}>
                <span className="why-emoji">{why.emoji}</span>
                <span className="why-question">
                  {why.question}
                  {why.secondary && <span className="why-question-secondary">{why.secondary.question}</span>}
                </span>
              </button>
              {isOpen && (
                <div className="why-detail">
                  <div className="why-tier">
                    <strong>⚡ {t("modules.whysQuickAnswer")}</strong>
                    <div className="why-tier-header">
                      <p>{why.quickAnswer}</p>
                      <SpeakButton text={why.quickAnswer} langCode={pair.mother} />
                    </div>
                    {why.secondary && (
                      <div className="why-tier-header secondary">
                        <p>{why.secondary.quickAnswer}</p>
                        <SpeakButton text={why.secondary.quickAnswer} langCode={pair.secondary} />
                      </div>
                    )}
                  </div>

                  {!tierState.more && (
                    <button type="button" className="big-btn why-reveal-btn" onClick={() => revealTier(why.id, "more")}>
                      🔎 {t("modules.whysMoreAnswer")}
                    </button>
                  )}
                  {tierState.more && (
                    <div className="why-tier">
                      <strong>🔎 {t("modules.whysMoreAnswer")}</strong>
                      <div className="why-tier-header">
                        <p>{why.moreAnswer}</p>
                        <SpeakButton text={why.moreAnswer} langCode={pair.mother} />
                      </div>
                      {why.secondary && (
                        <div className="why-tier-header secondary">
                          <p>{why.secondary.moreAnswer}</p>
                          <SpeakButton text={why.secondary.moreAnswer} langCode={pair.secondary} />
                        </div>
                      )}
                    </div>
                  )}

                  {tierState.more && why.experiment && !tierState.experiment && (
                    <button
                      type="button"
                      className="big-btn why-reveal-btn"
                      onClick={() => revealTier(why.id, "experiment")}
                    >
                      🧪 {t("modules.whysExperiment")}
                    </button>
                  )}
                  {tierState.experiment && why.experiment && (
                    <div className="why-tier">
                      <strong>🧪 {t("modules.whysExperiment")}</strong>
                      <div className="why-tier-header">
                        <p>{why.experiment}</p>
                        <SpeakButton text={why.experiment} langCode={pair.mother} />
                      </div>
                      {why.secondary?.experiment && (
                        <div className="why-tier-header secondary">
                          <p>{why.secondary.experiment}</p>
                          <SpeakButton text={why.secondary.experiment} langCode={pair.secondary} />
                        </div>
                      )}
                    </div>
                  )}

                  {tierState.more && (
                    <WhyQuiz key={why.id} why={why} whys={whys} pair={pair} profile={profile} t={t} />
                  )}

                  {why.relatedQuestionIds && why.relatedQuestionIds.length > 0 && (
                    <div className="why-related">
                      <strong>🔗 {t("modules.whysRelated")}</strong>
                      <div className="why-related-chips">
                        {why.relatedQuestionIds.map((relId) => {
                          const related = whyById[relId];
                          if (!related) return null;
                          return (
                            <button
                              type="button"
                              key={relId}
                              className="why-related-chip"
                              onClick={() => handleRelatedTap(relId)}
                            >
                              {related.emoji} {related.question}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {tierState.more && (
                    <RelatedLinks module="whys" itemId={why.id} pair={pair} profile={profile} />
                  )}

                  {tierState.more && (
                    <TeachBackPrompt
                      module="whys"
                      itemId={why.id}
                      topicText={why.question}
                      profile={profile}
                      pair={pair}
                      character="milo"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
