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

## Both languages

- The lyrics themselves are original content written for this app.
- Only Portuguese (`pt/`, 22 songs) and English (`en/`, 21 of 22 songs) are
  covered. The other 5 languages still use the browser's built-in Web
  Speech API (`speechSynthesis`), same as before.
- `Songs.jsx` automatically prefers a real audio file when one exists for a
  given song+language and falls back to Web Speech otherwise — no missing
  file ever blocks playback.
