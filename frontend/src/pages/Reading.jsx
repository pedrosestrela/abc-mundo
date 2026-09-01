import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getReading } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, pingProgress, recordSkillEvent } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import { IllustrationBook } from "../components/illustrations/index.js";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { pickLine } from "../components/mascots/reactionLines.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simple picture+word multiple-choice mini-quiz shown once a reading card
// is opened, built entirely from data already present on the reading list
// (the emoji is the question, the matching word is the correct option, two
// other words become distractors) — no extra per-language content needed.
// Anti-guessing: wrong taps disable that option instead of allowing
// repeated blind clicks. Mirrors Whys/HumanEvolution's quiz pattern.
function WordQuiz({ words, target, pair, profile, t }) {
  const [options] = useState(() => {
    const others = shuffle(words.filter((w) => w.word !== target.word)).slice(0, 2);
    return shuffle([target, ...others]);
  });
  const [wrongWords, setWrongWords] = useState([]);
  const [solved, setSolved] = useState(false);

  if (options.length < 3) return null;

  function pick(option) {
    if (solved) return;
    if (option.word === target.word) {
      setSolved(true);
      recordSkillEvent(profile?.name, "reading-quiz", wrongWords.length === 0);
      pingProgress({ profileName: profile?.name, module: "reading", event: `quiz_solved:${target.word}` });
    } else {
      setWrongWords((prev) => (prev.includes(option.word) ? prev : [...prev, option.word]));
      pingProgress({ profileName: profile?.name, module: "reading", event: `quiz_attempt:${target.word}` });
    }
  }

  const prompt = t("modules.readingQuizPrompt");

  return (
    <div className="game-card">
      <div className="game-emoji">{target.emoji}</div>
      <p className="mission-badge science-topic-badge">{t("modules.readingQuizTitle")}</p>
      <p className="page-intro">
        {prompt}
        <SpeakButton text={prompt} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {options.map((opt) => (
          <div className="game-option-row" key={opt.word}>
            <button
              type="button"
              disabled={solved || wrongWords.includes(opt.word)}
              className={
                "big-btn game-option" +
                (solved && opt.word === target.word ? " correct" : "") +
                (wrongWords.includes(opt.word) ? " wrong" : "")
              }
              onClick={() => pick(opt)}
            >
              {opt.word}
            </button>
            <SpeakButton text={opt.word} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {solved && (
        <div className="science-explanation">
          <p className="game-result">⭐ {t("modules.readingQuizCorrect")}</p>
          <SpeakButton text={t("modules.readingQuizCorrect")} langCode={pair.mother} />
          <MascotBubble character="lumi" reaction="happy" langCode={pair.mother}>
            {pickLine(t("mascotLines.mathCorrect", { returnObjects: true }))}
          </MascotBubble>
        </div>
      )}
    </div>
  );
}

// Tier -> how many word/picture pairs make up the memory board.
const MEMORY_TIER_PAIRS = { 1: 4, 2: 6, 3: 8 };

function shuffleMemory(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMemoryDeck(words, tier) {
  const pairCount = Math.min(MEMORY_TIER_PAIRS[tier] || MEMORY_TIER_PAIRS[1], words.length);
  const picked = shuffleMemory(words).slice(0, pairCount);
  const cards = [];
  picked.forEach((w, i) => {
    cards.push({ id: `w-${i}`, matchKey: w.word, kind: "word", value: w.word });
    cards.push({ id: `e-${i}`, matchKey: w.word, kind: "emoji", value: w.emoji });
  });
  return shuffleMemory(cards).map((c, idx) => ({ ...c, cardId: idx, matched: false }));
}

function starsForMoves(moves, pairCount) {
  if (moves <= pairCount * 1.5) return 3;
  if (moves <= pairCount * 2.5) return 2;
  return 1;
}

// "Jogo da Memória de Leitura": a word <-> picture flip-card memory match
// built entirely from the same reading word list already used for browsing
// (getReading), giving the mother-tongue words a second, more playful mode
// of practice beyond "tap to open a quiz card".
function ReadingMemoryGame({ pair, profile }) {
  const { t } = useTranslation();
  const tier = getDifficultyTier(profile?.age);
  const words = useMemo(() => getReading(pair.mother), [pair.mother]);
  const pairCount = Math.min(MEMORY_TIER_PAIRS[tier] || MEMORY_TIER_PAIRS[1], words.length);

  const [cards, setCards] = useState(() => buildMemoryDeck(words, tier));
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [logged, setLogged] = useState(false);

  const won = cards.length > 0 && cards.every((c) => c.matched);

  if (won && !logged) {
    setLogged(true);
    const stars = starsForMoves(moves, pairCount);
    recordSkillEvent(profile?.name, "reading-memory", stars >= 2);
    pingProgress({ profileName: profile?.name, module: "reading", event: `memory_win:${stars}stars` });
  }

  function handleFlip(card) {
    if (busy || card.matched || flipped.includes(card.cardId)) return;
    const next = [...flipped, card.cardId];
    setFlipped(next);
    if (next.length === 2) {
      setBusy(true);
      setMoves((m) => m + 1);
      const [aId, bId] = next;
      const a = cards.find((c) => c.cardId === aId);
      const b = cards.find((c) => c.cardId === bId);
      if (a.matchKey === b.matchKey) {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.cardId === aId || c.cardId === bId ? { ...c, matched: true } : c)));
          setFlipped([]);
          setBusy(false);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 800);
      }
    }
  }

  function restart() {
    setCards(buildMemoryDeck(words, tier));
    setFlipped([]);
    setMoves(0);
    setBusy(false);
    setLogged(false);
  }

  return (
    <div className="memory-wrap">
      <div className="memory-hud">
        <span>
          🧠 {t("modules.memoryMovesLabel")}: {moves}
        </span>
      </div>
      <div className="memory-grid reading-memory-grid">
        {cards.map((card) => {
          const isFlipped = card.matched || flipped.includes(card.cardId);
          return (
            <button
              type="button"
              key={card.cardId}
              className={"memory-card reading-memory-card" + (isFlipped ? " flipped" : "") + (card.matched ? " matched" : "")}
              onClick={() => handleFlip(card)}
              disabled={card.matched}
              aria-label={isFlipped ? card.value : "?"}
            >
              <span className="memory-card-face">{isFlipped ? card.value : "❓"}</span>
            </button>
          );
        })}
      </div>
      {won && (
        <div className="memory-result">
          <div className="game-emoji">🎉</div>
          <p className="game-result">
            {"⭐".repeat(starsForMoves(moves, pairCount))}
            {"☆".repeat(3 - starsForMoves(moves, pairCount))}
          </p>
          <p className="page-intro">
            {t("modules.readingMemoryWin")}
            <SpeakButton text={t("modules.readingMemoryWin")} langCode={pair.mother} />
          </p>
          <button type="button" className="big-btn" onClick={restart}>
            {t("modules.gamePlayAgain")} 🔁
          </button>
        </div>
      )}
    </div>
  );
}

