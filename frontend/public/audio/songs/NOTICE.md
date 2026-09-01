# Song audio — source and licensing

The `.mp3` files under `pt/` and `en/` are AI-generated narration of this
app's own original song lyrics (see `frontend/src/content/songs.pt.json` /
`songs.en.json`), created with the ElevenLabs text-to-speech API (voice:
"Jessica", `eleven_multilingual_v2` model) on 2026-09-01, using the free
tier (10,000 characters/month).

- The lyrics themselves are original content written for this app.
- The synthesized voice audio was generated under an ElevenLabs Free plan.
  If ABC Mundo is ever monetized/distributed commercially, check
  ElevenLabs' current terms for the plan tier in use — some tiers restrict
  commercial use of generated audio; upgrade the plan accordingly before
  commercial launch.
- Only Portuguese (`pt/`, 22 songs) and English (`en/`, 21 of 22 songs —
  "Hino Nacional (A Portuguesa)" hit the free-tier character quota and is
  not yet generated) are covered. The other 5 languages still use the
  browser's built-in Web Speech API (`speechSynthesis`), same as before.
- `Songs.jsx` automatically prefers a real audio file when one exists for a
  given song+language and falls back to Web Speech otherwise — no missing
  file ever blocks playback.
