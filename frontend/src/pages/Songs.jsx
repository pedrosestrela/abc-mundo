import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getSongs } from "../content/index.js";
import { getLangPair, getProfile, pingProgress } from "../storage.js";
import { isSpeechAvailable, speakSequence } from "../speech.js";
import { startBackgroundMusic, stopBackgroundMusic } from "../music.js";
import Illustration from "../components/Illustrations.jsx";
import HelpButton from "../components/HelpButton.jsx";

export default function Songs() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const songs = getSongs(pair.secondary);

  useEffect(() => stopBackgroundMusic, []);

  async function handlePlay(song) {
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "songs", event: `song_played:${song.id}` });
    startBackgroundMusic();
    await speakSequence(song.lyrics, pair.secondary);
    stopBackgroundMusic();
  }

  return (
    <div className="page">
      <h1>{t("modules.songsTitle")} 🎵</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.songsHelpMain")} langCode={pair.secondary} />
      </div>
      {!isSpeechAvailable() && <p className="speech-unavailable">{t("modules.speechUnavailable")}</p>}
      <div className="song-list">
        {songs.map((song) => (
          <div className="song-card" key={song.id}>
            <div className="song-illustration">
              <Illustration illustrationId={song.illustrationId} />
            </div>
            <h2>{song.title}</h2>
            <ul className="song-lyrics">
              {song.lyrics.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <button
              type="button"
              className="big-btn"
              onClick={() => handlePlay(song)}
              disabled={!isSpeechAvailable()}
            >
              ▶️ {t("modules.play")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
