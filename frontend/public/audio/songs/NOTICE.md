# Song audio — source and licensing

The `.mp3` files under `pt/` and `en/` are narration of this app's own
original song lyrics (see `frontend/src/content/songs.pt.json` /
`songs.en.json`), from two different sources:

## `pt/` — Piper TTS (European Portuguese), pitch-shifted stopgap for a female voice

Regenerated again on 2026-09-01 with [Piper TTS](https://github.com/rhasspy/piper)
(open-source, runs fully on-device — no account, no API key, no
per-character cost, no ongoing quota). The product owner reported that the
`pt_PT-tugão-medium` voice used previously sounds male and asked for a
female European-Portuguese voice instead.

**Voice search performed before regenerating (all dead ends for a genuine
free/well-licensed female PT-PT voice):**
- `rhasspy/piper-voices` (the official Piper voice pack) ships exactly one
  `pt_PT` voice — `tugão` — and it is male. No alternative in that pack.
- `OpenVoiceOS/pipertts_pt-PT_*` on Hugging Face has a genuinely female
  European-Portuguese voice (`dii`), but it is licensed
  **CC BY-NC-ND 4.0** — non-commercial and no-derivatives — which fails
  this project's licensing bar (this app may eventually be used more
  broadly). Two other pt-PT entries in the same collection (`voice3`,
  `voice4`) ship with an empty model card and no stated license at all
  (i.e. all-rights-reserved by default), so they're unusable regardless of
  gender.
- `facebook/mms-tts-por` (Meta's Massively Multilingual Speech project) is
  **CC-BY-NC 4.0** (non-commercial only) and is a single generic
  Portuguese voice not specifically PT-PT, of undocumented gender — fails
  the license bar even before the gender question.
- Coqui/VITS models trained on Portuguese Common Voice/CML-TTS data:
  no ready-to-use pretrained checkpoint with a permissive license and a
  documented female PT-PT speaker was found on Hugging Face; CML-TTS
  itself is a CC-BY 4.0 *dataset* (usable), but there is no free compute
  in this environment to train a new voice model from it, which is out of
  scope for this pass.

**Decision — explicitly-flagged stopgap, not a genuine female voice:**
with no free, well-licensed, genuinely-female PT-PT voice available, the
existing CC0 `pt_PT-tugão-medium` output is now **pitch-shifted up
~3 semitones** (`ffmpeg` `asetrate`/`atempo`, tempo restored so pacing is
unchanged) as a stopgap. This is a modified male voice, not a real female
voice — it is disclosed here so nobody mistakes it for one. If a genuine
free/licensable female PT-PT voice (Piper-compatible `.onnx`, or a trained
Coqui/VITS checkpoint) becomes available later, swap it in and drop the
pitch shift.

- Voice model: `pt_PT-tugão-medium` (European Portuguese, medium quality,
  22,050Hz), downloaded from the `rhasspy/piper-voices` repository on
  Hugging Face. Model license: **CC0** (public domain — see the model card
  at `rhasspy/piper-voices/pt/pt_PT/tugão/medium/MODEL_CARD`).
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
- Pitch shift: after the per-line splice, the combined `.wav` is pitch-shifted
  with `ffmpeg -af "asetrate=22050*1.19,aresample=22050,atempo=1/1.19"`
  (≈3 semitones up, kept subtle/natural rather than a cartoonish
  chipmunk effect) then converted to `.mp3` (via the `imageio-ffmpeg`
  bundled binary) to keep file sizes reasonable for a PWA.
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

## `zh/` — Piper TTS (Mandarin Chinese)

Generated on 2026-09-01 with Piper TTS.

- Voice model: `zh_CN-chaowen-medium` (Mandarin Chinese, medium quality,
  22,050Hz), downloaded from `rhasspy/piper-voices` on Hugging Face. Model
  license: **CC0** (public domain — dataset:
  [OHF-Voice/voice-datasets](https://github.com/OHF-Voice/voice-datasets),
  see the model card at
  `rhasspy/piper-voices/zh/zh_CN/chaowen/medium/MODEL_CARD`).
- Same per-line synthesis + ~400ms silence splice + `--length-scale 1.18`
  technique as `pt/` (see above).
- Getting here took several retries: earlier attempts on the same date hit
  a `wave.Error: # channels not specified` failure (Piper's Chinese
  phonemizer, `g2pW`, occasionally produced zero audio frames for a line)
  that looked at first like a broken/partially-installed `torch` on the
  generation machine. Once `torch`/`transformers` settled into a clean,
  fully-installed state, per-line retries of the previously-failing songs
  succeeded consistently — so the root cause was a transient environment
  state during install, not a fundamental Piper/`zh_CN-chaowen-medium`/g2pW
  incompatibility. No content had to be dropped or worked around.
- Coverage: all 21 songs in `songs.zh.json`.

## All languages

- The lyrics themselves are original content written for this app.
- Portuguese (`pt/`, 22 songs), English (`en/`, 21 of 22 songs), German
  (`de/`, 21 songs), French (`fr/`, 21 songs), Spanish (`es/`, 21 songs),
  Italian (`it/`, 21 songs), and Mandarin Chinese (`zh/`, 21 songs) are all
  now covered with real recorded-voice narration.
- `Songs.jsx` automatically prefers a real audio file when one exists for a
  given song+language and falls back to Web Speech otherwise — no missing
  file ever blocks playback.
