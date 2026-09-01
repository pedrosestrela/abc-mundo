// Tiny helper shared by pages that show varied mascot reaction lines (e.g.
// 2-3 "encouraging" variants on a wrong answer, or a couple of "happy"
// variants on a correct one) so the same line doesn't repeat every time.
// `t(key, { returnObjects: true })` on an i18next array key returns the
// array itself; this just picks one entry at random, falling back
// gracefully if the key is missing or not an array yet.
export function pickLine(linesOrString) {
  if (Array.isArray(linesOrString) && linesOrString.length > 0) {
    return linesOrString[Math.floor(Math.random() * linesOrString.length)];
  }
  if (typeof linesOrString === "string") return linesOrString;
  return "";
}
