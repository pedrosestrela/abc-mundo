import React, { useState } from "react";

// Casual access filter for the public GitHub Pages deployment, requested by
// the product owner after the app moved off a paid host to a public static
// site. This is NOT real security: the repo (and therefore this file) is
// public, so the credentials below are visible to anyone who looks at the
// source. It only keeps random visitors/search-engine crawlers out, not a
// motivated person. Do not put anything sensitive behind this gate.
const GATE_USER = "pedros_estrela@hotmail.com";
const GATE_PASS = "A241285c.";
const STORAGE_KEY = "abcmundo.gateUnlocked";

export default function AccessGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (user.trim() === GATE_USER && pass === GATE_PASS) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // localStorage unavailable (private browsing, etc.) — still let
        // this session through, just won't be remembered next visit.
      }
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="access-gate">
      <form className="access-gate-card" onSubmit={handleSubmit}>
        <h1 className="app-title">ABC Mundo 🌍✨</h1>
        <label className="field">
          Utilizador
          <input
            type="text"
            autoComplete="username"
            value={user}
            onChange={(e) => {
              setUser(e.target.value);
              setError(false);
            }}
            autoFocus
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setError(false);
            }}
          />
        </label>
        {error && <p className="access-gate-error">Utilizador ou password incorretos.</p>}
        <button type="submit" className="big-btn">
          Entrar
        </button>
      </form>
    </div>
  );
}
