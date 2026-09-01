# Story audio — source and licensing

The `.mp3` files under `pt/` are narration of this app's own original story
text (see `frontend/src/content/stories.pt.json` and
`completeTales.pt.json`), synthesized locally with
[Piper TTS](https://github.com/rhasspy/piper) (open-source, runs fully
on-device — no account, no API key, no per-character cost, no ongoing
quota) on 2026-09-01.

- Voice model: `pt_PT-tugão-medium` (European Portuguese, medium quality,
  22,050Hz), downloaded from the `rhasspy/piper-voices` repository on
  Hugging Face. Model license: **CC0** (public domain — see the model card
  at `rhasspy/piper-voices/pt/pt_PT/tugão/medium/MODEL_CARD`), so the
  generated audio has no usage restrictions.
- Each story's page texts are joined into one narration per story per
  `stories/pt/<id>.mp3` / `completeTales`'s tales share the same
  `stories/pt/<id>.mp3` naming (both content sets narrate into this one
  `stories/pt/` folder, keyed by story id).
- Only Portuguese is covered. Every other language, and any story id with
  no generated file (see the coverage note recorded in the commit that
  added this audio), falls back to the browser's built-in Web Speech API
  (`speechSynthesis`), same as before — `Stories.jsx` automatically prefers
  a real audio file when one exists and falls back otherwise, so nothing is
  ever silently broken.
- `.wav` output from Piper was converted to `.mp3` with `ffmpeg` (via the
  `imageio-ffmpeg` bundled binary) to keep file sizes reasonable for a PWA.
