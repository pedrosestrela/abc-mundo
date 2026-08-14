// Tiny procedural background-music generator using the Web Audio API.
// No audio files are used (avoids copyright issues) — a simple looping
// major-scale arpeggio + soft bass note plays quietly under the sung lyrics.
// The piano page also uses these helpers to play individual notes with a
// choice of a few procedurally-synthesised instrument timbres.

// Two octaves, C4 to C6, so songs have room to move beyond one octave.
export const NOTE_FREQS = {
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63, F4: 349.23,
  "F#4": 369.99, G4: 392.0, "G#4": 415.3, A4: 440.0, "A#4": 466.16, B4: 493.88,
  C5: 523.25, "C#5": 554.37, D5: 587.33, "D#5": 622.25, E5: 659.25, F5: 698.46,
  "F#5": 739.99, G5: 783.99, "G#5": 830.61, A5: 880.0, "A#5": 932.33, B5: 987.77,
  C6: 1046.5,
};

export const SOLFEGE_PT = {
  C4: "Dó", D4: "Ré", E4: "Mi", F4: "Fá", G4: "Sol", A4: "Lá", B4: "Si",
  C5: "Dó", D5: "Ré", E5: "Mi", F5: "Fá", G5: "Sol", A5: "Lá", B5: "Si",
  C6: "Dó",
};

const MELODY = ["C4", "E4", "G4", "C5", "G4", "E4", "D4", "F4", "A4", "F4", "D4", "C4"];
const BASS = ["C4", "G4"];

// --- Instrument definitions -------------------------------------------------
// Every instrument is a distinct Web Audio timbre: oscillator type + envelope
// shape (attack/decay) + optional extras (pitch bend, vibrato, noise burst).
// No sample files are used anywhere.

export const INSTRUMENTS = [
  { id: "piano", icon: "🎹" },
  { id: "xylophone", icon: "🎼" },
  { id: "guitar", icon: "🎸" },
  { id: "flute", icon: "🪈" },
  { id: "drum", icon: "🥁" },
  { id: "violin", icon: "🎻" },
  { id: "cavaquinho", icon: "🪕" },
  { id: "portugueseGuitar", icon: "🎸" },
  { id: "accordion", icon: "🪗" },
  { id: "concertina", icon: "🎐" },
  { id: "harp", icon: "🎶" },
];

// Simple tappable pads for the drum instrument — no musical scale, just a
// few percussive hits, each a filtered noise burst at a different tone.
export const DRUM_PADS = ["kick", "snare", "hihat", "tom"];

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

// --- Per-instrument single-note synthesis -----------------------------------

function playPianoNote(ctx, freq, duration) {
  // Triangle wave, medium attack/decay — warm and round, close to the
  // background-music timbre already used elsewhere in the app.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
  scheduledNodes.push(osc);
}

function playXylophoneNote(ctx, freq, duration) {
  // Sine wave, fast decay, a small downward pitch bend right at the start —
  // mimics the bright "clack" of a struck wooden bar.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.06, now);
  osc.frequency.exponentialRampToValueAtTime(freq, now + 0.06);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(duration, 0.35));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.45);
  scheduledNodes.push(osc);
}

function playGuitarNote(ctx, freq, duration) {
  // Sawtooth wave with a very fast attack and a plucky exponential decay,
  // filtered slightly to soften the buzz.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 2200;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(duration, 0.4));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + Math.max(duration, 0.4) + 0.05);
  scheduledNodes.push(osc);
}

function playFluteNote(ctx, freq, duration) {
  // Sine wave with a slower attack and a gentle vibrato (LFO modulating
  // frequency), like a breathy sustained tone.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  vibrato.type = "sine";
  vibrato.frequency.value = 5.5;
  vibratoGain.gain.value = freq * 0.012;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.14);
  gain.gain.linearRampToValueAtTime(0.16, now + Math.max(duration - 0.1, 0.15));
  gain.gain.linearRampToValueAtTime(0, now + duration + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  vibrato.start(now);
  osc.start(now);
  vibrato.stop(now + duration + 0.15);
  osc.stop(now + duration + 0.15);
  scheduledNodes.push(osc, vibrato);
}

function playViolinNote(ctx, freq, duration) {
  // Sawtooth wave with a slow bowed attack (much slower than the guitar's
  // pluck) plus a light vibrato — rate/depth deliberately different from
  // the flute's, so the two "sustained" timbres don't sound alike.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  vibrato.type = "sine";
  vibrato.frequency.value = 6.5;
  vibratoGain.gain.value = freq * 0.006;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.18);
  gain.gain.linearRampToValueAtTime(0.16, now + Math.max(duration - 0.1, 0.2));
  gain.gain.linearRampToValueAtTime(0, now + duration + 0.15);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  vibrato.start(now);
  osc.start(now);
  vibrato.stop(now + duration + 0.2);
  osc.stop(now + duration + 0.2);
  scheduledNodes.push(osc, vibrato);
}

function playCavaquinhoNote(ctx, freq, duration) {
  // Bright plucked timbre: sawtooth through a higher lowpass cutoff than
  // the guitar (more high-frequency content, small-body "jangly" sound)
  // and a faster decay, since a cavaquinho's strings ring out quickly.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 4200;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.24, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(duration, 0.28));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
  scheduledNodes.push(osc);
}

function playPortugueseGuitarNote(ctx, freq, duration) {
  // Distinct metallic/ringing plucked timbre for the "guitarra portuguesa":
  // a square wave (harder, more nasal edge than the guitar's sawtooth or
  // the cavaquinho's soft sawtooth) through a resonant bandpass filter that
  // emphasises upper harmonics, with a long, slowly fading ring.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  filter.type = "bandpass";
  filter.frequency.value = freq * 3;
  filter.Q.value = 4;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(duration, 0.6));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + Math.max(duration, 0.6) + 0.05);
  scheduledNodes.push(osc);
}

