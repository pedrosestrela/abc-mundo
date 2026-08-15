// Background-music generator + per-instrument note player for the Music
// page. Seven instruments now play real recorded samples, each pitch-shifted
// across the keyboard via AudioBufferSourceNode.playbackRate (or, for drum
// pads, played back at fixed pitch like a real kit), with an automatic
// fallback to the original procedurally-synthesised timbre if a sample
// fails to load (offline-before-cache-warms, blocked network, etc):
//   - piano: Salamander Grand Piano, CC BY 3.0 (public/audio/piano/NOTICE.md)
//   - xylophone, guitar, flute, violin, harp: tonejs-instruments sample
//     library, CC BY 3.0 (public/audio/<instrument>/NOTICE.md)
//   - drum (pads): Sonic Pi sample library, CC0-1.0 / public domain, via
//     the `supersonic-scsynth-samples` npm package (public/audio/drum/NOTICE.md)
// Every other instrument (viola, cavaquinho, portugueseGuitar, accordion,
// concertina, and the looping background melody) still uses layered/detuned
// Web Audio oscillator synthesis — a genuinely thorough search (npm registry
// search + direct package-name probing for Iberian/folk-instrument and reed
// sample libraries) turned up no clean/verifiable permissively-licensed
// sample pack for them — tuned to approximate each instrument's real
// overtone character (see the per-instrument functions below for the
// specific technique used for each).

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
  { id: "viola", icon: "🎻" },
];

// Simple tappable pads for the drum instrument — no musical scale, just a
// few percussive hits, each a filtered noise burst at a different tone.
export const DRUM_PADS = ["kick", "snare", "hihat", "tom"];

let audioCtx = null;
let scheduledNodes = [];
let loopTimer = null;
let reverbImpulseBuffer = null;
let sharedReverb = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

// --- Shared "warmth" helpers -------------------------------------------------
// A handful of small, cheap building blocks reused by every instrument so
// notes sound layered/resonant instead of a single bare oscillator, without
// growing the per-note DSP graph enough to glitch on quick successive notes.

// Procedurally generates a short exponentially-decaying noise burst as an
// impulse response for ConvolverNode — a tiny bit of algorithmic "room" with
// no external audio file involved.
function getReverbImpulse(ctx) {
  if (reverbImpulseBuffer && reverbImpulseBuffer.sampleRate === ctx.sampleRate) {
    return reverbImpulseBuffer;
  }
  const duration = 0.9;
  const length = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 2.5);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
  }
  reverbImpulseBuffer = buffer;
  return buffer;
}

// A single shared, subtle reverb send bus — one ConvolverNode for the whole
// app instead of one per note, kept quiet so it adds gentle space without
// turning a children's app into a concert hall.
function getReverbSend(ctx) {
  if (sharedReverb && sharedReverb.context === ctx) return sharedReverb;
  const convolver = ctx.createConvolver();
  convolver.buffer = getReverbImpulse(ctx);
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.1;
  convolver.connect(wetGain);
  wetGain.connect(ctx.destination);
  sharedReverb = { context: ctx, input: convolver };
  return sharedReverb;
}

// Gentle soft-clip curve used for a touch of analog-style saturation —
// rounds off the harshest edges of sawtooth/square waves.
let saturationCurve = null;
function getSaturationCurve() {
  if (saturationCurve) return saturationCurve;
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 1.5);
  }
  saturationCurve = curve;
  return curve;
}

// --- Real piano samples (with synthesis fallback) --------------------------
// One real recorded note every minor third (C, D#, F#, A) across octaves
// 1-8 of a Salamander Grand Piano (CC BY 3.0 — see
// public/audio/piano/NOTICE.md), bundled locally under public/audio/piano/
// so playback works fully offline once cached (the app's service worker
// cache-first-caches every same-origin GET, including these files, on
// first fetch). Notes that fall between two recorded samples are pitch
// shifted from the nearest one via AudioBufferSourceNode.playbackRate —
// standard technique to cover a full keyboard from a sparse sample set.
const PIANO_SAMPLE_BASE = "/audio/piano/";
const SEMITONE_INDEX = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };

