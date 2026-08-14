import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import Home from "./pages/Home.jsx";
import LanguagePicker from "./pages/LanguagePicker.jsx";
import Alphabet from "./pages/Alphabet.jsx";
import Reading from "./pages/Reading.jsx";
import Songs from "./pages/Songs.jsx";
import Phonics from "./pages/Phonics.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/languages" element={<LanguagePicker />} />
          <Route path="/phonics" element={<Phonics />} />
          <Route path="/alphabet" element={<Alphabet />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/songs" element={<Songs />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}
