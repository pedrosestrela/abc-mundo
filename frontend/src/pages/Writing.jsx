import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlphabet } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";
import { getStrokes } from "../content/strokeOrder.js";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const LETTER_MODES = ["upper", "lower", "hand", "print"];

// "Corrida de Letras" (Letter Race): a lightweight timed game mode layered
// on top of the same TraceCanvas/StrokeGuide used by regular practice — no
// new drawing/canvas code, just a sequence of 5 random targets timed with a
// simple stopwatch and a star rating on the results screen. Age-tier aware:
// younger children get a more generous time window for 3 stars.
const RACE_LENGTH = 5;

// Tier -> seconds-per-target thresholds for 3/2/1 stars (lower = better).
const RACE_STAR_THRESHOLDS = {
  1: { three: 9, two: 15 },
  2: { three: 6, two: 10 },
  3: { three: 4, two: 7 },
};

function pickRaceTargets(alphabet, count) {
  const pool = alphabet.length > 0 ? alphabet : [];
  const picks = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    picks.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return picks;
}

function starsForAvgSeconds(avgSeconds, tier) {
  const th = RACE_STAR_THRESHOLDS[tier] || RACE_STAR_THRESHOLDS[2];
  if (avgSeconds <= th.three) return 3;
  if (avgSeconds <= th.two) return 2;
  return 1;
}