function noteToMidi(note) {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) return null;
  return Number(m[2]) * 12 + SEMITONE_INDEX[m[1]];
}

// Matches the actual files shipped in public/audio/piano/ (A0-A7, C1-C8,
// D#1-D#7 as "Ds", F#1-F#7 as "Fs" — sharps spelled without "#" in the
// filename to keep URLs simple).
function buildPianoSampleList() {
  const letters = [
    { letter: "A", semitone: 9, octaves: [0, 1, 2, 3, 4, 5, 6, 7] },
    { letter: "C", semitone: 0, octaves: [1, 2, 3, 4, 5, 6, 7, 8] },
    { letter: "Ds", semitone: 3, octaves: [1, 2, 3, 4, 5, 6, 7] },
    { letter: "Fs", semitone: 6, octaves: [1, 2, 3, 4, 5, 6, 7] },
  ];
  const list = [];
  letters.forEach(({ letter, semitone, octaves }) => {
    octaves.forEach((oct) => {
      list.push({ midi: oct * 12 + semitone, file: `${letter}${oct}v10.mp3` });
    });
  });
  return list.sort((a, b) => a.midi - b.midi);
}
const PIANO_SAMPLES = buildPianoSampleList();

function nearestPianoSample(midi) {
  let best = null;
  let bestDist = Infinity;
  for (const sample of PIANO_SAMPLES) {
    const dist = Math.abs(sample.midi - midi);
    if (dist < bestDist) {
      bestDist = dist;
      best = sample;
    }
  }
  return best;
}

// file -> Promise<AudioBuffer|null>, so concurrent/repeated requests for the
// same sample share one fetch+decode instead of re-downloading, and a
// failure (offline before cache warms, decode error, etc.) is remembered as
// "no sample" so callers fall back to synthesis instantly next time.
const pianoBufferCache = new Map();

function loadPianoBuffer(ctx, file) {
  if (pianoBufferCache.has(file)) return pianoBufferCache.get(file);
  const promise = fetch(PIANO_SAMPLE_BASE + file)
    .then((res) => {
      if (!res.ok) throw new Error("piano sample fetch failed: " + file);
      return res.arrayBuffer();
    })
    .then((data) => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
    .catch(() => null);
  pianoBufferCache.set(file, promise);
  return promise;
}

// Plays a real recorded piano note (pitch-shifted from the nearest sample),
// falling back to the synthesized piano voice (playPianoNoteSynth, defined
// below) if no AudioBuffer is available yet or the fetch/decode failed.
function playPianoNoteSampled(ctx, note, freq, duration) {
  const midi = noteToMidi(note);
  const sample = midi != null ? nearestPianoSample(midi) : null;
  if (!sample) {
    playPianoNoteSynth(ctx, freq, duration);
    return;
  }
  loadPianoBuffer(ctx, sample.file).then((buffer) => {
    if (!buffer) {
      playPianoNoteSynth(ctx, freq, duration);
      return;
    }
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2, (midi - sample.midi) / 12);

    const gain = ctx.createGain();
    const peak = 0.55;
    const sustainEnd = now + Math.max(duration - 0.05, 0.05);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.006);
    gain.gain.setValueAtTime(peak, sustainEnd);
    // Real piano notes ring out naturally past the nominal duration instead
    // of cutting off sharply — let the recorded decay tail play out.
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration + 1.1);

    source.connect(gain);
    connectWithReverb(ctx, gain, 1);
    source.start(now);
    source.stop(now + duration + 1.3);
    scheduledNodes.push(source);
  });
}

