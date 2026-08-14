// Shared visual language for the hand-authored SVG illustrations and mascots.
// Keep every illustration/mascot within this limited palette + stroke width so
// the whole app reads as one consistent, friendly, flat-design system.
export const PALETTE = {
  outline: "#2b2340", // dark plum used for outlines/linework everywhere
  cream: "#fff8ec", // paper/background tone for highlights
  red: "#ff6b6b",
  redDark: "#e05353",
  yellow: "#ffd93d",
  yellowDark: "#f0b429",
  green: "#6bcb77",
  greenDark: "#4fa85c",
  blue: "#4d96ff",
  blueDark: "#3878d6",
  purple: "#9b5de5",
  purpleDark: "#7c3fc4",
  orange: "#f4a261",
  orangeDark: "#d9822b",
  brown: "#a9744f",
  brownDark: "#8a5c3b",
  pink: "#ff8fab",
  white: "#ffffff",
  gray: "#c9c2d6",
};

export const STROKE_WIDTH = 5;
export const STROKE = PALETTE.outline;
