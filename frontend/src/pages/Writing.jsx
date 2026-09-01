import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlphabet, getOffScreenMissions } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { pickLine } from "../components/mascots/reactionLines.js";
import { getStrokes, BASIC_STROKES, evaluateAttempt, pathLength } from "../content/strokeOrder.js";

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

// Picks a deterministic-per-target off-screen mission template (same idea as
// DailyMission.jsx's pickOffScreenTemplate: stable for a given index, not a
// new random one on every render). `requireLetter` steers towards templates
// that reference {letter} (good for letter practice) or away from them (for
// numbers/shapes, where there's no letter to plug in) — falling back to the
// full pool if no template matches so it never returns nothing.
function pickOffScreenTemplate(templates, index, requireLetter) {
  if (!templates || templates.length === 0) return null;
  const filtered = templates.filter((tpl) =>
    requireLetter ? tpl.template.includes("{letter}") : !tpl.template.includes("{letter}")
  );
  const pool = filtered.length > 0 ? filtered : templates;
  return pool[index % pool.length];
}

function fillOffScreenTemplate(template, letter, number) {
  return template.replace(/\{letter\}/g, letter || "").replace(/\{number\}/g, String(number));
}

// Renders faint directional guide lines (with an arrowhead at the end of
// each stroke and a small number marking its start) so the child can see
// which way to draw before/while tracing. Purely decorative — sits behind
// the drawing canvas and never intercepts pointer events. The very first
// stroke's start point additionally gets a pulsing highlight ring so the
// single most important thing — "start here" — reads clearly at a glance.
function StrokeGuide({ strokes }) {
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
            {i === 0 && <circle cx={sx} cy={sy} r="7" className="writing-stroke-start-pulse" />}
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

// Finds the point at fraction `t` (0-1) along a polyline's arc length.
function pointAlong(points, t) {
  const segLens = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    segLens.push(l);
    total += l;
  }
  if (total === 0) return points[0];
  let target = t * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const segT = segLens[i] > 0 ? Math.min(1, target / segLens[i]) : 1;
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      return [x1 + (x2 - x1) * segT, y1 + (y2 - y1) * segT];
    }
    target -= segLens[i];
  }
  return points[points.length - 1];
}

