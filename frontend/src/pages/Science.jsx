import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getScience, getLabSimulators, getLabEngineering } from "../content/index.js";
import { getLangPair, getProfile, getExploredScience, exploreScienceCard, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

const TOPIC_ICONS = {
  biology: "🧬",
  physics: "⚙️",
  chemistry: "🧪",
  earth: "🌍",
};

function PlantSimulator({ data, pair }) {
  const [light, setLight] = useState(1);
  const [water, setWater] = useState(1);
  const outcome = data.outcomes[`${light}-${water}`];
  return (
    <div className="game-card science-card">
      <div className="game-emoji">{data.emoji}</div>
      <p className="mission-text">
        {data.question}
        <SpeakButton text={data.question} langCode={pair.mother} />
      </p>
      <div className="game-options">
        <div>
          <strong>{data.lightLabel}: {data.levels[light]}</strong>
          <div className="game-options">
            {data.levels.map((lvl, i) => (
              <button
                key={"light-" + i}
                type="button"
                className={"big-btn game-option" + (light === i ? " done" : "")}
                onClick={() => setLight(i)}
              >
                ☀️ {lvl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <strong>{data.waterLabel}: {data.levels[water]}</strong>
          <div className="game-options">
            {data.levels.map((lvl, i) => (
              <button
                key={"water-" + i}
                type="button"
                className={"big-btn game-option" + (water === i ? " done" : "")}
                onClick={() => setWater(i)}
              >
                💧 {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>
      {outcome && (
        <div className="science-explanation">
          <div className="game-emoji">{outcome.emoji}</div>
          <p className="game-result">{outcome.text}</p>
          <SpeakButton text={outcome.text} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

function GravitySimulator({ data, pair }) {
  const [planetId, setPlanetId] = useState("earth");
  const planet = data.planets.find((p) => p.id === planetId) || data.planets[0];
  const barWidth = Math.min(100, Math.round(planet.jumpMultiplier * 16));
  return (
    <div className="game-card science-card">
      <div className="game-emoji">{data.emoji}</div>
      <p className="mission-text">
        {data.question}
        <SpeakButton text={data.question} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {data.planets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={"big-btn game-option" + (planetId === p.id ? " done" : "")}
            onClick={() => setPlanetId(p.id)}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
      <div className="science-explanation">
        <p className="mission-text">🧍 {data.jumpLabel}</p>
        <div style={{ background: "#eee", borderRadius: 8, height: 24, width: "100%", maxWidth: 260, margin: "0 auto" }}>
          <div
            style={{
              background: "var(--pink, #ff6f91)",
              height: "100%",
              borderRadius: 8,
              width: `${barWidth}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <p className="game-result">{planet.text}</p>
        <SpeakButton text={planet.text} langCode={pair.mother} />
      </div>
    </div>
  );
}

function WaterStateSimulator({ data, pair }) {
  const [temp, setTemp] = useState(1);
  const outcome = data.outcomes[String(temp)];
  return (
    <div className="game-card science-card">
      <div className="game-emoji">{outcome ? outcome.emoji : data.emoji}</div>
      <p className="mission-text">
        {data.question}
        <SpeakButton text={data.question} langCode={pair.mother} />
      </p>
      <strong>{data.tempLabel}: {data.levels[temp]}</strong>
      <div className="game-options">
        {data.levels.map((lvl, i) => (
          <button
            key={"temp-" + i}
            type="button"
            className={"big-btn game-option" + (temp === i ? " done" : "")}
            onClick={() => setTemp(i)}
          >
            {i === 0 ? "🥶" : i === 1 ? "🌡️" : "🔥"} {lvl}
          </button>
        ))}
      </div>
      {outcome && (
        <div className="science-explanation">
          <p className="game-result">{outcome.text}</p>
          <SpeakButton text={outcome.text} langCode={pair.mother} />
        </div>
      )}
    </div>
  );
}

function EngineeringChallenge({ id, data, pair, profile, bumpVersion }) {
  const [pickedId, setPickedId] = useState(null);
  const outcome = pickedId ? data.outcomes[pickedId] : null;

  function pick(materialId) {
    setPickedId(materialId);
    const result = data.outcomes[materialId];
    if (result?.success) {
      exploreScienceCard(profile?.name, `lab-eng-${id}`);
      recordSkillEvent(profile?.name, "science-engineering", true);
      pingProgress({ profileName: profile?.name, module: "science", event: `engineering_success:${id}:${materialId}` });
      bumpVersion();
    } else {
      pingProgress({ profileName: profile?.name, module: "science", event: `engineering_attempt:${id}:${materialId}` });
    }
  }

  return (
    <div className="game-card science-card">
      <div className="game-emoji">{data.emoji}</div>
      <p className="mission-text">
        {data.prompt}
        <SpeakButton text={data.prompt} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {data.materials.map((m) => (
          <button
            key={m.id}
            type="button"
            className={"big-btn game-option" + (pickedId === m.id ? " done" : "")}
            onClick={() => pick(m.id)}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
      {outcome && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">
            {outcome.success ? "✅" : "❌"}
          </p>
          <p className="game-result">{outcome.text}</p>
          <SpeakButton text={outcome.text} langCode={pair.mother} />
          {!outcome.success && (
            <div>
              <button type="button" className="big-btn" onClick={() => setPickedId(null)}>
                🔁
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Science() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const cards = getScience(pair.mother);
  const simulators = getLabSimulators(pair.mother);
  const engineering = getLabEngineering(pair.mother);
  const [tab, setTab] = useState("facts");
  const [openId, setOpenId] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [version, setVersion] = useState(0);

  const explored = useMemo(() => getExploredScience(profile?.name), [profile?.name, version]);

  function handleOpen(card) {
    setOpenId(card.id === openId ? null : card.id);
    setPrediction(null);
  }

  function handlePredict(card, option) {
    if (prediction) return;
    setPrediction(option);
    exploreScienceCard(profile?.name, card.id);
    recordSkillEvent(profile?.name, "science-" + card.topic, true);
    pingProgress({ profileName: profile?.name, module: "science", event: `experiment_explored:${card.id}` });
    setVersion((v) => v + 1);
  }

  return (
    <div className="page">
      <h1>{t("modules.scienceTitle")} 🔬</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.scienceHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.scienceIntro")}</p>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "facts" ? " selected" : "")} onClick={() => setTab("facts")}>
          <span className="phonics-tab-inner">🔎 {t("modules.scienceFactsTab")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "sim" ? " selected" : "")} onClick={() => setTab("sim")}>
          <span className="phonics-tab-inner">🧪 {t("modules.scienceLabSimTab")}</span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "eng" ? " selected" : "")} onClick={() => setTab("eng")}>
          <span className="phonics-tab-inner">🏗️ {t("modules.scienceLabEngTab")}</span>
        </button>
      </div>

      {tab === "facts" && (
        <>
          <h2 className="songs-heading">
            {t("modules.scienceExplored")} ({explored.length}/{cards.length})
          </h2>

          {cards.map((card) => {
            const isOpen = openId === card.id;
            const wasExplored = explored.includes(card.id);
            return (
              <div key={card.id} className={"game-card science-card" + (wasExplored ? " done" : "")}>
                <div className="mission-badge science-topic-badge">
                  {TOPIC_ICONS[card.topic] || "🔬"} {card.topic}
                </div>
                <div className="game-emoji">{card.emoji}</div>
                <p className="mission-text">
                  {card.question}
                  <SpeakButton text={card.question} langCode={pair.mother} />
                </p>

                {!isOpen && (
                  <button type="button" className="big-btn" onClick={() => handleOpen(card)}>
                    🔎 {t("modules.sciencePredict")}
                  </button>
                )}

                {isOpen && !prediction && (
                  <div className="game-options">
                    {card.prediction_options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="big-btn game-option"
                        onClick={() => handlePredict(card, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {isOpen && prediction && (
                  <div className="science-explanation">
                    <p className="game-result">💡 {card.explanation}</p>
                    <p className="mission-text science-try-home">
                      🏠 {t("modules.scienceTryAtHome")}: {card.tryAtHome}
                    </p>
                    <SpeakButton text={`${card.explanation} ${card.tryAtHome}`} langCode={pair.mother} />
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

      {tab === "sim" && (
        <>
          <p className="page-intro">{t("modules.scienceLabSimIntro")}</p>
          <h2 className="songs-heading">{simulators.plant.title}</h2>
          <PlantSimulator data={simulators.plant} pair={pair} />
          <h2 className="songs-heading">{simulators.gravity.title}</h2>
          <GravitySimulator data={simulators.gravity} pair={pair} />
          <h2 className="songs-heading">{simulators.water.title}</h2>
          <WaterStateSimulator data={simulators.water} pair={pair} />
        </>
      )}

      {tab === "eng" && (
        <>
          <p className="page-intro">{t("modules.scienceLabEngIntro")}</p>
          {["bridge", "tower", "boat"].map((id) => (
            <React.Fragment key={id}>
              <h2 className="songs-heading">{engineering[id].title}</h2>
              <EngineeringChallenge
                id={id}
                data={engineering[id]}
                pair={pair}
                profile={profile}
                bumpVersion={() => setVersion((v) => v + 1)}
              />
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
}
