# Human Evolution photos — source and licensing

All `.jpg` files in this folder are real photographs (museum casts/
reconstructions and one prehistoric cave painting — no AI art, no
copyrighted textbook illustrations) sourced from [Wikimedia
Commons](https://commons.wikimedia.org/), downloaded on 2026-09-01,
license-verified via the Commons API before download, and
resized/compressed locally (max ~900px, JPEG quality 78) — no cropping or
content edits. Each maps to one stage id in
`frontend/src/content/humanEvolution.pt.json` via
`frontend/src/content/humanEvolutionPhotos.json`. 8 of the 9 stages have a
photo; `humanos-hoje` was intentionally left without one — depicting real
living people raises consent/privacy concerns for a children's app, so the
existing illustration covers it instead.

| File | Source (File: page) | Author | License |
|---|---|---|---|
| `ancestral-comum.jpg` | [Skulls of our Ancestors.jpg](https://commons.wikimedia.org/wiki/File:Skulls_of_our_Ancestors.jpg) | Ryan Somma | CC BY-SA 2.0 |
| `australopithecus.jpg` | [Reconstruction of the fossil skeleton of "Lucy" the Australopithecus afarensis.jpg](https://commons.wikimedia.org/wiki/File:Reconstruction_of_the_fossil_skeleton_of_%22Lucy%22_the_Australopithecus_afarensis.jpg) | 120 (Wikimedia Commons) | CC BY 2.5 |
| `homo-habilis.jpg` | [Homo habilis skull - Naturmuseum Senckenberg - DSC02097.JPG](https://commons.wikimedia.org/wiki/File:Homo_habilis_skull_-_Naturmuseum_Senckenberg_-_DSC02097.JPG) | Daderot | CC0 |
| `homo-erectus.jpg` | [Homo erectus skull cast, World Museum Liverpool.JPG](https://commons.wikimedia.org/wiki/File:Homo_erectus_skull_cast,_World_Museum_Liverpool.JPG) | Rept0n1x | CC BY-SA 3.0 |
| `neandertais.jpg` | [Neanderthal man reconstruction, Natural History Museum, London.jpg](https://commons.wikimedia.org/wiki/File:Neanderthal_man_reconstruction,_Natural_History_Museum,_London.jpg) | Werner Ustorf | CC BY-SA 2.0 |
| `homo-sapiens.jpg` | [Homo sapiens sapiens (Cro-Magnon Man), World Museum Liverpool (1).JPG](https://commons.wikimedia.org/wiki/File:Homo_sapiens_sapiens_(Cro-Magnon_Man),_World_Museum_Liverpool_(1).JPG) | Rept0n1x | CC BY-SA 3.0 |
| `arte-e-cultura.jpg` | [Lascaux painting.jpg](https://commons.wikimedia.org/wiki/File:Lascaux_painting.jpg) | Unknown (public-domain photograph) | Public domain |
| `agricultura.jpg` | [Neolithic period1.jpg](https://commons.wikimedia.org/wiki/File:Neolithic_period1.jpg) | A.Aida88 | CC0 |

Structured credit data (author/license/URL per stage id) also lives in
`frontend/src/content/humanEvolutionPhotos.json` and is rendered as an
in-app photo caption by `EvolutionPhoto` in
`frontend/src/pages/HumanEvolution.jsx`, mirroring `CountryPhotoStrip` in
`frontend/src/pages/World.jsx`.
