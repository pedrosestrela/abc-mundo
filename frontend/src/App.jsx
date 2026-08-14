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

export default function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/languages" element={<LanguagePicker />} />
          <Route path="/alphabet" element={<Alphabet />} />
          <Route path="/syllables" element={<Syllables />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/phrases" element={<Phrases />} />
          <Route path="/songs" element={<Songs />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
