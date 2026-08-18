import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLangPair, getProfile, getCookedRecipes, cookRecipe, recordSkillEvent, pingProgress } from "../storage.js";
import SpeakButton from "../components/SpeakButton.jsx";
import HelpButton from "../components/HelpButton.jsx";
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import {
  IllustrationBread,
  IllustrationBowl,
  IllustrationCup,
  IllustrationChefHat,
} from "../components/illustrations/index.js";

// Shared ingredient pool — reused across recipes so the child recognises
// items again in different dishes (apple/banana show up more than once).
const INGREDIENTS = [
  { id: "apple", emoji: "🍎", key: "miniChefIngApple" },
  { id: "banana", emoji: "🍌", key: "miniChefIngBanana" },
  { id: "strawberry", emoji: "🍓", key: "miniChefIngStrawberry" },
  { id: "orange", emoji: "🍊", key: "miniChefIngOrange" },
  { id: "bread", emoji: "🍞", key: "miniChefIngBread" },
  { id: "butter", emoji: "🧈", key: "miniChefIngButter" },
  { id: "cheese", emoji: "🧀", key: "miniChefIngCheese" },
  { id: "ham", emoji: "🍖", key: "miniChefIngHam" },
  { id: "milk", emoji: "🥛", key: "miniChefIngMilk" },
  { id: "honey", emoji: "🍯", key: "miniChefIngHoney" },
];
const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

