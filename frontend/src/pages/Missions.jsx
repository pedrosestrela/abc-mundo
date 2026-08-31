import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMissions } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getCompletedMissions,
  completeMission,
  getMissionReactions,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { IllustrationTree, IllustrationSun } from "../components/illustrations/index.js";

// Picks a deterministic "mission of the day" so it doesn't change every
// re-render, but still rotates day to day without needing a backend.
function pickDailyIndex(length, dateSeed) {
  if (length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < dateSeed.length; i++) {
    hash = (hash * 31 + dateSeed.charCodeAt(i)) % 100000;
  }
  return hash % length;
}

// Picks a deterministic set of "featured" missions for the current week, so
// the child sees a small curated list ("Missões em Destaque") instead of the
// whole flat bank right away. Rotates weekly (deterministic by ISO-ish week
// seed), not truly random, so no backend/state is needed and it stays
// stable across re-renders/reloads within the same week.
function pickFeaturedIndexes(length, weekSeed, count) {
  if (length === 0) return [];
  let hash = 0;
  for (let i = 0; i < weekSeed.length; i++) {
    hash = (hash * 31 + weekSeed.charCodeAt(i)) % 1000000;
  }
  const picked = [];
  const used = new Set();
  let cursor = hash;
  const n = Math.min(count, length);
  while (picked.length < n) {
    cursor = (cursor * 7 + 13) % length;
    if (!used.has(cursor)) {
      used.add(cursor);
      picked.push(cursor);
    }
  }
  return picked;
}

const REACTIONS = [
  { value: "easy", emoji: "😊" },
  { value: "interesting", emoji: "🤔" },
  { value: "hard", emoji: "😅" },
];

export default function Missions() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const missions = getMissions(pair.mother);
  const [doneVersion, setDoneVersion] = useState(0);
  const [reflectingId, setReflectingId] = useState(null);

  const todaySeed = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  const weekSeed = useMemo(() => {
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d - firstDay) / 86400000 + firstDay.getDay() + 1) / 7);
    return `${d.getFullYear()}-w${weekNumber}-${profile?.name || "Explorer"}`;
  }, [profile?.name]);

  const dailyIndex = useMemo(() => pickDailyIndex(missions.length, todaySeed), [missions.length, todaySeed]);
  const dailyMission = missions[dailyIndex];

  const featuredIndexes = useMemo(
    () => pickFeaturedIndexes(missions.length, weekSeed, 4),
    [missions.length, weekSeed]
  );
  const featuredMissions = useMemo(
    () => featuredIndexes.map((i) => missions[i]).filter((m) => m && m.id !== dailyMission?.id),
    [featuredIndexes, missions, dailyMission?.id]
  );

  const completed = useMemo(() => getCompletedMissions(profile?.name), [profile?.name, doneVersion]);
  const reactions = useMemo(() => getMissionReactions(profile?.name), [profile?.name, doneVersion]);

  function handleMarkDone(missionId) {
    setReflectingId(missionId);
  }

  function handleReaction(missionId, reaction) {
    completeMission(profile?.name, missionId, reaction);
    pingProgress({ profileName: profile?.name, module: "missions", event: `mission_completed:${missionId}` });
    setReflectingId(null);
    setDoneVersion((v) => v + 1);
  }

  function handleSkipReflection(missionId) {
    completeMission(profile?.name, missionId);
    pingProgress({ profileName: profile?.name, module: "missions", event: `mission_completed:${missionId}` });
    setReflectingId(null);
    setDoneVersion((v) => v + 1);
  }

  if (!dailyMission) return null;

  const isDailyDone = completed.includes(dailyMission.id);

  function renderMissionActions(mission) {
    const done = completed.includes(mission.id);
    if (done) {
      const reaction = reactions[mission.id];
      const reactionEmoji = REACTIONS.find((r) => r.value === reaction)?.emoji;
      return (
        <div className="mission-done-tag">
          ✅ {t("modules.missionsCompleted")}
          {reactionEmoji && <span className="mission-reaction-tag"> {reactionEmoji}</span>}
        </div>
      );
    }
    if (reflectingId === mission.id) {
      return (
        <div className="mission-reflection">
          <p className="mission-reflection-prompt">{t("modules.missionsReflectionPrompt")}</p>
          <div className="mission-reaction-row">
            {REACTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                className="mission-reaction-btn"
                onClick={() => handleReaction(mission.id, r.value)}
                aria-label={t(`modules.missionsReaction_${r.value}`)}
              >
                {r.emoji}
              </button>
            ))}
          </div>
          <button type="button" className="mission-reflection-skip" onClick={() => handleSkipReflection(mission.id)}>
            {t("modules.missionsSkipReflection")}
          </button>
        </div>
      );
    }
    return (
      <button type="button" className="big-btn" onClick={() => handleMarkDone(mission.id)}>
        ✅ {t("modules.missionsMarkDone")}
      </button>
    );
  }

  return (
    <div className="page">
      <h1>{t("modules.missionsTitle")} 🧭</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.missionsHelpMain")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.missionsIntro")}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <IllustrationSun size={36} />
        <IllustrationTree size={36} />
      </div>
      <MascotBubble character="lumi" mood="happy" langCode={pair.mother}>
        {t("modules.missionsMascotIntro")}
      </MascotBubble>

      <div className="mission-card mission-card-today">
        <div className="mission-badge">{t("modules.missionsToday")}</div>
        <div className="mission-emoji">{dailyMission.emoji}</div>
        {dailyMission.hook && (
          <p className="mission-hook">
            💡 {dailyMission.hook}
            <SpeakButton text={dailyMission.hook} langCode={pair.mother} />
          </p>
        )}
        <p className="mission-text">
          {dailyMission.text}
          <SpeakButton text={dailyMission.text} langCode={pair.mother} />
        </p>
        <div className="mission-supervision">
          {dailyMission.supervision === "adulto" || dailyMission.supervision === "adult"
            ? "👨‍👧 " + t("modules.missionsWithAdult")
            : "🧒 " + t("modules.missionsAlone")}
        </div>
        {renderMissionActions(dailyMission)}
      </div>

      {featuredMissions.length > 0 && (
        <>
          <h2 className="songs-heading">{t("modules.missionsFeaturedTitle")}</h2>
          <div className="mission-featured-row">
            {featuredMissions.map((m) => (
              <div key={m.id} className="mission-card mission-card-featured">
                <div className="mission-emoji">{m.emoji}</div>
                {m.hook && <p className="mission-hook mission-hook-small">💡 {m.hook}</p>}
                <p className="mission-text mission-text-small">
                  {m.text}
                  <SpeakButton text={m.text} langCode={pair.mother} />
                </p>
                <div className="mission-supervision">
                  {m.supervision === "adulto" || m.supervision === "adult"
                    ? "👨‍👧 " + t("modules.missionsWithAdult")
                    : "🧒 " + t("modules.missionsAlone")}
                </div>
                {renderMissionActions(m)}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="songs-heading">
        {t("modules.missionsPassport")} ({completed.length}/{missions.length})
      </h2>
      <div className="mission-grid">
        {missions.map((m) => {
          const done = completed.includes(m.id);
          return (
            <div key={m.id} className={"mission-tile" + (done ? " done" : "")}>
              <div className="mission-tile-emoji">{m.emoji}</div>
              {done && <div className="mission-tile-check">✅</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
