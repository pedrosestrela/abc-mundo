# Drum samples — provenance & license

Source: Sonic Pi (https://github.com/sonic-pi-net/sonic-pi) built-in sample
library, redistributed via the CC0-1.0-licensed npm package
`supersonic-scsynth-samples` (https://npm.im/supersonic-scsynth-samples, by
Sam Aaron — see PROVENANCE.md excerpt below; the package's own LICENSE file
is CC0-1.0/public domain and covers both the packaging and the audio content
itself, so no attribution is legally required, though it is credited here
for transparency).

Four single-hit acoustic-style drum samples, one per pad
(`frontend/src/music.js`'s `DRUM_PADS`), ~106KB total:

| Pad     | File        | Original filename in `supersonic-scsynth-samples` | Freesound.org source |
|---------|-------------|-----------------------------------------------------|------------------------|
| kick    | kick.flac   | `drum_heavy_kick.flac`                              | https://freesound.org/people/Zajo/sounds/4832/ |
| snare   | snare.flac  | `drum_snare_hard.flac`                              | https://freesound.org/people/menegass/sounds/100058/ |
| hihat   | hihat.flac  | `drum_cymbal_closed.flac`                           | https://freesound.org/people/menegass/sounds/100053/ |
| tom     | tom.flac    | `drum_tom_mid_hard.flac`                            | https://freesound.org/people/menegass/sounds/100066/ |

License: CC0-1.0 / Public Domain (https://creativecommons.org/publicdomain/zero/1.0/)

Files are kept in their original FLAC format (small enough — 19-36KB each —
that MP3 re-encoding wasn't worth the added tooling dependency/quality loss;
FLAC decodes fine via `AudioContext.decodeAudioData` in all browsers this PWA
targets). Each is a single fixed-pitch hit — no per-note pitch-shifting is
applied for the pad player, matching how a real drum kit doesn't retune per
key. `music.js` falls back to the original synthesized noise-burst voice if a
sample fails to load/decode (offline-before-cache-warms, blocked network,
older browser without FLAC support, etc).
