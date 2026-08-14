// ABC Mundo mascot library — 7 recurring characters used to give the app
// warmth and personality instead of relying on raw emoji / cold copy
// ("Resposta errada"). Each mascot is one hand-authored SVG (consistent
// palette + stroke width, shared with the illustrations/ library) with a
// `mood` prop ("neutral" | "happy" | "thinking") plus a subtle CSS idle
// animation, so a single drawn pose still feels alive.
//
// CHARACTER -> SUBJECT AREA MAP (for future wiring, not done in this task):
//   lumi   (MascotLumi)  — curious general guide / "descoberta" purple-yellow
//                           star-child. Use on Home, Mundos hub, generic
//                           encouragement/onboarding surfaces.
//   bit    (MascotBit)   — robot, technology & programming. Use in Robots.jsx
//                           / Computing.jsx.
//   nina   (MascotNina)  — science & nature, leaf-crowned. Use in Science.jsx
//                           / LabEngineering / LabSimulators pages.
//   tomas  (MascotTomas) — maths & logic, glasses + geometric shapes. Use in
//                           MathGame.jsx / Thinking.jsx.
//   milo   (MascotMilo)  — music, headphones + musical note. Use in Music.jsx
//                           / Songs.jsx.
//   vasco  (MascotVasco) — history & exploration, explorer hat + compass. Use
//                           in PortugalHistory.jsx / World.jsx.
//   pipa   (MascotPipa)  — creativity, stories & art, beret + paintbrush. Use
//                           in Art.jsx / Stories.jsx / DrawingCanvas contexts.
//
// Usage:
//   import { MascotLumi, MascotBit, MASCOTS } from "../components/mascots/index.js";
//   import MascotBubble from "../components/mascots/MascotBubble.jsx";
//
//   <MascotBit mood="happy" size={80} />
//   <MascotBubble character="nina" mood="thinking" langCode="pt">
//     Vamos experimentar outra vez? Quase lá!
//   </MascotBubble>
//
// Do NOT wire these into specific pages (Robots.jsx, Science.jsx, etc.) as
// part of this task — that is deliberately left as follow-up work for other
// agents editing those page files in parallel, to avoid merge conflicts.
export * from "./characters.jsx";
export { default as MascotBubble } from "./MascotBubble.jsx";