// Builds a small "voice": 2-3 detuned oscillators (fundamental + slightly
// detuned unison + a soft sub-octave or harmonic layer) summed into one
// gain node, then routed through a lowpass filter and a touch of soft
// saturation before the caller applies its own ADSR envelope and connects
// to the destination/reverb. This is the core trick that makes notes sound
// "layered" instead of a single bare beep, while staying cheap (a few
// oscillators + 1-2 filter nodes per note).
function buildVoice(ctx, freq, { type = "triangle", detuneCents = 6, subLevel = 0.25, subType = "sine", filterFreq = 3500, satAmount = 0.15 } = {}) {
  const voiceGain = ctx.createGain();
  voiceGain.gain.value = 1;

  const osc1 = ctx.createOscillator();
  osc1.type = type;
  osc1.frequency.value = freq;

  const osc2 = ctx.createOscillator();
  osc2.type = type;
  osc2.frequency.value = freq;
  osc2.detune.value = detuneCents;

  const osc2Gain = ctx.createGain();
  osc2Gain.gain.value = 0.55;

  const subOsc = ctx.createOscillator();
  subOsc.type = subType;
  subOsc.frequency.value = freq / 2;
  const subGain = ctx.createGain();
  subGain.gain.value = subLevel;

  osc1.connect(voiceGain);
  osc2.connect(osc2Gain);
  osc2Gain.connect(voiceGain);
  subOsc.connect(subGain);
  subGain.connect(voiceGain);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.7;

  const shaper = ctx.createWaveShaper();
  shaper.curve = getSaturationCurve();
  shaper.oversample = "2x";

  const satMix = ctx.createGain();
  satMix.gain.value = 1 + satAmount * 0.3;

  voiceGain.connect(filter);
  filter.connect(shaper);
  shaper.connect(satMix);

  return { output: satMix, oscillators: [osc1, osc2, subOsc] };
}

// Connects a voice's output to both the dry destination and a quiet reverb
// send, so every instrument gets a touch of natural space "for free".
function connectWithReverb(ctx, node, dryLevel = 1) {
  const dry = ctx.createGain();
  dry.gain.value = dryLevel;
  node.connect(dry);
  dry.connect(ctx.destination);
  const reverb = getReverbSend(ctx);
  node.connect(reverb.input);
}

function startStopVoice(voice, startTime, stopTime) {
  voice.oscillators.forEach((osc) => {
    osc.start(startTime);
    osc.stop(stopTime);
  });
  scheduledNodes.push(...voice.oscillators);
}

function playNote(ctx, freq, startTime, duration, gainValue, type) {
  const voice = buildVoice(ctx, freq, { type, detuneCents: 5, subLevel: 0.18, filterFreq: 2600 });
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(Math.max(gainValue * 0.15, 0.0001), startTime + duration * 0.85);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  startStopVoice(voice, startTime, startTime + duration + 0.05);
}

// --- Real samples for xylophone / guitar / flute / violin (with synthesis
// fallback) -------------------------------------------------------------
// Same architecture as the piano samples above: a sparse set of real
// recorded notes per instrument (from the CC BY 3.0 `tonejs-instruments`
// sample library, bundled locally under public/audio/<instrument>/ — see
// each folder's NOTICE.md for full provenance/license), pitch-shifted via
// AudioBufferSourceNode.playbackRate to cover every note in between, with
// an automatic fallback to the original synthesized voice if a sample
// fails to load/decode.

// filename uses "s" instead of "#" for sharps (matches the tonejs-instruments
// package's own file naming), everything else is identical to the note name.
function toneFileName(note) {
  return note.replace("#", "s") + ".mp3";
}

function buildToneSampleList(notes) {
  return notes
    .map((note) => ({ midi: noteToMidi(note), file: toneFileName(note) }))
    .sort((a, b) => a.midi - b.midi);
}

