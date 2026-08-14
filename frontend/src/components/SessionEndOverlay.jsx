import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSessionElapsedMinutes } from "../storage.js";

// Easy-to-tune knob: after this many minutes of session time, we gently
// suggest an offline break. This is a nudge, never a hard block.
export const SESSION_SUGGESTION_MINUTES = 15;

// Once the child dismisses the nudge (either way), don't show it again
// for the rest of this browser session/tab.
const DISMISSED_KEY = "abcmundo.sessionEndDismissed";

const ACTIVITIES = [
  { key: "sessionEndRead", emoji: "📚" },
  { key: "sessionEndExplore", emoji: "🌳" },
  { key: "sessionEndDraw", emoji: "🎨" },
  { key: "sessionEndBuild", emoji: "🧱" },
  { key: "sessionEndMove", emoji: "🏃" },
  { key: "sessionEndHelp", emoji: "👨‍🍳" },
];

function isDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // ignore
  }
}

export default function SessionEndOverlay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [pickedActivity, setPickedActivity] = useState(null);

  useEffect(() => {
    if (isDismissed()) return undefined;

    const check = () => {
      if (isDismissed()) return;
      if (getSessionElapsedMinutes() >= SESSION_SUGGESTION_MINUTES) {
        setVisible(true);
      }
    };

    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    markDismissed();
    setVisible(false);
    setPickedActivity(null);
  };

  const goToMissions = () => {
    markDismissed();
    setVisible(false);
    setPickedActivity(null);
    navigate("/missions");
  };

  return (
    <div className="session-end-backdrop" role="dialog" aria-modal="true">
      <div className="session-end-card">
        <p className="session-end-title">{t("modules.sessionEndTitle")}</p>
        <p className="session-end-body">{t("modules.sessionEndBody")}</p>

        {!pickedActivity ? (
          <div className="session-end-grid">
            {ACTIVITIES.map((activity) => (
              <button
                key={activity.key}
                type="button"
                className="session-end-activity-btn"
                onClick={() => setPickedActivity(activity.key)}
              >
                <span className="session-end-activity-emoji">{activity.emoji}</span>
                <span>{t(`modules.${activity.key}`)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="session-end-picked">
            <p>{t(`modules.${pickedActivity}`)} 🎉</p>
            <button type="button" className="big-btn" onClick={goToMissions}>
              {t("modules.sessionEndGoToMissions")}
            </button>
          </div>
        )}

        <button type="button" className="session-end-continue-btn" onClick={dismiss}>
          ▶️ {t("modules.sessionEndContinue")}
        </button>
      </div>
    </div>
  );
}
