# Harp samples — provenance & license

Source: `tonejs-instruments` sample library by Nicholas Brosowsky
(https://github.com/nbrosowsky/tonejs-instruments), distributed via the
MIT-licensed npm package `tonejs-instrument-harp-mp3`
(https://npm.im/tonejs-instrument-harp-mp3, published by Makefully
Studios — see https://github.com/Makefully-Studios/tonejs-instruments for
the packaging repo).

License:
- Code/packaging: MIT
- Audio samples: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/) —
  per the package README: "Samples: CC-by 3.0". Original samples sourced
  from public-domain instrument recordings, edited (trimmed, normalized,
  pitch-corrected) by the tonejs-instruments project.

13 of the 23 files shipped from the package (A4, B3, B5, C3, C5, D4, D6, E3,
E5, F4, F6, G3, G5) were selected — enough to densely cover the app's C4-C6
playable range plus a little headroom either side, without shipping every
note the upstream package includes. `music.js` pitch-shifts each sample via
`AudioBufferSourceNode.playbackRate` to cover the notes in between.

Attribution: "tonejs-instruments" harp samples, CC BY 3.0, via
Nicholas Brosowsky / Makefully Studios.