const SAMPLE_INSTRUMENTS = {
  xylophone: {
    base: "/audio/xylophone/",
    samples: buildToneSampleList(["C5", "C6", "C7", "C8", "G4", "G5", "G6", "G7"]),
    peak: 0.32,
    attack: 0.004,
    decayEnd: 0.35,
    tail: 0.5,
  },
  guitar: {
    base: "/audio/guitar/",
    samples: buildToneSampleList(["A2", "A#3", "B4", "C#3", "D3", "D#3", "E4", "F#2", "G3", "G#4"]),
    peak: 0.28,
    attack: 0.004,
    decayEnd: 0.8,
    tail: 1.0,
  },
  flute: {
    base: "/audio/flute/",
    samples: buildToneSampleList(["A4", "A5", "A6", "C4", "C5", "C6", "C7", "E4", "E5", "E6"]),
    peak: 0.24,
    attack: 0.06,
    decayEnd: 0.9,
    tail: 0.3,
  },
  violin: {
    base: "/audio/violin/",
    samples: buildToneSampleList([
      "A3", "A4", "A5", "A6", "C4", "C5", "C6", "C7", "E4", "E5", "E6", "G3", "G4", "G5", "G6",
    ]),
    peak: 0.26,
    attack: 0.08,
    decayEnd: 0.85,
    tail: 0.6,
  },
  harp: {
    base: "/audio/harp/",
    samples: buildToneSampleList([
      "A4", "B3", "B5", "C3", "C5", "D4", "D6", "E3", "E5", "F4", "F6", "G3", "G5",
    ]),
    peak: 0.3,
    attack: 0.008,
    decayEnd: 1.0,
    tail: 1.1,
  },
};

// instrumentId -> file -> Promise<AudioBuffer|null>, one cache Map per
// instrument (mirrors pianoBufferCache above).
const sampleBufferCaches = new Map();

function loadSampleBuffer(ctx, instrumentId, base, file) {
  let cache = sampleBufferCaches.get(instrumentId);
  if (!cache) {
    cache = new Map();
    sampleBufferCaches.set(instrumentId, cache);
  }
  if (cache.has(file)) return cache.get(file);
  const promise = fetch(base + file)
    .then((res) => {
      if (!res.ok) throw new Error(`${instrumentId} sample fetch failed: ${file}`);
      return res.arrayBuffer();
    })
    .then((data) => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
    .catch(() => null);
  cache.set(file, promise);
  return promise;
}

function nearestSample(samples, midi) {
  let best = null;
  let bestDist = Infinity;
  for (const sample of samples) {
    const dist = Math.abs(sample.midi - midi);
    if (dist < bestDist) {
      bestDist = dist;
      best = sample;
    }
  }
  return best;
}

// Plays a real recorded note for the given sampled instrument, pitch-shifted
// from the nearest sample, falling back to `synthFn(ctx, freq, duration)` if
// no note-to-MIDI mapping, no nearby sample, or the fetch/decode failed.
function playSampledNote(instrumentId, ctx, note, freq, duration, synthFn) {
  const config = SAMPLE_INSTRUMENTS[instrumentId];
  const midi = noteToMidi(note);
  const sample = config && midi != null ? nearestSample(config.samples, midi) : null;
  if (!sample) {
    synthFn(ctx, freq, duration);
    return;
  }
  loadSampleBuffer(ctx, instrumentId, config.base, sample.file).then((buffer) => {
    if (!buffer) {
      synthFn(ctx, freq, duration);
      return;
    }
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2, (midi - sample.midi) / 12);

    const gain = ctx.createGain();
    const peak = config.peak;
    const sustainEnd = now + Math.max(duration - 0.05, 0.05);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + config.attack);
    gain.gain.setValueAtTime(peak, sustainEnd);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration + config.decayEnd);

    source.connect(gain);
    connectWithReverb(ctx, gain, 1);
    source.start(now);
    source.stop(now + duration + config.decayEnd + config.tail);
    scheduledNodes.push(source);
  });
}

// --- Per-instrument single-note synthesis -----------------------------------