export default function Reading() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const motherWords = getReading(pair.mother);
  const secondaryWords = getReading(pair.secondary);
  const count = Math.min(motherWords.length, secondaryWords.length);
  const [openIndex, setOpenIndex] = useState(null);
  const [mode, setMode] = useState("browse"); // "browse" | "memory"

  function handleView(word, index) {
    pingProgress({ profileName: profile?.name, module: "reading", event: `word_viewed:${word}` });
    recordSkillEvent(profile?.name, "reading-word", true);
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="page">
      <h1>{t("modules.readingTitle")} 📖</h1>
      <div className="help-btn-corner">
        <HelpButton text={mode === "browse" ? t("modules.readingHelpMain") : t("modules.readingMemoryHelp")} langCode={pair.mother} />
      </div>
      <IllustrationBook size={40} />
      <MascotBubble character="lumi" reaction="curious" langCode={pair.mother}>
        {t("mascotLines.readingOpening")}
      </MascotBubble>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (mode === "browse" ? " selected" : "")} onClick={() => setMode("browse")}>
          📖 {t("modules.readingModeBrowse")}
        </button>
        <button type="button" className={"phonics-tab" + (mode === "memory" ? " selected" : "")} onClick={() => setMode("memory")}>
          🧠 {t("modules.readingModeMemory")}
        </button>
      </div>

      {mode === "memory" && <ReadingMemoryGame key="reading-memory" pair={pair} profile={profile} />}

      {mode === "browse" && (
      <div className="reading-list">
        {Array.from({ length: count }).map((_, i) => {
          const m = motherWords[i];
          const s = secondaryWords[i];
          return (
            <div
              className="reading-card"
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => handleView(m.word, i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleView(m.word, i);
                }
              }}
            >
              <div className="reading-emoji">{m.emoji}</div>
              <div className="reading-words">
                <div className="reading-word-row">
                  <span className="reading-word">{m.word}</span>
                  <SpeakButton text={m.hint} langCode={pair.mother} />
                </div>
                <div className="reading-word-row secondary">
                  <span className="reading-word">{s.word}</span>
                  <SpeakButton text={s.hint} langCode={pair.secondary} />
                </div>
              </div>
              {openIndex === i && (
                <div onClick={(e) => e.stopPropagation()}>
                  <WordQuiz key={m.word} words={motherWords} target={m} pair={pair} profile={profile} t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
