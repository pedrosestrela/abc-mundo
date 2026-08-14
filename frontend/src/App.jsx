import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import SessionEndOverlay from "./components/SessionEndOverlay.jsx";
// Home and LanguagePicker stay eager: they are the very first screen every
// session hits, so lazy-loading them would show a loading flash before the
// app is even usable.
import Home from "./pages/Home.jsx";
import LanguagePicker from "./pages/LanguagePicker.jsx";

// Deploys happen often and each one changes the hashed chunk filenames, so
// a tab left open across a deploy can try to dynamic-import a JS chunk that
// no longer exists on the server ("Loading failed for the module..."). Wrap
// every lazy import so a failed chunk load triggers exactly one full page
// reload (picking up the fresh index.html + current chunk map) instead of
// leaving the child stuck on a red error screen. The sessionStorage flag
// stops an infinite reload loop if the failure isn't actually stale-deploy
// related (e.g. offline).
function lazyWithReload(factory) {
  return lazy(() =>
    factory().catch((err) => {
      const key = "chunk-reload-attempted";
      if (!window.sessionStorage.getItem(key)) {
        window.sessionStorage.setItem(key, "1");
        window.location.reload();
        // Never resolves — the reload is already in flight.
        return new Promise(() => {});
      }
      throw err;
    })
  );
}

// All other pages are route-level code-split: each only downloads when the
// child actually navigates there, shrinking the initial main bundle.
const Alphabet = lazyWithReload(() => import("./pages/Alphabet.jsx"));
const Syllables = lazyWithReload(() => import("./pages/Syllables.jsx"));
const Reading = lazyWithReload(() => import("./pages/Reading.jsx"));
const Phrases = lazyWithReload(() => import("./pages/Phrases.jsx"));
const Songs = lazyWithReload(() => import("./pages/Songs.jsx"));
const Game = lazyWithReload(() => import("./pages/Game.jsx"));
const Music = lazyWithReload(() => import("./pages/Music.jsx"));
const Stories = lazyWithReload(() => import("./pages/Stories.jsx"));
const Rhymes = lazyWithReload(() => import("./pages/Rhymes.jsx"));
const MathGame = lazyWithReload(() => import("./pages/MathGame.jsx"));
const Financial = lazyWithReload(() => import("./pages/Financial.jsx"));
const ParentDashboard = lazyWithReload(() => import("./pages/ParentDashboard.jsx"));
const Achievements = lazyWithReload(() => import("./pages/Achievements.jsx"));
const Phonics = lazyWithReload(() => import("./pages/Phonics.jsx"));
const Missions = lazyWithReload(() => import("./pages/Missions.jsx"));
const World = lazyWithReload(() => import("./pages/World.jsx"));
const Detective = lazyWithReload(() => import("./pages/Detective.jsx"));
const Whys = lazyWithReload(() => import("./pages/Whys.jsx"));
const Robots = lazyWithReload(() => import("./pages/Robots.jsx"));
const Art = lazyWithReload(() => import("./pages/Art.jsx"));
const Science = lazyWithReload(() => import("./pages/Science.jsx"));
const PortugalHistory = lazyWithReload(() => import("./pages/PortugalHistory.jsx"));
const LifeSkills = lazyWithReload(() => import("./pages/LifeSkills.jsx"));
const Computing = lazyWithReload(() => import("./pages/Computing.jsx"));
const City = lazyWithReload(() => import("./pages/City.jsx"));
const Mundos = lazyWithReload(() => import("./pages/Mundos.jsx"));
const Thinking = lazyWithReload(() => import("./pages/Thinking.jsx"));
const NatureDiary = lazyWithReload(() => import("./pages/NatureDiary.jsx"));

export default function App() {
  // A successful render means the current chunk map is good — clear the
  // reload guard so a *future* deploy can still trigger one recovery reload.
  React.useEffect(() => {
    window.sessionStorage.removeItem("chunk-reload-attempted");
  }, []);

  return (
    <div className="app-shell">
      <main className="app-main">
        <Suspense fallback={<div className="page-loading">🌟</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/languages" element={<LanguagePicker />} />
            <Route path="/mundos" element={<Mundos />} />
            <Route path="/phonics" element={<Phonics />} />
            <Route path="/alphabet" element={<Alphabet />} />
            <Route path="/syllables" element={<Syllables />} />
            <Route path="/reading" element={<Reading />} />
            <Route path="/phrases" element={<Phrases />} />
            <Route path="/songs" element={<Songs />} />
            <Route path="/game" element={<Game />} />
            <Route path="/music" element={<Music />} />
            <Route path="/piano" element={<Music defaultInstrument="piano" />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/rhymes" element={<Rhymes />} />
            <Route path="/math" element={<MathGame />} />
            <Route path="/financial" element={<Financial />} />
            <Route path="/parents" element={<ParentDashboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/world" element={<World />} />
            <Route path="/detective" element={<Detective />} />
            <Route path="/whys" element={<Whys />} />
            <Route path="/robots" element={<Robots />} />
            <Route path="/art" element={<Art />} />
            <Route path="/science" element={<Science />} />
            <Route path="/history" element={<PortugalHistory />} />
            <Route path="/lifeskills" element={<LifeSkills />} />
            <Route path="/computing" element={<Computing />} />
            <Route path="/thinking" element={<Thinking />} />
            <Route path="/city" element={<City />} />
            <Route path="/nature-diary" element={<NatureDiary />} />
          </Routes>
        </Suspense>
      </main>
      <NavBar />
      <SessionEndOverlay />
    </div>
  );
}