// Fallback synth voice used only when the real piano sample can't be
// loaded/decoded (see playPianoNoteSampled above) — warm and round:
// fundamental + detuned unison triangle + a soft sine sub-octave, gently
// filtered and saturated, with a proper ADSR envelope (soft attack, decay
// into a lower sustain, natural release).
function playPianoNoteSynth(ctx, freq, duration) {
  const now = ctx.currentTime;
  const voice = buildVoice(ctx, freq, { type: "triangle", detuneCents: 6, subLevel: 0.22, filterFreq: 3800, satAmount: 0.1 });
  const gain = ctx.createGain();
  const peak = 0.22;
  const sustainLevel = peak * 0.35;
  const sustainEnd = now + Math.max(duration - 0.08, 0.05);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(Math.max(sustainLevel, 0.0001), now + 0.18);
  gain.gain.setValueAtTime(sustainLevel, sustainEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.05);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  startStopVoice(voice, now, now + duration + 0.08);
}

function playXylophoneNote(ctx, freq, duration) {
  // Bright "clack" of a struck wooden bar: sine fundamental + a quiet
  // detuned partner + a touch of the octave-above harmonic (via sub-level
  // trick inverted through frequency), fast attack and a small downward
  // pitch bend right at the start, quick exponential decay.
  const now = ctx.currentTime;
  const voice = buildVoice(ctx, freq, { type: "sine", detuneCents: 9, subLevel: 0.12, subType: "triangle", filterFreq: 6000, satAmount: 0.05 });
  voice.oscillators[0].frequency.setValueAtTime(freq * 1.06, now);
  voice.oscillators[0].frequency.exponentialRampToValueAtTime(freq, now + 0.06);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(duration, 0.35));
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  startStopVoice(voice, now, now + 0.45);
}

function playGuitarNote(ctx, freq, duration) {
  // Layered sawtooth (fundamental + detuned unison + sub-octave body),
  // very fast attack, plucky exponential decay, softened by the shared
  // lowpass + saturation stage so the buzz feels warm rather than harsh.
  const now = ctx.currentTime;
  const sustain = Math.max(duration, 0.4);
  const voice = buildVoice(ctx, freq, { type: "sawtooth", detuneCents: 7, subLevel: 0.2, filterFreq: 2200, satAmount: 0.15 });
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, now + sustain);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  startStopVoice(voice, now, now + sustain + 0.05);
}

function playFluteNote(ctx, freq, duration) {
  // Sine fundamental + a quiet detuned partner + a whisper of sub-octave
  // "breath" body, gentle vibrato (LFO modulating both oscillators'
  // frequency) and a slow, breathy ADSR attack/release.
  const now = ctx.currentTime;
  const voice = buildVoice(ctx, freq, { type: "sine", detuneCents: 4, subLevel: 0.1, filterFreq: 2600, satAmount: 0.03 });
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.type = "sine";
  vibrato.frequency.value = 5.5;
  vibratoGain.gain.value = freq * 0.012;
  vibrato.connect(vibratoGain);
  voice.oscillators.slice(0, 2).forEach((osc) => vibratoGain.connect(osc.frequency));
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.14);
  gain.gain.linearRampToValueAtTime(0.16, now + Math.max(duration - 0.1, 0.15));
  gain.gain.linearRampToValueAtTime(0, now + duration + 0.1);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  vibrato.start(now);
  vibrato.stop(now + duration + 0.15);
  scheduledNodes.push(vibrato);
  startStopVoice(voice, now, now + duration + 0.15);
}

function playViolinNote(ctx, freq, duration) {
  // Layered sawtooth (fundamental + detuned unison + soft sub-octave body)
  // with a slow bowed attack (much slower than the guitar's pluck) plus a
  // light vibrato — rate/depth deliberately different from the flute's, so
  // the two "sustained" timbres don't sound alike.
  const now = ctx.currentTime;
  const voice = buildVoice(ctx, freq, { type: "sawtooth", detuneCents: 6, subLevel: 0.12, filterFreq: 3200, satAmount: 0.08 });
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.type = "sine";
  vibrato.frequency.value = 6.5;
  vibratoGain.gain.value = freq * 0.006;
  vibrato.connect(vibratoGain);
  voice.oscillators.slice(0, 2).forEach((osc) => vibratoGain.connect(osc.frequency));
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.18);
  gain.gain.linearRampToValueAtTime(0.16, now + Math.max(duration - 0.1, 0.2));
  gain.gain.linearRampToValueAtTime(0, now + duration + 0.15);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  vibrato.start(now);
  vibrato.stop(now + duration + 0.2);
  scheduledNodes.push(vibrato);
  startStopVoice(voice, now, now + duration + 0.2);
}

