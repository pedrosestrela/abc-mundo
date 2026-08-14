import React from "react";
import { SOLFEGE_PT } from "../music.js";

// Diatonic letter index used to work out how many staff-steps a note sits
// away from the bottom line (E4), so we can place a note-head at the right
// height without needing a full notation engine. Each diatonic step (line to
// adjacent space, or space to adjacent line) is worth STEP_PX vertically.
const LETTER_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function diatonicStep(note) {
  const letter = note[0];
  const octave = Number(note[note.length - 1]);
  return octave * 7 + LETTER_INDEX[letter];
}

const E4_STEP = diatonicStep("E4"); // bottom line of the treble staff

const STEP_PX = 8; // half the gap between two staff lines
const LINE_GAP = STEP_PX * 2;
const STAFF_LINES = 5;
const STAFF_WIDTH = 280;
const STAFF_LEFT = 70;
const STAFF_RIGHT = STAFF_WIDTH - 16;

// Bottom line (E4) sits near the bottom of the drawing, leaving room above
// for ledger lines up to C6 and below for the C4 ledger line.
const BOTTOM_LINE_Y = 150;

function noteY(note) {
  const diff = diatonicStep(note) - E4_STEP;
  return BOTTOM_LINE_Y - diff * STEP_PX;
}

// Returns the y-positions of any ledger lines a note needs, above or below
// the staff (the staff itself spans steps 0..8 relative to the bottom line).
function ledgerLineYs(note) {
  const diff = diatonicStep(note) - E4_STEP;
  const ys = [];
  if (diff < 0) {
    // Ledger lines below the staff, one per even step at/below -2, -4, ...
    for (let step = -2; step >= diff; step -= 2) {
      ys.push(BOTTOM_LINE_Y - step * STEP_PX);
    }
  } else if (diff > 8) {
    for (let step = 10; step <= diff; step += 2) {
      ys.push(BOTTOM_LINE_Y - step * STEP_PX);
    }
  }
  return ys;
}

export default function MusicStaff({ note }) {
  const lines = Array.from({ length: STAFF_LINES }, (_, i) => BOTTOM_LINE_Y - i * LINE_GAP);
  const topY = lines[lines.length - 1];
  const svgHeight = 220;

  const y = note ? noteY(note) : null;
  const ledgers = note ? ledgerLineYs(note) : [];
  const solfege = note ? SOLFEGE_PT[note] || note : null;

  return (
    <div className="music-staff-wrap">
      <svg
        className="music-staff-svg"
        viewBox={`0 0 ${STAFF_WIDTH} ${svgHeight}`}
        width="100%"
        role="img"
        aria-label={note ? `Nota ${solfege} (${note}) na pauta` : "Pauta musical"}
      >
        {lines.map((ly, i) => (
          <line key={i} x1={STAFF_LEFT} y1={ly} x2={STAFF_RIGHT} y2={ly} className="staff-line" />
        ))}

        {/* Treble clef glyph */}
        <text x={16} y={topY + LINE_GAP * 2 + 6} className="staff-clef">
          𝄞
        </text>

        {ledgers.map((ly, i) => (
          <line
            key={"ledger-" + i}
            x1={STAFF_LEFT + LINE_GAP * 3.4}
            y1={ly}
            x2={STAFF_LEFT + LINE_GAP * 3.4 + 24}
            y2={ly}
            className="staff-ledger"
          />
        ))}

        {note && (
          <g className="staff-note">
            <ellipse cx={STAFF_LEFT + LINE_GAP * 3.4 + 12} cy={y} rx={9} ry={7} className="staff-notehead" />
          </g>
        )}
      </svg>
      <div className="music-staff-label">{note ? `${solfege} (${note})` : " "}</div>
    </div>
  );
}
