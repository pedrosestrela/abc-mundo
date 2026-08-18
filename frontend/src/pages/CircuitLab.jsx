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

// Each challenge is a small circuit board: a battery/power spot, one or two
// connector spots and the "payoff" component spot, laid out around a
// rounded-square track so the child can SEE the loop shape they are
// closing, not just fill in a flat row of blanks. "bottom" is always the
// decorative closing wire (drawn already-connected) unless a challenge
// claims that slot for itself, e.g. the traffic light's third LED.
const CHALLENGES = [
  {
    id: "lightbulb",
    emoji: "💡",
    titleKey: "circuitBulbTitle",
    slots: [
      { pos: "left", partId: "battery" },
      { pos: "top", partId: "wire" },
      { pos: "right", partId: "bulb" },
    ],
    successAnim: "circuit-success-glow",
    whyKey: "circuitBulbWhy",
  },
  {
    id: "motor",
    emoji: "🌀",
    titleKey: "circuitMotorTitle",
    slots: [
      { pos: "left", partId: "battery" },
      { pos: "top", partId: "wire" },
      { pos: "right", partId: "motor" },
    ],
    successAnim: "circuit-success-spin",
    whyKey: "circuitMotorWhy",
  },
  {
    id: "buzzer",
    emoji: "🔔",
    titleKey: "circuitBuzzerTitle",
    slots: [
      { pos: "left", partId: "battery" },
      { pos: "top", partId: "switch" },
      { pos: "right", partId: "buzzer" },
    ],
    successAnim: "circuit-success-shake",
    whyKey: "circuitBuzzerWhy",
  },
  {
    id: "traffic-light",
    emoji: "🚦",
    titleKey: "circuitTrafficTitle",
    slots: [
      { pos: "left", partId: "ledRed" },
      { pos: "top", partId: "ledYellow" },
      { pos: "right", partId: "ledGreen" },
    ],
    successAnim: "circuit-success-glow",
    whyKey: "circuitTrafficWhy",
    noDecorativeWire: true,
    decorativeIcon: "🔋",
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

// Assemble-the-board puzzle: the child taps a part in the tray to pick it
// up (armed state), then taps the board spot they think it belongs in.
// This is deliberately tap-to-place rather than real drag-and-drop — the
// same simplest-robust-interaction choice already proven for touch/mouse
// in JigsawGame's tap-to-swap tiles — but because the board renders the
// actual loop shape, the child is still placing pieces spatially onto a
// circuit they can see, not just tapping options in a flat sequence.
// A wrong placement never fails the child: the slot gently shakes, the
// part stays in the tray, and they can try again; an incomplete board
// shows a soft "falta uma peça" nudge instead of any error state.
function CircuitPuzzle({ challenge, pair, t, profile, onSolved }) {
  const tray = useMemo(() => {
    let attempt = shuffle(challenge.slots.map((s, index) => ({ ...s, index })));
    if (attempt.length > 1 && attempt.every((s, i) => s.index === i)) attempt = shuffle(attempt);
    return attempt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.id]);

  const [placedIndexes, setPlacedIndexes] = useState([]);
  const [armed, setArmed] = useState(null); // index (into challenge.slots) of the part currently picked up
  const [shakeSlot, setShakeSlot] = useState(null);
  const [shakeTray, setShakeTray] = useState(null);
  const [solved, setSolved] = useState(false);

  const remaining = tray.filter((s) => !placedIndexes.includes(s.index));
  const complete = placedIndexes.length === challenge.slots.length;

  function pickPart(slotDef) {
    if (complete) return;
    setArmed(armed === slotDef.index ? null : slotDef.index);
  }

  function tapBoardSlot(slotIndex) {
    if (complete || placedIndexes.includes(slotIndex)) return;
    if (armed === null) return;
    if (armed === slotIndex) {
      const next = [...placedIndexes, slotIndex];
      setPlacedIndexes(next);
      setArmed(null);
      if (next.length === challenge.slots.length) {
        setSolved(true);
        completeCircuit(profile?.name, challenge.id);
        recordSkillEvent(profile?.name, "circuit-lab", true);
        pingProgress({ profileName: profile?.name, module: "circuitLab", event: `solved:${challenge.id}` });
        onSolved();
      }
    } else {
      setShakeSlot(slotIndex);
      setShakeTray(armed);
      setTimeout(() => {
        setShakeSlot(null);
        setShakeTray(null);
      }, 400);
    }
  }

  return (
    <div className="game-card">
      <p className="mission-badge science-topic-badge">🔧 {t("modules.circuitPlaceHint")}</p>

      <div className={"circuit-board" + (solved ? " " + challenge.successAnim : "")}>
        {challenge.slots.map((slotDef, i) => {
          const part = PARTS[slotDef.partId];
          const isFilled = placedIndexes.includes(i);
          const isArmedTarget = armed !== null && !isFilled;
          return (
            <button
              key={i}
              type="button"
              className={
                "circuit-board-slot circuit-slot circuit-board-slot-" +
                slotDef.pos +
                (isFilled ? " filled" : "") +
                (isArmedTarget ? " targetable" : "") +
                (shakeSlot === i ? " wrong-shake" : "")
              }
              onClick={() => tapBoardSlot(i)}
              disabled={isFilled}
              aria-label={t(`modules.${part.key}`)}
            >
              {isFilled ? part.emoji : "○"}
            </button>
          );
        })}
        {!challenge.noDecorativeWire && (
          <span className="circuit-board-slot circuit-slot circuit-board-slot-bottom circuit-board-slot-decorative" aria-hidden="true">
            🔗
          </span>
        )}
        {challenge.noDecorativeWire && challenge.decorativeIcon && (
          <span className="circuit-board-slot circuit-slot circuit-board-slot-bottom circuit-board-slot-decorative" aria-hidden="true">
            {challenge.decorativeIcon}
          </span>
        )}
      </div>

      {!complete && (
        <>
          {armed !== null && (
            <p className="mission-text">✋ {t("modules.circuitChooseSlot")}</p>
          )}
          <div className="game-options circuit-tray">
            {remaining.map((s) => {
              const part = PARTS[s.partId];
              return (
                <button
                  key={s.index}
                  type="button"
                  className={
                    "big-btn game-option circuit-tray-part" +
                    (armed === s.index ? " circuit-tray-part-armed" : "") +
                    (shakeTray === s.index ? " wrong-shake" : "")
                  }
                  onClick={() => pickPart(s)}
                >
                  {part.emoji} {t(`modules.${part.key}`)}
                  <SpeakButton text={t(`modules.${part.key}`)} langCode={pair.mother} />
                </button>
              );
            })}
          </div>
        </>
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
