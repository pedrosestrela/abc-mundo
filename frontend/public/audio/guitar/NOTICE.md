# Guitar (acoustic) samples — provenance & license

Source: `tonejs-instruments` sample library by Nicholas Brosowsky
(https://github.com/nbrosowsky/tonejs-instruments), distributed via the
MIT-licensed npm package `tonejs-instrument-guitar-acoustic-mp3`
(https://npm.im/tonejs-instrument-guitar-acoustic-mp3, published by
Makefully Studios — see
https://github.com/Makefully-Studios/tonejs-instruments for the packaging
repo).

License:
- Code/packaging: MIT
- Audio samples: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/) —
  per the package README: "Samples: CC-by 3.0". Original samples sourced
  from public-domain instrument recordings, edited (trimmed, normalized,
  pitch-corrected) by the tonejs-instruments project.

The full package ships 36 chromatic samples (~7MB unpacked) across octaves
2-4. To stay within this PWA's asset-size budget, only the package's own
curated "minify" subset (10 files: A2, A#3, B4, C#3, D3, D#3, E4, F#2, G3,
G#4 — same set the package's `minify: true` option loads) is bundled here
(~2.1MB). `music.js` pitch-shifts each sample via
`AudioBufferSourceNode.playbackRate` to cover the notes in between,
including notes above the highest sampled note (up to ~1 octave of
upward shift for the app's top notes).

Attribution: "tonejs-instruments" acoustic guitar samples, CC BY 3.0, via
Nicholas Brosowsky / Makefully Studios.
