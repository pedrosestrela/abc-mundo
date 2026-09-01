// Stroke-order guidance data for the Writing/tracing module.
//
// Each entry maps an uppercase letter or digit to an ordered array of
// "strokes" — the individual pen movements a child makes to form the
// character, in the order conventionally taught in early literacy.
//
// Every stroke is a polyline: an array of [x, y] points in a normalized
// 0-100 coordinate space (x: left->right, y: top->bottom), roughly matching
// the bounding box of the big guide letter rendered behind the tracing
// canvas in Writing.jsx. Rendering draws a faint line through the points
// and an arrowhead at the final point, pointing in the direction of travel
// (from the second-to-last point to the last point). Multi-stroke letters
// get a small numbered label near the start of each stroke.
//
// This is standard, well-established letter-formation stroke order (as
// taught in early-childhood handwriting curricula), not invented data.

export const STROKE_ORDER = {
  // Uppercase letters
  A: [
    [[30, 90], [50, 10]],
    [[50, 10], [70, 90]],
    [[35, 60], [65, 60]],
  ],
  B: [
    [[30, 10], [30, 90]],
    [[30, 10], [55, 10], [65, 25], [55, 40], [30, 40]],
    [[30, 40], [60, 40], [70, 65], [60, 90], [30, 90]],
  ],
  C: [
    [[70, 25], [55, 12], [35, 20], [25, 50], [35, 80], [55, 88], [70, 75]],
  ],
  D: [
    [[30, 10], [30, 90]],
    [[30, 10], [55, 10], [70, 50], [55, 90], [30, 90]],
  ],
  E: [
    [[30, 10], [30, 90]],
    [[30, 10], [65, 10]],
    [[30, 50], [58, 50]],
    [[30, 90], [65, 90]],
  ],
  F: [
    [[30, 10], [30, 90]],
    [[30, 10], [65, 10]],
    [[30, 50], [58, 50]],
  ],
  G: [
    [[70, 25], [55, 12], [35, 20], [25, 50], [35, 80], [55, 88], [70, 75], [70, 55], [52, 55]],
  ],
  H: [
    [[30, 10], [30, 90]],
    [[70, 10], [70, 90]],
    [[30, 50], [70, 50]],
  ],
  I: [
    [[50, 10], [50, 90]],
  ],
  J: [
    [[65, 10], [65, 70], [55, 88], [40, 88], [28, 75]],
  ],
  K: [
    [[30, 10], [30, 90]],
    [[68, 10], [30, 50]],
    [[30, 50], [68, 90]],
  ],
  L: [
    [[30, 10], [30, 90]],
    [[30, 90], [65, 90]],
  ],
  M: [
    [[25, 90], [25, 10]],
    [[25, 10], [50, 55]],
    [[50, 55], [75, 10]],
    [[75, 10], [75, 90]],
  ],
  N: [
    [[28, 90], [28, 10]],
    [[28, 10], [72, 90]],
    [[72, 90], [72, 10]],
  ],
  O: [
    [[50, 10], [30, 20], [22, 50], [30, 80], [50, 90], [70, 80], [78, 50], [70, 20], [50, 10]],
  ],
  P: [
    [[30, 10], [30, 90]],
    [[30, 10], [58, 10], [68, 25], [58, 40], [30, 40]],
  ],
  Q: [
    [[50, 10], [30, 20], [22, 50], [30, 80], [50, 90], [70, 80], [78, 50], [70, 20], [50, 10]],
    [[55, 65], [75, 90]],
  ],
  R: [
    [[30, 10], [30, 90]],
    [[30, 10], [58, 10], [68, 25], [58, 40], [30, 40]],
    [[30, 40], [68, 90]],
  ],
  S: [
    [[68, 20], [52, 10], [35, 15], [28, 28], [38, 45], [62, 55], [72, 68], [65, 85], [48, 90], [32, 80]],
  ],
  T: [
    [[25, 10], [75, 10]],
    [[50, 10], [50, 90]],
  ],
  U: [
    [[30, 10], [30, 65], [38, 85], [50, 90], [62, 85], [70, 65], [70, 10]],
  ],
  V: [
    [[25, 10], [50, 90]],
    [[50, 90], [75, 10]],
  ],
  W: [
    [[22, 10], [35, 90]],
    [[35, 90], [50, 45]],
    [[50, 45], [65, 90]],
    [[65, 90], [78, 10]],
  ],
  X: [
    [[28, 10], [72, 90]],
    [[72, 10], [28, 90]],
  ],
  Y: [
    [[25, 10], [50, 50]],
    [[75, 10], [50, 50]],
    [[50, 50], [50, 90]],
  ],
  Z: [
    [[28, 10], [72, 10]],
    [[72, 10], [28, 90]],
    [[28, 90], [72, 90]],
  ],

  // Digits
  0: [
    [[50, 10], [30, 20], [22, 50], [30, 80], [50, 90], [70, 80], [78, 50], [70, 20], [50, 10]],
  ],
  1: [
    [[35, 25], [50, 10]],
    [[50, 10], [50, 90]],
  ],
  2: [
    [[28, 25], [35, 12], [55, 10], [68, 20], [68, 35], [50, 55], [28, 80], [28, 90], [72, 90]],
  ],
  3: [
    [[28, 18], [45, 10], [62, 15], [65, 28], [52, 42], [65, 55], [68, 72], [55, 88], [35, 85], [25, 75]],
  ],
  4: [
    [[58, 10], [25, 60], [70, 60]],
    [[58, 10], [58, 90]],
  ],
  5: [
    [[65, 10], [32, 10], [30, 42], [48, 38], [62, 48], [65, 68], [55, 85], [35, 85], [25, 75]],
  ],
  6: [
    [[62, 12], [42, 25], [30, 50], [28, 70], [38, 88], [55, 88], [68, 75], [65, 58], [50, 50], [35, 58]],
  ],
  7: [
    [[25, 10], [72, 10]],
    [[72, 10], [40, 90]],
  ],
  8: [
    [[50, 10], [38, 20], [38, 35], [50, 45], [62, 35], [62, 20], [50, 10]],
    [[50, 45], [35, 58], [32, 75], [42, 88], [58, 88], [68, 75], [65, 58], [50, 45]],
  ],
  9: [
    [[65, 45], [62, 28], [48, 18], [35, 25], [32, 40], [42, 50], [58, 45], [65, 30]],
    [[65, 45], [65, 70], [55, 88], [40, 88]],
  ],
};

