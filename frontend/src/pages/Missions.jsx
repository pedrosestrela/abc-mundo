import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMissions } from "../content/index.js";
import { getLangPair, getProfile, getCompletedMissions, completeMission, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

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

export default function Missions() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const missions = getMissions(pair.mother);
  const [doneVersion, setDoneVersion] = useState(0);

  const todaySeed = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  const dailyIndex = useMemo(() => pickDailyIndex(missions.length, todaySeed), [missions.length, todaySeed]);
  const dailyMission = missions[dailyIndex];

  const completed = useMemo(() => getCompletedMissions(profile?.name), [profile?.name, doneVersion]);

  function handleComplete(missionId) {
    completeMission(profile?.name, missionId);
    pingProgress({ profileName: profile?.name, module: "missions", event: `mission_completed:${missionId}` });
    setDoneVersion((v) => v + 1);
  }

  if (!dailyMission) return null;

  const isDailyDone = completed.includes(dailyMission.id);

  return (
    <div className="page">
      <h1>{t("modules.missionsTitle")} 🧭</h1>
      <p className="page-intro">{t("modules.missionsIntro")}</p>

      <div className="mission-card mission-card-today">
        <div className="mission-badge">{t("modules.missionsToday")}</div>
        <div className="mission-emoji">{dailyMission.emoji}</div>
        <p className="mission-text">
          {dailyMission.text}
          <SpeakButton text={dailyMission.text} langCode={pair.mother} />
        </p>
        <div className="mission-supervision">
          {dailyMission.supervision === "adulto" || dailyMission.supervision === "adult"
            ? "👨‍👧 " + t("modules.missionsWithAdult")
            : "🧒 " + t("modules.missionsAlone")}
        </div>
        {isDailyDone ? (
          <div className="mission-done-tag">✅ {t("modules.missionsCompleted")}</div>
        ) : (
          <button type="button" className="big-btn" onClick={() => handleComplete(dailyMission.id)}>
            ✅ {t("modules.missionsMarkDone")}
          </button>
        )}
      </div>

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
