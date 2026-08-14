import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NavBar() {
  const { t } = useTranslation();
  return (
    <nav className="navbar">
      <NavLink to="/" end className="nav-link">
        🏠 {t("nav.home")}
      </NavLink>
      <NavLink to="/languages" className="nav-link">
        🌐 {t("nav.language")}
      </NavLink>
      <NavLink to="/phonics" className="nav-link">
        👂 {t("nav.phonics")}
      </NavLink>
      <NavLink to="/alphabet" className="nav-link">
        🔤 {t("nav.alphabet")}
      </NavLink>
      <NavLink to="/syllables" className="nav-link">
        🧩 {t("nav.syllables")}
      </NavLink>
      <NavLink to="/reading" className="nav-link">
        📖 {t("nav.reading")}
      </NavLink>
      <NavLink to="/phrases" className="nav-link">
        💬 {t("nav.phrases")}
      </NavLink>
      <NavLink to="/stories" className="nav-link">
        📚 {t("nav.stories")}
      </NavLink>
      <NavLink to="/game" className="nav-link">
        🎮 {t("nav.game")}
      </NavLink>
      <NavLink to="/math" className="nav-link">
        🔢 {t("nav.math")}
      </NavLink>
      <NavLink to="/songs" className="nav-link">
        🎵 {t("nav.songs")}
      </NavLink>
      <NavLink to="/piano" className="nav-link">
        🎹 {t("nav.piano")}
      </NavLink>
      <NavLink to="/world" className="nav-link">
        🗺️ {t("nav.world")}
      </NavLink>
      <NavLink to="/detective" className="nav-link">
        🕵️ {t("nav.detective")}
      </NavLink>
      <NavLink to="/whys" className="nav-link">
        ❓ {t("nav.whys")}
      </NavLink>
      <NavLink to="/financial" className="nav-link">
        💰 {t("nav.financial")}
      </NavLink>
      <NavLink to="/missions" className="nav-link">
        🧭 {t("nav.missions")}
      </NavLink>
      <NavLink to="/achievements" className="nav-link">
        🏆 {t("nav.achievements")}
      </NavLink>
      <NavLink to="/parents" className="nav-link">
        👪 {t("nav.parents")}
      </NavLink>
    </nav>
  );
}
