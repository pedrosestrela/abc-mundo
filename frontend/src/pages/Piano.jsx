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

export default function Piano() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const [instrument, setInstrument] = useState("piano");
  const [songId, setSongId] = useState(pianoSongs[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  const song = pianoSongs.find((s) => s.id === songId);
  const nextNote = playing ? song.notes[step] : null;
  const isDrum = instrument === "drum";

  function handleKeyPress(note) {
    playInstrumentNote(instrument, note);
    setActiveNote(note);
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "piano", event: `note_played:${instrument}:${note}` });

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
    pingProgress({ profileName: profile?.name, module: "piano", event: `drum_pad:${padId}` });
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
  }

  return (
    <div className="page">
      <h1>{t("modules.pianoTitle")} 🎹</h1>
      <p className="page-intro">{t("modules.pianoIntro")}</p>

      <div className="instrument-switcher">
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
