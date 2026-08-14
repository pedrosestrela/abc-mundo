import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { playInstrumentNote, playDrumPad, SOLFEGE_PT, NOTE_FREQS, INSTRUMENTS, DRUM_PADS } from "../music.js";
import { getProfile, pingProgress, getLangPair } from "../storage.js";
import pianoSongs from "../content/pianoSongs.json";
import SpeakButton from "../components/SpeakButton.jsx";
import MusicStaff from "../components/MusicStaff.jsx";
import HelpButton from "../components/HelpButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";

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

// Ear-training scale — the seven natural notes of the first octave, matching
// the solfège names shown elsewhere in the module.
const EAR_SCALE = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Builds a round for level 1 (same/different): 50% chance of two identical
// notes, otherwise two notes at least a third apart so the difference is
// clearly audible to a young child.
function buildLevel1Round() {
  const a = randomFrom(EAR_SCALE);
  const same = Math.random() < 0.5;
  let b = a;
  if (!same) {
    const others = EAR_SCALE.filter((n) => n !== a);
    b = randomFrom(others);
  }
  return { a, b, answer: same ? "same" : "different" };
}

// Builds a round for level 2 (low/high): two distinct notes, answer is
// whichever has the higher frequency.
function buildLevel2Round() {
  let a = randomFrom(EAR_SCALE);
  let b = randomFrom(EAR_SCALE);
  while (b === a) b = randomFrom(EAR_SCALE);
  const answer = NOTE_FREQS[a] > NOTE_FREQS[b] ? "first" : "second";
  return { a, b, answer };
}

// Builds a round for level 3 (which note?): picks a target note from the
// first `choiceCount` notes of the scale, plus that many options to choose
// from — difficulty grows as choiceCount grows (2 -> 3 -> 7).
function buildLevel3Round(choiceCount) {
  const pool = EAR_SCALE.slice(0, choiceCount);
  const target = randomFrom(pool);
  return { target, options: pool };
}

