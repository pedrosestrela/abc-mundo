import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { playInstrumentNote, playDrumPad, SOLFEGE_PT, INSTRUMENTS, DRUM_PADS } from "../music.js";
import { getProfile, pingProgress, getLangPair } from "../storage.js";
import pianoSongs from "../content/pianoSongs.json";
import SpeakButton from "../components/SpeakButton.jsx";
import MusicStaff from "../components/MusicStaff.jsx";

const WHITE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];

// Two octaves (C4-C5, C5-C6) plus the final C6, so every song note in
// pianoSongs.json is reachable on the rendered keyboard.
const WHITE_KEYS = [
  ...WHITE_LETTERS.map((l) => `${l}4`),
  ...WHITE_LETTERS.map((l) => `${l}5`),
  "C6",
];

// Sharps sit after the white key at `offset` (index into WHITE_KEYS),
// skipping after E and B in every octave, same as a real keyboard.
function buildBlackKeys(baseOctave, baseIndex) {
  return [
    { note: `C#${baseOctave}`, offset: baseIndex + 0 },
    { note: `D#${baseOctave}`, offset: baseIndex + 1 },
    { note: `F#${baseOctave}`, offset: baseIndex + 3 },
    { note: `G#${baseOctave}`, offset: baseIndex + 4 },
    { note: `A#${baseOctave}`, offset: baseIndex + 5 },
  ];
}
const BLACK_KEYS = [...buildBlackKeys(4, 0), ...buildBlackKeys(5, 7)];

const WHITE_KEY_COUNT = WHITE_KEYS.length;

// 4-beat rhythm patterns for the drum "repeat this rhythm" mini-game, using
// the same pad ids as the tappable drum pads.
const RHYTHM_PATTERNS = [
  ["kick", "kick", "snare", "hihat"],
  ["kick", "hihat", "snare", "hihat"],
  ["kick", "snare", "kick", "snare"],
  ["hihat", "hihat", "kick", "snare"],
];

const PAD_EMOJI = { kick: "🥁", snare: "🪘", hihat: "🎩", tom: "🛢️" };

