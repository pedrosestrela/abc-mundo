import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFinancial, getLemonadeStand, getShopping, getAdLiteracy, getFinancialActivities } from "../content/index.js";
import { getDifficultyTier, getLangPair, getProfile, pingProgress, recordSkillEvent } from "../storage.js";
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
  // Multiple business scenarios (lemonade / orange juice / hot chocolate)
  // live under `scenarios`; one is picked at random per playthrough, mirroring
  // the weekly-budget tab's scenario-rotation pattern below.
  const lemonadePool = getLemonadeStand(pair.mother).scenarios;
  const [lemonade, setLemonade] = useState(
    () => lemonadePool[Math.floor(Math.random() * lemonadePool.length)]
  );
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
    setLemonade(lemonadePool[Math.floor(Math.random() * lemonadePool.length)]);
    setLemonRound(1);
    setLemonPrice(null);
    setLemonResult(null);
    setLemonTotalProfit(0);
    setLemonDone(false);
  }

  // --- Shopping / budget game state ---
  // Multiple store scenarios (grocery / stationery / toy shop) live under
  // `scenarios`; one is picked at random per playthrough, same rotation
  // pattern as the lemonade stand and weekly-budget tabs.
  const shoppingPool = getShopping(pair.mother).scenarios;
  const [shopping, setShopping] = useState(
    () => shoppingPool[Math.floor(Math.random() * shoppingPool.length)]
  );
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
    setShopping(shoppingPool[Math.floor(Math.random() * shoppingPool.length)]);
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

  // --- Deeper financial activities (wants/needs, save-vs-spend, piggy
  // bank, discount detective, interest, safety) ---
  const activities = getFinancialActivities(pair.mother);

  // Wants vs Needs sorting: sequential binary classification. Wrong taps
  // disable that option (anti-guessing); full XP only counts on the first
  // attempt of each round.
  const wnItems = useMemo(() => shuffle(activities.wantsNeeds), [activities]);
  const [wnStep, setWnStep] = useState(0);
  const [wnScore, setWnScore] = useState(0);
  const [wnWrongPick, setWnWrongPick] = useState(null);
  const [wnFirstTry, setWnFirstTry] = useState(true);
  const wnItem = wnItems[wnStep];
  const wnFinished = wnStep >= wnItems.length;

  function handleWnAnswer(pickedNeed) {
    const correct = pickedNeed === wnItem.isNeed;
    if (correct) {
      if (wnFirstTry) setWnScore((s) => s + 1);
      recordSkillEvent(profile?.name, "financial-wants-needs", wnFirstTry);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_wants_needs:correct" });
      setTimeout(() => {
        setWnStep((s) => s + 1);
        setWnWrongPick(null);
        setWnFirstTry(true);
      }, 700);
    } else {
      setWnWrongPick(pickedNeed);
      setWnFirstTry(false);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_wants_needs:wrong" });
    }
  }

  function handleWnRestart() {
    setWnStep(0);
    setWnScore(0);
    setWnWrongPick(null);
    setWnFirstTry(true);
  }

  // Save vs Spend: one consequence-based scenario, picked at random from a
  // pool for replay variety (same rotation pattern as lemonade/shopping).
  // No "wrong" choice - each pick shows a concrete tradeoff explanation
  // instead of a right/wrong mark.
  const savingsDecisionsPool = activities.savingsDecisions;
  const [saveSpend, setSaveSpend] = useState(
    () => savingsDecisionsPool[Math.floor(Math.random() * savingsDecisionsPool.length)]
  );
  const [ssChoice, setSsChoice] = useState(null);

  function handleSaveSpendChoose(item) {
    if (ssChoice) return;
    setSsChoice(item);
    pingProgress({ profileName: profile?.name, module: "financial", event: `financial_save_spend:chose_${item.id}` });
    recordSkillEvent(profile?.name, "financial-save-spend", true);
  }

  function handleSaveSpendRestart() {
    setSaveSpend(savingsDecisionsPool[Math.floor(Math.random() * savingsDecisionsPool.length)]);
    setSsChoice(null);
  }

  const ssOtherItem = ssChoice ? saveSpend.items.find((i) => i.id !== ssChoice.id) : null;

  // Piggy bank: tap through several turns, watching the total grow.
  const piggy = activities.piggyBank;
  const [piggyTurn, setPiggyTurn] = useState(0);
  const [piggyTotal, setPiggyTotal] = useState(0);
  const piggyFinished = piggyTurn >= piggy.coinTurns.length;

  function handlePiggyAddCoin() {
    if (piggyFinished) return;
    const amount = piggy.coinTurns[piggyTurn];
    setPiggyTotal((t) => t + amount);
    setPiggyTurn((t) => t + 1);
    pingProgress({ profileName: profile?.name, module: "financial", event: "financial_piggybank:coin_added" });
    if (piggyTurn === piggy.coinTurns.length - 1) {
      recordSkillEvent(profile?.name, "financial-savings-goal", true);
    }
  }

  function handlePiggyRestart() {
    setPiggyTurn(0);
    setPiggyTotal(0);
  }

  // Discount detective: reason about whether an inflated "was" price makes
  // the sale a real deal or an advertising trick.
  const discountCards = useMemo(() => shuffle(activities.discountAds), [activities]);
  const [discStep, setDiscStep] = useState(0);
  const [discScore, setDiscScore] = useState(0);
  const [discWrongPick, setDiscWrongPick] = useState(null);
  const [discFirstTry, setDiscFirstTry] = useState(true);
  const [discAnswered, setDiscAnswered] = useState(false);
  const discCard = discountCards[discStep];
  const discFinished = discStep >= discountCards.length;

  function handleDiscAnswer(saysGoodDeal) {
    if (discAnswered) return;
    const correct = saysGoodDeal === discCard.isGoodDeal;
    if (correct) {
      if (discFirstTry) setDiscScore((s) => s + 1);
      recordSkillEvent(profile?.name, "financial-discounts", discFirstTry);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_discount:correct" });
      setDiscAnswered(true);
    } else {
      setDiscWrongPick(saysGoodDeal);
      setDiscFirstTry(false);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_discount:wrong" });
    }
  }

  function handleDiscNext() {
    setDiscStep((s) => s + 1);
    setDiscWrongPick(null);
    setDiscFirstTry(true);
    setDiscAnswered(false);
  }

  function handleDiscRestart() {
    setDiscStep(0);
    setDiscScore(0);
    setDiscWrongPick(null);
    setDiscFirstTry(true);
    setDiscAnswered(false);
  }

  // Simple interest walkthrough (tier 2+ only, soft-gated via AgeAdvisory).
  const interest = activities.interestExample;
  const [interestAdvisoryDone, setInterestAdvisoryDone] = useState(tier >= 2);
  const [interestYear, setInterestYear] = useState(0);
  const interestTotals = useMemo(() => {
    const totals = [interest.principal];
    for (let y = 1; y <= interest.years; y++) totals.push(totals[y - 1] + interest.yearlyBonus);
    return totals;
  }, [interest]);
  const interestFinished = interestYear >= interest.years;

  function handleInterestNext() {
    if (interestFinished) return;
    setInterestYear((y) => y + 1);
    if (interestYear + 1 === interest.years) {
      recordSkillEvent(profile?.name, "financial-interest", true);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_interest:complete" });
    }
  }

  function handleInterestRestart() {
    setInterestYear(0);
  }

  // Money-safety mini quiz, mirroring the computingSafety pattern.
  const safetyCards = useMemo(() => shuffle(activities.safety), [activities]);
  const [safeStep, setSafeStep] = useState(0);
  const [safeScore, setSafeScore] = useState(0);
  const [safeWrongPick, setSafeWrongPick] = useState(null);
  const [safeFirstTry, setSafeFirstTry] = useState(true);
  const [safeAnswered, setSafeAnswered] = useState(false);
  const safeCard = safetyCards[safeStep];
  const safeFinished = safeStep >= safetyCards.length;

  function handleSafeAnswer(saysSafe) {
    if (safeAnswered) return;
    const correct = saysSafe === safeCard.isSafe;
    if (correct) {
      if (safeFirstTry) setSafeScore((s) => s + 1);
      recordSkillEvent(profile?.name, "financial-safety", safeFirstTry);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_safety:correct" });
      setSafeAnswered(true);
    } else {
      setSafeWrongPick(saysSafe);
      setSafeFirstTry(false);
      pingProgress({ profileName: profile?.name, module: "financial", event: "financial_safety:wrong" });
    }
  }

  function handleSafeNext() {
    setSafeStep((s) => s + 1);
    setSafeWrongPick(null);
    setSafeFirstTry(true);
    setSafeAnswered(false);
  }

  function handleSafeRestart() {
    setSafeStep(0);
    setSafeScore(0);
    setSafeWrongPick(null);
    setSafeFirstTry(true);
    setSafeAnswered(false);
  }

  // Semana do Dinheiro (weekly budget simulator): tap through a fictional
  // week, paying fixed obligations, handling a surprise expense, and making
  // optional want-vs-need choices while tracking progress toward a savings
  // goal. Tier-2+ content, soft-gated via AgeAdvisory like Simple Interest.
  const weeklyBudgetPool = activities.weeklyBudget;
  const [wbAdvisoryDone, setWbAdvisoryDone] = useState(tier >= 2);
  const [wbScenario, setWbScenario] = useState(
    () => weeklyBudgetPool[Math.floor(Math.random() * weeklyBudgetPool.length)]
  );
  const [wbDayIndex, setWbDayIndex] = useState(0);
  const [wbBalance, setWbBalance] = useState(wbScenario.allowance);
  const [wbShortfall, setWbShortfall] = useState(false);
  const [wbDone, setWbDone] = useState(false);

  const wbDay = wbScenario.days[wbDayIndex];
  const wbFinished = wbDone || wbDayIndex >= wbScenario.days.length;

  function wbFinishWeek(finalBalance) {
    setWbDone(true);
    const goalReached = finalBalance >= wbScenario.goal.amount;
    recordSkillEvent(profile?.name, "financial-weekly-budget", goalReached);
    pingProgress({
      profileName: profile?.name,
      module: "financial",
      event: `financial_weekly_budget:${goalReached ? "goal_reached" : "goal_missed"}`,
    });
  }

  function wbAdvanceDay(newBalance, spentMoreThanHad) {
    if (spentMoreThanHad) setWbShortfall(true);
    setWbBalance(newBalance);
    if (wbDayIndex + 1 >= wbScenario.days.length) {
      wbFinishWeek(newBalance);
    } else {
      setWbDayIndex((i) => i + 1);
    }
  }

  function handleWbPayExpense() {
    const spentMoreThanHad = wbBalance < wbDay.amount;
    const newBalance = Math.max(0, wbBalance - wbDay.amount);
    wbAdvanceDay(newBalance, spentMoreThanHad);
  }

  function handleWbOptionalChoice(buy) {
    if (!buy) {
      wbAdvanceDay(wbBalance, false);
      return;
    }
    const spentMoreThanHad = wbBalance < wbDay.amount;
    const newBalance = Math.max(0, wbBalance - wbDay.amount);
    wbAdvanceDay(newBalance, spentMoreThanHad);
  }

  function handleWbRestart() {
    const next = weeklyBudgetPool[Math.floor(Math.random() * weeklyBudgetPool.length)];
    setWbScenario(next);
    setWbDayIndex(0);
    setWbBalance(next.allowance);
    setWbShortfall(false);
    setWbDone(false);
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
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "wantsneeds" ? " selected" : "")}
          onClick={() => setActiveTab("wantsneeds")}
        >
          <span className="phonics-tab-inner">
            🧦 {t("modules.financialWantsNeedsTitle")}
            <TabSpeakIcon text={t("modules.financialWantsNeedsTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "savespend" ? " selected" : "")}
          onClick={() => setActiveTab("savespend")}
        >
          <span className="phonics-tab-inner">
            ⚖️ {t("modules.financialSaveSpendTitle")}
            <TabSpeakIcon text={t("modules.financialSaveSpendTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "piggy" ? " selected" : "")}
          onClick={() => setActiveTab("piggy")}
        >
          <span className="phonics-tab-inner">
            🐷 {t("modules.financialPiggyBankTitle")}
            <TabSpeakIcon text={t("modules.financialPiggyBankTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "discount" ? " selected" : "")}
          onClick={() => setActiveTab("discount")}
        >
          <span className="phonics-tab-inner">
            🕵️ {t("modules.financialDiscountTitle")}
            <TabSpeakIcon text={t("modules.financialDiscountTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "interest" ? " selected" : "")}
          onClick={() => setActiveTab("interest")}
        >
          <span className="phonics-tab-inner">
            📈 {t("modules.financialInterestTitle")}
            <TabSpeakIcon text={t("modules.financialInterestTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "safety" ? " selected" : "")}
          onClick={() => setActiveTab("safety")}
        >
          <span className="phonics-tab-inner">
            🛡️ {t("modules.financialSafetyTitle")}
            <TabSpeakIcon text={t("modules.financialSafetyTitle")} langCode={pair.mother} />
          </span>
        </button>
        <button
          type="button"
          className={"phonics-tab" + (activeTab === "weeklybudget" ? " selected" : "")}
          onClick={() => setActiveTab("weeklybudget")}
        >
          <span className="phonics-tab-inner">
            📅 {t("modules.financialWeeklyBudgetTitle")}
            <TabSpeakIcon text={t("modules.financialWeeklyBudgetTitle")} langCode={pair.mother} />
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
              <p className="page-intro">
                {t("modules.financialLemonadeIntro")} {lemonade.emoji} {lemonade.productName}
              </p>
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
            <p className="page-intro">
              {t("modules.financialShoppingIntro")} {shopping.emoji} {shopping.storeName}
            </p>
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

      {activeTab === "wantsneeds" && (
        <>
          <h2 className="section-title">{t("modules.financialWantsNeedsTitle")} 🧦</h2>
          <p className="page-intro">{t("modules.financialWantsNeedsIntro")}</p>
          <div className="game-card">
            {!wnFinished ? (
              <>
                <div className="game-progress">
                  {wnStep + 1} / {wnItems.length} · ⭐ {wnScore}
                </div>
                <div className="game-emoji">{wnItem.emoji}</div>
                <p className="page-intro">
                  {wnItem.name}
                  <SpeakButton text={wnItem.name} langCode={pair.mother} />
                </p>
                <div className="game-options">
                  <button
                    type="button"
                    className="big-btn game-option"
                    disabled={wnWrongPick === true}
                    onClick={() => handleWnAnswer(true)}
                  >
                    🙋 {t("modules.financialNeed")}
                  </button>
                  <button
                    type="button"
                    className="big-btn game-option"
                    disabled={wnWrongPick === false}
                    onClick={() => handleWnAnswer(false)}
                  >
                    💭 {t("modules.financialWant")}
                  </button>
                </div>
                {wnWrongPick != null && <p className="game-feedback wrong">❌</p>}
              </>
            ) : (
              <div className="game-card">
                <div className="game-emoji">🏆</div>
                <p className="game-result">
                  {t("modules.financialScore")}: {wnScore} / {wnItems.length}
                </p>
                <button type="button" className="big-btn" onClick={handleWnRestart}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "savespend" && (
        <>
          <h2 className="section-title">{t("modules.financialSaveSpendTitle")} ⚖️</h2>
          <div className="game-card">
            <p className="page-intro">
              {saveSpend.scenarioText}
              <SpeakButton text={saveSpend.scenarioText} langCode={pair.mother} />
            </p>
            {!ssChoice ? (
              <div className="game-options">
                {saveSpend.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="big-btn game-option"
                    onClick={() => handleSaveSpendChoose(item)}
                  >
                    {item.emoji} {item.name} — {formatValue(item.price)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="game-result">
                <p className="page-intro">
                  {t("modules.financialSaveSpendResultBought")} {ssChoice.emoji} {ssChoice.name}.
                </p>
                <p className="page-intro">
                  {t("modules.financialSaveSpendResultCant")} {ssOtherItem?.emoji} {ssOtherItem?.name}.
                </p>
                <p className="financial-explanation">{t("modules.financialSaveSpendResultTip")}</p>
                <button type="button" className="big-btn" onClick={handleSaveSpendRestart}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "piggy" && (
        <>
          <h2 className="section-title">{t("modules.financialPiggyBankTitle")} 🐷</h2>
          <div className="game-card">
            <p className="page-intro">
              {piggy.intro}
              <SpeakButton text={piggy.intro} langCode={pair.mother} />
            </p>
            <div className="game-progress">
              {t("modules.financialPiggyBankTotal")}: {formatValue(piggyTotal)}
            </div>
            {!piggyFinished ? (
              <button type="button" className="big-btn" onClick={handlePiggyAddCoin}>
                🪙 {t("modules.financialPiggyBankAddCoin")} ({formatValue(piggy.coinTurns[piggyTurn])})
              </button>
            ) : (
              <div className="game-result">
                <div className="game-emoji">🏆</div>
                <p className="game-score">
                  {t("modules.financialPiggyBankGoalReached")} {formatValue(piggyTotal)}
                </p>
                <p className="financial-explanation">
                  {piggy.outro}
                  <SpeakButton text={piggy.outro} langCode={pair.mother} />
                </p>
                <button type="button" className="big-btn" onClick={handlePiggyRestart}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "discount" && (
        <>
          <h2 className="section-title">{t("modules.financialDiscountTitle")} 🕵️</h2>
          <p className="page-intro">{t("modules.financialDiscountIntro")}</p>
          <div className="game-card">
            {!discFinished ? (
              <>
                <div className="game-progress">
                  {discStep + 1} / {discountCards.length} · ⭐ {discScore}
                </div>
                <div className="game-emoji">{discCard.emoji}</div>
                <p className="page-intro">{discCard.product}</p>
                <p className="financial-explanation">
                  {t("modules.financialDiscountFakePrice")}: <s>{formatValue(discCard.fakeOriginalPrice)}</s> (-{discCard.discountPercent}%)
                  {" · "}
                  {t("modules.financialDiscountSellingPrice")}: {formatValue(discCard.sellingPrice)}
                </p>
                {!discAnswered ? (
                  <>
                    <p className="page-intro">{t("modules.financialDiscountAskGoodDeal")}</p>
                    <div className="game-options">
                      <button
                        type="button"
                        className="big-btn game-option"
                        disabled={discWrongPick === true}
                        onClick={() => handleDiscAnswer(true)}
                      >
                        👍 {t("modules.financialDiscountYes")}
                      </button>
                      <button
                        type="button"
                        className="big-btn game-option"
                        disabled={discWrongPick === false}
                        onClick={() => handleDiscAnswer(false)}
                      >
                        👎 {t("modules.financialDiscountNo")}
                      </button>
                    </div>
                    {discWrongPick != null && <p className="game-feedback wrong">❌</p>}
                  </>
                ) : (
                  <div className="game-card">
                    <p className="game-result">
                      ⭐ {discCard.isGoodDeal ? t("modules.financialDiscountGoodDeal") : t("modules.financialDiscountBadDeal")}
                    </p>
                    <p className="financial-explanation">
                      {discCard.explanation}
                      <SpeakButton text={discCard.explanation} langCode={pair.mother} />
                    </p>
                    <button type="button" className="big-btn" onClick={handleDiscNext}>
                      ➡️
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="game-card">
                <div className="game-emoji">🏆</div>
                <p className="game-result">
                  {t("modules.financialScore")}: {discScore} / {discountCards.length}
                </p>
                <button type="button" className="big-btn" onClick={handleDiscRestart}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "interest" && (
        <>
          <h2 className="section-title">{t("modules.financialInterestTitle")} 📈</h2>
          {tier === 1 && !interestAdvisoryDone ? (
            <AgeAdvisory
              langCode={pair.mother}
              onAccept={() => setInterestAdvisoryDone(true)}
              onDecline={() => setActiveTab("concepts")}
            />
          ) : (
            <div className="game-card">
              <p className="page-intro">
                {interest.intro}
                <SpeakButton text={interest.intro} langCode={pair.mother} />
              </p>
              <div className="reading-list">
                {interestTotals.slice(0, interestYear + 1).map((total, y) => (
                  <div className="reading-card" key={y}>
                    <div className="reading-emoji">🏦</div>
                    <div className="reading-words">
                      <span className="reading-word">
                        {y === 0 ? t("modules.financialPiggyBankTotal") : `${t("modules.financialInterestYear")} ${y}`}
                      </span>
                      <p className="financial-explanation">{formatValue(total)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!interestFinished ? (
                <button type="button" className="big-btn" onClick={handleInterestNext}>
                  ➡️ {t("modules.financialInterestYear")} {interestYear + 1}
                </button>
              ) : (
                <div className="game-result">
                  <p className="financial-explanation">
                    {interest.explanation}
                    <SpeakButton text={interest.explanation} langCode={pair.mother} />
                  </p>
                  <button type="button" className="big-btn" onClick={handleInterestRestart}>
                    {t("modules.financialPlayAgain")}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "safety" && (
        <>
          <h2 className="section-title">{t("modules.financialSafetyTitle")} 🛡️</h2>
          <p className="page-intro">{t("modules.financialSafetyIntro")}</p>
          <div className="game-card">
            {!safeFinished ? (
              <>
                <div className="game-progress">
                  {safeStep + 1} / {safetyCards.length} · ⭐ {safeScore}
                </div>
                <div className="game-emoji">{safeCard.emoji}</div>
                <p className="page-intro">
                  {safeCard.scenario}
                  <SpeakButton text={safeCard.scenario} langCode={pair.mother} />
                </p>
                {!safeAnswered ? (
                  <>
                    <div className="game-options">
                      <button
                        type="button"
                        className="big-btn game-option"
                        disabled={safeWrongPick === true}
                        onClick={() => handleSafeAnswer(true)}
                      >
                        ✅ {t("modules.financialSafetySafe")}
                      </button>
                      <button
                        type="button"
                        className="big-btn game-option"
                        disabled={safeWrongPick === false}
                        onClick={() => handleSafeAnswer(false)}
                      >
                        ⚠️ {t("modules.financialSafetyUnsafe")}
                      </button>
                    </div>
                    {safeWrongPick != null && <p className="game-feedback wrong">❌</p>}
                  </>
                ) : (
                  <div className="game-card">
                    <p className="game-result">
                      ⭐ {safeCard.explanation}
                      <SpeakButton text={safeCard.explanation} langCode={pair.mother} />
                    </p>
                    <button type="button" className="big-btn" onClick={handleSafeNext}>
                      ➡️
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="game-card">
                <div className="game-emoji">🏆</div>
                <p className="game-result">
                  {t("modules.financialScore")}: {safeScore} / {safetyCards.length}
                </p>
                <button type="button" className="big-btn" onClick={handleSafeRestart}>
                  {t("modules.financialPlayAgain")}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "weeklybudget" && (
        <>
          <h2 className="section-title">{t("modules.financialWeeklyBudgetTitle")} 📅</h2>
          {tier === 1 && !wbAdvisoryDone ? (
            <AgeAdvisory
              langCode={pair.mother}
              onAccept={() => setWbAdvisoryDone(true)}
              onDecline={() => setActiveTab("concepts")}
            />
          ) : (
            <div className="game-card">
              <p className="page-intro">
                {t("modules.financialWeeklyBudgetIntro")}
                <SpeakButton text={t("modules.financialWeeklyBudgetIntro")} langCode={pair.mother} />
              </p>
              <div className="game-progress">
                {t("modules.financialWeeklyBudgetAllowance")}: {formatValue(wbScenario.allowance)}
                {" · "}
                {t("modules.financialWeeklyBudgetGoal")}: {wbScenario.goal.emoji} {wbScenario.goal.name} (
                {formatValue(wbScenario.goal.amount)})
              </div>
              <div className="game-progress">
                {t("modules.financialWeeklyBudgetBalance")}: {formatValue(wbBalance)}
              </div>

              {!wbFinished ? (
                <>
                  <div className="game-progress">
                    {t("modules.financialWeeklyBudgetDay")} {wbDayIndex + 1} / {wbScenario.days.length} ·{" "}
                    {wbDay.dayLabel}
                  </div>
                  <div className="game-emoji">{wbDay.emoji}</div>
                  {wbDay.type === "surprise" && (
                    <p className="game-feedback wrong">⚠️ {t("modules.financialWeeklyBudgetSurpriseLabel")}</p>
                  )}
                  <p className="page-intro">
                    {wbDay.label} {wbDay.type !== "optional" ? `— ${formatValue(wbDay.amount)}` : ""}
                    <SpeakButton text={wbDay.label} langCode={pair.mother} />
                  </p>

                  {wbDay.type === "optional" ? (
                    <div className="game-options">
                      <button type="button" className="big-btn game-option" onClick={() => handleWbOptionalChoice(true)}>
                        🛍️ {t("modules.financialWeeklyBudgetBuy")} ({formatValue(wbDay.amount)})
                      </button>
                      <button type="button" className="big-btn game-option" onClick={() => handleWbOptionalChoice(false)}>
                        🙅 {t("modules.financialWeeklyBudgetSkip")}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="big-btn" onClick={handleWbPayExpense}>
                      ➡️ {t("modules.financialWeeklyBudgetNextDay")}
                    </button>
                  )}
                </>
              ) : (
                <div className="game-result">
                  <div className="game-emoji">{wbBalance >= wbScenario.goal.amount ? "🏆" : "🌱"}</div>
                  <p className="game-score">{t("modules.financialWeeklyBudgetSummaryTitle")}</p>
                  <p className="page-intro">
                    {t("modules.financialWeeklyBudgetBalance")}: {formatValue(wbBalance)}
                  </p>
                  <p className={`game-feedback ${wbBalance >= wbScenario.goal.amount ? "correct" : "wrong"}`}>
                    {wbBalance >= wbScenario.goal.amount
                      ? `✅ ${t("modules.financialWeeklyBudgetGoalReached")}`
                      : `🌱 ${t("modules.financialWeeklyBudgetGoalMissed")}`}
                  </p>
                  <p className="financial-explanation">
                    {wbShortfall
                      ? t("modules.financialWeeklyBudgetSurpriseStruggled")
                      : t("modules.financialWeeklyBudgetSurpriseHandled")}
                  </p>
                  <button type="button" className="big-btn" onClick={handleWbRestart}>
                    {t("modules.financialPlayAgain")}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
