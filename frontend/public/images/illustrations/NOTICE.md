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

These replace the corresponding hand-rolled inline SVGs in
`frontend/src/components/illustrations/icons.jsx`,
`frontend/src/components/illustrations/scenery.jsx`, and
`frontend/src/components/illustrations/kitchen.jsx` for the specific exports
listed above (used on the Home, Missions, LifeSkills, Reading, and MiniChef
pages — the highest-traffic pages that actually render illustrations in the
app today).

Other illustration modules (`animals.jsx`, `humanEvolution.jsx`,
`techHistory.jsx`, `circuits.jsx`, and the remaining exports of
`icons.jsx`/`kitchen.jsx`/`scenery.jsx`) are unchanged and still use the
original inline flat-SVG style — see the PR/commit notes for why this is an
intentional partial pass rather than a full reskin.
