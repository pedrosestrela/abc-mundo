# Tech History photos — source and licensing

All `.jpg` files in this folder are real photographs sourced from
[Wikimedia Commons](https://commons.wikimedia.org/), downloaded on
2026-09-01, license-verified via the Commons API before download, and
resized/compressed locally (max ~900px, JPEG quality 78) to keep the PWA
bundle small — no cropping or content edits. Each maps to one stage id in
`frontend/src/content/techHistory.pt.json` via
`frontend/src/content/techHistoryPhotos.json`. 14 of the 15 stages have a
photo; `carros-modernos` was intentionally left without one (no
well-licensed, brand-neutral "modern car" photo was found on a focused
Commons search — the hand-drawn illustration still covers it).

| File | Source (File: page) | Author | License |
|---|---|---|---|
| `carruagens.jpg` | [Horse-drawn carriage, early 19th century.jpg](https://commons.wikimedia.org/wiki/File:Horse-drawn_carriage,_early_19th_century.jpg) | Unattributed | Public domain |
| `primeiros-prototipos.jpg` | [1886 Benz Patent-Motorwagen Replica (1).jpg](https://commons.wikimedia.org/wiki/File:1886_Benz_Patent-Motorwagen_Replica_(1).jpg) | Damian B Oh | CC BY-SA 4.0 |
| `ford-t.jpg` | [Ford Model T BW 2018-07-15 13-17-32.jpg](https://commons.wikimedia.org/wiki/File:Ford_Model_T_BW_2018-07-15_13-17-32.jpg) | Berthold Werner | CC BY-SA 3.0 |
| `carros-eletricos.jpg` | [Electric car charging station equipment, Vancouver, WA, March 2020.jpg](https://commons.wikimedia.org/wiki/File:Electric_car_charging_station_equipment,_Vancouver,_WA,_March_2020.jpg) | Steven Baltakatei Sandoval | CC BY-SA 4.0 |
| `velas-candeeiros.jpg` | [Antique Oil Lanterns Public Domain.jpg](https://commons.wikimedia.org/wiki/File:Antique_Oil_Lanterns_Public_Domain.jpg) | Lisafern | CC0 |
| `primeiras-experiencias.jpg` | [Volta battery-MHS 373-IMG 3840-gradient.jpg](https://commons.wikimedia.org/wiki/File:Volta_battery-MHS_373-IMG_3840-gradient.jpg) | Rama | CC BY-SA 3.0 fr |
| `lampada-eletrica.jpg` | [Light bulb Edison 2.jpg](https://commons.wikimedia.org/wiki/File:Light_bulb_Edison_2.jpg) | Thomas Edison (reprint, Norris Peters Co.) | Public domain |
| `eletrificacao.jpg` | [Transmission towers of overhead power lines near Skravena, Bulgaria 01.jpg](https://commons.wikimedia.org/wiki/File:Transmission_towers_of_overhead_power_lines_near_Skravena,_Bulgaria_01.jpg) | Dimitǎr Boevski | CC BY-SA 4.0 |
| `led-hoje.jpg` | [LED bulbs.jpg](https://commons.wikimedia.org/wiki/File:LED_bulbs.jpg) | Geoffrey.landis (English Wikipedia) | CC BY 3.0 |
| `hidroeletrica.jpg` | [Bratsk Hydroelectric Power Station in october.jpg](https://commons.wikimedia.org/wiki/File:Bratsk_Hydroelectric_Power_Station_in_october.jpg) | Egor Kovarsky | CC BY-SA 3.0 |
| `eolica.jpg` | [Roscoe Wind Farm in West Texas.jpg](https://commons.wikimedia.org/wiki/File:Roscoe_Wind_Farm_in_West_Texas.jpg) | Matthew T Rader | CC BY-SA 4.0 |
| `solar.jpg` | [Solar Panel Array in Laos Laowotaiyangban.jpg](https://commons.wikimedia.org/wiki/File:Solar_Panel_Array_in_Laos_Laowotaiyangban.jpg) | China News Service | CC BY 4.0 |
| `termica.jpg` | [Coal power plant Herne snow.jpg](https://commons.wikimedia.org/wiki/File:Coal_power_plant_Herne_snow.jpg) | Arnoldius | CC BY-SA 3.0 |
| `nuclear.jpg` | [Cooling towers of a nuclear power plant.jpg](https://commons.wikimedia.org/wiki/File:Cooling_towers_of_a_nuclear_power_plant.jpg) | Vsatinet | CC BY-SA 4.0 |

Structured credit data (author/license/URL per stage id) also lives in
`frontend/src/content/techHistoryPhotos.json` and is rendered as an
in-app photo caption by `TechPhoto` in `frontend/src/pages/TechHistory.jsx`,
mirroring `CountryPhotoStrip` in `frontend/src/pages/World.jsx`.
