# Illustration asset notices

All files in this folder are sourced from the **Twemoji** project (originally
by Twitter, now maintained by the community at
https://github.com/jdecked/twemoji; the assets used here were pulled from the
`twitter/twemoji` GitHub repository, tag/branch `master`,
`assets/svg/<codepoint>.svg`).

- Source: https://github.com/twitter/twemoji
- License: **CC-BY 4.0** (graphics/emoji artwork). See
  https://github.com/twitter/twemoji/blob/master/LICENSE-GRAPHICS.md
- Attribution required: "Graphics licensed by Twitter, Inc and other
  contributors — CC-BY 4.0" (https://creativecommons.org/licenses/by/4.0/)
- No modifications were made to the SVGs beyond the file rename below.

| Local file      | Twemoji source file                                        | Represents          |
|------------------|-------------------------------------------------------------|----------------------|
| sun.svg          | assets/svg/2600.svg                                          | ☀️ Sun                |
| star.svg         | assets/svg/2b50.svg                                          | ⭐ Star               |
| house.svg        | assets/svg/1f3e0.svg                                         | 🏠 House              |
| heart.svg        | assets/svg/2764.svg                                          | ❤️ Heart              |
| tree.svg         | assets/svg/1f333.svg                                         | 🌳 Tree               |
| book.svg         | assets/svg/1f4d6.svg                                         | 📖 Book               |
| bread.svg        | assets/svg/1f35e.svg                                         | 🍞 Bread              |
| bowl.svg         | assets/svg/1f963.svg                                         | 🥣 Bowl               |
| cup.svg          | assets/svg/1f375.svg                                         | 🍵 Cup                |
| chef-hat.svg     | assets/svg/1f468-200d-1f373.svg                              | 👨‍🍳 Chef            |
| battery.svg      | assets/svg/1f50b.svg                                          | 🔋 Battery            |
| bulb.svg         | assets/svg/1f4a1.svg                                          | 💡 Light bulb         |
| buzzer.svg       | assets/svg/1f514.svg                                          | 🔔 Bell               |

These replace the corresponding hand-rolled inline SVGs in
`frontend/src/components/illustrations/icons.jsx`,
`frontend/src/components/illustrations/scenery.jsx`,
`frontend/src/components/illustrations/kitchen.jsx`, and
`frontend/src/components/illustrations/circuits.jsx` for the specific exports
listed above (used on the Home, Missions, LifeSkills, Reading, MiniChef, and
CircuitLab pages).

## Second pass (2026-08-18)

Added `battery.svg`, `bulb.svg`, and `buzzer.svg` (see table above), swapping
`IllustrationBattery`, `IllustrationBulb`, and `IllustrationBuzzer` in
`circuits.jsx` from hand-rolled flat SVG to Twemoji, same license/process as
the first pass. `IllustrationWire`, `IllustrationMotor`, and
`IllustrationSwitch` in the same file have no good single-emoji Twemoji
equivalent, so they were hand-improved in place instead (added gradients/
shading rather than replaced) — see commit for details.

Also hand-improved the 7 mascot characters in
`frontend/src/components/mascots/characters.jsx` (Lumi, Bit, Nina, Tomás,
Milo, Vasco, Pipa) with gradients, layered shading, and highlights. These are
the app's recurring "brand" characters (rendered via `MascotBubble` on almost
every page) and were deliberately kept as bespoke hand-drawn SVG rather than
replaced with generic Twemoji faces, per product direction.

Other illustration modules (`animals.jsx` — confirmed unused anywhere in
`frontend/src/pages`, `humanEvolution.jsx`, `techHistory.jsx`, and
`solarSystem.jsx` — already gradient-shaded from an earlier pass) are
unchanged in this pass; see the commit message for what's left for a future
pass.
