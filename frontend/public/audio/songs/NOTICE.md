# Song audio — source and licensing

The `.mp3` files under `pt/` and `en/` are narration of this app's own
original song lyrics (see `frontend/src/content/songs.pt.json` /
`songs.en.json`), from two different sources:

## `pt/` — Piper TTS (European Portuguese)

Regenerated on 2026-09-01 with [Piper TTS](https://github.com/rhasspy/piper)
(open-source, runs fully on-device — no account, no API key, no
per-character cost, no ongoing quota), replacing an earlier ElevenLabs
version whose `pt` voice rendered with a Brazilian-Portuguese-leaning
accent — wrong for this PT-first app.

- Voice model: `pt_PT-tugão-medium` (European Portuguese, medium quality,
  22,050Hz), downloaded from the `rhasspy/piper-voices` repository on
  Hugging Face. Model license: **CC0** (public domain — see the model card
  at `rhasspy/piper-voices/pt/pt_PT/tugão/medium/MODEL_CARD`), so the
  generated audio has no usage restrictions. Same voice already used for
  `stories/pt/` — see that folder's NOTICE.md.
- Rhythm/pacing: each song's `lyrics` array (already short per-line phrases
  in `songs.pt.json`) is synthesized as **separate Piper calls per line**
  and concatenated with ~400ms of silence between lines, instead of
  synthesizing the whole lyrics blob as one utterance — this reads as
  phrased, rhythmic lines rather than one flat run-on paragraph. Piper's
  `--length-scale` was also set to `1.18` (slower than the default `1.0`)
  for a more deliberate, nursery-rhyme-like cadence. This is still plain
  narration TTS, not melody-aware singing synthesis — no free/local tool
  can make it actually sing a tune — but the per-line pacing meaningfully
  reduces the "flat news-reader" feel of one continuous spoken paragraph.
- `.wav` output from Piper was converted to `.mp3` with `ffmpeg` (via the
  `imageio-ffmpeg` bundled binary) to keep file sizes reasonable for a PWA.
- Coverage: all 22 songs in `songs.pt.json`.

## `en/` — ElevenLabs (unchanged)

Created with the ElevenLabs text-to-speech API (voice: "Jessica",
`eleven_multilingual_v2` model) on 2026-09-01, using the free tier
(10,000 characters/month). Not regenerated — English wasn't the accent
complaint that prompted the `pt/` redo above.

- The synthesized voice audio was generated under an ElevenLabs Free plan.
  If ABC Mundo is ever monetized/distributed commercially, check
  ElevenLabs' current terms for the plan tier in use — some tiers restrict
  commercial use of generated audio; upgrade the plan accordingly before
  commercial launch.
- Coverage: 21 of 22 songs — "Hino Nacional (A Portuguesa)" hit the
  free-tier character quota and is not yet generated.

## `de/` — Piper TTS (German)

Generated on 2026-09-01 with Piper TTS.

- Voice model: `de_DE-thorsten-medium` (German, medium quality, 22,050Hz),
  downloaded from `rhasspy/piper-voices` on Hugging Face. Model license:
  **CC0** (public domain — dataset:
  [Thorsten-Voice](https://github.com/thorstenMueller/Thorsten-Voice), see
  the model card at `rhasspy/piper-voices/de/de_DE/thorsten/medium/MODEL_CARD`).
- Same per-line synthesis + ~400ms silence splice + `--length-scale 1.18`
  technique as `pt/` (see above).
- Coverage: all 21 songs in `songs.de.json` (this language's song list has
  21 entries, not 22 — no German equivalent of the PT/EN national anthem
  track).

## `fr/` — Piper TTS (French)

Generated on 2026-09-01 with Piper TTS.

- Voice model: `fr_FR-siwis-medium` (French, medium quality, 22,050Hz),
  downloaded from `rhasspy/piper-voices` on Hugging Face. Model license:
  **CC-BY 4.0** (dataset: [SIWIS French Speech
  Synthesis](https://datashare.is.ed.ac.uk/handle/10283/2353), University
  of Edinburgh — see the model card at
  `rhasspy/piper-voices/fr/fr_FR/siwis/medium/MODEL_CARD`). No CC0/public-domain
  French voice of comparable (medium) quality was available in the
  `piper-voices` repo at generation time; CC-BY permits this use, attribution
  recorded here.
- Same per-line synthesis + ~400ms silence splice + `--length-scale 1.18`
  technique as `pt/` (see above).
- Coverage: all 21 songs in `songs.fr.json`.

## `es/` — Piper TTS (Spanish)

Generated on 2026-09-01 with Piper TTS.

- Voice model: `es_ES-davefx-medium` (European Spanish, medium quality,
  22,050Hz), downloaded from `rhasspy/piper-voices` on Hugging Face. Model
  license: **CC0** (public domain — dataset:
  [OHF-Voice/voice-datasets](https://github.com/OHF-Voice/voice-datasets),
  see the model card at
  `rhasspy/piper-voices/es/es_ES/davefx/medium/MODEL_CARD`).
- Same per-line synthesis + ~400ms silence splice + `--length-scale 1.18`
  technique as `pt/` (see above).
- Coverage: all 21 songs in `songs.es.json`.

## `it/` — Piper TTS (Italian)

Generated on 2026-09-01 with Piper TTS.

- Voice model: `it_IT-serena-medium` (Italian, medium quality, 22,050Hz),
  downloaded from `rhasspy/piper-voices` on Hugging Face. Model license:
  **CC-BY 4.0** (dataset:
  [serena-synthetic-it-27h](https://huggingface.co/datasets/committa/serena-synthetic-it-27h),
  see the model card at
  `rhasspy/piper-voices/it/it_IT/serena/medium/MODEL_CARD`). The other
  medium-quality Italian voice (`paola`) had an unclear/unverifiable
  dataset license, so `serena` was used instead; attribution recorded here.
- Same per-line synthesis + ~400ms silence splice + `--length-scale 1.18`
  technique as `pt/` (see above).
- Coverage: all 21 songs in `songs.it.json`.

## `zh/` — not yet generated (Mandarin Chinese)

Attempted on 2026-09-01 but not completed — left out entirely rather than
partially generated, so `zh/` still falls back to Web Speech for every song.

- Voice model candidate: `zh_CN-chaowen-medium` (CC0, same
  `piper-voices` repo). The model itself downloaded fine and is
  appropriately licensed.
- Blocker: Piper's Chinese phonemizer (`g2pW`) requires the `transformers`
  Python package, which on this generation machine detects a broken/
  partially-installed `torch` package (an environment issue unrelated to
  this app or its content — a `torch` install was mid-flight from other
  concurrent activity on the shared machine, causing the phonemizer to
  either crash or silently produce empty phonemes depending on install
  state at the moment of each call). This is a local tooling problem, not
  a licensing or content issue.
- To finish `zh/` later: regenerate on a machine/environment with a clean
  Python install (no broken `torch`), run `pip install "piper-tts[zh]"`,
  then reuse `zh_CN-chaowen-medium` with the same per-line + silence +
  `--length-scale 1.18` technique as the other languages.

## All languages

- The lyrics themselves are original content written for this app.
- Portuguese (`pt/`, 22 songs), English (`en/`, 21 of 22 songs), German
  (`de/`, 21 songs), French (`fr/`, 21 songs), Spanish (`es/`, 21 songs),
  and Italian (`it/`, 21 songs) are covered with real recorded-voice
  narration. Mandarin Chinese (`zh/`) is not yet covered — see above.
- `Songs.jsx` automatically prefers a real audio file when one exists for a
  given song+language and falls back to Web Speech otherwise — no missing
  file ever blocks playback.