function playViolaNote(ctx, freq, duration) {
  // Bowed string like the violin, but pitched and voiced to sound like the
  // viola's darker, larger body: the same freq is dropped an octave first
  // (violas are read/played roughly an octave below where a violin note of
  // the same on-screen key would sit) plus a lower lowpass cutoff (less
  // top-end shimmer than the violin), a slower/deeper vibrato, and a softer
  // sub-octave layer for extra body weight.
  const now = ctx.currentTime;
  const violaFreq = freq / 2;
  const voice = buildVoice(ctx, violaFreq, { type: "sawtooth", detuneCents: 7, subLevel: 0.28, filterFreq: 1900, satAmount: 0.12 });
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.type = "sine";
  vibrato.frequency.value = 5;
  vibratoGain.gain.value = violaFreq * 0.007;
  vibrato.connect(vibratoGain);
  voice.oscillators.slice(0, 2).forEach((osc) => vibratoGain.connect(osc.frequency));
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
  gain.gain.linearRampToValueAtTime(0.17, now + Math.max(duration - 0.1, 0.22));
  gain.gain.linearRampToValueAtTime(0, now + duration + 0.18);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  vibrato.start(now);
  vibrato.stop(now + duration + 0.22);
  scheduledNodes.push(vibrato);
  startStopVoice(voice, now, now + duration + 0.22);
}

function playCavaquinhoNote(ctx, freq, duration) {
  // Bright plucked timbre: layered sawtooth through a higher lowpass cutoff
  // than the guitar (more high-frequency content, small-body "jangly"
  // sound) and a faster decay, since a cavaquinho's strings ring out
  // quickly. Kept a lighter sub-layer than the guitar to stay bright.
  const now = ctx.currentTime;
  const voice = buildVoice(ctx, freq, { type: "sawtooth", detuneCents: 8, subLevel: 0.08, filterFreq: 4200, satAmount: 0.12 });
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.24, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(duration, 0.28));
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  startStopVoice(voice, now, now + 0.35);
}

function playPortugueseGuitarNote(ctx, freq, duration) {
  // Distinct metallic/ringing plucked timbre for the "guitarra portuguesa":
  // detuned square waves (harder, more nasal edge than the guitar's
  // sawtooth or the cavaquinho's soft sawtooth) through a resonant bandpass
  // filter that emphasises upper harmonics, with a long, slowly fading ring.
  const now = ctx.currentTime;
  const sustain = Math.max(duration, 0.6);
  const voice = buildVoice(ctx, freq, { type: "square", detuneCents: 5, subLevel: 0.06, filterFreq: freq * 4, satAmount: 0.1 });
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = freq * 3;
  bandpass.Q.value = 4;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, now + sustain);
  voice.output.connect(bandpass);
  bandpass.connect(gain);
  connectWithReverb(ctx, gain, 1);
  startStopVoice(voice, now, now + sustain + 0.05);
}