const RECIPES = [
  {
    id: "fruit-salad",
    emoji: "🥗",
    Illustration: IllustrationBowl,
    titleKey: "miniChefRecipeSaladTitle",
    correct: ["apple", "banana", "strawberry", "orange"],
    distractors: ["bread", "cheese"],
    stepKeys: ["miniChefSaladStep1", "miniChefSaladStep2", "miniChefSaladStep3", "miniChefSaladStep4"],
    whyKey: "miniChefSaladWhy",
  },
  {
    id: "sandwich",
    emoji: "🥪",
    Illustration: IllustrationBread,
    titleKey: "miniChefRecipeSandwichTitle",
    correct: ["bread", "butter", "cheese", "ham"],
    distractors: ["banana", "honey"],
    stepKeys: ["miniChefSandwichStep1", "miniChefSandwichStep2", "miniChefSandwichStep3", "miniChefSandwichStep4"],
    whyKey: "miniChefSandwichWhy",
  },
  {
    id: "smoothie",
    emoji: "🥤",
    Illustration: IllustrationCup,
    titleKey: "miniChefRecipeSmoothieTitle",
    correct: ["banana", "strawberry", "milk", "honey"],
    distractors: ["bread", "cheese"],
    stepKeys: ["miniChefSmoothieStep1", "miniChefSmoothieStep2", "miniChefSmoothieStep3", "miniChefSmoothieStep4"],
    whyKey: "miniChefSmoothieWhy",
  },
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Stage 1 of a recipe: tap every correct ingredient (no fail — a wrong tap
// just nudges, following the app's anti-guessing convention).
function IngredientStage({ recipe, pair, t, onDone }) {
  const pool = useMemo(
    () => shuffle([...recipe.correct, ...recipe.distractors]).map((id) => INGREDIENT_BY_ID[id]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipe.id]
  );
  const [picked, setPicked] = useState(() => new Set());
  const [nudge, setNudge] = useState(false);
  const correctSet = useMemo(() => new Set(recipe.correct), [recipe]);
  const done = recipe.correct.every((id) => picked.has(id));

  function tapIngredient(ing) {
    if (correctSet.has(ing.id)) {
      if (!picked.has(ing.id)) {
        const next = new Set(picked);
        next.add(ing.id);
        setPicked(next);
      }
    } else {
      setNudge(ing.id);
      setTimeout(() => setNudge(false), 500);
    }
  }

  return (
    <div className="game-card">
      <p className="mission-badge science-topic-badge">🧺 {t("modules.miniChefPickIngredients")}</p>
      <p className="page-intro">
        {t("modules.miniChefIngredientsHint")}
        <SpeakButton text={t("modules.miniChefIngredientsHint")} langCode={pair.mother} />
      </p>
      <div className="game-options">
        {pool.map((ing) => (
          <button
            key={ing.id}
            type="button"
            className={
              "big-btn game-option" +
              (picked.has(ing.id) ? " done" : "") +
              (nudge === ing.id ? " wrong-shake" : "")
            }
            onClick={() => tapIngredient(ing)}
          >
            {ing.emoji} {t(`modules.${ing.key}`)}
            {picked.has(ing.id) ? " ✅" : ""}
            <SpeakButton text={t(`modules.${ing.key}`)} langCode={pair.mother} />
          </button>
        ))}
      </div>
      {nudge && <p className="game-result">🤔 {t("modules.miniChefWrongIngredient")}</p>}
      {done ? (
        <button type="button" className="big-btn" onClick={onDone}>
          ➡️ {t("modules.miniChefNext")}
        </button>
      ) : (
        <p className="mission-text">{t("modules.miniChefMissingIngredient")}</p>
      )}
    </div>
  );
}

// Stage 2: tap the recipe steps in the correct order (same tap-to-order
// pattern LifeSkills.jsx uses for its SequenceGame).
function StepsStage({ recipe, pair, t, onDone }) {
  const steps = recipe.stepKeys.map((k) => t(`modules.${k}`));
  const scrambled = useMemo(() => {
    let attempt = shuffle(steps.map((label, index) => ({ label, index })));
    if (steps.length > 1 && attempt.every((s, i) => s.index === i)) attempt = shuffle(attempt);
    return attempt;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id]);
  const [placed, setPlaced] = useState([]);
  const [shake, setShake] = useState(null);
  const done = placed.length === steps.length;
  const remaining = scrambled.filter((s) => !placed.includes(s.index));

  function tapStep(step) {
    if (done) return;
    if (step.index === placed.length) {
      setPlaced((prev) => [...prev, step.index]);
    } else {
      setShake(step.index);
      setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <div className="game-card sequence-game">
      <p className="mission-badge science-topic-badge">🔢 {t("modules.miniChefStepsHint")}</p>
      <ol className="sequence-slots" style={{ textAlign: "left", paddingLeft: "1.2rem" }}>
        {steps.map((label, i) => (
          <li key={i} style={{ minHeight: "1.6em" }}>
            {i < placed.length ? steps[placed[i]] : "⬜️ …"}
          </li>
        ))}
      </ol>
      {!done && (
        <div className="game-options">
          {remaining.map((step) => (
            <button
              key={step.index}
              type="button"
              className={"big-btn game-option" + (shake === step.index ? " wrong-shake" : "")}
              onClick={() => tapStep(step)}
            >
              {step.label}
              <SpeakButton text={step.label} langCode={pair.mother} />
            </button>
          ))}
        </div>
      )}
      {done && (
        <button type="button" className="big-btn" onClick={onDone}>
          ➡️ {t("modules.miniChefNext")}
        </button>
      )}
    </div>
  );
}

export default function MiniChef() {
  const { t } = useTranslation();
  const pair = getLangPair() || { mother: "pt", secondary: "en" };
  const profile = getProfile();
  const [openId, setOpenId] = useState(null);
  const [stage, setStage] = useState("ingredients"); // ingredients -> steps -> why -> done
  const [version, setVersion] = useState(0);

  const cooked = useMemo(() => getCookedRecipes(profile?.name), [profile?.name, version]);
  const openRecipe = RECIPES.find((r) => r.id === openId);

  function openRecipeCard(recipe) {
    const nowOpen = recipe.id !== openId;
    setOpenId(nowOpen ? recipe.id : null);
    setStage("ingredients");
    if (nowOpen) {
      pingProgress({ profileName: profile?.name, module: "miniChef", event: `recipe_opened:${recipe.id}` });
    }
  }

  function finishRecipe() {
    cookRecipe(profile?.name, openRecipe.id);
    recordSkillEvent(profile?.name, "mini-chef", true);
    pingProgress({ profileName: profile?.name, module: "miniChef", event: `recipe_done:${openRecipe.id}` });
    setVersion((v) => v + 1);
    setStage("done");
  }

  return (
    <div className="page">
      <h1>{t("modules.miniChefTitle")} 👩‍🍳</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("modules.miniChefHelp")} langCode={pair.mother} />
      </div>
      <p className="page-intro">{t("modules.miniChefIntro")}</p>
      <MascotBubble character="pipa" mood="happy" langCode={pair.mother}>
        {t("modules.miniChefIntro")}
      </MascotBubble>

      {!openRecipe && (
        <div className="computing-grid">
          {RECIPES.map((r) => {
            const done = cooked.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                className={"computing-term-btn" + (done ? " done" : "")}
                onClick={() => openRecipeCard(r)}
              >
                <span className="computing-term-emoji">{r.emoji}</span>
                {t(`modules.${r.titleKey}`)}
                {done && <span className="mundos-tile-sub">✅</span>}
              </button>
            );
          })}
        </div>
      )}

      {openRecipe && (
        <div>
          <div className="game-emoji">{openRecipe.emoji}</div>
          <p className="mission-text">
            {t(`modules.${openRecipe.titleKey}`)}
            <SpeakButton text={t(`modules.${openRecipe.titleKey}`)} langCode={pair.mother} />
          </p>

          {stage === "ingredients" && (
            <IngredientStage recipe={openRecipe} pair={pair} t={t} onDone={() => setStage("steps")} />
          )}

          {stage === "steps" && (
            <StepsStage recipe={openRecipe} pair={pair} t={t} onDone={() => setStage("why")} />
          )}

          {stage === "why" && (
            <div className="game-card">
              <p className="mission-badge science-topic-badge">🔬 {t("modules.miniChefWhyTitle")}</p>
              <p className="game-result">
                {t(`modules.${openRecipe.whyKey}`)}
                <SpeakButton text={t(`modules.${openRecipe.whyKey}`)} langCode={pair.mother} />
              </p>
              <button type="button" className="big-btn" onClick={finishRecipe}>
                🎉 {t("modules.miniChefDone")}
              </button>
            </div>
          )}

          {stage === "done" && (
            <div className="game-card done">
              <div className="game-emoji">
                <IllustrationChefHat size={72} />
              </div>
              <p className="game-result">
                {t("modules.miniChefCompleteMsg")}
                <SpeakButton text={t("modules.miniChefCompleteMsg")} langCode={pair.mother} />
              </p>
              <button type="button" className="big-btn" onClick={() => openRecipeCard(openRecipe)}>
                ✅ {t("modules.miniChefBack")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
