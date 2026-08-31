import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMuseum, getArchaeology } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getExploredMuseumExhibits,
  exploreMuseumExhibit,
  getCompletedExcavations,
  completeExcavation,
  recordSkillEvent,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";

// --- Museu ABC: rooms of tappable exhibits, "guess first" pattern ---

function ExhibitCard({ exhibit, chosenOptionId, onGuess, t, mother }) {
  const guessed = chosenOptionId != null;
  const chosen = guessed ? exhibit.options.find((o) => o.id === chosenOptionId) : null;

  return (
    <div className="game-card">
      <p className="mission-text">
        {exhibit.emoji} {exhibit.name}
        <SpeakButton text={exhibit.name} langCode={mother} />
      </p>

      {!guessed && (
        <>
          <p className="page-intro">
            {t("modules.museumGuessQuestion")}
            <SpeakButton text={t("modules.museumGuessQuestion")} langCode={mother} />
          </p>
          <div className="quiz-options">
            {exhibit.options.map((opt) => (
              <button key={opt.id} type="button" className="option-btn" onClick={() => onGuess(exhibit, opt)}>
                {opt.text}
              </button>
            ))}
          </div>
        </>
      )}

      {guessed && (
        <div className="science-explanation">
          <div className="mission-badge computing-topic-badge">
            {chosen.correct ? "🎉" : "🤔"} {chosen.text}
          </div>
          <p className="page-intro">{t("modules.museumRealAnswer")}</p>
          <p className="game-result">
            {exhibit.explanation}
            <SpeakButton text={exhibit.explanation} langCode={mother} />
          </p>
        </div>
      )}
    </div>
  );
}

