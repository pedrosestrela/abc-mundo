import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getProfile, setProfile, pingProgress } from "../storage.js";

const AVATARS = [
  "🦸", "🦸‍♀️", "🦹", "🧙", "🧚", "🧞", "🥷", "🤖",
  "👽", "🐉", "🦊", "🐼", "🦁", "🐸", "🦄", "🐝",
];
const AGES = [5, 6, 7, 8, 9, 10];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const existing = getProfile();
  const [name, setName] = useState(existing?.name || "");
  const [avatar, setAvatar] = useState(existing?.avatar || AVATARS[0]);
  const [age, setAge] = useState(existing?.age || AGES[0]);

  function handleStart() {
    const profile = { name: name.trim() || "Explorer", avatar, age };
    setProfile(profile);
    pingProgress({ profileName: profile.name, module: "home", event: "profile_selected" });
    navigate("/languages");
  }

  return (
    <div className="page home-page">
      <h1 className="app-title">ABC Mundo 🌍✨</h1>
      <h2>{t("home.pickProfile")}</h2>

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