// Look up stroke data for a character regardless of case (digits pass
// through unchanged). Returns null if no stroke data exists (e.g. lowercase
// letters and cursive/hand forms, which are not yet covered).
export function getStrokes(char) {
  if (char == null) return null;
  const key = /^[a-zA-Z]$/.test(char) ? char.toUpperCase() : char;
  return STROKE_ORDER[key] || null;
}

// --- Pre-letter "basic strokes" practice ---
//
// Before attempting real letters, young children build the fine-motor
// control they need by tracing simple, generic shapes: straight lines,
// curves, circles, waves, zigzags. These are not tied to any language/
// alphabet content (unlike STROKE_ORDER above), so they live here as a
// flat list the "Traços Básicos" practice mode iterates over directly.
// Each entry uses the same [x, y] 0-100 polyline format as STROKE_ORDER,
// so it renders through the same StrokeGuide/animation/validation code.
export const BASIC_STROKES = [
  {
    id: "line-h",
    emoji: "➖",
    labelKey: "writingBasicLineH",
    strokes: [[[15, 50], [85, 50]]],
  },
  {
    id: "line-v",
    emoji: "🎋",
    labelKey: "writingBasicLineV",
    strokes: [[[50, 15], [50, 85]]],
  },
  {
    id: "diagonal",
    emoji: "📐",
    labelKey: "writingBasicDiagonal",
    strokes: [[[20, 20], [80, 80]]],
  },
  {
    id: "curve",
    emoji: "🌙",
    labelKey: "writingBasicCurve",
    strokes: [[[75, 25], [58, 14], [40, 18], [27, 35], [25, 55], [33, 74], [50, 84], [68, 80]]],
  },
  {
    id: "circle",
    emoji: "⭕",
    labelKey: "writingBasicCircle",
    strokes: [[[50, 15], [30, 25], [20, 50], [30, 75], [50, 85], [70, 75], [80, 50], [70, 25], [50, 15]]],
  },
  {
    id: "zigzag",
    emoji: "⚡",
    labelKey: "writingBasicZigzag",
    strokes: [[[15, 20], [40, 80], [60, 20], [85, 80]]],
  },
  {
    id: "wave",
    emoji: "🌊",
    labelKey: "writingBasicWave",
    strokes: [[[10, 50], [22, 25], [35, 50], [48, 75], [61, 50], [74, 25], [90, 50]]],
  },
];

// --- Lightweight attempt validation ---
//
// Not a shape-matching algorithm (that would be overkill for a 5-year-old's
// wobbly-but-genuine attempt, and would risk frustrating false negatives).
// Just enough signal to tell "no real attempt" (a tap, a tiny scribble)
// apart from "a real attempt was made", and to surface one specific,
// encouraging observation about it.

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

// Interpolates extra points along each segment so straight 2-point strokes
// (e.g. a simple line or capital I) get evenly spaced samples too, not just
// their two endpoints — otherwise coverage checks against them would be
// nearly meaningless.
function densify(points, step = 6) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const segLen = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.round(segLen / step));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

// drawnPoints: array of {x, y} in the same normalized 0-100 space as the
// guide strokes (see Writing.jsx, which converts canvas pixel coords).
// Returns { quality, totalLength, startDist, coverage } where quality is
// one of "tooShort" | "goodStart" | "goodCoverage" | "attempt" — used to
// pick which specific, positive feedback message to show. Never returns a
// "wrong"/failure quality; the caller always lets the child proceed.
export function evaluateAttempt(drawnPoints, strokes) {
  if (!strokes || strokes.length === 0 || !drawnPoints || drawnPoints.length < 2) {
    return { quality: "tooShort", totalLength: 0, startDist: Infinity, coverage: 0 };
  }

  const drawnXY = drawnPoints.map((p) => [p.x, p.y]);
  const totalLength = pathLength(drawnXY);
  const guideStart = strokes[0][0];
  const startDist = dist(drawnXY[0], guideStart);

  const guideSamples = strokes.flatMap((s) => densify(s));
  const threshold = 14;
  const covered = guideSamples.filter((gp) => drawnXY.some((dp) => dist(dp, gp) <= threshold)).length;
  const coverage = guideSamples.length > 0 ? covered / guideSamples.length : 0;

  const guideLen = strokes.reduce((sum, s) => sum + pathLength(s), 0);
  const minLength = Math.max(12, guideLen * 0.25);

  let quality;
  if (totalLength < minLength) {
    quality = "tooShort";
  } else if (startDist <= 16) {
    quality = "goodStart";
  } else if (coverage >= 0.35) {
    quality = "goodCoverage";
  } else {
    quality = "attempt";
  }

  return { quality, totalLength, startDist, coverage };
}