function playAccordionNote(ctx, freq, duration) {
  // Reed-like sustained tone: layered square waves through a lowpass
  // filter, a slower attack than piano, and a gentle tremolo (amplitude
  // LFO) approximating the "breathing" of accordion bellows.
  const now = ctx.currentTime;
  const sustain = Math.max(duration, 0.7);
  const voice = buildVoice(ctx, freq, { type: "square", detuneCents: 4, subLevel: 0.15, filterFreq: 1800, satAmount: 0.06 });
  const gain = ctx.createGain();
  const tremolo = ctx.createOscillator();
  const tremoloGain = ctx.createGain();
  tremolo.type = "sine";
  tremolo.frequency.value = 5;
  tremoloGain.gain.value = 0.04;
  tremolo.connect(tremoloGain);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.12);
  gain.gain.linearRampToValueAtTime(0.14, now + sustain - 0.15);
  gain.gain.linearRampToValueAtTime(0, now + sustain + 0.1);
  tremoloGain.connect(gain.gain);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  tremolo.start(now);
  tremolo.stop(now + sustain + 0.15);
  scheduledNodes.push(tremolo);
  startStopVoice(voice, now, now + sustain + 0.15);
}

function playConcertinaNote(ctx, freq, duration) {
  // Same reedy family as the accordion but higher/brighter: layered
  // sawtooth (more harmonic content than the accordion's square) through a
  // brighter filter cutoff, a snappier attack, and a faster, shallower
  // tremolo.
  const now = ctx.currentTime;
  const sustain = Math.max(duration, 0.55);
  const voice = buildVoice(ctx, freq, { type: "sawtooth", detuneCents: 5, subLevel: 0.1, filterFreq: 3000, satAmount: 0.08 });
  const gain = ctx.createGain();
  const tremolo = ctx.createOscillator();
  const tremoloGain = ctx.createGain();
  tremolo.type = "sine";
  tremolo.frequency.value = 7.5;
  tremoloGain.gain.value = 0.025;
  tremolo.connect(tremoloGain);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.12, now + sustain - 0.12);
  gain.gain.linearRampToValueAtTime(0, now + sustain + 0.08);
  tremoloGain.connect(gain.gain);
  voice.output.connect(gain);
  connectWithReverb(ctx, gain, 1);
  tremolo.start(now);
  tremolo.stop(now + sustain + 0.12);
  scheduledNodes.push(tremolo);
  startStopVoice(voice, now, now + sustain + 0.12);
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
  connectWithReverb(ctx, gain, 1);
  noise.start(now);
  noise.stop(now + duration + 0.02);
  scheduledNodes.push(noise);
}

// A short pitch-enveloped oscillator "body" layered under a drum's noise
// burst — the technique real kick/tom synthesis relies on (a sine that
// glides sharply downward in pitch reads as a resonant drum shell), which a
// flat-frequency filtered-noise burst alone can't reproduce.
function playPitchedThump(ctx, { startFreq, endFreq, duration, gainValue, glideTime }) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), now + glideTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  connectWithReverb(ctx, gain, 1);
  osc.start(now);
  osc.stop(now + duration + 0.02);
  scheduledNodes.push(osc);
}

// Per-drum-type synthesis fallback, each tuned to that drum's real acoustic
// behaviour instead of one generic filtered-noise burst for everything:
//   - kick: fast downward pitch sweep (150Hz -> 45Hz) for the shell "thump",
//     plus a very short low-passed noise click for the beater attack.
//   - snare: filtered noise "snap" (the wires) layered with a short ~190Hz
//     tone (the shell) for body under the snap.
//   - hihat: bright, very short high-passed/bandpassed noise only — no tonal
//     body, since a hi-hat's sound is almost entirely metallic shimmer.
//   - tom: same pitch-sweep idea as the kick but higher and slower (220Hz ->
//     110Hz), so it reads as a bigger drum than the kick without being a
//     copy of it.
function playDrumSynth(padId) {
  const ctx = getContext();
  if (!ctx) return;
  switch (padId) {
    case "kick":
      playPitchedThump(ctx, { startFreq: 150, endFreq: 45, duration: 0.32, gainValue: 0.6, glideTime: 0.09 });
      playNoiseBurst(ctx, { filterType: "lowpass", freq: 400, q: 0.5, duration: 0.03, gainValue: 0.25 });
      break;
    case "snare":
      playPitchedThump(ctx, { startFreq: 190, endFreq: 150, duration: 0.09, gainValue: 0.22, glideTime: 0.03 });
      playNoiseBurst(ctx, { filterType: "bandpass", freq: 2200, q: 0.9, duration: 0.16, gainValue: 0.42 });
      break;
    case "hihat":
      playNoiseBurst(ctx, { filterType: "highpass", freq: 7000, q: 0.7, duration: 0.06, gainValue: 0.22 });
      playNoiseBurst(ctx, { filterType: "bandpass", freq: 9500, q: 3, duration: 0.09, gainValue: 0.14 });
      break;
    case "tom":
    default:
      playPitchedThump(ctx, { startFreq: 220, endFreq: 110, duration: 0.34, gainValue: 0.5, glideTime: 0.14 });
      playNoiseBurst(ctx, { filterType: "bandpass", freq: 350, q: 1, duration: 0.08, gainValue: 0.15 });
      break;
  }
}