function playAccordionNote(ctx, freq, duration) {
  // Reed-like sustained tone: soft square wave through a lowpass filter,
  // a slower attack than piano, and a gentle tremolo (amplitude LFO)
  // approximating the "breathing" of accordion bellows.
  const now = ctx.currentTime;
  const sustain = Math.max(duration, 0.7);
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const tremolo = ctx.createOscillator();
  const tremoloGain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  tremolo.type = "sine";
  tremolo.frequency.value = 5;
  tremoloGain.gain.value = 0.04;
  tremolo.connect(tremoloGain);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.12);
  gain.gain.linearRampToValueAtTime(0.14, now + sustain - 0.15);
  gain.gain.linearRampToValueAtTime(0, now + sustain + 0.1);
  tremoloGain.connect(gain.gain);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  tremolo.start(now);
  osc.start(now);
  tremolo.stop(now + sustain + 0.15);
  osc.stop(now + sustain + 0.15);
  scheduledNodes.push(osc, tremolo);
}

function playConcertinaNote(ctx, freq, duration) {
  // Same reedy family as the accordion but higher/brighter: sawtooth (more
  // harmonic content than the accordion's square) through a brighter filter
  // cutoff, a snappier attack, and a faster, shallower tremolo.
  const now = ctx.currentTime;
  const sustain = Math.max(duration, 0.55);
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const tremolo = ctx.createOscillator();
  const tremoloGain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 3000;
  tremolo.type = "sine";
  tremolo.frequency.value = 7.5;
  tremoloGain.gain.value = 0.025;
  tremolo.connect(tremoloGain);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.12, now + sustain - 0.12);
  gain.gain.linearRampToValueAtTime(0, now + sustain + 0.08);
  tremoloGain.connect(gain.gain);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  tremolo.start(now);
  osc.start(now);
  tremolo.stop(now + sustain + 0.12);
  osc.stop(now + sustain + 0.12);
  scheduledNodes.push(osc, tremolo);
}

function playHarpNote(ctx, freq, duration) {
  // Plucked-string family like guitar/cavaquinho, but sparklier and more
  // resonant: a triangle fundamental plus a slightly detuned sine an octave
  // up (the detune creates a soft shimmering beat), and a long smooth
  // exponential decay for a resonant "ring" the others don't have.
  const now = ctx.currentTime;
  const sustain = Math.max(duration, 1.1);
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const gain2 = ctx.createGain();
  osc1.type = "triangle";
  osc2.type = "sine";
  osc1.frequency.value = freq;
  osc2.frequency.value = freq * 2.003;
  gain2.gain.value = 0.35;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + sustain);
  osc1.connect(gain);
  osc2.connect(gain2);
  gain2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + sustain + 0.1);
  osc2.stop(now + sustain + 0.1);
  scheduledNodes.push(osc1, osc2);
}

// Filtered white-noise burst used for both the drum pads and as the
// "drum" instrument's stand-in for a musical note.
function playNoiseBurst(ctx, { filterType = "bandpass", freq = 800, q = 1, duration = 0.15, gainValue = 0.35 } = {}) {
  const now = ctx.currentTime;
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration + 0.02);
  scheduledNodes.push(noise);
}

const DRUM_PAD_SOUNDS = {
  kick: { filterType: "lowpass", freq: 120, q: 0.7, duration: 0.28, gainValue: 0.55 },
  snare: { filterType: "highpass", freq: 900, q: 0.8, duration: 0.18, gainValue: 0.4 },
  hihat: { filterType: "highpass", freq: 6000, q: 0.6, duration: 0.08, gainValue: 0.25 },
  tom: { filterType: "bandpass", freq: 300, q: 1.2, duration: 0.22, gainValue: 0.45 },
};

export function playDrumPad(padId) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const sound = DRUM_PAD_SOUNDS[padId] || DRUM_PAD_SOUNDS.tom;
  playNoiseBurst(ctx, sound);
}

// Plays a single pitched note with the given instrument's timbre. `drum`
// falls back to a generic percussive hit (no pitch), since drums use pads
// instead of a musical scale in the UI.
export function playInstrumentNote(instrument, note, duration = 0.5) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const freq = NOTE_FREQS[note];
  if (!freq) return;

  switch (instrument) {
    case "xylophone":
      playXylophoneNote(ctx, freq, duration);
      break;
    case "guitar":
      playGuitarNote(ctx, freq, duration);
      break;
    case "flute":
      playFluteNote(ctx, freq, duration);
      break;
    case "violin":
      playViolinNote(ctx, freq, duration);
      break;
    case "cavaquinho":
      playCavaquinhoNote(ctx, freq, duration);
      break;
    case "portugueseGuitar":
      playPortugueseGuitarNote(ctx, freq, duration);
      break;
    case "accordion":
      playAccordionNote(ctx, freq, duration);
      break;
    case "concertina":
      playConcertinaNote(ctx, freq, duration);
      break;
    case "harp":
      playHarpNote(ctx, freq, duration);
      break;
    case "drum":
      playNoiseBurst(ctx, { filterType: "bandpass", freq: freq / 2, q: 1, duration: 0.2, gainValue: 0.4 });
      break;
    case "piano":
    default:
      playPianoNote(ctx, freq, duration);
      break;
  }
}

// Kept for backwards compatibility with any existing callers — plays a note
// with the classic piano timbre.
export function playNoteOnce(note, duration = 0.5) {
  playInstrumentNote("piano", note, duration);
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
