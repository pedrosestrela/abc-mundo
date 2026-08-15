import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";
import { getProfiles, setProfile, pingProgress } from "../storage.js";
// PLACEHOLDER smoke-test integration (illustration/mascot library task) —
// future agents working on Home.jsx are free to remove, replace, or build on this.
import MascotBubble from "../components/mascots/MascotBubble.jsx";
import { IllustrationSun, IllustrationStar } from "../components/illustrations/index.js";
import HelpButton from "../components/HelpButton.jsx";

const AVATARS = [
  "🦸", "🦸‍♀️", "🦹", "🧙", "🧚", "🧞", "🥷", "🤖",
  "👽", "🐉", "🦊", "🐼", "🦁", "🐸", "🦄", "🐝",
];
const AGES = [5, 6, 7, 8, 9, 10];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profiles = getProfiles();
  const [showForm, setShowForm] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [age, setAge] = useState(AGES[0]);

  function selectProfile(profile) {
    setProfile(profile);
    pingProgress({ profileName: profile.name, module: "home", event: "profile_selected" });
    navigate("/languages");
  }

  function handleStart() {
    const profile = { name: name.trim() || "Explorer", avatar, age };
    selectProfile(profile);
  }

  if (!showForm) {
    return (
      <div className="page home-page">
        <h1 className="app-title">ABC Mundo 🌍✨</h1>
        <div className="help-btn-corner">
          <HelpButton text={t("home.helpMain")} langCode={i18n.language} />
        </div>
        {/* PLACEHOLDER smoke-test — illustration/mascot library, safe to remove */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <IllustrationSun size={40} />
          <IllustrationStar size={40} />
          <MascotBubble character="lumi" mood="happy" langCode={i18n.language}>Olá! Vamos aprender juntos?</MascotBubble>
        </div>
        <h2>{t("home.pickExistingProfile")}</h2>

        <div className="avatar-grid">
          {profiles.map((p) => (
            <button
              key={p.name}
              type="button"
              className="profile-btn"
              onClick={() => selectProfile(p)}
            >
              <span className="profile-btn-avatar">{p.avatar}</span>
              <span>{p.name}</span>
            </button>
          ))}
          <button
            type="button"
            className="profile-btn new-profile-btn"
            onClick={() => setShowForm(true)}
          >
            <span className="profile-btn-avatar">➕</span>
            <span>{t("home.addNewProfile")}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page home-page">
      <h1 className="app-title">ABC Mundo 🌍✨</h1>
      <div className="help-btn-corner">
        <HelpButton text={t("home.helpMain")} langCode={i18n.language} />
      </div>
      <h2>{t("home.pickProfile")}</h2>

      {profiles.length > 0 && (
        <button type="button" className="nav-link" onClick={() => setShowForm(false)}>
          ← {t("home.switchProfile")}
        </button>
      )}

      <label className="field">
        {t("home.name")}
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="..." />
      </label>

      <p>{t("home.chooseAvatar")}</p>
      <div className="avatar-grid">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            className={"avatar-btn" + (avatar === a ? " selected" : "")}
            onClick={() => setAvatar(a)}
          >
            {a}
          </button>
        ))}
      </div>

      <p>{t("home.chooseAge")}</p>
      <div className="avatar-grid">
        {AGES.map((a) => (
          <button
            key={a}
            type="button"
            className={"avatar-btn age-btn" + (age === a ? " selected" : "")}
            onClick={() => setAge(a)}
          >
            {a}
            {a === 10 ? "+" : ""}
          </button>
        ))}
      </div>

      <button type="button" className="big-btn" onClick={handleStart}>
        {t("home.start")} 🚀
      </button>
    </div>
  );
}
