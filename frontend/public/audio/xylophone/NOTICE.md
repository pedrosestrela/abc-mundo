# Xylophone samples — provenance & license

Source: `tonejs-instruments` sample library by Nicholas Brosowsky
(https://github.com/nbrosowsky/tonejs-instruments), distributed via the
MIT-licensed npm package `tonejs-instrument-xylophone-mp3`
(https://npm.im/tonejs-instrument-xylophone-mp3, published by Makefully
Studios — see https://github.com/Makefully-Studios/tonejs-instruments for
the packaging repo).

License:
- Code/packaging: MIT
- Audio samples: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/) —
  per the package README: "Samples: CC-by 3.0". Original samples sourced
  from public-domain instrument recordings, edited (trimmed, normalized,
  pitch-corrected) by the tonejs-instruments project.

All 8 files shipped from the package (C5, C6, C7, C8, G4, G5, G6, G7 —
no minification needed, package is already small). `music.js` pitch-shifts
each sample via `AudioBufferSourceNode.playbackRate` to cover the notes in
between.

Attribution: "tonejs-instruments" xylophone samples, CC BY 3.0, via
Nicholas Brosowsky / Makefully Studios.
