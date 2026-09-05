# Home experiment photos — source and licensing

The Science module's "Experiências" (home experiments) tab can show a real
photo for some of its step-by-step experiments (`frontend/src/content/homeExperiments.*.json`,
`image` field). Not every experiment has one — a well-licensed photo was
only used where a genuine public-domain / CC0 / CC-BY / CC-BY-SA match was
found on Wikimedia Commons after a reasonable search; the rest fall back to
the experiment's emoji in the UI.

All images below are sourced from [Wikimedia Commons](https://commons.wikimedia.org),
downloaded via a `500px`-wide thumbnail rendition of the original file to
keep each one well under 300KB for a fast-loading PWA, with no other
alteration to the image content.

## Sep 5, 2026 — initial pack (5 photos)

| File | Subject | Author | License | Source |
|---|---|---|---|---|
| volcano.jpg | Baking soda + vinegar reaction | Kate Ter Haar | CC BY 2.0 | commons.wikimedia.org/wiki/File:Baking_soda_and_vinegar.jpg |
| oil-water.jpg | Oil and water not mixing (density layers) | ГузАрина | CC BY 4.0 | commons.wikimedia.org/wiki/File:Liquids_of_different_density_do_not_mix.jpg |
| cabbage-indicator.jpg | Red cabbage juice as a pH indicator | Epaenurk | CC BY-SA 3.0 | commons.wikimedia.org/wiki/File:Red_cabbage_indicator.jpg |
| naked-egg.jpg | Chicken egg with shell dissolved by vinegar | Biswarup Ganguly | CC BY 3.0 (also GFDL 1.2+) | commons.wikimedia.org/wiki/File:Chicken_Egg_without_Eggshell_5859.jpg |
| sugar-crystal.jpg | Sugar crystals grown from a seed crystal | Zaereth | CC BY-SA 4.0 | commons.wikimedia.org/wiki/File:Crystallized_sugar,_multiple_crystals_and_a_single_crystal_grown_from_seed.jpg |

No image has been cropped or edited in a way that misrepresents the
subject. A reasonable search (2-3 queries) was also made for photos of the
walking-rainbow, magic-milk, static-balloon, egg-float-in-salt-water, and
homemade-compass experiments, and for the lava lamp and rubber-band-car
experiments, but no genuinely well-licensed match was found on Commons —
those entries in `homeExperiments.*.json` have no `image` field and the UI
shows the experiment's emoji instead.
