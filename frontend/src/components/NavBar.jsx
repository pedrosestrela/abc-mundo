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
      <NavLink to="/alphabet" className="nav-link">
        🔤 {t("nav.alphabet")}
      </NavLink>
      <NavLink to="/reading" className="nav-link">
        📖 {t("nav.reading")}
      </NavLink>
      <NavLink to="/songs" className="nav-link">
        🎵 {t("nav.songs")}
      </NavLink>
      <NavLink to="/parents" className="nav-link">
        👪 {t("nav.parents")}
      </NavLink>
    </nav>
  );
}
