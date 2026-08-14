import React from "react";
import SpeakButton from "../SpeakButton.jsx";
import { MASCOTS } from "./characters.jsx";
import "./mascots.css";

// <MascotBubble character="lumi" mood="happy" langCode="pt">texto da fala</MascotBubble>
//
// Renders the mascot illustration next to a speech-bubble text box. Pass
// `langCode` (one of the app's short language codes, e.g. "pt"/"en") to get
// an optional SpeakButton for the bubble text — omit it to render without
// a speak button. Speech is never auto-played; SpeakButton only speaks on click.
export default function MascotBubble({ character = "lumi", mood = "neutral", langCode, size = 72, className = "", children }) {
  const entry = MASCOTS[character] || MASCOTS.lumi;
  const { Component } = entry;
  const text = typeof children === "string" ? children : null;

  return (
    <div className={`mascot-bubble ${className}`}>
      <div className="mascot-bubble__figure">
        <Component mood={mood} size={size} />
      </div>
      <div className="mascot-bubble__balloon" style={{ "--mascot-bubble-border": entry.color }}>
        <p className="mascot-bubble__text">{children}</p>
        {langCode && text ? <SpeakButton text={text} langCode={langCode} /> : null}
      </div>
    </div>
  );
}
