// Shared helper for playing a pre-recorded real-voice audio file (Piper/
// ElevenLabs generated .mp3, bundled as a static asset) with a progress
// callback, used by Songs.jsx/Stories.jsx/Rhymes.jsx/Whys.jsx to sync simple
// visual highlighting (current line/page) to playback position. There's no
// per-word boundary info from a recorded file (unlike speechSynthesis's
// `onboundary` event), so callers approximate with elapsed-time fractions
// weighted by each segment's text length — see `onProgress` below.
//
// Resolves when playback ends (or errors — treated as "done" rather than
// thrown, since narration is a progressive enhancement and callers should
// keep going, e.g. re-enable buttons, regardless of a playback hiccup).
export function playRealAudio(url, { onProgress } = {}) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    if (typeof onProgress === "function") {
      audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        onProgress(audio.currentTime / audio.duration, audio);
      });
    }
    audio.addEventListener("ended", resolve);
    audio.addEventListener("error", resolve);
    audio.play().catch(resolve);
  });
}

// Given per-segment texts (lyric lines, story pages, ...) and a playback
// fraction (0..1), returns the index of the segment that fraction falls
// into, weighting each segment by its text length (with a floor so very
// short segments still get a fair sliver of time). Shared by every page
// that syncs a highlighted line/page to real-audio playback progress.
export function segmentIndexForProgress(texts, frac) {
  const weights = texts.map((t) => Math.max((t || "").length, 8));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  let idx = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    idx = i;
    if (frac <= acc / total) break;
  }
  return idx;
}