export default function Music({ defaultInstrument = "piano" }) {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const [instrument, setInstrument] = useState(defaultInstrument);
  const [songId, setSongId] = useState(pianoSongs[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  const [rhythmPattern, setRhythmPattern] = useState(null);
  const [rhythmInput, setRhythmInput] = useState([]);
  const [rhythmResult, setRhythmResult] = useState(null); // null | "success" | "fail"

  const song = pianoSongs.find((s) => s.id === songId);
  const nextNote = playing ? song.notes[step] : null;
  const isDrum = instrument === "drum";

  function handleStartRhythm() {
    const pattern = RHYTHM_PATTERNS[Math.floor(Math.random() * RHYTHM_PATTERNS.length)];
    setRhythmPattern(pattern);
    setRhythmInput([]);
    setRhythmResult(null);
  }

  function handleRhythmPadTap(padId) {
    if (!rhythmPattern || rhythmResult) return;
    const next = [...rhythmInput, padId];
    setRhythmInput(next);
    const idx = next.length - 1;
    if (padId !== rhythmPattern[idx]) {
      setRhythmResult("fail");
      const profile = getProfile();
      pingProgress({ profileName: profile?.name, module: "music", event: "drum_rhythm:fail" });
      return;
    }
    if (next.length === rhythmPattern.length) {
      setRhythmResult("success");
      const profile = getProfile();
      pingProgress({ profileName: profile?.name, module: "music", event: "drum_rhythm:success" });
    }
  }

  function handleKeyPress(note) {
    playInstrumentNote(instrument, note);
    setActiveNote(note);
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "music", event: `note_played:${instrument}:${note}` });

    if (playing && note === song.notes[step]) {
      const next = step + 1;
      if (next >= song.notes.length) {
        setPlaying(false);
        setStep(0);
      } else {
        setStep(next);
      }
    }
  }

  function handleDrumPad(padId) {
    playDrumPad(padId);
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "music", event: `drum_pad:${padId}` });
  }

  function handleStartSong(id) {
    setSongId(id);
    setStep(0);
    setPlaying(true);
  }

  function handleSelectInstrument(id) {
    setInstrument(id);
    setPlaying(false);
    setStep(0);
    setActiveNote(null);
    setRhythmPattern(null);
    setRhythmInput([]);
    setRhythmResult(null);
  }

  return (
    <div className="page">
      <h1>{t("modules.musicTitle")} 🎶</h1>
      <p className="page-intro">{t("modules.musicIntro")}</p>

      <div className="instrument-switcher phonics-tabs">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.id}
            type="button"
            className={"instrument-btn" + (instrument === inst.id ? " active" : "")}
            onClick={() => handleSelectInstrument(inst.id)}
          >
            <span className="instrument-icon">{inst.icon}</span>
            <span>{t(`modules.pianoInstrument_${inst.id}`)}</span>
          </button>
        ))}
      </div>

      {!isDrum && <MusicStaff note={activeNote} />}

      {isDrum ? (
        <div className="drum-pads-wrap">
          <h2 className="songs-heading">{t("modules.pianoDrumHeading")}</h2>
          <div className="drum-pads">
            {DRUM_PADS.map((padId) => (
              <button
                key={padId}
                type="button"
                className={"drum-pad drum-pad-" + padId}
                onClick={() => handleDrumPad(padId)}
              >
                {t(`modules.pianoDrumPad_${padId}`)}
              </button>
            ))}
          </div>

          <h2 className="songs-heading">{t("modules.musicRhythmGameHeading")}</h2>
          <p className="page-intro">{t("modules.musicRhythmGameIntro")}</p>
          {!rhythmPattern ? (
            <button type="button" className="big-btn" onClick={handleStartRhythm}>
              ▶️ {t("modules.musicRhythmGameStart")}
            </button>
          ) : (
            <div className="rhythm-game">
              <div className="rhythm-pattern">
                {rhythmPattern.map((padId, i) => (
                  <span key={i} className="rhythm-pattern-icon">
                    {PAD_EMOJI[padId]}
                  </span>
                ))}
              </div>
              <div className="rhythm-input">
                {rhythmPattern.map((_, i) => (
                  <span key={i} className="rhythm-input-slot">
                    {rhythmInput[i] ? PAD_EMOJI[rhythmInput[i]] : "•"}
                  </span>
                ))}
              </div>
              <div className="drum-pads">
                {DRUM_PADS.map((padId) => (
                  <button
                    key={padId}
                    type="button"
                    className={"drum-pad drum-pad-" + padId}
                    onClick={() => handleRhythmPadTap(padId)}
                  >
                    {t(`modules.pianoDrumPad_${padId}`)}
                  </button>
                ))}
              </div>
              {rhythmResult === "success" && (
                <p className="rhythm-feedback rhythm-success">
                  🎉 {t("modules.musicRhythmGameSuccess")}
                </p>
              )}
              {rhythmResult === "fail" && (
                <p className="rhythm-feedback rhythm-fail">
                  🙂 {t("modules.musicRhythmGameFail")}
                </p>
              )}
              {rhythmResult && (
                <button type="button" className="big-btn" onClick={handleStartRhythm}>
                  🔁 {t("modules.musicRhythmGameStart")}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="piano-wrap">
            <div className="piano-white-keys">
              {WHITE_KEYS.map((note) => (
                <button
                  key={note}
                  type="button"
                  className={"piano-key white" + (nextNote === note ? " highlight" : "")}
                  onClick={() => handleKeyPress(note)}
                >
                  <span className="piano-key-label">{SOLFEGE_PT[note] || note}</span>
                </button>
              ))}
            </div>
            <div className="piano-black-keys">
              {BLACK_KEYS.map((key) => (
                <button
                  key={key.note}
                  type="button"
                  style={{
                    left: `${(key.offset + 1) * (100 / WHITE_KEY_COUNT) - 100 / (2 * WHITE_KEY_COUNT)}%`,
                  }}
                  className={"piano-key black" + (nextNote === key.note ? " highlight" : "")}
                  onClick={() => handleKeyPress(key.note)}
                />
              ))}
            </div>
          </div>

          <h2 className="songs-heading">{t("modules.pianoSongsHeading")}</h2>
          <div className="song-list">
            {pianoSongs.map((s) => (
              <div className="song-card piano-song-card" key={s.id}>
                <h3>{s.title}</h3>
                <div className="piano-song-lyrics-row">
                  <p className="piano-song-lyrics">{s.lyrics.join(" · ")}</p>
                  <SpeakButton text={s.lyrics.join(", ")} langCode={pair.mother} />
                </div>
                {playing && songId === s.id ? (
                  <p className="piano-progress">
                    {t("modules.pianoFollow")}: {step + 1} / {s.notes.length}
                  </p>
                ) : (
                  <button type="button" className="big-btn" onClick={() => handleStartSong(s.id)}>
                    ▶️ {t("modules.pianoLearnSong")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
