import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getHouseSystems, getCitySystems } from "../content/index.js";
import { getLangPair, getProfile, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

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
