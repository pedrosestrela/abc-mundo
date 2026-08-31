import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { pingProgress } from "../storage.js";
import SpeakButton from "./SpeakButton.jsx";
import MascotBubble from "./mascots/MascotBubble.jsx";

// "Ensina-me Tu" — a small, reusable teach-back ritual dropped in as an
// optional wrap-up step after a topic reveal, experiment, or exercise. A
// mascot pretends to be confused and asks the child to explain the topic
// back out loud. There is no speech-to-text grading here on purpose: the
// pedagogical value is in the act of explaining, not in judging whether the
// explanation was "correct". Flow: ask -> 🎤 start -> brief pulsing
// "listening" state (pure role-play, no audio is captured) -> ✅ done, with
// an always-encouraging reply, or 🔁 try again to reset the ritual.
//
// Usage:
//   <TeachBackPrompt
//     module="whys"
//     itemId={why.id}
//     topicText={why.question}
//     profile={profile}
//     pair={pair}
//     character="fox"
//     mood="confused"
//   />
export default function TeachBackPrompt({
  module,
  itemId,
  topicText,
  profile,
  pair,
  character = "milo",
  mood = "confused",
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState("ask"); // ask -> listening -> done
  const listenTimerRef = React.useRef(null);

  function start() {
    setPhase("listening");
    listenTimerRef.current = setTimeout(() => {
      setPhase("done");
      pingProgress({
        profileName: profile?.name,
        module,
        event: `teach_back:${module}:${itemId}:completed`,
      });
    }, 2200);
  }

  function retry() {
    if (listenTimerRef.current) clearTimeout(listenTimerRef.current);
    setPhase("ask");
  }

  React.useEffect(() => {
    return () => {
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current);
    };
  }, []);

  return (
    <div className="teach-back-prompt">
      <strong className="teach-back-heading">{t("modules.teachBackSectionTitle")}</strong>

      {phase !== "done" && (
        <MascotBubble character={character} mood={mood} langCode={pair?.mother}>
          {t("modules.teachBackIntro")} {topicText ? `"${topicText}"` : ""}
        </MascotBubble>
      )}

      {phase === "ask" && (
        <button type="button" className="big-btn teach-back-start-btn" onClick={start}>
          {t("modules.teachBackStart")}
        </button>
      )}

      {phase === "listening" && (
        <div className="teach-back-listening" role="status">
          <span className="teach-back-mic-pulse" aria-hidden="true">
            🎤
          </span>
          <p>{t("modules.teachBackListening")}</p>
        </div>
      )}

      {phase === "done" && (
        <div className="teach-back-done">
          <MascotBubble character={character} mood="happy" langCode={pair?.mother}>
            {t("modules.teachBackResponse")}
          </MascotBubble>
          <div className="teach-back-done-actions">
            <span className="teach-back-done-label">
              ✅ {t("modules.teachBackDone")}
              <SpeakButton text={t("modules.teachBackResponse")} langCode={pair?.mother} />
            </span>
            <button type="button" className="big-btn teach-back-retry-btn" onClick={retry}>
              {t("modules.teachBackRetry")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
