import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import SessionEndOverlay from "./components/SessionEndOverlay.jsx";
// Home and LanguagePicker stay eager: they are the very first screen every
// session hits, so lazy-loading them would show a loading flash before the
// app is even usable.
import Home from "./pages/Home.jsx";
import LanguagePicker from "./pages/LanguagePicker.jsx";

// All other pages are route-level code-split: each only downloads when the
// child actually navigates there, shrinking the initial main bundle.
const Alphabet = lazy(() => import("./pages/Alphabet.jsx"));
const Syllables = lazy(() => import("./pages/Syllables.jsx"));
const Reading = lazy(() => import("./pages/Reading.jsx"));
const Phrases = lazy(() => import("./pages/Phrases.jsx"));
const Songs = lazy(() => import("./pages/Songs.jsx"));
const Game = lazy(() => import("./pages/Game.jsx"));
const Music = lazy(() => import("./pages/Music.jsx"));
const Stories = lazy(() => import("./pages/Stories.jsx"));
const MathGame = lazy(() => import("./pages/MathGame.jsx"));
const Financial = lazy(() => import("./pages/Financial.jsx"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard.jsx"));
const Achievements = lazy(() => import("./pages/Achievements.jsx"));
const Phonics = lazy(() => import("./pages/Phonics.jsx"));
const Missions = lazy(() => import("./pages/Missions.jsx"));
const World = lazy(() => import("./pages/World.jsx"));
const Detective = lazy(() => import("./pages/Detective.jsx"));
const Whys = lazy(() => import("./pages/Whys.jsx"));
const Robots = lazy(() => import("./pages/Robots.jsx"));
const Art = lazy(() => import("./pages/Art.jsx"));
const Science = lazy(() => import("./pages/Science.jsx"));
const PortugalHistory = lazy(() => import("./pages/PortugalHistory.jsx"));
const LifeSkills = lazy(() => import("./pages/LifeSkills.jsx"));
const Computing = lazy(() => import("./pages/Computing.jsx"));
const City = lazy(() => import("./pages/City.jsx"));
const Mundos = lazy(() => import("./pages/Mundos.jsx"));

export default function App() {
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
            <Route path="/city" element={<City />} />
          </Routes>
        </Suspense>
      </main>
      <NavBar />
      <SessionEndOverlay />
    </div>
  );
}
