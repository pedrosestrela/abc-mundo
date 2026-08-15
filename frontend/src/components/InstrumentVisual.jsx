import React from "react";
import { SOLFEGE_PT } from "../music.js";

// Maps each pitched (non-keyboard, non-drum) instrument id to a visual
// "family" — used both here and by the caller to decide whether to render
// this component at all instead of the shared piano keyboard.
export const INSTRUMENT_FAMILY = {
  guitar: "strings",
  violin: "bowed",
  cello: "bowed",
  flute: "wind",
  clarinet: "wind",
  saxophone: "wind",
  trumpet: "wind",
  harp: "harp",
  xylophone: "mallet",
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
// currently just the guitar. Kept as a per-instrument config map (rather
// than a single hardcoded shape) so a future plucked-string instrument can
// be added the same way the bowed/wind families are.
const STRINGS_CONFIG = {
  guitar: { width: 320, height: 220, inset: 4, rx: 22, bodyClass: "guitar-body", stringInset: 18, shape: "figure8" },
};

function StringsVisual({ notes, activeNote, onPress, instrument }) {
  const cfg = STRINGS_CONFIG[instrument] || STRINGS_CONFIG.guitar;
  const { width, height, bodyClass, stringInset, shape } = cfg;
  const gap = height / (notes.length + 1);
  return (
    <svg
      className={"instrument-visual-svg strings-visual strings-visual-" + instrument}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Cordas"
    >
      {shape === "round" ? (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - 8}
          ry={height / 2 - 6}
          className={"instrument-body " + bodyClass}
        />
      ) : (
        <rect x={4} y={4} width={width - 8} height={height - 8} rx={cfg.rx} className={"instrument-body " + bodyClass} />
      )}
      {notes.map((note, i) => {
        const y = gap * (i + 1);
        return (
          <g key={note} className="instrument-hit-area" onClick={() => onPress(note)}>
            <rect x={0} y={y - gap / 2} width={width} height={gap} fill="transparent" />
            <line
              x1={stringInset}
              y1={y}
              x2={width - stringInset}
              y2={y}
              className={"instrument-string" + (activeNote === note ? " active" : "")}
            />
            <text x={width - stringInset - 6} y={y + 4} textAnchor="end" className="instrument-note-label">
              {noteLabel(note)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Curved strings over a violin-body silhouette for the "friccionadas" family.
// Violin is smaller with a tighter waist; cello is a real size bigger and a
// different wood tone, matching the real-world size difference.
const BOWED_CONFIG = {
  violin: { width: 280, height: 200, waist: 42, bodyClass: "violin-body", spread: 22 },
  cello: { width: 320, height: 230, waist: 36, bodyClass: "cello-body", spread: 26 },
};

function BowedVisual({ notes, activeNote, onPress, instrument }) {
  const cfg = BOWED_CONFIG[instrument] || BOWED_CONFIG.violin;
  const { width, height, waist, bodyClass, spread } = cfg;
  const mid = width / 2;
  return (
    <svg className={"instrument-visual-svg bowed-visual bowed-visual-" + instrument} viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Cordas de arco">
      <path
        d={`M ${mid} 10
            C ${mid - 70} 30, ${mid - 90} 70, ${mid - waist} ${height / 2}
            C ${mid - 90} ${height - 90}, ${mid - 70} ${height - 30}, ${mid} ${height - 10}
            C ${mid + 70} ${height - 30}, ${mid + 90} ${height - 90}, ${mid + waist} ${height / 2}
            C ${mid + 90} 70, ${mid + 70} 30, ${mid} 10 Z`}
        className={"instrument-body " + bodyClass}
      />
      <ellipse cx={mid - waist - 6} cy={height / 2} rx={4} ry={16} className="bowed-fhole" />
      <ellipse cx={mid + waist + 6} cy={height / 2} rx={4} ry={16} className="bowed-fhole" />
      {notes.map((note, i) => {
        const cx = mid - spread * ((notes.length - 1) / 2) + spread * i;
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

// Wind-family silhouette (finger-hole/valve body) shared by flute, clarinet,
// saxophone and trumpet. Each instrument gets its own body color/shape and
// hit-marker style (round finger holes for the woodwinds, square valve caps
// for the brass trumpet) so the four don't look identical despite sharing
// one layout — mirrors how the "bowed" and "strings" families vary a shared
// silhouette per instrument.
const WIND_CONFIG = {
  flute: { bodyClass: "flute-body", markShape: "hole" },
  clarinet: { bodyClass: "clarinet-body", markShape: "hole" },
  saxophone: { bodyClass: "saxophone-body", markShape: "hole" },
  trumpet: { bodyClass: "trumpet-body", markShape: "valve" },
};

function WindVisual({ notes, activeNote, onPress, instrument }) {
  const cfg = WIND_CONFIG[instrument] || WIND_CONFIG.flute;
  const width = 320;
  const height = 120;
  const gap = width / (notes.length + 1);
  return (
    <svg
      className={"instrument-visual-svg wind-visual wind-visual-" + instrument}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Instrumento de sopro"
    >
      <rect x={10} y={height / 2 - 22} width={width - 20} height={44} rx={22} className={"instrument-body " + cfg.bodyClass} />
      {notes.map((note, i) => {
        const cx = gap * (i + 1);
        const active = activeNote === note ? " active" : "";
        return (
          <g key={note} className="instrument-hit-area" onClick={() => onPress(note)}>
            <circle cx={cx} cy={height / 2} r={20} fill="transparent" />
            {cfg.markShape === "valve" ? (
              <rect
                x={cx - 10}
                y={height / 2 - 10}
                width={20}
                height={20}
                rx={4}
                className={"instrument-hole wind-valve" + active}
              />
            ) : (
              <circle cx={cx} cy={height / 2} r={13} className={"instrument-hole" + active} />
            )}
            <text x={cx} y={height - 6} textAnchor="middle" className="instrument-note-label">
              {noteLabel(note)}
            </text>
          </g>
        );
      })}
    </svg>
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

// Colorful mallet bars for the xylophone: longer bars for lower notes,
// shorter for higher ones, laid out side by side like a real instrument
// instead of reusing the piano-keyboard UI.
const BAR_COLORS = ["#ff6b6b", "#ff9f45", "#ffd93d", "#6bcb77", "#4d96ff", "#9b5de5", "#ff5c8d"];

function MalletVisual({ notes, activeNote, onPress }) {
  const width = 320;
  const height = 190;
  const barGap = width / notes.length;
  const barWidth = barGap * 0.72;
  const maxBarHeight = height - 40;
  return (
    <svg className="instrument-visual-svg mallet-visual" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Xilofone">
      <rect x={4} y={height - 26} width={width - 8} height={18} rx={8} className="instrument-body mallet-frame" />
      {notes.map((note, i) => {
        const barHeight = maxBarHeight - i * (maxBarHeight / (notes.length + 1.5));
        const bx = barGap * i + (barGap - barWidth) / 2;
        const by = height - 26 - barHeight;
        return (
          <g key={note} className="instrument-hit-area" onClick={() => onPress(note)}>
            <rect
              x={bx}
              y={by}
              width={barWidth}
              height={barHeight}
              rx={6}
              fill={BAR_COLORS[i % BAR_COLORS.length]}
              className={"mallet-bar" + (activeNote === note ? " active" : "")}
            />
            <circle cx={bx + barWidth / 2} cy={by + 14} r={3.5} className="mallet-bar-hole" />
            <text x={bx + barWidth / 2} y={height - 4} textAnchor="middle" className="instrument-note-label">
              {noteLabel(note)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Small drum-kit layout for the Percussão pads: distinct shapes (round bass
// drum, cylindrical snare, cymbal, smaller tom) arranged spatially like a
// real kit, with a brief scale/flash "hit" animation on tap. Purely visual —
// the caller still owns playDrumPad/DRUM_PADS and passes them in unchanged.
export function DrumKitVisual({ pads, activePad, onPress, labels = {} }) {
  const width = 320;
  const height = 220;
  const layout = {
    hihat: { cx: 70, cy: 60, shape: "cymbal" },
    tom: { cx: 190, cy: 55, shape: "tom" },
    snare: { cx: 250, cy: 120, shape: "snare" },
    kick: { cx: 140, cy: 165, shape: "kick" },
  };

  return (
    <svg
      className="instrument-visual-svg drum-kit-visual"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Bateria"
    >
      {pads.map((padId) => {
        const pos = layout[padId] || { cx: width / 2, cy: height / 2, shape: "tom" };
        const isActive = activePad === padId;
        const hitClass = "drum-kit-piece drum-kit-" + pos.shape + (isActive ? " hit" : "");
        return (
          <g
            key={padId}
            className="instrument-hit-area"
            onClick={() => onPress(padId)}
            role="button"
            aria-label={labels[padId] || padId}
          >
            {pos.shape === "cymbal" && (
              <>
                <line x1={pos.cx} y1={pos.cy + 18} x2={pos.cx} y2={pos.cy + 55} className="drum-kit-stand" />
                <ellipse cx={pos.cx} cy={pos.cy} rx={44} ry={14} className={hitClass} />
              </>
            )}
            {pos.shape === "tom" && (
              <>
                <rect x={pos.cx - 30} y={pos.cy} width={60} height={40} rx={8} className={hitClass} />
                <ellipse cx={pos.cx} cy={pos.cy} rx={30} ry={10} className={hitClass + " drum-kit-head"} />
              </>
            )}
            {pos.shape === "snare" && (
              <>
                <rect x={pos.cx - 36} y={pos.cy} width={72} height={46} rx={8} className={hitClass} />
                <ellipse cx={pos.cx} cy={pos.cy} rx={36} ry={11} className={hitClass + " drum-kit-head"} />
              </>
            )}
            {pos.shape === "kick" && (
              <ellipse cx={pos.cx} cy={pos.cy} rx={54} ry={50} className={hitClass} />
            )}
            <rect
              x={pos.cx - 55}
              y={pos.cy - 40}
              width={110}
              height={110}
              fill="transparent"
            />
            <text x={pos.cx} y={pos.cy + (pos.shape === "kick" ? 6 : 66)} textAnchor="middle" className="instrument-note-label">
              {labels[padId] || padId}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function InstrumentVisual({ instrument, activeNote, onPress }) {
  const family = getInstrumentFamily(instrument);
  if (family === "strings") return <StringsVisual notes={NOTES} activeNote={activeNote} onPress={onPress} instrument={instrument} />;
  if (family === "bowed") return <BowedVisual notes={NOTES} activeNote={activeNote} onPress={onPress} instrument={instrument} />;
  if (family === "wind") return <WindVisual notes={NOTES} activeNote={activeNote} onPress={onPress} instrument={instrument} />;
  if (family === "harp") return <HarpVisual notes={NOTES} activeNote={activeNote} onPress={onPress} />;
  if (family === "mallet") return <MalletVisual notes={NOTES} activeNote={activeNote} onPress={onPress} />;
  return null;
}
