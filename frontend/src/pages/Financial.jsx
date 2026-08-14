import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFinancial, getLemonadeStand, getShopping, getAdLiteracy } from "../content/index.js";
import { getDifficultyTier, getLangPair, getProfile, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import TabSpeakIcon from "../components/TabSpeakIcon.jsx";
import HelpButton from "../components/HelpButton.jsx";
import AgeAdvisory from "../components/AgeAdvisory.jsx";

// Coin values used to build quiz rounds. Plain emoji + label, no real
// currency imagery needed.
const COINS = [
  { id: "1c", label: "1c", value: 1 },
  { id: "2c", label: "2c", value: 2 },
  { id: "5c", label: "5c", value: 5 },
  { id: "10c", label: "10c", value: 10 },
  { id: "20c", label: "20c", value: 20 },
  { id: "50c", label: "50c", value: 50 },
  { id: "1e", label: "1€", value: 100 },
  { id: "2e", label: "2€", value: 200 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatValue(cents) {
  if (cents >= 100 && cents % 100 === 0) return `${cents / 100}€`;
  if (cents >= 100) return `${(cents / 100).toFixed(2)}€`;
  return `${cents}c`;
}

function pickOptions(correctCoin, pool, count) {
  const others = shuffle(pool.filter((c) => c.id !== correctCoin.id)).slice(0, count - 1);
  return shuffle([correctCoin, ...others]);
}

// Builds one round of the coin game depending on the child's age tier.
// Tier 1: recognize a single coin's value among distractors.
// Tier 2-3: sum two coins and pick the matching total.
function buildRound(tier) {
  if (tier === 1) {
    const correct = COINS[Math.floor(Math.random() * COINS.length)];
    const options = pickOptions(correct, COINS, 3).map((c) => ({ key: c.id, label: c.label, correct: c.id === correct.id }));
    return { prompt: { emoji: "🪙", label: correct.label }, options, questionKind: "single" };
  }
  const pool = tier === 2 ? COINS.slice(0, 6) : COINS;
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while (b.id === a.id && guard < 10) {
    b = pool[Math.floor(Math.random() * pool.length)];
    guard += 1;
  }
  const total = a.value + b.value;
  const correctLabel = formatValue(total);
  const distractors = new Set();
  while (distractors.size < 2) {
    const delta = [10, 20, 50, -10, -20][Math.floor(Math.random() * 5)];
    const candidate = Math.max(1, total + delta);
    const candidateLabel = formatValue(candidate);
    if (candidateLabel !== correctLabel) distractors.add(candidateLabel);
  }
  const options = shuffle([correctLabel, ...distractors]).map((label) => ({
    key: label,
    label,
    correct: label === correctLabel,
  }));
  return { prompt: { emoji: "🪙", coins: [a, b] }, options, questionKind: "sum" };
}

const ROUNDS_PER_GAME = 6;

// --- Banca de Limonada (Lemonade Stand) ---
// Deterministic-feeling but slightly randomized demand model: cheaper prices
// sell more cups (up to a cap), pricier ones sell fewer but earn more per
// cup. baseline is tuned around the middle price option.
function simulateLemonadeDay(priceCents, priceOptions) {
  const sorted = [...priceOptions].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  const maxCups = 20;
  const sensitivity = 0.12; // cups lost per cent above the mid price
  const baseline = 12;
  const diff = priceCents - mid;
  const noise = Math.floor(Math.random() * 5) - 2; // -2..+2
  let cups = Math.round(baseline - diff * sensitivity + noise);
  cups = Math.max(0, Math.min(maxCups, cups));
  return cups;
}

const LEMONADE_ROUNDS = 3;

export default function Financial() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const tier = getDifficultyTier(profile?.age);

  const motherConcepts = getFinancial(pair.mother);
  const secondaryConcepts = getFinancial(pair.secondary);
  const conceptCount = Math.min(motherConcepts.length, secondaryConcepts.length);

  const [activeTab, setActiveTab] = useState("concepts");

  // --- Coin game state ---
  const [round, setRound] = useState(() => buildRound(tier));
  const [roundIndex, setRoundIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);

  const gameOver = finished || roundIndex > ROUNDS_PER_GAME;

  function handleViewConcept(concept) {
    pingProgress({ profileName: profile?.name, module: "financial", event: `concept_viewed:${concept.id}` });
  }

  function handleAnswer(option) {
    if (feedback) return;
    setFeedback(option.correct ? "correct" : "wrong");
    if (option.correct) setScore((s) => s + 1);
    pingProgress({
      profileName: profile?.name,
      module: "financial",
      event: `coin_answer:${option.correct ? "correct" : "wrong"}`,
    });
    setTimeout(() => {
      setFeedback(null);
      if (roundIndex >= ROUNDS_PER_GAME) {
        setFinished(true);
      } else {
        setRoundIndex((i) => i + 1);
        setRound(buildRound(tier));
      }
    }, 700);
  }

  function handlePlayAgain() {
    setScore(0);
    setRoundIndex(1);
    setFinished(false);
    setFeedback(null);
    setRound(buildRound(tier));
  }

  const promptCoins = useMemo(() => round.prompt.coins, [round]);

  // --- Lemonade Stand state ---
  const lemonade = getLemonadeStand(pair.mother);
  const [lemonAdvisoryDone, setLemonAdvisoryDone] = useState(tier >= 2);
  const [lemonRound, setLemonRound] = useState(1);
  const [lemonPrice, setLemonPrice] = useState(null);
  const [lemonResult, setLemonResult] = useState(null);
  const [lemonTotalProfit, setLemonTotalProfit] = useState(0);
  const [lemonDone, setLemonDone] = useState(false);

  const fixedCost = useMemo(() => lemonade.ingredients.reduce((sum, i) => sum + i.cost, 0), [lemonade]);

  function handlePickLemonPrice(price) {
    setLemonPrice(price);
  }

  function handleRunLemonDay() {
    if (lemonPrice == null) return;
    const cupsSold = simulateLemonadeDay(lemonPrice, lemonade.priceOptions);
    const revenue = cupsSold * lemonPrice;
    const profit = revenue - fixedCost;
    setLemonResult({ cupsSold, revenue, cost: fixedCost, profit, price: lemonPrice });
    setLemonTotalProfit((p) => p + profit);
    pingProgress({
      profileName: profile?.name,
      module: "financial",
      event: `financial_lemonade:round_complete`,
    });
  }

  function handleNextLemonRound() {
    if (lemonRound >= LEMONADE_ROUNDS) {
      setLemonDone(true);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_lemonade:game_complete" });
      return;
    }
    setLemonRound((r) => r + 1);
    setLemonPrice(null);
    setLemonResult(null);
  }

  function handleRestartLemonade() {
    setLemonRound(1);
    setLemonPrice(null);
    setLemonResult(null);
    setLemonTotalProfit(0);
    setLemonDone(false);
  }

  // --- Shopping / budget game state ---
  const shopping = getShopping(pair.mother);
  const [cart, setCart] = useState([]);
  const [shopFeedback, setShopFeedback] = useState(null);

  const cartTotal = useMemo(() => cart.reduce((sum, id) => {
    const item = shopping.items.find((i) => i.id === id);
    return sum + (item ? item.price : 0);
  }, 0), [cart, shopping]);

  const remainingBudget = shopping.budget - cartTotal;

  function handleToggleCartItem(item) {
    setShopFeedback(null);
    setCart((c) => {
      if (c.includes(item.id)) return c.filter((id) => id !== item.id);
      if (cartTotal + item.price > shopping.budget) return c; // can't afford, ignore tap
      return [...c, item.id];
    });
  }

  function handleFinishShopping() {
    const withinBudget = cartTotal <= shopping.budget;
    setShopFeedback({ withinBudget, change: shopping.budget - cartTotal });
    pingProgress({
      profileName: profile?.name,
      module: "financial",
      event: `financial_shopping:complete`,
    });
  }

  function handleResetShopping() {
    setCart([]);
    setShopFeedback(null);
  }

  // --- Ad literacy game state ---
  const adCards = useMemo(() => shuffle(getAdLiteracy(pair.mother)), [pair.mother]);
  const [adStep, setAdStep] = useState(0);
  const [adAnswered, setAdAnswered] = useState(null);
  const [adScore, setAdScore] = useState(0);

  const adCard = adCards[adStep];
  const adFinished = adStep >= adCards.length;

  function handleAdAnswer(choseAd) {
    if (adAnswered) return;
    const correct = choseAd === adCard.isAd;
    setAdAnswered({ correct, choseAd });
    if (correct) setAdScore((s) => s + 1);
    pingProgress({
      profileName: profile?.name,
      module: "financial",
      event: `financial_ads:${correct ? "correct" : "wrong"}`,
    });
  }

  function handleAdNext() {
    setAdAnswered(null);
    setAdStep((s) => s + 1);
  }

  function handleAdRestart() {
    setAdStep(0);
    setAdAnswered(null);
    setAdScore(0);
  }

  return (
    <div className="page">
      <h1>{t("modules.financialTitle")} 💰</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.financialHelp")} langCode={pair.mother} />
      </div>

      <div className="phonics-tabs">
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "concepts" ? " selected" : "")}
          onClick={() => setActiveTab("concepts")}
        >
          <span className="phonics-tab-inner">
            📚 {t("modules.financialConcepts")}
            <TabSpeakIcon text={t("modules.financialConcepts")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "coins" ? " selected" : "")}
          onClick={() => setActiveTab("coins")}
        >
          <span className="phonics-tab-inner">
            🪙 {t("modules.financialCoinGame")}
            <TabSpeakIcon text={t("modules.financialCoinGame")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "lemonade" ? " selected" : "")}
          onClick={() => setActiveTab("lemonade")}
        >
          <span className="phonics-tab-inner">
            🍋 {t("modules.financialLemonadeTitle")}
            <TabSpeakIcon text={t("modules.financialLemonadeTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "shopping" ? " selected" : "")}
          onClick={() => setActiveTab("shopping")}
        >
          <span className="phonics-tab-inner">
            🛒 {t("modules.financialShoppingTitle")}
            <TabSpeakIcon text={t("modules.financialShoppingTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "ads" ? " selected" : "")}
          onClick={() => setActiveTab("ads")}
        >
          <span className="phonics-tab-inner">
            📢 {t("modules.financialAdsTitle")}
            <TabSpeakIcon text={t("modules.financialAdsTitle")} langCode={pair.mother} />
          </span>
        </button>
      </div>

      {activeTab === "concepts" && (
        <>
          <h2 className="section-title">{t("modules.financialConcepts")}</h2>
          <div className="reading-list">
            {Array.from({ length: conceptCount }).map((_, i) => {
              const m = motherConcepts[i];
              const s = secondaryConcepts[i];
              return (
                <div className="reading-card" key={m.id} onClick={() => handleViewConcept(m)}>
                  <div className="reading-emoji">{m.emoji}</div>
                  <div className="reading-words">
                    <div className="reading-word-row">
                      <span className="reading-word">{m.concept}</span>
                      <SpeakButton text={`${m.concept}. ${m.explanation}`} langCode={pair.mother} />
                    </div>
                    <p className="financial-explanation">{m.explanation}</p>
                    <div className="reading-word-row secondary">
                      <span className="reading-word">{s.concept}</span>
                      <SpeakButton text={`${s.concept}. ${s.explanation}`} langCode={pair.secondary} />
                    </div>
                    <p className="financial-explanation secondary">{s.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "coins" && (
        <>
          <h2 className="section-title">{t("modules.financialCoinGame")} 🪙</h2>
          <div className="game-card">
            {gameOver ? (
              <div className="game-result">
                <p className="game-score">
                  {t("modules.financialScore")}: {score} / {ROUNDS_PER_GAME}
                </p>
                <button type="button" className="big-btn" onClick={handlePlayAgain}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            ) : (
              <>
                <div className="game-progress">
                  {roundIndex} / {ROUNDS_PER_GAME} · {t("modules.financialScore")}: {score}
                </div>
                <div className="game-prompt">
                  {round.questionKind === "single" ? (
                    <div className="coin-display">
                      <span className="coin-emoji">{round.prompt.emoji}</span>
                      <span className="coin-label">{round.prompt.label}</span>
                    </div>
                  ) : (
                    <div className="coin-display">
                      {promptCoins.map((c, idx) => (
                        <span className="coin-pair" key={idx}>
                          <span className="coin-emoji">🪙</span>
                          <span className="coin-label">{c.label}</span>
                          {idx === 0 && <span className="coin-plus">+</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="game-options">
                  {round.options.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`game-option-btn${feedback && opt.correct ? " correct" : ""}`}
                      disabled={!!feedback}
                      onClick={() => handleAnswer(opt)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {feedback && (
                  <p className={`game-feedback ${feedback}`}>{feedback === "correct" ? "✅" : "❌"}</p>
                )}
              </>
            )}
          </div>
        </>
      )}

      {activeTab === "lemonade" && (
        <>
          <h2 className="section-title">{t("modules.financialLemonadeTitle")} 🍋</h2>
          {tier === 1 && !lemonAdvisoryDone ? (
            <AgeAdvisory
              langCode={pair.mother}
              onAccept={() => setLemonAdvisoryDone(true)}
              onDecline={() => setActiveTab("concepts")}
            />
          ) : (
            <div className="game-card">
              <p className="page-intro">{t("modules.financialLemonadeIntro")}</p>
              {!lemonDone ? (
                <>
                  <div className="game-progress">
                    {t("modules.financialLemonadeRound")} {lemonRound} / {LEMONADE_ROUNDS}
                  </div>
                  <h3 className="section-title">{t("modules.financialLemonadeIngredients")}</h3>
                  <div className="reading-list">
                    {lemonade.ingredients.map((ing) => (
                      <div className="reading-card" key={ing.id}>
                        <div className="reading-emoji">{ing.emoji}</div>
                        <div className="reading-words">
                          <span className="reading-word">{ing.name}</span>
                          <p className="financial-explanation">{formatValue(ing.cost)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="financial-explanation">
                    {t("modules.financialLemonadeTotalCost")}: {formatValue(fixedCost)}
                  </p>

                  {!lemonResult ? (
                    <>
                      <h3 className="section-title">{t("modules.financialLemonadePickPrice")}</h3>
                      <div className="game-options">
                        {lemonade.priceOptions.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`game-option-btn${lemonPrice === p ? " correct" : ""}`}
                            onClick={() => handlePickLemonPrice(p)}
                          >
                            {formatValue(p)}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="big-btn"
                        disabled={lemonPrice == null}
                        onClick={handleRunLemonDay}
                      >
                        ☀️ {t("modules.financialLemonadeRunDay")}
                      </button>
                    </>
                  ) : (
                    <div className="game-result">
                      <p className="page-intro">
                        {t("modules.financialLemonadeCupsSold")}: {lemonResult.cupsSold} 🥤
                      </p>
                      <p className="page-intro">
                        {t("modules.financialLemonadeRevenue")}: {formatValue(lemonResult.revenue)}
                      </p>
                      <p className="page-intro">
                        {t("modules.financialLemonadeCost")}: {formatValue(lemonResult.cost)}
                      </p>
                      <p className={`game-feedback ${lemonResult.profit >= 0 ? "correct" : "wrong"}`}>
                        {lemonResult.profit >= 0 ? "📈" : "📉"} {t("modules.financialLemonadeProfit")}:{" "}
                        {formatValue(Math.abs(lemonResult.profit))}
                        {lemonResult.profit < 0 ? ` (${t("modules.financialLemonadeLoss")})` : ""}
                      </p>
                      <button type="button" className="big-btn" onClick={handleNextLemonRound}>
                        ➡️
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="game-result">
                  <div className="game-emoji">🏆</div>
                  <p className="game-score">
                    {t("modules.financialLemonadeTotalProfit")}: {formatValue(Math.abs(lemonTotalProfit))}
                    {lemonTotalProfit < 0 ? ` (${t("modules.financialLemonadeLoss")})` : ""}
                  </p>
                  <button type="button" className="big-btn" onClick={handleRestartLemonade}>
                    {t("modules.financialPlayAgain")}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "shopping" && (
        <>
          <h2 className="section-title">{t("modules.financialShoppingTitle")} 🛒</h2>
          <div className="game-card">
            <p className="page-intro">{t("modules.financialShoppingIntro")}</p>
            <div className="game-progress">
              {t("modules.financialShoppingBudget")}: {formatValue(shopping.budget)} · {t("modules.financialShoppingRemaining")}:{" "}
              {formatValue(Math.max(0, remainingBudget))}
            </div>
            <div className="reading-list">
              {shopping.items.map((item) => {
                const inCart = cart.includes(item.id);
                const affordable = inCart || cartTotal + item.price <= shopping.budget;
                return (
                  <div
                    key={item.id}
                    className={"reading-card" + (inCart ? " done" : "") + (!affordable ? " disabled" : "")}
                    onClick={() => affordable && handleToggleCartItem(item)}
                  >
                    <div className="reading-emoji">{item.emoji}</div>
                    <div className="reading-words">
                      <span className="reading-word">{item.name}</span>
                      <p className="financial-explanation">{formatValue(item.price)}</p>
                    </div>
                    {inCart && <span className="mission-done-tag">✅</span>}
                  </div>
                );
              })}
            </div>
            {!shopFeedback ? (
              <button type="button" className="big-btn" disabled={cart.length === 0} onClick={handleFinishShopping}>
                {t("modules.financialShoppingFinish")}
              </button>
            ) : (
              <div className="game-result">
                <p className={`game-feedback ${shopFeedback.withinBudget ? "correct" : "wrong"}`}>
                  {shopFeedback.withinBudget
                    ? `✅ ${t("modules.financialShoppingWithinBudget")}`
                    : `❌ ${t("modules.financialShoppingOverBudget")}`}
                </p>
                <p className="page-intro">
                  {t("modules.financialShoppingChange")}: {formatValue(Math.max(0, shopFeedback.change))}
                </p>
                <button type="button" className="big-btn" onClick={handleResetShopping}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "ads" && (
        <>
          <h2 className="section-title">{t("modules.financialAdsTitle")} 📢</h2>
          <p className="page-intro">{t("modules.financialAdsIntro")}</p>
          <div className="game-card">
            {!adFinished ? (
              <>
                <div className="game-progress">
                  {adStep + 1} / {adCards.length} · ⭐ {adScore}
                </div>
                <div className="game-emoji">{adCard.emoji}</div>
                <p className="page-intro">
                  {adCard.text}
                  <SpeakButton text={adCard.text} langCode={pair.mother} />
                </p>

                {!adAnswered ? (
                  <div className="game-options">
                    <button type="button" className="big-btn game-option" onClick={() => handleAdAnswer(false)}>
                      ✅ {t("modules.financialAdsFact")}
                    </button>
                    <button type="button" className="big-btn game-option" onClick={() => handleAdAnswer(true)}>
                      📢 {t("modules.financialAdsAdvertising")}
                    </button>
                  </div>
                ) : (
                  <div className="game-card">
                    <p className="game-result">
                      {adAnswered.correct ? "⭐" : "🤔"} {adCard.explanation}
                      <SpeakButton text={adCard.explanation} langCode={pair.mother} />
                    </p>
                    <button type="button" className="big-btn" onClick={handleAdNext}>
                      ➡️
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="game-card">
                <div className="game-emoji">🏆</div>
                <p className="game-result">
                  {t("modules.financialScore")}: {adScore} / {adCards.length}
                </p>
                <button type="button" className="big-btn" onClick={handleAdRestart}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
