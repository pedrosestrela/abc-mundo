import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { playNoteOnce, SOLFEGE_PT } from "../music.js";
import { getProfile, pingProgress } from "../storage.js";
import pianoSongs from "../content/pianoSongs.json";

const WHITE_KEYS = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const BLACK_KEYS = [
  { note: "C#4", offset: 0 },
  { note: "D#4", offset: 1 },
  null,
  { note: "F#4", offset: 3 },
  { note: "G#4", offset: 4 },
  { note: "A#4", offset: 5 },
];

export default function Piano() {
  const { t } = useTranslation();
  const [songId, setSongId] = useState(pianoSongs[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const song = pianoSongs.find((s) => s.id === songId);
  const nextNote = playing ? song.notes[step] : null;

  function handleKeyPress(note) {
    playNoteOnce(note);
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "piano", event: `note_played:${note}` });

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

  function handleStartSong(id) {
    setSongId(id);
    setStep(0);
    setPlaying(true);
  }

  return (
    <div className="page">
      <h1>{t("modules.pianoTitle")} 🎹</h1>
      <p className="page-intro">{t("modules.pianoIntro")}</p>

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
          {BLACK_KEYS.map((key, i) =>
            key ? (
              <button
                key={key.note}
                type="button"
                style={{ left: `${(key.offset + 1) * (100 / 8) - 100 / 16}%` }}
                className={"piano-key black" + (nextNote === key.note ? " highlight" : "")}
                onClick={() => handleKeyPress(key.note)}
              />
            ) : (
              <span key={"gap-" + i} />
            )
          )}
        </div>
      </div>

      <h2 className="songs-heading">{t("modules.pianoSongsHeading")}</h2>
      <div className="song-list">
        {pianoSongs.map((s) => (
          <div className="song-card piano-song-card" key={s.id}>
            <h3>{s.title}</h3>
            <p className="piano-song-lyrics">{s.lyrics.join(" · ")}</p>
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
    </div>
  );
}
