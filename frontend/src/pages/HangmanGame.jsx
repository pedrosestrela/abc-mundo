import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlphabet, getHangmanWords } from "../content/index.js";
import { pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

// Word-guessing hangman ("Jogo da Forca"). Supports 1 player (computer
// picks a random word from the language's word bank, child guesses
// letters) and 2 players (player 1 taps a secret word from a small hidden
// on-screen list - no physical keyboard needed - then hands the device to
// player 2, who guesses). Wrong guesses are shown as a gentle balloon
// losing air rather than a hanging-figure, up to MAX_WRONG guesses before a
// friendly, non-punishing "game over" with the word revealed. Bounded to a
// single word per round - no auto-restart.
const MAX_WRONG = 6;
const CANDIDATE_COUNT = 4; // how many secret-word choices player 1 sees in 2p mode

// Accents/diacritics are stripped only for letter matching, so the on-screen
// alphabet grid (plain A-Z plus e.g. Ñ) can match accented word letters
// while the word itself still displays with correct spelling.
const ACCENT_MAP = {
  á: "a", à: "a", â: "a", ã: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
  ú: "u", ù: "u", û: "u", ü: "u",
  ç: "c",
};

function normalizeChar(ch) {
  const lower = ch.toLowerCase();
  return (ACCENT_MAP[lower] || lower).toUpperCase();
}

function flattenWords(bank) {
  return Object.values(bank).flat();
}

function pickRandom(list, count) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return count ? copy.slice(0, count) : copy;
}

function buildAlphabetLetters(langCode, words) {
  if (langCode === "zh") {
    // Chinese has no fixed alphabet: the guessable "letters" are the set of
    // unique characters that actually appear across the word bank.
    const set = new Set();
    for (const w of words) for (const ch of w.word) set.add(ch);
    return Array.from(set).sort();
  }
  return getAlphabet(langCode).map((entry) => entry.upper);
}

export default function HangmanGame({ pair, profileName }) {
  const { t } = useTranslation();
  const langCode = pair?.mother || "pt";
  const wordBank = useMemo(() => getHangmanWords(langCode), [langCode]);
  const allWords = useMemo(() => flattenWords(wordBank), [wordBank]);
  const alphabetLetters = useMemo(() => buildAlphabetLetters(langCode, allWords), [langCode, allWords]);

  const [mode, setMode] = useState("1p"); // "1p" | "2p"
  const [phase, setPhase] = useState("guessing"); // "picking" | "handoff" | "guessing"
  const [candidates, setCandidates] = useState([]);
  const [entry, setEntry] = useState(() => pickRandom(allWords, 1)[0]);
  const [guessed, setGuessed] = useState([]);
  const [logged, setLogged] = useState(false);

  const isZh = langCode === "zh";
  const wordLetters = useMemo(
    () => (entry ? entry.word.split("").map((ch) => (isZh ? ch : normalizeChar(ch))) : []),
    [entry, isZh]
  );
  const wrongGuesses = guessed.filter((g) => !wordLetters.includes(g));
  const wrongCount = wrongGuesses.length;
  const revealed = entry && wordLetters.every((_, i) => guessed.includes(wordLetters[i]));
  const lost = wrongCount >= MAX_WRONG;
  const finished = revealed || lost;

  if (finished && !logged) {
    setLogged(true);
    pingProgress({ profileName, module: "game-hangman", event: revealed ? "hangman_win" : "hangman_loss" });
    recordSkillEvent(profileName, "game-hangman", revealed);
  }

  function startNewRound(nextMode) {
    const useMode = nextMode || mode;
    setMode(useMode);
    setGuessed([]);
    setLogged(false);
    if (useMode === "2p") {
      setCandidates(pickRandom(allWords, CANDIDATE_COUNT));
      setEntry(null);
      setPhase("picking");
    } else {
      setEntry(pickRandom(allWords, 1)[0]);
      setPhase("guessing");
    }
  }

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    startNewRound(nextMode);
  }

  function choosePlayer1Word(word) {
    setEntry(word);
    setPhase("handoff");
  }

  function beginGuessing() {
    setPhase("guessing");
  }

  function handleGuess(letter) {
    if (finished || guessed.includes(letter)) return;
    setGuessed((g) => [...g, letter]);
  }

  function restart() {
    startNewRound();
  }

  return (
    <div className="game-card hangman-wrap">
      <div className="game-options math-mode-toggle">
        <button
          type="button"
          className={"big-btn game-option" + (mode === "1p" ? " correct" : "")}
          onClick={() => switchMode("1p")}
        >
          🤖 {t("modules.tttMode1p")}
        </button>
        <button
          type="button"
          className={"big-btn game-option" + (mode === "2p" ? " correct" : "")}
          onClick={() => switchMode("2p")}
        >
          🧑‍🤝‍🧑 {t("modules.tttMode2p")}
        </button>
      </div>

      {phase === "picking" && (
        <div className="hangman-picking">
          <p className="page-intro">{t("modules.hangmanPickPrompt")}</p>
          <div className="hangman-word-choices">
            {candidates.map((w) => (
              <button type="button" key={w.word} className="big-btn" onClick={() => choosePlayer1Word(w)}>
                {w.emoji} {w.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "handoff" && (
        <div className="hangman-handoff">
          <div className="game-emoji">🙈</div>
          <p className="page-intro">{t("modules.hangmanHandoffPrompt")}</p>
          <button type="button" className="big-btn" onClick={beginGuessing}>
            {t("modules.hangmanHandoffReady")} ▶️
          </button>
        </div>
      )}

      {phase === "guessing" && entry && (
        <>
          <div className="hangman-balloon" role="img" aria-label={`${wrongCount}/${MAX_WRONG}`}>
            <span className="hangman-balloon-emoji" style={{ opacity: 1 - wrongCount * 0.13 }}>
              🎈
            </span>
            <span className="hangman-balloon-count">
              {wrongCount} / {MAX_WRONG}
            </span>
          </div>

          {entry.emoji && !finished && <div className="game-emoji">{entry.emoji}</div>}

          <div className="hangman-word" aria-label={entry.word}>
            {entry.word.split("").map((ch, i) => {
              const norm = isZh ? ch : normalizeChar(ch);
              const show = guessed.includes(norm) || finished;
              return (
                <span key={i} className="hangman-letter-slot">
                  {show ? ch : "_"}
                </span>
              );
            })}
            {/* Only speakable once the word is fully revealed or the round is
                lost, so tapping this can never spoil an in-progress guess. */}
            {finished && <SpeakButton text={entry.word} langCode={langCode} />}
          </div>

          {!finished && (
            <div className="hangman-alphabet" role="group" aria-label={t("modules.hangmanGuessPrompt")}>
              {alphabetLetters.map((letter) => {
                const used = guessed.includes(letter);
                const correct = used && wordLetters.includes(letter);
                return (
                  <button
                    type="button"
                    key={letter}
                    className={"hangman-key" + (used ? (correct ? " hangman-key-correct" : " hangman-key-wrong") : "")}
                    onClick={() => handleGuess(letter)}
                    disabled={used}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          )}

          {finished && (
            <div className="hangman-result">
              <div className="game-emoji">{revealed ? "🏆" : "🌤️"}</div>
              <p className="game-result">
                {revealed ? t("modules.hangmanWin") : t("modules.hangmanLoss") + " " + entry.word}
                <SpeakButton
                  text={revealed ? t("modules.hangmanWin") : t("modules.hangmanLoss") + " " + entry.word}
                  langCode={langCode}
                />
              </p>
              <button type="button" className="big-btn" onClick={restart}>
                {t("modules.gamePlayAgain")} 🔁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
