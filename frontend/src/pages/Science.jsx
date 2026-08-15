import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getScience, getLabSimulators, getLabEngineering } from "../content/index.js";
import { getLangPair, getProfile, getExploredScience, exploreScienceCard, recordSkillEvent, pingProgress, getDifficultyTier } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";

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

function GravitySimulator({ data, pair, t, tier }) {
  const [planetId, setPlanetId] = useState("earth");
  const [hypothesis, setHypothesis] = useState(null);
  const [dropped, setDropped] = useState(false);
  const planet = data.planets.find((p) => p.id === planetId) || data.planets[0];
  const barWidth = Math.min(100, Math.round(planet.jumpMultiplier * 16));
  // Presentation-only relative fall duration: weaker gravity (higher jump
  // multiplier) => the ball floats down slower; stronger gravity => faster.
  const fallDurationMs = Math.min(3000, Math.max(500, Math.round(600 * planet.jumpMultiplier)));

  function choosePlanet(id) {
    setPlanetId(id);
    setHypothesis(null);
    setDropped(false);
  }

  function drop() {
    setDropped(false);
    // restart CSS animation
    requestAnimationFrame(() => setDropped(true));
  }

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
            onClick={() => choosePlanet(p.id)}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      <p className="mission-badge science-topic-badge">🧪 {t("modules.scienceHypothesisLabel")}</p>
      <p className="mission-text">
        {t("modules.scienceGravityDropQuestion")}
        <SpeakButton text={t("modules.scienceGravityDropQuestion")} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {["faster", "slower", "same"].map((h) => (
          <button
            key={h}
            type="button"
            className={"big-btn game-option" + (hypothesis === h ? " done" : "")}
            onClick={() => setHypothesis(h)}
          >
            {h === "faster" && t("modules.scienceGravityFaster")}
            {h === "slower" && t("modules.scienceGravitySlower")}
            {h === "same" && t("modules.scienceGravitySame")}
          </button>
        ))}
      </div>

      {hypothesis && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">🔬 {t("modules.scienceExperimentLabel")}</p>
          <button type="button" className="big-btn" onClick={drop}>
            🪀 {t("modules.scienceDropButton")}
          </button>
          <div style={{ position: "relative", height: 120, margin: "8px auto", width: 40 }}>
            <div
              key={planetId + String(dropped)}
              style={{
                fontSize: 28,
                position: "absolute",
                left: 4,
                top: 0,
                transform: dropped ? "translateY(90px)" : "translateY(0)",
                transition: dropped ? `transform ${fallDurationMs}ms ease-in` : "none",
              }}
            >
              ⚽
            </div>
          </div>

          {dropped && (
            <>
              <p className="mission-badge science-topic-badge">👀 {t("modules.scienceObservationLabel")}</p>
              <p className="game-result">{t("modules.scienceGravityObservation")}</p>
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
              <p className="mission-badge science-topic-badge">💡 {t("modules.scienceExplanationLabel")}</p>
              <p className="game-result">{planet.text}</p>
              <SpeakButton text={planet.text} langCode={pair.mother} />
              {tier >= 3 && (
                <p className="mission-text">{t("modules.scienceGravityTierNote")}</p>
              )}
              <div>
                <button type="button" className="big-btn" onClick={() => { setHypothesis(null); setDropped(false); }}>
                  🔁 {t("modules.scienceTryDifferent")}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ElectricSimulator({ data, pair, t, tier }) {
  const [middleId, setMiddleId] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const outcome = middleId ? data.outcomes[middleId] : null;

  function pickMiddle(id) {
    setMiddleId(id);
    setPrediction(null);
  }

  function reset() {
    setMiddleId(null);
    setPrediction(null);
  }

  return (
    <div className="game-card science-card">
      <div className="game-emoji">{data.emoji}</div>
      <p className="mission-text">
        {data.question}
        <SpeakButton text={data.question} langCode={pair.mother} />
      </p>
      <div className="game-emoji" aria-hidden="true">
        🔋 — {middleId ? data.options.find((o) => o.id === middleId)?.emoji : "❔"} — {outcome && prediction ? (outcome.success ? "💡" : "🔌") : "💡"}
      </div>
      <p className="mission-badge science-topic-badge">🔬 {t("modules.scienceExperimentLabel")}</p>
      <p className="mission-text">{data.middleLabel}</p>
      <div className="game-options">
        {data.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={"big-btn game-option" + (middleId === o.id ? " done" : "")}
            onClick={() => pickMiddle(o.id)}
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>

      {middleId && !prediction && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">🧪 {t("modules.scienceHypothesisLabel")}</p>
          <p className="mission-text">
            {t("modules.sciencePredictYesNo")}
            <SpeakButton text={t("modules.sciencePredictYesNo")} langCode={pair.mother} />
          </p>
          <div className="game-options">
            <button type="button" className="big-btn game-option" onClick={() => setPrediction("yes")}>
              👍 {t("modules.sciencePredictYes")}
            </button>
            <button type="button" className="big-btn game-option" onClick={() => setPrediction("no")}>
              👎 {t("modules.sciencePredictNo")}
            </button>
          </div>
        </div>
      )}

      {middleId && prediction && outcome && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">👀 {t("modules.scienceObservationLabel")}</p>
          <div className="game-emoji">{outcome.success ? "💡" : "🔌"}</div>
          <p className="game-result">
            {(prediction === "yes") === outcome.success
              ? t("modules.sciencePredictionCorrect")
              : t("modules.sciencePredictionWrong")}
          </p>
          <p className="mission-badge science-topic-badge">💡 {t("modules.scienceExplanationLabel")}</p>
          <p className="game-result">{outcome.text}</p>
          <SpeakButton text={outcome.text} langCode={pair.mother} />
          {tier >= 3 && (
            <p className="mission-text">{t("modules.scienceElectricTierNote")}</p>
          )}
          <div>
            <button type="button" className="big-btn" onClick={reset}>
              🔁 {t("modules.scienceTryDifferent")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LightSimulator({ data, pair, t }) {
  const [picked, setPicked] = useState([]);
  const [guess, setGuess] = useState(null);
  const comboKey = picked.length === 2 ? picked.slice().sort().join("-") : null;
  const combo = comboKey ? data.combos[comboKey] : null;

  function toggleLight(id) {
    setGuess(null);
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [id];
      return [...prev, id];
    });
  }

  const guessOptions = combo
    ? Array.from(
        new Map(
          [
            [combo.resultLabel, combo],
            ...Object.values(data.combos)
              .filter((c) => c.resultLabel !== combo.resultLabel)
              .slice(0, 1)
              .map((c) => [c.resultLabel, c]),
            [data.distractor.label, { resultLabel: data.distractor.label, color: data.distractor.color }],
          ]
        ).values()
      )
    : [];

  return (
    <div className="game-card science-card">
      <div className="game-emoji">{data.emoji}</div>
      <p className="mission-text">
        {data.question}
        <SpeakButton text={data.question} langCode={pair.mother} />
      </p>
      <p className="mission-badge science-topic-badge">🔬 {t("modules.scienceExperimentLabel")}</p>
      <p className="mission-text">{data.pickLabel}</p>
      <div className="game-options">
        {data.lights.map((l) => (
          <button
            key={l.id}
            type="button"
            className={"big-btn game-option" + (picked.includes(l.id) ? " done" : "")}
            onClick={() => toggleLight(l.id)}
            style={{ borderColor: l.color }}
          >
            {l.emoji} {l.label}
          </button>
        ))}
      </div>

      {picked.length === 2 && !comboKey && (
        <p className="game-result">⚠️ {data.sameWarning}</p>
      )}

      {combo && !guess && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">🧪 {t("modules.scienceHypothesisLabel")}</p>
          <p className="mission-text">
            {data.guessLabel}
            <SpeakButton text={data.guessLabel} langCode={pair.mother} />
          </p>
          <div className="game-options">
            {guessOptions.map((g) => (
              <button
                key={g.resultLabel}
                type="button"
                className="big-btn game-option"
                onClick={() => setGuess(g.resultLabel)}
                style={{ borderColor: g.color }}
              >
                {g.resultLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {combo && guess && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">👀 {t("modules.scienceObservationLabel")}</p>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: combo.color,
              margin: "8px auto",
              border: "2px solid #ccc",
            }}
            aria-hidden="true"
          />
          <p className="game-result">
            {guess === combo.resultLabel ? t("modules.sciencePredictionCorrect") : t("modules.sciencePredictionWrong")}
            {" "}
            {combo.resultLabel}
          </p>
          <p className="mission-badge science-topic-badge">💡 {t("modules.scienceExplanationLabel")}</p>
          <p className="game-result">{combo.text}</p>
          <SpeakButton text={combo.text} langCode={pair.mother} />
          <div>
            <button type="button" className="big-btn" onClick={() => { setPicked([]); setGuess(null); }}>
              🔁 {t("modules.scienceTryDifferent")}
            </button>
          </div>
        </div>
      )}
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

function PredictSimulator({ data, pair, t }) {
  const [itemId, setItemId] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const outcome = itemId ? data.outcomes[itemId] : null;

  function pickItem(id) {
    setItemId(id);
    setPrediction(null);
  }

  function reset() {
    setItemId(null);
    setPrediction(null);
  }

  return (
    <div className="game-card science-card">
      <div className="game-emoji">{data.emoji}</div>
      <p className="mission-text">
        {data.question}
        <SpeakButton text={data.question} langCode={pair.mother} />
      </p>
      <p className="mission-badge science-topic-badge">🔬 {t("modules.scienceExperimentLabel")}</p>
      <p className="mission-text">{data.itemsLabel}</p>
      <div className="game-options">
        {data.items.map((o) => (
          <button
            key={o.id}
            type="button"
            className={"big-btn game-option" + (itemId === o.id ? " done" : "")}
            onClick={() => pickItem(o.id)}
          >
            {o.emoji} {o.label}
          </button>
        ))}
      </div>

      {itemId && !prediction && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">🧪 {t("modules.scienceHypothesisLabel")}</p>
          <p className="mission-text">
            {data.predictQuestion}
            <SpeakButton text={data.predictQuestion} langCode={pair.mother} />
          </p>
          <div className="game-options">
            <button type="button" className="big-btn game-option" onClick={() => setPrediction("yes")}>
              👍 {t("modules.sciencePredictYes")}
            </button>
            <button type="button" className="big-btn game-option" onClick={() => setPrediction("no")}>
              👎 {t("modules.sciencePredictNo")}
            </button>
          </div>
        </div>
      )}

      {itemId && prediction && outcome && (
        <div className="science-explanation">
          <p className="mission-badge science-topic-badge">👀 {t("modules.scienceObservationLabel")}</p>
          <div className="game-emoji">{outcome.success ? data.successEmoji : data.failEmoji}</div>
          <p className="game-result">
            {(prediction === "yes") === outcome.success
              ? t("modules.sciencePredictionCorrect")
              : t("modules.sciencePredictionWrong")}
          </p>
          <p className="mission-badge science-topic-badge">💡 {t("modules.scienceExplanationLabel")}</p>
          <p className="game-result">{outcome.text}</p>
          <SpeakButton text={outcome.text} langCode={pair.mother} />
          <div>
            <button type="button" className="big-btn" onClick={reset}>
              🔁 {t("modules.scienceTryDifferent")}
            </button>
          </div>
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
  const tier = getDifficultyTier(profile?.age);
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
      <MascotBubble character="nina" mood="happy" langCode={pair.mother}>
        {t("modules.scienceMascotIntro")}
      </MascotBubble>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (tab === "facts" ? " selected" : "")} onClick={() => setTab("facts")}>
          <span className="phonics-tab-inner">
            🔎 {t("modules.scienceFactsTab")}
            <TabSpeakIcon text={t("modules.scienceFactsTab")} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "sim" ? " selected" : "")} onClick={() => setTab("sim")}>
          <span className="phonics-tab-inner">
            🧪 {t("modules.scienceLabSimTab")}
            <TabSpeakIcon text={`${t("modules.scienceLabSimTab")}. ${t("modules.scienceLabSimIntro")}`} langCode={pair.mother} />
          </span>
        </button>
        <button type="button" className={"phonics-tab" + (tab === "eng" ? " selected" : "")} onClick={() => setTab("eng")}>
          <span className="phonics-tab-inner">
            🏗️ {t("modules.scienceLabEngTab")}
            <TabSpeakIcon text={`${t("modules.scienceLabEngTab")}. ${t("modules.scienceLabEngIntro")}`} langCode={pair.mother} />
          </span>
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
          <GravitySimulator data={simulators.gravity} pair={pair} t={t} tier={tier} />
          <h2 className="songs-heading">{simulators.water.title}</h2>
          <WaterStateSimulator data={simulators.water} pair={pair} />
          {simulators.electric && (
            <>
              <h2 className="songs-heading">{simulators.electric.title}</h2>
              <ElectricSimulator data={simulators.electric} pair={pair} t={t} tier={tier} />
            </>
          )}
          {simulators.light && (
            <>
              <h2 className="songs-heading">{simulators.light.title}</h2>
              <LightSimulator data={simulators.light} pair={pair} t={t} />
            </>
          )}
          {simulators.sound && (
            <>
              <h2 className="songs-heading">{simulators.sound.title}</h2>
              <WaterStateSimulator data={simulators.sound} pair={pair} />
            </>
          )}
          {simulators.magnetism && (
            <>
              <h2 className="songs-heading">{simulators.magnetism.title}</h2>
              <PredictSimulator data={simulators.magnetism} pair={pair} t={t} />
            </>
          )}
          {simulators.buoyancy && (
            <>
              <h2 className="songs-heading">{simulators.buoyancy.title}</h2>
              <PredictSimulator data={simulators.buoyancy} pair={pair} t={t} />
            </>
          )}
        </>
      )}

      {tab === "eng" && (
        <>
          <p className="page-intro">{t("modules.scienceLabEngIntro")}</p>
          {["bridge", "tower", "boat", "dam", "catapult", "crane"].map((id) => (
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
