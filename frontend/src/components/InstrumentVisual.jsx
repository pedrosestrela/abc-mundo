import React, { useEffect, useState } from "react";
import { SOLFEGE_PT } from "../music.js";

// Maps each pitched (non-keyboard, non-drum) instrument id to a visual
// "family" — used both here and by the caller to decide whether to render
// this component at all instead of the shared piano keyboard.
export const INSTRUMENT_FAMILY = {
  guitar: "strings",
  cavaquinho: "strings",
  portugueseGuitar: "strings",
  violin: "bowed",
  flute: "wind",
  accordion: "bellows",
  concertina: "bellows",
  harp: "harp",
};

export function getInstrumentFamily(instrumentId) {
  return INSTRUMENT_FAMILY[instrumentId] || null;
}

// A single octave of natural notes is plenty for a tappable fretboard/hole
// layout aimed at young children — matches the "Ouvido Musical" scale too.
const NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];

function noteLabel(note) {
  return SOLFEGE_PT[note] || note;
}

// Horizontal strings for the "dedilhadas" (plucked, flat-body) family:
// guitar, cavaquinho, guitarra portuguesa.
function StringsVisual({ notes, activeNote, onPress }) {
  const width = 320;
  const height = 210;
  const gap = height / (notes.length + 1);
  return (
    <svg className="instrument-visual-svg strings-visual" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Cordas">
      <rect x={4} y={4} width={width - 8} height={height - 8} rx={16} className="instrument-body" />
      {notes.map((note, i) => {
        const y = gap * (i + 1);
        return (
          <g key={note} className="instrument-hit-area" onClick={() => onPress(note)}>
            <rect x={0} y={y - gap / 2} width={width} height={gap} fill="transparent" />
            <line
              x1={20}
              y1={y}
              x2={width - 20}
              y2={y}
              className={"instrument-string" + (activeNote === note ? " active" : "")}
            />
            <text x={width - 14} y={y + 4} textAnchor="end" className="instrument-note-label">
              {noteLabel(note)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Curved strings over a violin-body silhouette for the "friccionadas" family.
function BowedVisual({ notes, activeNote, onPress }) {
  const width = 320;
  const height = 220;
  return (
    <svg className="instrument-visual-svg bowed-visual" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Cordas de arco">
      <path
        d={`M ${width / 2} 10
            C ${width / 2 - 70} 30, ${width / 2 - 90} 70, ${width / 2 - 40} 100
            C ${width / 2 - 90} 130, ${width / 2 - 70} 190, ${width / 2} 210
            C ${width / 2 + 70} 190, ${width / 2 + 90} 130, ${width / 2 + 40} 100
            C ${width / 2 + 90} 70, ${width / 2 + 70} 30, ${width / 2} 10 Z`}
        className="instrument-body violin-body"
      />
      {notes.map((note, i) => {
        const spread = 26;
        const cx = width / 2 - spread * ((notes.length - 1) / 2) + spread * i;
        return (
          <g key={note} className="instrument-hit-area" onClick={() => onPress(note)}>
            <rect x={cx - 12} y={0} width={24} height={height} fill="transparent" />
            <path
              d={`M ${cx} 8 C ${cx - 10} ${height / 2}, ${cx + 10} ${height / 2}, ${cx} ${height - 8}`}
              className={"instrument-string bowed-string" + (activeNote === note ? " active" : "")}
            />
            <text x={cx} y={height - 2} textAnchor="middle" className="instrument-note-label">
              {noteLabel(note)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Flute/recorder silhouette with tappable finger-hole circles.
function WindVisual({ notes, activeNote, onPress }) {
  const width = 320;
  const height = 120;
  const gap = width / (notes.length + 1);
  return (
    <svg className="instrument-visual-svg wind-visual" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Instrumento de sopro">
      <rect x={10} y={height / 2 - 22} width={width - 20} height={44} rx={22} className="instrument-body flute-body" />
      {notes.map((note, i) => {
        const cx = gap * (i + 1);
        return (
          <g key={note} className="instrument-hit-area" onClick={() => onPress(note)}>
            <circle cx={cx} cy={height / 2} r={20} fill="transparent" />
            <circle
              cx={cx}
              cy={height / 2}
              r={13}
              className={"instrument-hole" + (activeNote === note ? " active" : "")}
            />
            <text x={cx} y={height - 6} textAnchor="middle" className="instrument-note-label">
              {noteLabel(note)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Accordion/concertina silhouette with tappable buttons and a bellows shape
// that visually squeezes when a note is played.
function BellowsVisual({ notes, activeNote, onPress }) {
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (!activeNote) return;
    setPulsing(true);
    const timer = window.setTimeout(() => setPulsing(false), 280);
    return () => window.clearTimeout(timer);
  }, [activeNote]);

  const width = 320;
  const height = 190;
  const cols = 4;
  const rows = Math.ceil(notes.length / cols);

  return (
    <div className={"bellows-wrap" + (pulsing ? " pulsing" : "")}>
      <svg className="instrument-visual-svg bellows-visual" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Fole">
        <rect x={0} y={20} width={64} height={height - 40} rx={10} className="instrument-body bellows-side" />
        <rect x={width - 64} y={20} width={64} height={height - 40} rx={10} className="instrument-body bellows-side" />
        <g className="bellows-folds">
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={i}
              x1={70 + i * ((width - 140) / 5)}
              y1={24}
              x2={70 + i * ((width - 140) / 5)}
              y2={height - 24}
              className="bellows-fold-line"
            />
          ))}
        </g>
      </svg>
      <div className="bellows-buttons" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {notes.map((note) => (
          <button
            key={note}
            type="button"
            className={"bellows-button" + (activeNote === note ? " active" : "")}
            onClick={() => onPress(note)}
          >
            {noteLabel(note)}
          </button>
        ))}
      </div>
    </div>
  );
}

// Angled/vertical fan of strings for the harp — deliberately not horizontal,
// so it reads as visually distinct from the flat-body "strings" family.
function HarpVisual({ notes, activeNote, onPress }) {
  const width = 260;
  const height = 220;
  const topX = 50;
  const bottomStartX = 20;
  const bottomGap = (width - 60) / (notes.length - 1 || 1);
  return (
    <svg className="instrument-visual-svg harp-visual" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Harpa">
      <path
        d={`M 10 20 C 40 10, ${width - 30} 30, ${width - 20} 200 L ${width - 60} 210 C ${width - 90} 90, 30 60, 10 20 Z`}
        className="instrument-body harp-frame"
      />
      {notes.map((note, i) => {
        const bx = bottomStartX + bottomGap * i;
        const ty = 26 + (i * (height - 60)) / (notes.length - 1 || 1);
        return (
          <g key={note} className="instrument-hit-area" onClick={() => onPress(note)}>
            <rect x={Math.min(topX, bx) - 14} y={ty - 10} width={Math.abs(topX - bx) + 28} height={200 - ty} fill="transparent" />
            <line
              x1={topX}
              y1={ty}
              x2={bx}
              y2={200}
              className={"instrument-string harp-string" + (activeNote === note ? " active" : "")}
            />
            <text x={bx} y={214} textAnchor="middle" className="instrument-note-label">
              {noteLabel(note)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function InstrumentVisual({ instrument, activeNote, onPress }) {
  const family = getInstrumentFamily(instrument);
  if (family === "strings") return <StringsVisual notes={NOTES} activeNote={activeNote} onPress={onPress} />;
  if (family === "bowed") return <BowedVisual notes={NOTES} activeNote={activeNote} onPress={onPress} />;
  if (family === "wind") return <WindVisual notes={NOTES} activeNote={activeNote} onPress={onPress} />;
  if (family === "bellows") return <BellowsVisual notes={NOTES} activeNote={activeNote} onPress={onPress} />;
  if (family === "harp") return <HarpVisual notes={NOTES} activeNote={activeNote} onPress={onPress} />;
  return null;
}