// Plays a short "how it's drawn" animation before the child traces: a dot
// travels along each stroke path in order (revealing the line behind it as
// it goes), so the child watches the pencil motion once before attempting
// it themselves. Triggered by `playToken` changing (incrementing it again
// replays it, e.g. from the "Ver como se faz" button). Purely decorative —
// pointer-events: none — and sits above the static StrokeGuide.
function StrokeAnimation({ strokes, playToken, onPlayingChange }) {
  const [frame, setFrame] = useState(null);
  const rafRef = useRef(null);
  const prevTokenRef = useRef(0);

  useEffect(() => {
    if (!strokes || strokes.length === 0) return undefined;
    if (!playToken || playToken === prevTokenRef.current) return undefined;
    prevTokenRef.current = playToken;

    let cancelled = false;
    const lengths = strokes.map((s) => pathLength(s));
    const MS_PER_UNIT = 9;
    const MIN_STROKE_MS = 500;
    const GAP_MS = 220;
    const durations = lengths.map((l) => Math.max(MIN_STROKE_MS, l * MS_PER_UNIT));
    const totalDuration = durations.reduce((a, b) => a + b, 0) + GAP_MS * Math.max(0, strokes.length - 1);

    if (onPlayingChange) onPlayingChange(true);
    const start = performance.now();

    function tick(now) {
      if (cancelled) return;
      const elapsed = now - start;
      let acc = 0;
      let strokeIndex = null;
      let progress = 0;
      for (let i = 0; i < strokes.length; i++) {
        const dur = durations[i];
        if (elapsed < acc + dur) {
          strokeIndex = i;
          progress = dur > 0 ? Math.max(0, Math.min(1, (elapsed - acc) / dur)) : 1;
          break;
        }
        acc += dur + GAP_MS;
      }
      if (strokeIndex === null) {
        setFrame(null);
        if (onPlayingChange) onPlayingChange(false);
        return;
      }
      const dot = pointAlong(strokes[strokeIndex], progress);
      setFrame({ strokeIndex, progress, dot });
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playToken, strokes, onPlayingChange]);

  if (!strokes || strokes.length === 0 || !frame) return null;

  return (
    <svg
      className="writing-stroke-anim"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {strokes.map((points, i) => {
        if (i > frame.strokeIndex) return null;
        const d = points.map((p, idx) => `${idx === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
        const len = pathLength(points) || 1;
        const drawnFraction = i < frame.strokeIndex ? 1 : frame.progress;
        return (
          <path
            key={i}
            d={d}
            className="writing-stroke-anim-line"
            style={{ strokeDasharray: len, strokeDashoffset: len * (1 - drawnFraction) }}
          />
        );
      })}
      <circle cx={frame.dot[0]} cy={frame.dot[1]} r="3.4" className="writing-stroke-anim-dot" />
    </svg>
  );
}

// Tracing canvas: adapted from DrawingCanvas.jsx (Art.jsx's drawing surface)
// but simplified for tracing practice — one pen colour, no palette, and a
// `guideChar` rendered as a big low-opacity background letter for the child
// to trace over (omitted for shape practice, which has no letter). Touch/
// pointer handling mirrors the original exactly so it keeps working
// reliably on iPad. Also records the child's raw stroke points (normalized
// to a 0-100 space matching the guide strokes) so a parent component can
// run lightweight attempt validation via the exposed `getPoints()` ref
// method — the canvas itself stays dumb about what "good" looks like.
const TraceCanvas = React.forwardRef(function TraceCanvas(
  { guideChar, guideFontFamily, guideStroke, resetKey, strokes, playToken, onPlayingChange },
  ref
) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const attemptPointsRef = useRef([]);

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
    attemptPointsRef.current = [];
  }, [resetKey, guideChar]);

  useImperativeHandle(ref, () => ({
    getPoints: () => attemptPointsRef.current,
  }));

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top, rect };
  }

  function recordAttemptPoint(point) {
    const { rect } = point;
    if (!rect || rect.width === 0 || rect.height === 0) return;
    attemptPointsRef.current.push({ x: (point.x / rect.width) * 100, y: (point.y / rect.height) * 100 });
  }

  function startDrawing(e) {
    e.preventDefault();
    drawingRef.current = true;
    const point = getPoint(e);
    lastPointRef.current = point;
    recordAttemptPoint(point);
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
    recordAttemptPoint(point);
  }

  function stopDrawing() {
    drawingRef.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    attemptPointsRef.current = [];
  }

  return (
    <div className="writing-canvas-wrap">
      {guideChar && (
        <div
          className="writing-guide-char"
          style={{ fontFamily: guideFontFamily, WebkitTextStroke: guideStroke }}
          aria-hidden="true"
        >
          {guideChar}
        </div>
      )}
      <StrokeGuide strokes={strokes} />
      <StrokeAnimation strokes={strokes} playToken={playToken} onPlayingChange={onPlayingChange} />
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
});

// Bundles one practice target's full flow: auto-play the "how it's drawn"
// animation once when a new target appears, offer a replay button, let the
// child trace, and on "Done" run the lightweight attempt validation and
// show specific, warm feedback plus an off-screen paper-activity nudge.
// Never blocks progress — `onComplete` always fires and the parent always
// advances, regardless of attempt quality.
function TracePractice({ strokes, guideChar, guideFontFamily, guideStroke, offScreenText, onComplete, pair }) {
  const { t } = useTranslation();
  const [playToken, setPlayToken] = useState(1); // 1 => auto-play once on mount
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [quality, setQuality] = useState(null);
  const traceRef = useRef(null);

  function handleWatch() {
    setPlayToken((k) => k + 1);
  }

  function handleDone() {
    const points = traceRef.current ? traceRef.current.getPoints() : [];
    const result = evaluateAttempt(points, strokes);
    setQuality(result.quality);
    setDone(true);
    onComplete(result);
  }

  const feedbackByQuality = {
    tooShort: { emoji: "🐌", key: "writingFeedbackTooShort" },
    goodStart: { emoji: "🎯", key: "writingFeedbackGoodStart" },
    goodCoverage: { emoji: "✨", key: "writingFeedbackGoodCoverage" },
    attempt: { emoji: "💪", key: "writingFeedbackAttempt" },
  };
  const feedback = quality ? feedbackByQuality[quality] : null;

  return (
    <>
      <TraceCanvas
        ref={traceRef}
        guideChar={guideChar}
        guideFontFamily={guideFontFamily}
        guideStroke={guideStroke}
        resetKey={0}
        strokes={strokes}
        playToken={playToken}
        onPlayingChange={setPlaying}
      />
      <button type="button" className="big-btn writing-watch-btn" onClick={handleWatch} disabled={playing}>
        ▶️ {t("modules.writingWatchHow")}
      </button>
      <button type="button" className="big-btn writing-done-btn" onClick={handleDone} disabled={done}>
        ✅ {t("modules.writingDone")}
      </button>
      {done && feedback && (
        <p className="writing-feedback">
          {feedback.emoji} {t(`modules.${feedback.key}`)}
        </p>
      )}
      {done && feedback && pair && (
        <MascotBubble
          character="tomas"
          reaction={quality === "goodCoverage" || quality === "goodStart" ? "happy" : "encouraging"}
          langCode={pair.mother}
        >
          {pickLine(
            t(
              quality === "goodCoverage" || quality === "goodStart" ? "mascotLines.writingCorrect" : "mascotLines.writingEncouraging",
              { returnObjects: true }
            )
          )}
        </MascotBubble>
      )}
      {done && offScreenText && (
        <p className="writing-offscreen-suggestion">
          🌟 {t("modules.writingTryOnPaper")} {offScreenText}
        </p>
      )}
    </>
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
        strokes={getStrokes(current.upper)}
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
  const offScreenTemplates = useMemo(() => getOffScreenMissions(pair.mother), [pair.mother]);

  const [section, setSection] = useState("letters"); // "letters" | "numbers" | "race" | "basic"
  const [letterIndex, setLetterIndex] = useState(0);
  const [digitIndex, setDigitIndex] = useState(0);
  const [basicIndex, setBasicIndex] = useState(0);
  const [mode, setMode] = useState("upper");

  const letter = alphabet[letterIndex];
  const digit = DIGITS[digitIndex];
  const basicShape = BASIC_STROKES[basicIndex];

  const helpTextByMode = {
    upper: t("modules.writingHelpUpper"),
    lower: t("modules.writingHelpLower"),
    hand: t("modules.writingHelpHand"),
    print: t("modules.writingHelpPrint"),
  };
  const numbersHelp = t("modules.writingHelpNumbers");
  const basicHelp = t("modules.writingBasicHelp");

  const lettersOffScreen = useMemo(() => {
    const tpl = pickOffScreenTemplate(offScreenTemplates, letterIndex, true);
    return tpl ? fillOffScreenTemplate(tpl.template, letter?.upper, 3) : null;
  }, [offScreenTemplates, letterIndex, letter]);

  const numbersOffScreen = useMemo(() => {
    const tpl = pickOffScreenTemplate(offScreenTemplates, digitIndex, false);
    return tpl ? fillOffScreenTemplate(tpl.template, letter?.upper, digit) : null;
  }, [offScreenTemplates, digitIndex, digit, letter]);

  const basicOffScreen = useMemo(() => {
    const tpl = pickOffScreenTemplate(offScreenTemplates, basicIndex, false);
    return tpl ? fillOffScreenTemplate(tpl.template, letter?.upper, 3) : null;
  }, [offScreenTemplates, basicIndex, letter]);

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

  function goNextBasicShape() {
    setBasicIndex((i) => (i + 1) % BASIC_STROKES.length);
  }

  function goPrevBasicShape() {
    setBasicIndex((i) => (i - 1 + BASIC_STROKES.length) % BASIC_STROKES.length);
  }

  function handleComplete(result) {
    const skill =
      section === "letters" ? `writing-letter-${mode}` : section === "numbers" ? "writing-numbers" : "writing-basic-shapes";
    const madeRealAttempt = result ? result.quality !== "tooShort" : true;
    recordSkillEvent(profile?.name, skill, madeRealAttempt);
    pingProgress({
      profileName: profile?.name,
      module: "writing",
      event:
        section === "letters"
          ? `letter:${letter?.letter}:${mode}:${result?.quality || "n/a"}`
          : section === "numbers"
          ? `digit:${digit}:${result?.quality || "n/a"}`
          : `shape:${basicShape?.id}:${result?.quality || "n/a"}`,
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
      } else if (section === "numbers") {
        goNextDigit();
      } else if (section === "basic") {
        goNextBasicShape();
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
      <MascotBubble character="tomas" reaction="curious" langCode={pair.mother}>
        {t("mascotLines.writingOpening")}
      </MascotBubble>

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
          className={"phonics-tab" + (section === "basic" ? " selected" : "")}
          onClick={() => setSection("basic")}
        >
          🧩 {t("modules.writingBasicStrokes")}
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

          <TracePractice
            key={`${letter.letter}-${mode}`}
            strokes={getStrokes(guideByMode[mode].char)}
            guideChar={guideByMode[mode].char}
            guideFontFamily={guideByMode[mode].fontFamily}
            guideStroke={guideByMode[mode].stroke}
            offScreenText={lettersOffScreen}
            onComplete={handleComplete}
            pair={pair}
          />
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

          <TracePractice
            key={digit}
            strokes={getStrokes(digit)}
            guideChar={digit}
            guideFontFamily="'Arial Black', Arial, sans-serif"
            guideStroke="3px #d0d8f0"
            offScreenText={numbersOffScreen}
            onComplete={handleComplete}
            pair={pair}
          />
        </>
      )}

      {section === "basic" && basicShape && (
        <>
          <p className="page-intro">{t("modules.writingBasicStrokesIntro")}</p>

          <div className="writing-target-row">
            <button type="button" className="writing-nav-btn" onClick={goPrevBasicShape} aria-label={t("modules.writingPrev")}>
              ◀
            </button>
            <div className="writing-target-card">
              <div className="writing-target-letter">{basicShape.emoji}</div>
              <div className="writing-target-word">{t(`modules.${basicShape.labelKey}`)}</div>
            </div>
            <button type="button" className="writing-nav-btn" onClick={goNextBasicShape} aria-label={t("modules.writingNext")}>
              ▶
            </button>
          </div>

          <div className="help-btn-corner">
            <HelpButton text={basicHelp} langCode={pair.mother} />
          </div>

          <TracePractice
            key={basicShape.id}
            strokes={basicShape.strokes}
            guideChar={null}
            guideFontFamily="inherit"
            guideStroke="3px #d8d8f0"
            offScreenText={basicOffScreen}
            onComplete={handleComplete}
            pair={pair}
          />
        </>
      )}
    </div>
  );
}
