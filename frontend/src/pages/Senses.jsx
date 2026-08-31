import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSensesMissions } from "../content/index.js";
import {
  getLangPair,
  getProfile,
  getCompletedSensesMissions,
  completeSensesMission,
  pingProgress,
} from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";

// Fixed sense order + emoji/label key, so the grid is grouped the same way
// every time regardless of json array order.
const SENSES = [
  { id: "hearing", emoji: "👂" },
  { id: "smell", emoji: "👃" },
  { id: "touch", emoji: "✋" },
  { id: "taste", emoji: "👅" },
  { id: "sight", emoji: "👀" },
];

export default function Senses() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const missions = getSensesMissions(pair.mother);
  const [doneVersion, setDoneVersion] = useState(0);

  const completed = useMemo(
    () => getCompletedSensesMissions(profile?.name),
    [profile?.name, doneVersion]
  );

  function handleMarkDone(missionId) {
    completeSensesMission(profile?.name, missionId);
    pingProgress({ profileName: profile?.name, module: "senses", event: `mission_completed:${missionId}` });
    setDoneVersion((v) => v + 1);
  }

  const missionsBySense = useMemo(() => {
    const map = {};
    for (const sense of SENSES) map[sense.id] = [];
    for (const m of missions) {
      if (map[m.sense]) map[m.sense].push(m);
    }
    return map;
  }, [missions]);

  return (
    <div className="page">
      <h1>{t("modules.sensesTitle")} 🖐️👂👃👅👀</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.sensesHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.sensesIntro")}</p>
      <MascotBubble character="lumi" mood="happy" langCode={pair.mother}>
        {t("modules.sensesMascotIntro")}
      </MascotBubble>

      <p className="mission-badge">
        {completed.length}/{missions.length} {t("modules.sensesDoneLabel")}
      </p>

      {SENSES.map((sense) => (
        <div key={sense.id}>
          <h2 className="songs-heading">
            {sense.emoji} {t(`modules.sensesName_${sense.id}`)}
          </h2>
          <div className="mission-grid mission-grid-cards">
            {missionsBySense[sense.id].map((m) => {
              const done = completed.includes(m.id);
              return (
                <div key={m.id} className={"mission-card" + (done ? " done" : "")}>
                  <div className="mission-emoji">{m.emoji}</div>
                  {m.hook && (
                    <p className="mission-hook mission-hook-small">
                      💡 {m.hook}
                      <SpeakButton text={m.hook} langCode={pair.mother} />
                    </p>
                  )}
                  <p className="mission-text mission-text-small">
                    {m.text}
                    <SpeakButton text={m.text} langCode={pair.mother} />
                  </p>
                  <div className="mission-supervision">
                    {m.supervision === "adulto" ? "👨‍👧 " + t("modules.missionsWithAdult") : "🧒 " + t("modules.missionsAlone")}
                  </div>
                  {done ? (
                    <div className="mission-done-tag">✅ {t("modules.sensesDone")}</div>
                  ) : (
                    <button type="button" className="big-btn" onClick={() => handleMarkDone(m.id)}>
                      ✅ {t("modules.sensesMarkDone")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
