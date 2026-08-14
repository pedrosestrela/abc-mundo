import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import LanguagePicker from "./pages/LanguagePicker.jsx";
import Alphabet from "./pages/Alphabet.jsx";
import Syllables from "./pages/Syllables.jsx";
import Reading from "./pages/Reading.jsx";
import Phrases from "./pages/Phrases.jsx";
import Songs from "./pages/Songs.jsx";
import Game from "./pages/Game.jsx";
import Piano from "./pages/Piano.jsx";
import Stories from "./pages/Stories.jsx";
import MathGame from "./pages/MathGame.jsx";
import Financial from "./pages/Financial.jsx";
import ParentDashboard from "./pages/ParentDashboard.jsx";
import Achievements from "./pages/Achievements.jsx";
import Phonics from "./pages/Phonics.jsx";
import Missions from "./pages/Missions.jsx";
import World from "./pages/World.jsx";
import SessionEndOverlay from "./components/SessionEndOverlay.jsx";
import Detective from "./pages/Detective.jsx";
import Whys from "./pages/Whys.jsx";
import Robots from "./pages/Robots.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/languages" element={<LanguagePicker />} />
          <Route path="/phonics" element={<Phonics />} />
          <Route path="/alphabet" element={<Alphabet />} />
          <Route path="/syllables" element={<Syllables />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/phrases" element={<Phrases />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/game" element={<Game />} />
          <Route path="/piano" element={<Piano />} />
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
        </Routes>
      </main>
      <NavBar />
      <SessionEndOverlay />
    </div>
  );
}
