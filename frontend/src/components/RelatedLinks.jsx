import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getScience, getWhys, getHowMade, getCountries } from "../content/index.js";
import { pingProgress } from "../storage.js";
import { getRelatedTopics } from "../content/topicConnections.js";

const MODULE_ROUTES = {
  science: "/science",
  whys: "/whys",
  howMade: "/how-made",
  world: "/world",
};

// "Ligações" — shows 3-5 cards linking the current item to related content
// in OTHER modules (e.g. the how-made chocolate entry links to the São
// Tomé e Príncipe country card, which actually grows cacau). Connections
// come from the curated, verified map in ../content/topicConnections.js;
// this component only resolves each target's current-language label/emoji
// via the same content getters the target page itself uses, and navigates
// there on tap (passing { state: { openId } } so the target page can
// auto-open the right card — see the matching useEffect in each page).
export default function RelatedLinks({ module, itemId, pair, profile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const targets = getRelatedTopics(module, itemId);
  const needsCountries = targets.some((tg) => tg.module === "world");
  const [countries, setCountries] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (needsCountries) {
      getCountries(pair.mother).then((list) => {
        if (!cancelled) setCountries(list);
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsCountries, pair.mother]);

  if (targets.length === 0) return null;

  const scienceItems = getScience(pair.mother);
  const whysItems = getWhys(pair.mother);
  const howMadeItems = getHowMade(pair.mother);

  function resolveTarget(target) {
    if (target.module === "science") {
      const item = scienceItems.find((c) => c.id === target.id);
      return item ? { emoji: item.emoji, label: item.question } : null;
    }
    if (target.module === "whys") {
      const item = whysItems.find((w) => w.id === target.id);
      return item ? { emoji: item.emoji, label: item.question } : null;
    }
    if (target.module === "howMade") {
      const item = howMadeItems.find((h) => h.id === target.id);
      return item ? { emoji: item.icon, label: item.name } : null;
    }
    if (target.module === "world") {
      if (!countries) return { emoji: "🌍", label: "…", pending: true };
      const c = countries.find((x) => x.iso === target.id);
      return c ? { emoji: c.flag, label: c.name } : null;
    }
    return null;
  }

  const cards = targets
    .map((target) => ({ target, info: resolveTarget(target) }))
    .filter((c) => c.info);

  if (cards.length === 0) return null;

  function openCard(target) {
    pingProgress({
      profileName: profile?.name,
      module,
      event: `topic_connection:${module}:${itemId}->${target.module}:${target.id}`,
    });
    navigate(MODULE_ROUTES[target.module], { state: { openId: target.id } });
  }

  return (
    <div className="related-links">
      <strong className="related-links-heading">{t("modules.relatedLinksTitle")}</strong>
      <div className="related-links-cards">
        {cards.map(({ target, info }) => (
          <button
            type="button"
            key={`${target.module}:${target.id}`}
            className="big-btn related-links-card"
            disabled={info.pending}
            onClick={() => openCard(target)}
          >
            <span className="related-links-emoji">{info.emoji}</span>
            <span className="related-links-label">{info.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
