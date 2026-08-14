// Tiny procedural background-music generator using the Web Audio API.
// No audio files are used (avoids copyright issues) — a simple looping
// major-scale arpeggio + soft bass note plays quietly under the sung lyrics.

const NOTE_FREQS = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
};

const MELODY = ["C4", "E4", "G4", "C5", "G4", "E4", "D4", "F4", "A4", "F4", "D4", "C4"];
const BASS = ["C4", "G4"];

let audioCtx = null;
let scheduledNodes = [];
let loopTimer = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function playNote(ctx, freq, startTime, duration, gainValue, type) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.03);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
  scheduledNodes.push(osc);
}

export function isMusicAvailable() {
  return typeof window !== "undefined" && !!(window.AudioContext || window.webkitAudioContext);
}

export function startBackgroundMusic() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  stopBackgroundMusic();

  const noteDuration = 0.4;
  const loopDuration = MELODY.length * noteDuration;

  function scheduleLoop() {
    const now = ctx.currentTime + 0.05;
    MELODY.forEach((note, i) => {
      playNote(ctx, NOTE_FREQS[note], now + i * noteDuration, noteDuration * 0.9, 0.05, "triangle");
    });
    BASS.forEach((note, i) => {
      playNote(ctx, NOTE_FREQS[note] / 2, now + i * (loopDuration / 2), loopDuration / 2 - 0.05, 0.04, "sine");
    });
  }

  scheduleLoop();
  loopTimer = window.setInterval(scheduleLoop, loopDuration * 1000);
}

export function stopBackgroundMusic() {
  if (loopTimer) {
    window.clearInterval(loopTimer);
    loopTimer = null;
  }
  scheduledNodes.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  });
  scheduledNodes = [];
}
