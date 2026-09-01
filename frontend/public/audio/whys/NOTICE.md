# Whys audio — source and licensing

The `.mp3` files under `pt/` narrate this app's own original "why" answers
(see `frontend/src/content/whys.pt.json`) — each file is the question,
quick answer, longer answer and (when present) the experiment, joined into
one narration — synthesized locally with
[Piper TTS](https://github.com/rhasspy/piper) (open-source, runs fully
on-device — no account, no API key, no per-character cost, no ongoing
quota) on 2026-09-01, and regenerated the same day with a pitch-shifted
voice — see below.

- Voice model: `pt_PT-tugão-medium` (European Portuguese, medium quality,
  22,050Hz), downloaded from the `rhasspy/piper-voices` repository on
  Hugging Face. Model license: **CC0** (public domain), so the generated
  audio has no usage restrictions.
- **Female-voice stopgap (2026-09-01):** the product owner reported this
  voice sounds male and asked for a female PT-PT voice. A search across
  Hugging Face turned up no free, well-licensed, genuinely female PT-PT
  voice (`OpenVoiceOS/pipertts_pt-PT_dii` is female but CC BY-NC-ND;
  `voice3`/`voice4` from the same collection have no stated license;
  `facebook/mms-tts-por` is CC-BY-NC; no ready pretrained Coqui/VITS
  checkpoint was found) — full detail in `songs/NOTICE.md`. As an
  explicitly-flagged stopgap, the CC0 `tugão` output is pitch-shifted up
  ~3 semitones with `ffmpeg` (`asetrate`/`atempo`, tempo preserved) before
  the mp3 conversion below. This is a modified male voice, not a genuine
  female voice — swap in a real one if a suitable license ever surfaces.
- Coverage: all 64 entries have real narration, each as `whys/pt/<id>.mp3`.
- Only Portuguese is covered. Every other language falls back to the
  browser's built-in Web Speech API (`speechSynthesis`), same as before —
  `Whys.jsx` automatically prefers a real audio file when one exists and
  falls back otherwise, so nothing is ever silently broken.
- `.wav` output from Piper was converted to `.mp3` with `ffmpeg` (via the
  `imageio-ffmpeg` bundled binary) to keep file sizes reasonable for a PWA.
