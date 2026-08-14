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
  const motherSongs = getSongs(pair.mother);
  const secondarySongs = getSongs(pair.secondary);
  const count = Math.min(motherSongs.length, secondarySongs.length);

  useEffect(() => stopBackgroundMusic, []);

  async function handlePlay(song, langCode) {
    const profile = getProfile();
    pingProgress({ profileName: profile?.name, module: "songs", event: `song_played:${song.id}:${langCode}` });
    startBackgroundMusic();
    await speakSequence(song.lyrics, langCode);
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
                {m.lyrics.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              <button
                type="button"
                className="big-btn"
                onClick={() => handlePlay(m, pair.mother)}
                disabled={!isSpeechAvailable()}
              >
                ▶️ {t("modules.play")}
              </button>
              {pair.secondary !== pair.mother ? (
                <>
                  <h2 className="song-secondary-title">{s.title}</h2>
                  <ul className="song-lyrics secondary">
                    {s.lyrics.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="big-btn secondary-btn"
                    onClick={() => handlePlay(s, pair.secondary)}
                    disabled={!isSpeechAvailable()}
                  >
                    ▶️ {t("modules.play")}
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
