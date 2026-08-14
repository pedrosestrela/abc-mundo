import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPhonics } from "../content/index.js";
import { getLangPair, getProfile, getDifficultyTier, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

const TIER_CONFIG = {
  1: { rounds: 4, optionCount: 3 },
  2: { rounds: 6, optionCount: 3 },
  3: { rounds: 8, optionCount: 4 },
};

const GAMES = ["initial", "rhyme", "syllables", "oddOneOut"];

function buildInitialSoundRounds(words, count, optionCount) {
  const rounds = [];
  const withInitial = words.filter((w) => w.initial);
  const pool = shuffle(withInitial);
  for (const target of pool) {
    if (rounds.length >= count) break;
    const distractors = shuffle(words.filter((w) => w.initial !== target.initial)).slice(0, optionCount - 1);
    if (distractors.length < optionCount - 1) continue;
    rounds.push({
      target,
      sound: target.initial,
      options: shuffle([target, ...distractors]),
    });
  }
  return rounds;
}

function buildRhymeRounds(words, count, optionCount) {
  const rounds = [];
  const rhymeGroups = {};
  for (const w of words) {
    if (!w.rhyme) continue;
    (rhymeGroups[w.rhyme] = rhymeGroups[w.rhyme] || []).push(w);
  }
  const candidates = shuffle(
    Object.entries(rhymeGroups).filter(([, list]) => list.length >= 2)
  );
  for (const [rhyme, list] of candidates) {
    if (rounds.length >= count) break;
    const [prompt, answer] = shuffle(list).slice(0, 2);
    const distractors = shuffle(words.filter((w) => w.rhyme !== rhyme && w.word !== prompt.word)).slice(
      0,
      optionCount - 1
    );
    if (distractors.length < optionCount - 1) continue;
    rounds.push({
      prompt,
      target: answer,
      options: shuffle([answer, ...distractors]),
    });
  }
  return rounds;
}

function buildSyllableRounds(words, count) {
  const rounds = [];
  const pool = shuffle(words.filter((w) => w.syllables));
  const allCounts = Array.from(new Set(words.map((w) => w.syllables))).sort((a, b) => a - b);
  for (const target of pool) {
    if (rounds.length >= count) break;
    const others = allCounts.filter((c) => c !== target.syllables);
    const optionCounts = shuffle(others).slice(0, 2);
    const options = shuffle([target.syllables, ...optionCounts]);
    rounds.push({ target, options });
  }
  return rounds;
}

function buildOddOneOutRounds(words, count) {
  const rounds = [];
  const groups = {};
  for (const w of words) {
    const key = w.rhyme || `initial:${w.initial}`;
    (groups[key] = groups[key] || []).push(w);
  }
  const bigGroups = shuffle(Object.entries(groups).filter(([, list]) => list.length >= 3));
  for (const [key, list] of bigGroups) {
    if (rounds.length >= count) break;
    const trio = shuffle(list).slice(0, 3);
    const outsider = shuffle(words.filter((w) => !trio.includes(w) && w.rhyme !== key && `initial:${w.initial}` !== key))[0];
    if (!outsider) continue;
    const options = shuffle([...trio, outsider]);
    rounds.push({ options, oddWord: outsider });
  }
  return rounds;
}

export default function Phonics() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);
  const config = TIER_CONFIG[tier] || TIER_CONFIG[1];
  const words = getPhonics(pair.mother);

  const [game, setGame] = useState("initial");

  const initialRounds = useMemo(() => buildInitialSoundRounds(words, config.rounds, config.optionCount), [words, config, game]);
  const rhymeRounds = useMemo(() => buildRhymeRounds(words, config.rounds, config.optionCount), [words, config, game]);
  const syllableRounds = useMemo(() => buildSyllableRounds(words, config.rounds), [words, config, game]);
  const oddRounds = useMemo(() => buildOddOneOutRounds(words, config.rounds), [words, config, game]);

  return (
    <div className="page">
      <h1>{t("modules.phonicsTitle")} 👂</h1>
      <p className="page-intro">{t("modules.phonicsIntro", "")}</p>

      <div className="phonics-tabs">
        <button type="button" className={"phonics-tab" + (game === "initial" ? " selected" : "")} onClick={() => setGame("initial")}>
          🔊 {t("modules.phonicsInitialSound")}
        </button>
        <button type="button" className={"phonics-tab" + (game === "rhyme" ? " selected" : "")} onClick={() => setGame("rhyme")}>
          🎶 {t("modules.phonicsRhyme")}
        </button>
        <button type="button" className={"phonics-tab" + (game === "syllables" ? " selected" : "")} onClick={() => setGame("syllables")}>
          👏 {t("modules.phonicsSyllableCount")}
        </button>
        <button type="button" className={"phonics-tab" + (game === "oddOneOut" ? " selected" : "")} onClick={() => setGame("oddOneOut")}>
          🕵️ {t("modules.phonicsOddOneOut")}
        </button>
      </div>

      {game === "initial" && (
        <InitialSoundGame rounds={initialRounds} pair={pair} profile={profile} t={t} />
      )}
      {game === "rhyme" && <RhymeGame rounds={rhymeRounds} pair={pair} profile={profile} t={t} />}
      {game === "syllables" && <SyllableGame rounds={syllableRounds} pair={pair} profile={profile} t={t} />}
      {game === "oddOneOut" && <OddOneOutGame rounds={oddRounds} pair={pair} profile={profile} t={t} />}
    </div>
  );
}

