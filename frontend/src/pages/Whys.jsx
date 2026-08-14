import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getWhys } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, exploreWhy, getExploredWhys } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

export default function Whys() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const whys = getWhys(pair.secondary);
  const profile = getProfile();
  const [explored, setExplored] = useState(() => getExploredWhys(profile?.name));
  const [openId, setOpenId] = useState(null);
  const [tiers, setTiers] = useState({}); // { [whyId]: { more: bool, experiment: bool } }

  function handleOpen(why) {
    const alreadyOpen = openId === why.id;
    setOpenId(alreadyOpen ? null : why.id);
    if (!explored.includes(why.id)) {
      exploreWhy(profile?.name, why.id);
      pingProgress({ profileName: profile?.name, module: "whys", event: `why_explored:${why.id}` });
      setExplored((prev) => [...prev, why.id]);
    }
  }

  function revealTier(whyId, tier) {
    setTiers((prev) => ({
      ...prev,
      [whyId]: { ...prev[whyId], [tier]: true },
    }));
  }

  return (
    <div className="page">
      <h1>{t("modules.whysTitle")} ❓</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.whysHelpMain")} langCode={pair.secondary} />
      </div>
      <p className="page-intro">{t("modules.whysIntro")}</p>
      <div className="whys-progress">
        {t("modules.whysExplored")}: {explored.length} / {whys.length}
      </div>
      <div className="whys-grid">
        {whys.map((why) => {
          const isOpen = openId === why.id;
          const tierState = tiers[why.id] || {};
          return (
            <div className={`why-card${isOpen ? " why-card-open" : ""}`} key={why.id}>
              <button type="button" className="why-question-btn" onClick={() => handleOpen(why)}>
                <span className="why-emoji">{why.emoji}</span>
                <span className="why-question">{why.question}</span>
              </button>
              {isOpen && (
                <div className="why-detail">
                  <div className="why-tier">
                    <strong>⚡ {t("modules.whysQuickAnswer")}</strong>
                    <div className="why-tier-header">
                      <p>{why.quickAnswer}</p>
                      <SpeakButton text={why.quickAnswer} langCode={pair.secondary} />
                    </div>
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
                        <SpeakButton text={why.moreAnswer} langCode={pair.secondary} />
                      </div>
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
                        <SpeakButton text={why.experiment} langCode={pair.secondary} />
                      </div>
                    </div>
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