// Builds a round for level 4 (melody recall): a short 3-4 note snippet
// lifted from a random song in pianoSongs.json.
function buildLevel4Round() {
  const song = randomFrom(pianoSongs);
  const len = Math.min(song.notes.length, Math.random() < 0.5 ? 3 : 4);
  const startMax = Math.max(0, song.notes.length - len);
  const start = Math.floor(Math.random() * (startMax + 1));
  return { sequence: song.notes.slice(start, start + len) };
}

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

  // "instruments" = the keyboard/song/drum experience above; "eartraining" =
  // the new Ouvido Musical mode.
  const [mode, setMode] = useState("instruments");
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [earLevel, setEarLevel] = useState(1);
  const [earStreak, setEarStreak] = useState(0);
  const [earLevel3ChoiceCount, setEarLevel3ChoiceCount] = useState(2);
  const [earRound, setEarRound] = useState(null);
  const [earResult, setEarResult] = useState(null); // null | "correct" | "wrong"
  const [earMelodyInput, setEarMelodyInput] = useState([]);

  const song = pianoSongs.find((s) => s.id === songId);
  const nextNote = playing ? song.notes[step] : null;
  const isDrum = instrument === "drum";

  function pingEar(event) {
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "music", event: `ear_training_level${earLevel}:${event}` });
  }

  function registerEarResult(correct) {
    setEarResult(correct ? "correct" : "wrong");
    pingEar(correct ? "correct" : "fail");
    if (correct) {
      const nextStreak = earStreak + 1;
      setEarStreak(nextStreak);
      if (earLevel === 3) {
        // Progressive difficulty within level 3: widen the choice pool
        // every 3 correct answers in a row, up to the full 7-note scale.
        if (nextStreak % 3 === 0) {
          setEarLevel3ChoiceCount((c) => Math.min(EAR_SCALE.length, c + 1));
        }
      }
      if (nextStreak >= 3 && unlockedLevel <= earLevel && earLevel < 4) {
        setUnlockedLevel(earLevel + 1);
      }
    } else {
      setEarStreak(0);
    }
  }

  function startEarRound(level) {
    setEarLevel(level);
    setEarResult(null);
    setEarMelodyInput([]);
    if (level === 1) setEarRound(buildLevel1Round());
    else if (level === 2) setEarRound(buildLevel2Round());
    else if (level === 3) setEarRound(buildLevel3Round(earLevel3ChoiceCount));
    else setEarRound(buildLevel4Round());
  }

  function handleSelectEarLevel(level) {
    if (level > unlockedLevel) return;
    startEarRound(level);
  }

  function playEarRound() {
    if (!earRound) return;
    if (earLevel === 1 || earLevel === 2) {
      playInstrumentNote("piano", earRound.a, 0.5);
      window.setTimeout(() => playInstrumentNote("piano", earRound.b, 0.5), 650);
    } else if (earLevel === 3) {
      playInstrumentNote("piano", earRound.target, 0.6);
    } else if (earLevel === 4) {
      earRound.sequence.forEach((note, i) => {
        window.setTimeout(() => playInstrumentNote("piano", note, 0.45), i * 550);
      });
    }
  }

  function handleEarAnswer(value) {
    if (!earRound || earResult) return;
    registerEarResult(value === earRound.answer);
  }

  function handleEarNoteChoice(note) {
    if (!earRound || earResult) return;
    registerEarResult(note === earRound.target);
  }

  function handleEarMelodyTap(note) {
    if (!earRound || earResult) return;
    const next = [...earMelodyInput, note];
    setEarMelodyInput(next);
    const idx = next.length - 1;
    if (note !== earRound.sequence[idx]) {
      registerEarResult(false);
      return;
    }
    if (next.length === earRound.sequence.length) {
      registerEarResult(true);
    }
  }

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
      <div className="help-btn-corner">
        <HelpButton text={isDrum ? t("modules.musicHelpDrum") : t("modules.musicHelpPiano")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.musicIntro")}</p>

      <div className="phonics-tabs">
        <button
          type="button"
          className={"phonics-tab" + (mode === "instruments" ? " selected" : "")}
          onClick={() => setMode("instruments")}
        >
          🎹 {t("modules.musicModeInstruments")}
        </button>
        <button
          type="button"
          className={"phonics-tab" + (mode === "eartraining" ? " selected" : "")}
          onClick={() => {
            setMode("eartraining");
            if (!earRound) startEarRound(earLevel);
          }}
        >
          👂 {t("modules.musicModeEarTraining")}
        </button>
      </div>

      {mode === "eartraining" ? (
        <div className="ear-training-wrap">
          <p className="page-intro">{t("modules.earTrainingIntro")}</p>

          <div className="phonics-tabs">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                type="button"
                disabled={level > unlockedLevel}
                className={"phonics-tab" + (earLevel === level ? " selected" : "")}
                onClick={() => handleSelectEarLevel(level)}
              >
                {level > unlockedLevel ? "🔒 " : ""}
                {t(`modules.earLevel${level}Title`)}
              </button>
            ))}
          </div>

          {earLevel > unlockedLevel ? (
            <p className="page-intro">{t("modules.earLevelLocked")}</p>
          ) : (
            <div className="ear-training-round">
              <p className="page-intro">{t(`modules.earLevel${earLevel}Prompt`)}</p>
              <p className="ear-streak">
                {t("modules.earStreakLabel")}: {earStreak}
              </p>

              <button type="button" className="big-btn" onClick={playEarRound}>
                {earResult ? t("modules.earPlayAgain") : t("modules.earPlayButton")}
              </button>

              {earLevel === 1 && (
                <div className="ear-answers">
                  <button type="button" className="big-btn" disabled={!!earResult} onClick={() => handleEarAnswer("same")}>
                    {t("modules.earSame")}
                  </button>
                  <button
                    type="button"
                    className="big-btn"
                    disabled={!!earResult}
                    onClick={() => handleEarAnswer("different")}
                  >
                    {t("modules.earDifferent")}
                  </button>
                </div>
              )}

              {earLevel === 2 && (
                <div className="ear-answers">
                  <button type="button" className="big-btn" disabled={!!earResult} onClick={() => handleEarAnswer("first")}>
                    {t("modules.earFirstNote")}
                  </button>
                  <button
                    type="button"
                    className="big-btn"
                    disabled={!!earResult}
                    onClick={() => handleEarAnswer("second")}
                  >
                    {t("modules.earSecondNote")}
                  </button>
                </div>
              )}

              {earLevel === 3 && earRound && (
                <div className="ear-answers">
                  {earRound.options.map((note) => (
                    <button
                      key={note}
                      type="button"
                      className="big-btn"
                      disabled={!!earResult}
                      onClick={() => handleEarNoteChoice(note)}
                    >
                      {SOLFEGE_PT[note] || note}
                    </button>
                  ))}
                </div>
              )}

              {earLevel === 4 && earRound && (
                <div className="piano-wrap">
                  <div className="piano-white-keys">
                    {WHITE_KEYS.filter((n) => Number(n[n.length - 1]) === 4).map((note) => (
                      <button
                        key={note}
                        type="button"
                        className="piano-key white"
                        disabled={!!earResult}
                        onClick={() => handleEarMelodyTap(note)}
                      >
                        <span className="piano-key-label">{SOLFEGE_PT[note] || note}</span>
                      </button>
                    ))}
                  </div>
                  <p className="rhythm-input">
                    {earRound.sequence.map((_, i) => (
                      <span key={i} className="rhythm-input-slot">
                        {earMelodyInput[i] ? "🎵" : "•"}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {earResult === "correct" && <p className="rhythm-feedback rhythm-success">{t("modules.earCorrect")}</p>}
              {earResult === "wrong" && <p className="rhythm-feedback rhythm-fail">{t("modules.earWrong")}</p>}
              {earResult && (
                <button type="button" className="big-btn" onClick={() => startEarRound(earLevel)}>
                  ▶️ {t("modules.earNextRound")}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
      <div className="instrument-switcher phonics-tabs">
        {INSTRUMENTS.map((inst) => {
          const helpText = inst.id === "drum" ? t("modules.musicHelpDrum") : t("modules.musicHelpPiano");
          return (
            <button
              key={inst.id}
              type="button"
              className={"instrument-btn" + (instrument === inst.id ? " active" : "")}
              onClick={() => handleSelectInstrument(inst.id)}
            >
              <span className="instrument-icon">{inst.icon}</span>
              <span>{t(`modules.pianoInstrument_${inst.id}`)}</span>
              <TabSpeakIcon text={`${t(`modules.pianoInstrument_${inst.id}`)}. ${helpText}`} langCode={pair.mother} />
            </button>
          );
        })}
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
        </>
      )}
    </div>
  );
}
