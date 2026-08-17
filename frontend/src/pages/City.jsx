import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getHouseSystems, getCitySystems } from "../content/index.js";
import { getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Simple picture+text multiple-choice mini-quiz shown after a house/city
// system card is opened, built entirely from data already present on the
// items (the item's own prompt is the clue, its name/icon the correct
// option, two sibling items' names the distractors) — no extra
// per-language content needed. Anti-guessing: wrong taps disable that
// option. Mirrors HumanEvolution/TechHistory's StageQuiz.
function SystemQuiz({ item, items, pair, profile, t, skillId, eventPrefix }) {
  const [options] = useState(() => {
    const others = shuffle(items.filter((i) => i.id !== item.id)).slice(0, 2);
    return shuffle([item, ...others]);
  });
  const [wrongIds, setWrongIds] = useState([]);
  const [solved, setSolved] = useState(false);

  if (options.length < 3) return null;

  function pick(option) {
    if (solved) return;
    if (option.id === item.id) {
      setSolved(true);
      recordSkillEvent(profile?.name, skillId, wrongIds.length === 0);
      pingProgress({ profileName: profile?.name, module: "city", event: `${eventPrefix}_quiz_solved:${item.id}` });
    } else {
      setWrongIds((prev) => (prev.includes(option.id) ? prev : [...prev, option.id]));
      pingProgress({ profileName: profile?.name, module: "city", event: `${eventPrefix}_quiz_attempt:${item.id}` });
    }
  }

  return (
    <div className="science-explanation">
      <p className="mission-badge computing-topic-badge">❓ {t("modules.cityQuizTitle")}</p>
      <p className="mission-text">
        {t("modules.cityQuizPrompt")}
        <SpeakButton text={t("modules.cityQuizPrompt")} langCode={pair.mother} />
      </p>
      <p className="page-intro">
        {item.prompt}
        <SpeakButton text={item.prompt} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.id}>
            <button
              type="button"
              disabled={solved || wrongIds.includes(opt.id)}
              className={
                "big-btn game-option" +
                (solved && opt.id === item.id ? " correct" : "") +
                (wrongIds.includes(opt.id) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.icon} {opt.name}
            </button>
            <SpeakButton text={opt.name} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.cityQuizCorrect")}</p>
          <SpeakButton text={t("modules.cityQuizCorrect")} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

export default function City() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const house = getHouseSystems(pair.mother);
  const city = getCitySystems(pair.mother);

  const [tab, setTab] = useState("house");
  const [openHouseId, setOpenHouseId] = useState(null);
  const [openCityId, setOpenCityId] = useState(null);

  function handleOpenHouse(item) {
    const nowOpen = item.id !== openHouseId;
    setOpenHouseId(nowOpen ? item.id : null);
    if (nowOpen) {
      pingProgress({ profileName: profile?.name, module: "city", event: `house_system_explored:${item.id}` });
    }
  }

  function handleOpenCity(item) {
    const nowOpen = item.id !== openCityId;
    setOpenCityId(nowOpen ? item.id : null);
    if (nowOpen) {
      pingProgress({ profileName: profile?.name, module: "city", event: `city_service_explored:${item.id}` });
    }
  }

  return (
    <div className="page">
      <h1>{t("modules.cityTitle")} 🏙️</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.cityHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.cityIntro")}</p>

      <div className="game-options city-tabs">
        <button
          type="button"
          className={"big-btn game-option" + (tab === "house" ? " done" : "")}
          onClick={() => setTab("house")}
        >
          🏠 {t("modules.cityTabHouse")}
        </button>
        <button
          type="button"
          className={"big-btn game-option" + (tab === "city" ? " done" : "")}
          onClick={() => setTab("city")}
        >
          🏙️ {t("modules.cityTabCity")}
        </button>
      </div>

      {tab === "house" && (
        <>
          <h2 className="songs-heading">🏠 {t("modules.cityHouseTitle")}</h2>
          <p className="page-intro">{t("modules.cityHouseIntro")}</p>

          <div className="computing-grid">
            {house.map((item) => {
              const isOpen = item.id === openHouseId;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={"computing-term-btn" + (isOpen ? " done" : "")}
                  onClick={() => handleOpenHouse(item)}
                >
                  <span className="computing-term-emoji">{item.icon}</span>
                  {item.name}
                </button>
              );
            })}
          </div>

          {house
            .filter((item) => item.id === openHouseId)
            .map((item) => (
              <div key={item.id} className="game-card science-card done">
                <div className="game-emoji">{item.icon}</div>
                <p className="mission-text">
                  {item.prompt}
                  <SpeakButton text={item.prompt} langCode={pair.mother} />
                </p>
                <div className="science-explanation">
                  {item.steps.map((step, idx) => (
                    <p key={idx} className="game-result">
                      {step}
                    </p>
                  ))}
                  <SpeakButton text={item.steps.join(" ")} langCode={pair.mother} />
                </div>
                <SystemQuiz
                  key={item.id}
                  item={item}
                  items={house}
                  pair={pair}
                  profile={profile}
                  t={t}
                  skillId="city-house-quiz"
                  eventPrefix="house"
                />
                <div>
                  <button type="button" className="big-btn" onClick={() => handleOpenHouse(item)}>
                    ✅
                  </button>
                </div>
              </div>
            ))}
        </>
      )}

      {tab === "city" && (
        <>
          <h2 className="songs-heading">🏙️ {t("modules.cityCityTitle")}</h2>
          <p className="page-intro">{t("modules.cityCityIntro")}</p>

          <div className="computing-grid">
            {city.map((item) => {
              const isOpen = item.id === openCityId;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={"computing-term-btn" + (isOpen ? " done" : "")}
                  onClick={() => handleOpenCity(item)}
                >
                  <span className="computing-term-emoji">{item.icon}</span>
                  {item.name}
                </button>
              );
            })}
          </div>

          {city
            .filter((item) => item.id === openCityId)
            .map((item) => (
              <div key={item.id} className="game-card science-card done">
                <div className="game-emoji">{item.icon}</div>
                <p className="mission-text">
                  {item.prompt}
                  <SpeakButton text={item.prompt} langCode={pair.mother} />
                </p>
                <div className="science-explanation">
                  {item.steps.map((step, idx) => (
                    <p key={idx} className="game-result">
                      {step}
                    </p>
                  ))}
                  <SpeakButton text={item.steps.join(" ")} langCode={pair.mother} />
                </div>
                <SystemQuiz
                  key={item.id}
                  item={item}
                  items={city}
                  pair={pair}
                  profile={profile}
                  t={t}
                  skillId="city-city-quiz"
                  eventPrefix="city"
                />
                <div>
                  <button type="button" className="big-btn" onClick={() => handleOpenCity(item)}>
                    ✅
                  </button>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
