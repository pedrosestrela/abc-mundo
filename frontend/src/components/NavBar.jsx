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
      <NavLink to="/mundos" className="nav-link">
        🗺️ {t("nav.mundos")}
      </NavLink>
      <NavLink to="/missions" className="nav-link">
        🧭 {t("nav.missions")}
      </NavLink>
      <NavLink to="/achievements" className="nav-link">
        🏆 {t("nav.achievementsNav")}
      </NavLink>
      <NavLink to="/parents" className="nav-link">
        👪 {t("nav.parents")}
      </NavLink>
    </nav>
  );
}
