import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSongs } from "../content/index.js";
import { getLangPair, getProfile, pingProgress } from "../storage.js";
import { isSpeechAvailable, speakSequence } from "../speech.js";
import { startBackgroundMusic, stopBackgroundMusic } from "../music.js";
import Illustration from "../components/Illustrations.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { playRealAudio, segmentIndexForProgress } from "../audioPlayback.js";

// Real recorded-voice audio for songs (pt/ via Piper TTS, pt_PT voice,
// generated locally; en/ via ElevenLabs — see
// frontend/public/audio/songs/NOTICE.md for the full per-language
// provenance). Only covers a subset of songs/languages, so every lookup
// falls back to the existing Web Speech synthesis path below when no file
// exists for a given song+language.
const REAL_AUDIO = import.meta.glob("/public/audio/songs/*/*.mp3", { eager: true, query: "?url", import: "default" });
function realAudioUrl(songId, langCode) {
  const key = `/public/audio/songs/${langCode}/${songId}.mp3`;
  return REAL_AUDIO[key] || null;
}

// Splits a lyric line into words while keeping track of each word's start
// character offset, so a `charIndex` reported by the Web Speech API's
// `onboundary` event can be matched back to a word to highlight. Mirrors the
// same helper used for word-highlighting in Stories.jsx.
function splitWords(text) {
  const words = [];
  const re = /\S+/g;
  let match;
  while ((match = re.exec(text))) {
    words.push({ word: match[0], start: match.index });
  }
  return words;
}

export default function Songs() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const motherSongs = getSongs(pair.mother);
  const secondarySongs = getSongs(pair.secondary);
  const count = Math.min(motherSongs.length, secondarySongs.length);

  // Tracks which song/language is currently singing along and which
  // line/word within it is active, so the lyrics can highlight in sync with
  // playback (karaoke-style) — audio alone can't carry a melody, so this is
  // the visual compensation for that ceiling. `key` is `${song.id}:${langCode}`.
  const [playing, setPlaying] = useState(null);

  useEffect(() => stopBackgroundMusic, []);

async function handlePlay(song, langCode) {
    const profile = getProfile();
    const key = `${song.id}:${langCode}`;
    const audioUrl = realAudioUrl(song.id, langCode);
    pingProgress({
      profileName: profile?.name,
      module: "songs",
      event: `song_played:${song.id}:${langCode}:${audioUrl ? "real" : "synth"}`,
    });
    setPlaying({ key, lineIndex: 0, wordIndex: -1 });
    startBackgroundMusic();
    if (audioUrl) {
      // No word-boundary events from a recorded file, so lines are
      // highlighted proportionally to elapsed time weighted by line
      // length — an approximation, not a real karaoke sync, but still
      // gives a "follow along" cue during real sung/narrated playback.
      await playRealAudio(audioUrl, {
        onProgress: (frac) => {
          const lineIndex = segmentIndexForProgress(song.lyrics, frac);
          setPlaying((prev) => (prev && prev.key === key ? { ...prev, lineIndex, wordIndex: -1 } : prev));
        },
      });
    } else {
      await speakSequence(song.lyrics, langCode, {
        onLineStart: (lineIndex) => setPlaying({ key, lineIndex, wordIndex: -1 }),
        onWordBoundary: (charIndex) => {
          setPlaying((prev) => {
            if (!prev || prev.key !== key) return prev;
            const words = splitWords(song.lyrics[prev.lineIndex] || "");
            let wordIndex = -1;
            for (let w = 0; w < words.length; w++) {
              if (words[w].start <= charIndex) wordIndex = w;
              else break;
            }
            return { ...prev, wordIndex };
          });
        },
      });
    }
    stopBackgroundMusic();
    setPlaying((prev) => (prev && prev.key === key ? null : prev));
  }

  function renderLyricsLine(song, langCode, line, idx) {
    const key = `${song.id}:${langCode}`;
    const isActiveLine = playing && playing.key === key && playing.lineIndex === idx;
    if (!isActiveLine) {
      return <li key={idx}>{line}</li>;
    }
    const words = splitWords(line);
    return (
      <li key={idx} className="song-lyric-line active">
        {words.map((w, wi) => (
          <span key={wi} className={wi === playing.wordIndex ? "story-word active" : "story-word"}>
            {w.word}{" "}
          </span>
        ))}
      </li>
    );
  }

  return (
    <div className="page">
      <h1>{t("modules.songsTitle")} 🎵</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.songsHelpMain")} langCode={pair.secondary} />
      </div>
      {!isSpeechAvailable() && <p className="speech-unavailable">{t("modules.speechUnavailable")}</p>}
      <MascotBubble character="milo" mood="happy" langCode={pair.mother}>
        {t("modules.songsMascotIntro")}
      </MascotBubble>
      <div className="song-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherSongs[i];
          const s = secondarySongs[i];
          return (
            <div className="song-card" key={m.id}>
              <div className="song-illustration">
                <Illustration illustrationId={m.illustrationId} />
              </div>
              <h2>{m.title}</h2>
              <ul className="song-lyrics">
                {m.lyrics.map((line, idx) => renderLyricsLine(m, pair.mother, line, idx))}
              </ul>
              <button
                type="button"
                className="big-btn"
                onClick={() => handlePlay(m, pair.mother)}
                disabled={!isSpeechAvailable() && !realAudioUrl(m.id, pair.mother)}
              >
                ▶️ {t("modules.play")}
                {realAudioUrl(m.id, pair.mother) ? " 🎙️" : ""}
              </button>
              {pair.secondary !== pair.mother ? (
                <>
                  <h2 className="song-secondary-title">{s.title}</h2>
                  <ul className="song-lyrics secondary">
                    {s.lyrics.map((line, idx) => renderLyricsLine(s, pair.secondary, line, idx))}
                  </ul>
                  <button
                    type="button"
                    className="big-btn secondary-btn"
                    onClick={() => handlePlay(s, pair.secondary)}
                    disabled={!isSpeechAvailable() && !realAudioUrl(s.id, pair.secondary)}
                  >
                    ▶️ {t("modules.play")}
                    {realAudioUrl(s.id, pair.secondary) ? " 🎙️" : ""}
                  </button>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