// Tracing canvas: adapted from DrawingCanvas.jsx (Art.jsx's drawing surface)
// but simplified for tracing practice — one pen colour, no palette, and a
// `guideChar` rendered as a big low-opacity background letter for the child
// to trace over. Touch/pointer handling mirrors the original exactly so it
// keeps working reliably on iPad.
// Renders faint directional guide lines (with an arrowhead at the end of
// each stroke and a small number marking its start) so the child can see
// which way to draw before/while tracing. Purely decorative — sits behind
// the drawing canvas and never intercepts pointer events.
function StrokeGuide({ char }) {
  const strokes = getStrokes(char);
  if (!strokes || strokes.length === 0) return null;

  return (
    <svg
      className="writing-stroke-guide"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {strokes.map((points, i) => {
        const d = points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
        const [ex, ey] = points[points.length - 1];
        const [px, py] = points[points.length - 2] || points[0];
        const angle = (Math.atan2(ey - py, ex - px) * 180) / Math.PI;
        const [sx, sy] = points[0];
        return (
          <g key={i}>
            <path d={d} className="writing-stroke-line" />
            <g transform={`translate(${ex}, ${ey}) rotate(${angle})`}>
              <polygon points="0,0 -6,-3 -6,3" className="writing-stroke-arrow" />
            </g>
            <circle cx={sx} cy={sy} r="4.5" className="writing-stroke-num-bg" />
            <text x={sx} y={sy} className="writing-stroke-num" textAnchor="middle" dominantBaseline="central">
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TraceCanvas({ guideChar, guideFontFamily, guideStroke, resetKey }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
  }, [resetKey, guideChar]);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDrawing(e) {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function draw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(e);
    ctx.strokeStyle = "#3d87ff";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function stopDrawing() {
    drawingRef.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }

  return (
    <div className="writing-canvas-wrap">
      <div
        className="writing-guide-char"
        style={{ fontFamily: guideFontFamily, WebkitTextStroke: guideStroke }}
        aria-hidden="true"
      >
        {guideChar}
      </div>
      <StrokeGuide char={guideChar} />
      <canvas
        ref={canvasRef}
        className="writing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button type="button" className="drawing-clear-btn writing-clear-btn" onClick={handleClear}>
        🧹 {t("modules.writingClear")}
      </button>
    </div>
  );
}

function RaceMode({ alphabet, pair, profile, tier }) {
  const { t } = useTranslation();
  const [targets, setTargets] = useState(() => pickRaceTargets(alphabet, RACE_LENGTH));
  const [step, setStep] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [stepStart, setStepStart] = useState(() => Date.now());
  const [times, setTimes] = useState([]);
  const [finished, setFinished] = useState(false);
  const [logged, setLogged] = useState(false);

  const current = targets[step];
  const totalSeconds = times.reduce((sum, s) => sum + s, 0);
  const avgSeconds = times.length > 0 ? totalSeconds / times.length : 0;
  const stars = finished ? starsForAvgSeconds(avgSeconds, tier) : 0;

  if (finished && !logged) {
    setLogged(true);
    recordSkillEvent(profile?.name, "writing-race", stars >= 2);
    pingProgress({
      profileName: profile?.name,
      module: "writing",
      event: `race_complete:${stars}stars`,
    });
  }

  function handleRaceDone() {
    const elapsed = (Date.now() - stepStart) / 1000;
    const nextTimes = [...times, elapsed];
    setTimes(nextTimes);
    if (step + 1 >= targets.length) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
      setStepStart(Date.now());
      setResetKey((k) => k + 1);
    }
  }

  function restart() {
    setTargets(pickRaceTargets(alphabet, RACE_LENGTH));
    setStep(0);
    setResetKey((k) => k + 1);
    setStepStart(Date.now());
    setTimes([]);
    setFinished(false);
    setLogged(false);
  }

  if (finished) {
    return (
      <div className="game-card">
        <div className="game-emoji">🏁</div>
        <p className="game-result writing-race-stars">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</p>
        <p className="page-intro">
          {t("modules.writingRaceTime").replace("{sec}", totalSeconds.toFixed(1))}
        </p>
        <button type="button" className="big-btn" onClick={restart}>
          {t("modules.writingRacePlayAgain")} 🔁
        </button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <>
      <div className="game-progress writing-race-progress">
        🏁 {step + 1} / {targets.length}
      </div>
      <div className="writing-target-row">
        <div className="writing-target-card">
          <div className="writing-target-letter">{current.upper}</div>
          <div className="writing-target-word">
            {current.emoji} {current.exampleWord}
            <SpeakButton text={current.exampleWord} langCode={pair.mother} />
          </div>
        </div>
      </div>
      <TraceCanvas
        key={`race-${step}`}
        guideChar={current.upper}
        guideFontFamily="inherit"
        guideStroke="3px #d8d8f0"
        resetKey={resetKey}
      />
      <button type="button" className="big-btn writing-done-btn" onClick={handleRaceDone}>
        ✅ {t("modules.writingDone")}
      </button>
    </>
  );
}

export default function Writing() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const alphabet = useMemo(() => getAlphabet(pair.mother), [pair.mother]);

  const [section, setSection] = useState("letters"); // "letters" | "numbers" | "race"
  const [letterIndex, setLetterIndex] = useState(0);
  const [digitIndex, setDigitIndex] = useState(0);
  const [mode, setMode] = useState("upper");
  const [resetKey, setResetKey] = useState(0);
  const [done, setDone] = useState(false);

  const letter = alphabet[letterIndex];
  const digit = DIGITS[digitIndex];

  useEffect(() => {
    setResetKey((k) => k + 1);
    setDone(false);
  }, [mode, letterIndex, digitIndex, section]);

  const helpTextByMode = {
    upper: t("modules.writingHelpUpper"),
    lower: t("modules.writingHelpLower"),
    hand: t("modules.writingHelpHand"),
    print: t("modules.writingHelpPrint"),
  };
  const numbersHelp = t("modules.writingHelpNumbers");

  function goNextLetter() {
    setLetterIndex((i) => (i + 1) % Math.max(alphabet.length, 1));
  }

  function goPrevLetter() {
    setLetterIndex((i) => (i - 1 + alphabet.length) % Math.max(alphabet.length, 1));
  }

  function goNextDigit() {
    setDigitIndex((i) => (i + 1) % DIGITS.length);
  }

  function goPrevDigit() {
    setDigitIndex((i) => (i - 1 + DIGITS.length) % DIGITS.length);
  }

  function handleDone() {
    setDone(true);
    const skill = section === "letters" ? `writing-letter-${mode}` : "writing-numbers";
    recordSkillEvent(profile?.name, skill, true);
    pingProgress({
      profileName: profile?.name,
      module: "writing",
      event: section === "letters" ? `letter:${letter?.letter}:${mode}` : `digit:${digit}`,
    });
    setTimeout(() => {
      if (section === "letters") {
        const modeIdx = LETTER_MODES.indexOf(mode);
        if (modeIdx >= 0 && modeIdx < LETTER_MODES.length - 1) {
          setMode(LETTER_MODES[modeIdx + 1]);
        } else {
          setMode("upper");
          goNextLetter();
        }
      } else {
        goNextDigit();
      }
    }, 900);
  }

  if (section === "letters" && !letter) return null;

  const guideByMode = {
    upper: { char: letter?.upper, fontFamily: "inherit", stroke: "3px #d8d8f0" },
    lower: { char: letter?.lower, fontFamily: "inherit", stroke: "3px #d8d8f0" },
    hand: { char: letter?.lower, fontFamily: "'Comic Sans MS', 'Bradley Hand', cursive", stroke: "3px #ffd9ec" },
    print: { char: letter?.upper, fontFamily: "'Arial Black', Arial, sans-serif", stroke: "3px #d0f0d8" },
  };

  return (
    <div className="page">
      <h1>{t("modules.writingTitle")} ✏️</h1>
      <p className="page-intro">{t("modules.writingIntro")}</p>

      <div className="phonics-tabs writing-section-tabs">
        <button
          type="button"
          className={"phonics-tab" + (section === "letters" ? " selected" : "")}
          onClick={() => setSection("letters")}
        >
          🔤 {t("modules.writingLetters")}
        </button>
        <button
          type="button"
          className={"phonics-tab" + (section === "numbers" ? " selected" : "")}
          onClick={() => setSection("numbers")}
        >
          🔢 {t("modules.writingNumbers")}
        </button>
        <button
          type="button"
          className={"phonics-tab" + (section === "race" ? " selected" : "")}
          onClick={() => setSection("race")}
        >
          🏁 {t("modules.writingRace")}
        </button>
      </div>

      {section === "race" && (
        <>
          <div className="help-btn-corner">
            <HelpButton text={t("modules.writingRaceHelp")} langCode={pair.mother} />
          </div>
          <p className="page-intro">{t("modules.writingRaceIntro")}</p>
          <RaceMode key={`race-mode-${alphabet.length}`} alphabet={alphabet} pair={pair} profile={profile} tier={tier} />
        </>
      )}

      {section === "letters" && (
        <>
          <div className="writing-target-row">
            <button type="button" className="writing-nav-btn" onClick={goPrevLetter} aria-label={t("modules.writingPrev")}>
              ◀
            </button>
            <div className="writing-target-card">
              <div className="writing-target-letter">{letter.letter}</div>
              <div className="writing-target-word">
                {letter.emoji} {letter.exampleWord}
                <SpeakButton text={letter.exampleWord} langCode={pair.mother} />
              </div>
            </div>
            <button type="button" className="writing-nav-btn" onClick={goNextLetter} aria-label={t("modules.writingNext")}>
              ▶
            </button>
          </div>

          <div className="phonics-tabs">
            <button type="button" className={"phonics-tab" + (mode === "upper" ? " selected" : "")} onClick={() => setMode("upper")}>
              <span className="phonics-tab-inner">
                🔠 {t("modules.writingUpper")}
                <TabSpeakIcon text={`${t("modules.writingUpper")}. ${helpTextByMode.upper}`} langCode={pair.mother} />
              </span>
            </button>
            <button type="button" className={"phonics-tab" + (mode === "lower" ? " selected" : "")} onClick={() => setMode("lower")}>
              <span className="phonics-tab-inner">
                🔡 {t("modules.writingLower")}
                <TabSpeakIcon text={`${t("modules.writingLower")}. ${helpTextByMode.lower}`} langCode={pair.mother} />
              </span>
            </button>
            <button type="button" className={"phonics-tab" + (mode === "hand" ? " selected" : "")} onClick={() => setMode("hand")}>
              <span className="phonics-tab-inner">
                ✍️ {t("modules.writingHand")}
                <TabSpeakIcon text={`${t("modules.writingHand")}. ${helpTextByMode.hand}`} langCode={pair.mother} />
              </span>
            </button>
            <button type="button" className={"phonics-tab" + (mode === "print" ? " selected" : "")} onClick={() => setMode("print")}>
              <span className="phonics-tab-inner">
                🖨️ {t("modules.writingPrint")}
                <TabSpeakIcon text={`${t("modules.writingPrint")}. ${helpTextByMode.print}`} langCode={pair.mother} />
              </span>
            </button>
          </div>

          <div className="help-btn-corner">
            <HelpButton text={helpTextByMode[mode]} langCode={pair.mother} />
          </div>

          <TraceCanvas
            key={`${letter.letter}-${mode}`}
            guideChar={guideByMode[mode].char}
            guideFontFamily={guideByMode[mode].fontFamily}
            guideStroke={guideByMode[mode].stroke}
            resetKey={resetKey}
          />

          <button type="button" className="big-btn writing-done-btn" onClick={handleDone} disabled={done}>
            ✅ {t("modules.writingDone")}
          </button>
          {done && <p className="writing-feedback">🌟 {t("modules.writingGreatJob")}</p>}
        </>
      )}

      {section === "numbers" && (
        <>
          <div className="writing-target-row">
            <button type="button" className="writing-nav-btn" onClick={goPrevDigit} aria-label={t("modules.writingPrev")}>
              ◀
            </button>
            <div className="writing-target-card">
              <div className="writing-target-letter">{digit}</div>
              <div className="writing-target-word">
                <SpeakButton text={digit} langCode={pair.mother} />
              </div>
            </div>
            <button type="button" className="writing-nav-btn" onClick={goNextDigit} aria-label={t("modules.writingNext")}>
              ▶
            </button>
          </div>

          <div className="help-btn-corner">
            <HelpButton text={numbersHelp} langCode={pair.mother} />
          </div>

          <div className="writing-count-row" aria-hidden="true">
            {Array.from({ length: Number(digit) }).map((_, i) => (
              <span key={i} className="writing-count-dot">
                ⭐
              </span>
            ))}
          </div>

          <TraceCanvas
            key={digit}
            guideChar={digit}
            guideFontFamily="'Arial Black', Arial, sans-serif"
            guideStroke="3px #d0d8f0"
            resetKey={resetKey}
          />

          <button type="button" className="big-btn writing-done-btn" onClick={handleDone} disabled={done}>
            ✅ {t("modules.writingDone")}
          </button>
          {done && <p className="writing-feedback">🌟 {t("modules.writingGreatJob")}</p>}
        </>
      )}
    </div>
  );
}
