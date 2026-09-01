import React from "react";
import SpeakButton from "../SpeakButton.jsx";
import { MASCOTS } from "./characters.jsx";
import "./mascots.css";

// <MascotBubble character="lumi" mood="happy" langCode="pt">texto da fala</MascotBubble>
// <MascotBubble character="lumi" reaction="encouraging" langCode="pt">texto da fala</MascotBubble>
//
// Renders the mascot illustration next to a speech-bubble text box. Pass
// `langCode` (one of the app's short language codes, e.g. "pt"/"en") to get
// an optional SpeakButton for the bubble text — omit it to render without
// a speak button. Speech is never auto-played; SpeakButton only speaks on click.
//
// `reaction` is the higher-level "pedagogical moment" API layered on top of
// the SVG's own `mood` (neutral/happy/thinking face shapes): "happy" |
// "curious" | "encouraging" | "thinking" | "resting". Each maps to a face
// mood plus a small, calm CSS micro-animation (see mascots.css) — it never
// overrides an explicitly-passed `mood`. Reactions are visual-only sugar;
// `mood` alone still works exactly as before for callers that don't need one.
const REACTION_TO_MOOD = {
  happy: "happy",
  curious: "neutral",
  encouraging: "neutral",
  thinking: "thinking",
  resting: "neutral",
};

export default function MascotBubble({ character = "lumi", mood, reaction, langCode, size = 72, className = "", children }) {
  const entry = MASCOTS[character] || MASCOTS.lumi;
  const { Component } = entry;
  const text = typeof children === "string" ? children : null;
  const effectiveMood = mood || (reaction && REACTION_TO_MOOD[reaction]) || "neutral";
  const reactionClass = reaction ? `mascot-reaction-${reaction}` : "";

  return (
    <div className={`mascot-bubble ${reactionClass} ${className}`}>
      <div className="mascot-bubble__figure">
        <Component mood={effectiveMood} size={size} />
      </div>
      <div className="mascot-bubble__balloon" style={{ "--mascot-bubble-border": entry.color }}>
        <p className="mascot-bubble__text">{children}</p>
        {langCode && text ? <SpeakButton text={text} langCode={langCode} /> : null}
      </div>
    </div>
  );
}
