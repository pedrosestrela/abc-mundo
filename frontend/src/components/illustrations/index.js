// Custom illustration library — a small, hand-authored set of consistent
// flat-design SVG components used in place of raw emoji across the app.
//
// Every component takes { size = 64, className = "" } and renders an inline
// <svg>. Shared visual language (palette + stroke width) lives in palette.js.
//
// Categories:
//  - animals.jsx: dog, cat, cow, lion, sheep, mouse, duck, frog
//  - scenery.jsx: house, tree, sun, cloud, river
//  - icons.jsx: book, pencil, star, heart, clock
//  - humanEvolution.jsx: hominid silhouette, stone tool, fire, cave art,
//    modern-human silhouette (used by the "A Evolução do Homem" timeline)
export * from "./animals.jsx";
export * from "./scenery.jsx";
export * from "./icons.jsx";
export * from "./humanEvolution.jsx";
export * from "./techHistory.jsx";
export * from "./kitchen.jsx";
export * from "./circuits.jsx";
export { PALETTE, STROKE, STROKE_WIDTH } from "./palette.js";
