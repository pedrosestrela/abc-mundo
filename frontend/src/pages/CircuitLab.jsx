import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLangPair, getProfile, getCompletedCircuits, completeCircuit, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import {
  IllustrationBattery,
  IllustrationWire,
  IllustrationBulb,
  IllustrationMotor,
  IllustrationSwitch,
  IllustrationBuzzer,
} from "../components/illustrations/index.js";

// Shared component pool. Traffic-light challenge uses its own 3 coloured
// "LED" pieces instead, kept inline below.
const PARTS = {
  battery: { emoji: "🔋", Illustration: IllustrationBattery, key: "circuitPartBattery" },
  wire: { emoji: "🔗", Illustration: IllustrationWire, key: "circuitPartWire" },
  bulb: { emoji: "💡", Illustration: IllustrationBulb, key: "circuitPartBulb" },
  motor: { emoji: "🌀", Illustration: IllustrationMotor, key: "circuitPartMotor" },
  switch: { emoji: "🔘", Illustration: IllustrationSwitch, key: "circuitPartSwitch" },
  buzzer: { emoji: "🔔", Illustration: IllustrationBuzzer, key: "circuitPartBuzzer" },
  ledRed: { emoji: "🔴", key: "circuitPartLedRed" },
  ledYellow: { emoji: "🟡", key: "circuitPartLedYellow" },
  ledGreen: { emoji: "🟢", key: "circuitPartLedGreen" },
};

const CHALLENGES = [
  {
    id: "lightbulb",
    emoji: "💡",
    titleKey: "circuitBulbTitle",
    sequence: ["battery", "wire", "bulb"],
    successAnim: "circuit-success-glow",
    whyKey: "circuitBulbWhy",
  },
  {
    id: "motor",
    emoji: "🌀",
    titleKey: "circuitMotorTitle",
    sequence: ["battery", "wire", "motor"],
    successAnim: "circuit-success-spin",
    whyKey: "circuitMotorWhy",
  },
  {
    id: "buzzer",
    emoji: "🔔",
    titleKey: "circuitBuzzerTitle",
    sequence: ["battery", "switch", "buzzer"],
    successAnim: "circuit-success-shake",
    whyKey: "circuitBuzzerWhy",
  },
  {
    id: "traffic-light",
    emoji: "🚦",
    titleKey: "circuitTrafficTitle",
    sequence: ["ledRed", "ledYellow", "ledGreen"],
    successAnim: "circuit-success-glow",
    whyKey: "circuitTrafficWhy",
  },
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tap-to-connect puzzle: pick the circuit components in the right order.
// A wrong tap never fails the child — it just shakes and lets them retry —
// and an incomplete circuit shows a gentle "falta uma peça" nudge instead
// of any error state.
function CircuitPuzzle({ challenge, pair, t, profile, onSolved }) {
  const scrambled = useMemo(() => {
    let attempt = shuffle(challenge.sequence.map((id, index) => ({ id, index })));
    if (attempt.length > 1 && attempt.every((s, i) => s.index === i)) attempt = shuffle(attempt);
    return attempt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);
  const [placed, setPlaced] = useState([]);
  const [shake, setShake] = useState(null);
  const [solved, setSolved] = useState(false);
  const remaining = scrambled.filter((s) => !placed.includes(s.index));
  const complete = placed.length === challenge.sequence.length;

  function tapPart(part) {
    if (complete) return;
    if (part.index === placed.length) {
      const next = [...placed, part.index];
      setPlaced(next);
      if (next.length === challenge.sequence.length) {
        setSolved(true);
        completeCircuit(profile?.name, challenge.id);
        recordSkillEvent(profile?.name, "circuit-lab", true);
        pingProgress({ profileName: profile?.name, module: "circuitLab", event: `solved:${challenge.id}` });
        onSolved();
      }
    } else {
      setShake(part.index);
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <div className="game-card">
      <p className="mission-badge science-topic-badge">🔧 {t("modules.circuitPlaceHint")}</p>

      <div className={"circuit-slots" + (solved ? " " + challenge.successAnim : "")}>
        {challenge.sequence.map((partId, i) => {
          const part = PARTS[partId];
          return (
            <span key={i} className="circuit-slot">
              {i < placed.length ? part.emoji : "⬜️"}
            </span>
          );
        })}
      </div>

      {!complete && (
        <div className="game-options">
          {remaining.map((s) => {
            const part = PARTS[challenge.sequence[s.index]];
            return (
              <button
                key={s.index}
                type="button"
                className={"big-btn game-option" + (shake === s.index ? " wrong-shake" : "")}
                onClick={() => tapPart(s)}
              >
                {part.emoji} {t(`modules.${part.key}`)}
              </button>
            );
          })}
        </div>
      )}

      {!complete && <p className="mission-text">🤔 {t("modules.circuitMissingPiece")}</p>}

      {complete && (
        <p className="game-result">
          ⚡ {t("modules.circuitSuccess")}
          <SpeakButton text={t("modules.circuitSuccess")} langCode={pair.mother} />
        </p>
      )}
    </div>
  );
}

export default function CircuitLab() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const [openId, setOpenId] = useState(null);
  const [showWhy, setShowWhy] = useState(false);
  const [version, setVersion] = useState(0);

  const solved = useMemo(() => getCompletedCircuits(profile?.name), [profile?.name, version]);
  const openChallenge = CHALLENGES.find((c) => c.id === openId);

  function openChallengeCard(c) {
    const nowOpen = c.id !== openId;
    setOpenId(nowOpen ? c.id : null);
    setShowWhy(false);
  }

  return (
    <div className="page">
      <h1>{t("modules.circuitTitle")} 🔌</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.circuitHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.circuitIntro")}</p>
      <MascotBubble character="bit" mood="happy" langCode={pair.mother}>
        {t("modules.circuitIntro")}
      </MascotBubble>

      {!openChallenge && (
        <div className="computing-grid">
          {CHALLENGES.map((c) => {
            const done = solved.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={"computing-term-btn" + (done ? " done" : "")}
                onClick={() => openChallengeCard(c)}
              >
                <span className="computing-term-emoji">{c.emoji}</span>
                {t(`modules.${c.titleKey}`)}
                {done && <span className="mundos-tile-sub">✅</span>}
              </button>
            );
          })}
        </div>
      )}

      {openChallenge && (
        <div>
          <div className="game-emoji">{openChallenge.emoji}</div>
          <p className="mission-text">
            {t(`modules.${openChallenge.titleKey}`)}
            <SpeakButton text={t(`modules.${openChallenge.titleKey}`)} langCode={pair.mother} />
          </p>

          {!showWhy && (
            <CircuitPuzzle
              challenge={openChallenge}
              pair={pair}
              t={t}
              profile={profile}
              onSolved={() => setTimeout(() => setShowWhy(true), 900)}
            />
          )}

          {showWhy && (
            <div className="game-card done">
              <p className="mission-badge science-topic-badge">🔬 {t("modules.circuitWhyClosedLoop")}</p>
              <p className="game-result">
                {t(`modules.${openChallenge.whyKey}`)}
                <SpeakButton text={t(`modules.${openChallenge.whyKey}`)} langCode={pair.mother} />
              </p>
              <button type="button" className="big-btn" onClick={() => openChallengeCard(openChallenge)}>
                ✅ {t("modules.circuitBack")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
