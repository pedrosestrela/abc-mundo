import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLifeSkills } from "../content/index.js";
import { getLangPair, getProfile, getTriedLifeSkills, tryLifeSkill, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";

const CATEGORY_ICONS = {
  cozinha: "🍳",
  agua: "💧",
  eletricidade: "🔌",
  casa: "🏠",
  seguranca: "🛟",
};

// Every language file uses its own supervision word pair (see
// missions.<lang>.json for the same convention); the "adult" value never
// overlaps with the "alone" value across languages, so membership in this
// set is enough to detect adult-required cards regardless of language.
const ADULT_SUPERVISION_VALUES = new Set(["adulto", "adult", "erwachsener", "adulte", "大人"]);

export default function LifeSkills() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const cards = getLifeSkills(pair.mother);
  const [openId, setOpenId] = useState(null);
  const [category, setCategory] = useState("all");
  const [version, setVersion] = useState(0);

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

      <h2 className="songs-heading">
        {t("modules.lifeSkillsTried")} ({tried.length}/{cards.length})
      </h2>

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
    </div>
  );
}
