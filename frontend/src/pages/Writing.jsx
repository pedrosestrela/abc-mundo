import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlphabet } from "../content/index.js";
import { getLangPair, getProfile, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const LETTER_MODES = ["upper", "lower", "hand", "print"];

// Tracing canvas: adapted from DrawingCanvas.jsx (Art.jsx's drawing surface)
// but simplified for tracing practice — one pen colour, no palette, and a
// `guideChar` rendered as a big low-opacity background letter for the child
// to trace over. Touch/pointer handling mirrors the original exactly so it
// keeps working reliably on iPad.
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

export default function Writing() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const alphabet = useMemo(() => getAlphabet(pair.mother), [pair.mother]);

  const [section, setSection] = useState("letters"); // "letters" | "numbers"
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
      </div>

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