function MuseumTab({ t, mother, profile }) {
  const rooms = useMemo(() => getMuseum(mother), [mother]);
  const [roomId, setRoomId] = useState(null);
  const [openExhibitId, setOpenExhibitId] = useState(null);
  const [version, setVersion] = useState(0);

  const explored = useMemo(() => getExploredMuseumExhibits(profile?.name), [profile?.name, version]);
  // Session-only map of which option the child picked per exhibit id, so the
  // reveal shows the actual choice made (persisted "explored" only tracks
  // that the exhibit was opened, not which guess was chosen).
  const [guesses, setGuesses] = useState({});

  function roomExploredCount(r) {
    return r.exhibits.filter((e) => explored.includes(`${r.id}:${e.id}`)).length;
  }

  function handleOpenRoom(r) {
    setRoomId(r.id);
    setOpenExhibitId(null);
    pingProgress({ profileName: profile?.name, module: "museum", event: `room_opened:${r.id}` });
  }

  function handleGuess(exhibit, opt) {
    setOpenExhibitId(exhibit.id);
    setGuesses((g) => ({ ...g, [exhibit.id]: opt.id }));
    exploreMuseumExhibit(profile?.name, room.id, exhibit.id);
    recordSkillEvent(profile?.name, "museum-guess", opt.correct);
    pingProgress({ profileName: profile?.name, module: "museum", event: `exhibit_guessed:${room.id}:${exhibit.id}:${opt.correct ? "correct" : "incorrect"}` });
    setVersion((v) => v + 1);
  }

  if (!room) {
    return (
      <div className="computing-grid">
        {rooms.map((r) => {
          const count = roomExploredCount(r);
          const done = count === r.exhibits.length;
          return (
            <button key={r.id} type="button" className={"computing-term-btn" + (done ? " done" : "")} onClick={() => handleOpenRoom(r)}>
              <span className="computing-term-emoji">{r.emoji}</span>
              {r.title}
              <span className="mundos-tile-sub">
                {count}/{r.exhibits.length}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <p className="mission-text">
        {room.emoji} {room.title}
        <SpeakButton text={room.title} langCode={mother} />
      </p>
      <p className="page-intro">
        {room.intro}
        <SpeakButton text={room.intro} langCode={mother} />
      </p>
      <div className="teardown-part-list">
        {room.exhibits.map((exhibit) => (
          <ExhibitCard
            key={exhibit.id}
            exhibit={exhibit}
            chosenOptionId={guesses[exhibit.id] ?? null}
            onGuess={handleGuess}
            t={t}
            mother={mother}
          />
        ))}
      </div>
      <button type="button" className="big-btn" onClick={() => setRoomId(null)}>
        ✅ {t("modules.museumRoomBack")}
      </button>
    </div>
  );
}

// --- Pequeno Arqueólogo: dig-to-reveal artifacts, then a reasoning question ---

function DigScenario({ scenario, t, mother, profile, onComplete, completed }) {
  const [foundIds, setFoundIds] = useState(() => new Set());
  const [answeredId, setAnsweredId] = useState(null);

  const allFound = foundIds.size === scenario.artifacts.length;

  function handleDig(artifact) {
    if (foundIds.has(artifact.id)) return;
    const next = new Set(foundIds);
    next.add(artifact.id);
    setFoundIds(next);
    recordSkillEvent(profile?.name, "excavation-dig", true);
    pingProgress({ profileName: profile?.name, module: "archaeology", event: `artifact_found:${scenario.id}:${artifact.id}` });
  }

  function handleAnswer(opt) {
    setAnsweredId(opt.id);
    recordSkillEvent(profile?.name, "excavation-reasoning", opt.correct);
    pingProgress({ profileName: profile?.name, module: "archaeology", event: `reasoning_answered:${scenario.id}:${opt.correct ? "correct" : "incorrect"}` });
    if (!completed) {
      completeExcavation(profile?.name, scenario.id);
      onComplete();
    }
  }

  const chosen = answeredId ? scenario.options.find((o) => o.id === answeredId) : null;

  return (
    <div>
      <p className="mission-text">
        {scenario.emoji} {scenario.title}
        <SpeakButton text={scenario.title} langCode={mother} />
      </p>
      <p className="page-intro">
        {scenario.intro}
        <SpeakButton text={scenario.intro} langCode={mother} />
      </p>

      <div className="computing-grid">
        {scenario.artifacts.map((a) => {
          const found = foundIds.has(a.id);
          return (
            <button key={a.id} type="button" className={"computing-term-btn" + (found ? " done" : "")} onClick={() => handleDig(a)}>
              <span className="computing-term-emoji">{found ? a.emoji : "⬛"}</span>
              {found ? a.name : t("modules.archDigHint")}
            </button>
          );
        })}
      </div>

      {foundIds.size > 0 && (
        <div className="teardown-part-list">
          {scenario.artifacts
            .filter((a) => foundIds.has(a.id))
            .map((a) => (
              <div key={a.id} className="science-explanation">
                <div className="mission-badge computing-topic-badge">
                  {a.emoji} {a.name}
                </div>
                <p className="game-result">
                  {a.detail}
                  <SpeakButton text={a.detail} langCode={mother} />
                </p>
              </div>
            ))}
        </div>
      )}

      {allFound && (
        <div className="game-card">
          <p className="game-result">🏆 {t("modules.archAllFound")}</p>
          <p className="page-intro">{t("modules.archReasoningHeading")}</p>
          <p className="mission-text">
            {scenario.reasoningQuestion}
            <SpeakButton text={scenario.reasoningQuestion} langCode={mother} />
          </p>

          {!chosen && (
            <div className="quiz-options">
              {scenario.options.map((opt) => (
                <button key={opt.id} type="button" className="option-btn" onClick={() => handleAnswer(opt)}>
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {chosen && (
            <div className="science-explanation">
              <div className="mission-badge computing-topic-badge">
                {chosen.correct ? "🎉" : "🤔"} {chosen.text}
              </div>
              <p className="page-intro">{t("modules.archExplanationHeading")}</p>
              <p className="game-result">
                {scenario.explanation}
                <SpeakButton text={scenario.explanation} langCode={mother} />
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DigTab({ t, mother, profile }) {
  const scenarios = useMemo(() => getArchaeology(mother), [mother]);
  const [scenarioId, setScenarioId] = useState(null);
  const [version, setVersion] = useState(0);
  const completed = useMemo(() => getCompletedExcavations(profile?.name), [profile?.name, version]);

  const scenario = scenarios.find((s) => s.id === scenarioId);

  if (!scenario) {
    return (
      <div className="computing-grid">
        {scenarios.map((s) => {
          const done = completed.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={"computing-term-btn" + (done ? " done" : "")}
              onClick={() => {
                setScenarioId(s.id);
                pingProgress({ profileName: profile?.name, module: "archaeology", event: `scenario_opened:${s.id}` });
              }}
            >
              <span className="computing-term-emoji">{s.emoji}</span>
              {s.title}
              {done && <span className="mundos-tile-sub">🏆</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <DigScenario
        scenario={scenario}
        t={t}
        mother={mother}
        profile={profile}
        completed={completed.includes(scenario.id)}
        onComplete={() => setVersion((v) => v + 1)}
      />
      <button type="button" className="big-btn" onClick={() => setScenarioId(null)}>
        ✅ {t("modules.archBack")}
      </button>
    </div>
  );
}

export default function Museum() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const [tab, setTab] = useState("museum");

  return (
    <div className="page">
      <h1>{t("modules.museumTitle")} 🏛️</h1>
      <div className="help-btn-corner">
        <HelpButton text={t(tab === "museum" ? "modules.museumHelp" : "modules.archHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t(tab === "museum" ? "modules.museumIntro" : "modules.archIntro")}</p>

      <div className="tab-row" role="tablist">
        <button type="button" className={"tab-btn" + (tab === "museum" ? " active" : "")} onClick={() => setTab("museum")}>
          🏛️ {t("modules.museumTabMuseum")}
        </button>
        <button type="button" className={"tab-btn" + (tab === "dig" ? " active" : "")} onClick={() => setTab("dig")}>
          🔎 {t("modules.museumTabDig")}
        </button>
      </div>

      {tab === "museum" ? (
        <MuseumTab t={t} mother={pair.mother} profile={profile} />
      ) : (
        <DigTab t={t} mother={pair.mother} profile={profile} />
      )}
    </div>
  );
}