function useRoundState() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | null
  const [done, setDone] = useState(false);
  return { roundIndex, setRoundIndex, score, setScore, feedback, setFeedback, done, setDone };
}

function ScoreFooter({ score, total, done, onReplay, t }) {
  if (!done) return null;
  return (
    <div className="game-card">
      <p>
        {t("modules.phonicsScore")}: {score} / {total}
      </p>
      <button type="button" className="big-btn" onClick={onReplay}>
        {t("modules.phonicsPlayAgain")}
      </button>
    </div>
  );
}

function InitialSoundGame({ rounds, pair, profile, t }) {
  const state = useRoundState();
  const { roundIndex, setRoundIndex, score, setScore, feedback, setFeedback, done, setDone } = state;
  const [key, setKey] = useState(0);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];

  function handleAnswer(option) {
    if (feedback) return;
    const correct = option.word === round.target.word;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "phon-initial-sound", correct);
    pingProgress({ profileName: profile?.name, module: "phonics", event: `initial_sound:${correct ? "correct" : "wrong"}` });
    setTimeout(() => {
      setFeedback(null);
      if (roundIndex + 1 >= rounds.length) {
        setDone(true);
      } else {
        setRoundIndex((r) => r + 1);
      }
    }, 900);
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setFeedback(null);
    setDone(false);
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-prompt-row">
        <p className="game-prompt">/{round.sound.toLowerCase()}/ ...?</p>
        <SpeakButton text={round.sound} langCode={pair.mother} />
      </div>
      <div className="game-options">
        {round.options.map((opt) => (
          <div key={opt.word} className="game-option-wrap">
            <button
              type="button"
              className={"game-option" + (feedback && opt.word === round.target.word ? " correct" : "")}
              onClick={() => handleAnswer(opt)}
              disabled={!!feedback}
            >
              <span className="game-option-emoji">{opt.emoji}</span>
              <span>{opt.word}</span>
            </button>
            <SpeakButton text={opt.word} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} t={t} />
    </div>
  );
}

