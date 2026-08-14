# Piano samples — provenance & license

Source: Salamander Grand Piano V3 (https://archive.org/details/SalamanderGrandPianoV3)
Author: Alexander Holm
License: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)

These are the "velocity 10" (single dynamic layer) MP3 renders of the
Salamander Grand Piano, distributed via the MIT-licensed npm package
`@audio-samples/piano-mp3-velocity10` (https://npm.im/@audio-samples/piano-mp3-velocity10,
by Jan Forst — see LICENSE-samples.txt in this folder for the package's own
MIT license, which covers the packaging/tooling; the audio content itself is
CC BY 3.0 per Alexander Holm as noted above).

One real recorded note every minor third (C, D#, F#, A per octave, octaves
1-8) — 30 files total, ~5.5MB. `music.js` pitch-shifts each sample up/down by
at most 1.5 semitones via `AudioBufferSourceNode.playbackRate` to cover every
semitone in between, so the whole piano keyboard is covered from real
recordings without needing 88 separate files.

Attribution: "Salamander Grand Piano" samples by Alexander Holm, CC BY 3.0.
