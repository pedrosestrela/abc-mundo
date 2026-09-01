# Whys audio — source and licensing

The `.mp3` files under `pt/` narrate this app's own original "why" answers
(see `frontend/src/content/whys.pt.json`) — each file is the question,
quick answer, longer answer and (when present) the experiment, joined into
one narration — synthesized locally with
[Piper TTS](https://github.com/rhasspy/piper) (open-source, runs fully
on-device — no account, no API key, no per-character cost, no ongoing
quota) on 2026-09-01.

- Voice model: `pt_PT-tugão-medium` (European Portuguese, medium quality,
  22,050Hz), downloaded from the `rhasspy/piper-voices` repository on
  Hugging Face. Model license: **CC0** (public domain), so the generated
  audio has no usage restrictions.
- One file per entry: `whys/pt/<id>.mp3`.
- Only Portuguese is covered. Every other language falls back to the
  browser's built-in Web Speech API (`speechSynthesis`), same as before —
  `Whys.jsx` automatically prefers a real audio file when one exists and
  falls back otherwise, so nothing is ever silently broken.
- `.wav` output from Piper was converted to `.mp3` with `ffmpeg` (via the
  `imageio-ffmpeg` bundled binary) to keep file sizes reasonable for a PWA.