function RhymeGame({ rounds, pair, profile, t }) {
  const state = useRoundState();
  const { roundIndex, setRoundIndex, score, setScore, feedback, setFeedback, done, setDone } = state;
  const [key, setKey] = useState(0);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];

  function handleAnswer(option) {
    if (feedback) return;
    const correct = option.word === round.target.word;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "phon-rhyme", correct);
    pingProgress({ profileName: profile?.name, module: "phonics", event: `rhyme:${correct ? "correct" : "wrong"}` });
    setTimeout(() => {
      setFeedback(null);
      if (roundIndex + 1 >= rounds.length) setDone(true);
      else setRoundIndex((r) => r + 1);
    }, 900);
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setFeedback(null);
    setDone(false);
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-prompt-word">
        <span className="game-option-emoji">{round.prompt.emoji}</span>
        <span>{round.prompt.word}</span>
        <SpeakButton text={round.prompt.word} langCode={pair.mother} />
      </div>
      <div className="game-options">
        {round.options.map((opt) => (
          <div key={opt.word} className="game-option-wrap">
            <button
              type="button"
              className={"game-option" + (feedback && opt.word === round.target.word ? " correct" : "")}
              onClick={() => handleAnswer(opt)}
              disabled={!!feedback}
            >
              <span className="game-option-emoji">{opt.emoji}</span>
              <span>{opt.word}</span>
            </button>
            <SpeakButton text={opt.word} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} t={t} />
    </div>
  );
}

function SyllableGame({ rounds, pair, profile, t }) {
  const state = useRoundState();
  const { roundIndex, setRoundIndex, score, setScore, feedback, setFeedback, done, setDone } = state;
  const [key, setKey] = useState(0);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];

  function handleAnswer(count) {
    if (feedback) return;
    const correct = count === round.target.syllables;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "phon-syllable-count", correct);
    pingProgress({ profileName: profile?.name, module: "phonics", event: `syllable_count:${correct ? "correct" : "wrong"}` });
    setTimeout(() => {
      setFeedback(null);
      if (roundIndex + 1 >= rounds.length) setDone(true);
      else setRoundIndex((r) => r + 1);
    }, 900);
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setFeedback(null);
    setDone(false);
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-prompt-word">
        <span className="game-option-emoji">{round.target.emoji}</span>
        <span>{round.target.word}</span>
        <SpeakButton text={round.target.word} langCode={pair.mother} />
      </div>
      <div className="game-options">
        {round.options.map((count) => (
          <button
            key={count}
            type="button"
            className={"game-option" + (feedback && count === round.target.syllables ? " correct" : "")}
            onClick={() => handleAnswer(count)}
            disabled={!!feedback}
          >
            {count}
          </button>
        ))}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} t={t} />
    </div>
  );
}

function OddOneOutGame({ rounds, pair, profile, t }) {
  const state = useRoundState();
  const { roundIndex, setRoundIndex, score, setScore, feedback, setFeedback, done, setDone } = state;
  const [key, setKey] = useState(0);

  if (rounds.length === 0) return <p>{t("modules.phonicsScore")}</p>;
  const round = rounds[roundIndex];

  function handleAnswer(option) {
    if (feedback) return;
    const correct = option.word === round.oddWord.word;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    recordSkillEvent(profile?.name, "phon-odd-one-out", correct);
    pingProgress({ profileName: profile?.name, module: "phonics", event: `odd_one_out:${correct ? "correct" : "wrong"}` });
    setTimeout(() => {
      setFeedback(null);
      if (roundIndex + 1 >= rounds.length) setDone(true);
      else setRoundIndex((r) => r + 1);
    }, 900);
  }

  function replay() {
    setRoundIndex(0);
    setScore(0);
    setFeedback(null);
    setDone(false);
    setKey((k) => k + 1);
  }

  return (
    <div className="game-card" key={key}>
      <div className="game-options game-options-grid">
        {round.options.map((opt) => (
          <div key={opt.word} className="game-option-wrap">
            <button
              type="button"
              className={"game-option" + (feedback && opt.word === round.oddWord.word ? " correct" : "")}
              onClick={() => handleAnswer(opt)}
              disabled={!!feedback}
            >
              <span className="game-option-emoji">{opt.emoji}</span>
              <span>{opt.word}</span>
            </button>
            <SpeakButton text={opt.word} langCode={pair.mother} />
          </div>
        ))}
      </div>
      {!done && (
        <p className="game-round-count">
          {roundIndex + 1} / {rounds.length}
        </p>
      )}
      <ScoreFooter score={score} total={rounds.length} done={done} onReplay={replay} t={t} />
    </div>
  );
}