// --- Real drum samples (with synthesis fallback) ----------------------------
// One real recorded one-shot hit per pad (Sonic Pi sample library, CC0-1.0,
// bundled locally under public/audio/drum/ — see NOTICE.md there for full
// provenance). Unlike the pitched instruments above, a real drum kit doesn't
// retune per key, so these play back at a fixed rate — no
// note-to-frequency/playbackRate math needed, just load-once-and-play.
const DRUM_PAD_FILES = {
  kick: { file: "kick.flac", peak: 0.6, tail: 0.6 },
  snare: { file: "snare.flac", peak: 0.5, tail: 0.5 },
  hihat: { file: "hihat.flac", peak: 0.4, tail: 0.4 },
  tom: { file: "tom.flac", peak: 0.55, tail: 0.6 },
};
const DRUM_SAMPLE_BASE = "/audio/drum/";
const drumBufferCache = new Map();

function loadDrumBuffer(ctx, file) {
  if (drumBufferCache.has(file)) return drumBufferCache.get(file);
  const promise = fetch(DRUM_SAMPLE_BASE + file)
    .then((res) => {
      if (!res.ok) throw new Error("drum sample fetch failed: " + file);
      return res.arrayBuffer();
    })
    .then((data) => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)))
    .catch(() => null);
  drumBufferCache.set(file, promise);
  return promise;
}

// Plays a real recorded drum-pad hit, falling back to the synthesized noise
// burst (playNoiseBurst) if no sample is configured for this pad or the
// fetch/decode failed.
export function playDrumPad(padId) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const sample = DRUM_PAD_FILES[padId];
  if (!sample) {
    playDrumSynth(padId);
    return;
  }
  loadDrumBuffer(ctx, sample.file).then((buffer) => {
    if (!buffer) {
      playDrumSynth(padId);
      return;
    }
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(sample.peak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + buffer.duration + sample.tail);
    source.connect(gain);
    connectWithReverb(ctx, gain, 1);
    source.start(now);
    source.stop(now + buffer.duration + sample.tail + 0.05);
    scheduledNodes.push(source);
  });
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
      playSampledNote("xylophone", ctx, note, freq, duration, playXylophoneNote);
      break;
    case "guitar":
      playSampledNote("guitar", ctx, note, freq, duration, playGuitarNote);
      break;
    case "flute":
      playSampledNote("flute", ctx, note, freq, duration, playFluteNote);
      break;
    case "violin":
      playSampledNote("violin", ctx, note, freq, duration, playViolinNote);
      break;
    case "viola":
      playViolaNote(ctx, freq, duration);
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
      playSampledNote("harp", ctx, note, freq, duration, playHarpNote);
      break;
    case "drum":
      // Drums use pads (DRUM_PADS) rather than the musical scale in the UI;
      // this pitched-note path exists only for API completeness, so pick
      // the pad whose synthesized register loosely tracks the note's pitch.
      playDrumSynth(freq > 440 ? "hihat" : freq > 300 ? "snare" : "tom");
      break;
    case "piano":
    default:
      playPianoNoteSampled(ctx, note, freq, duration);
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
