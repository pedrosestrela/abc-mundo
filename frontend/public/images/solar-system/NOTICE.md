# Solar System images — provenance & license

Status: no external raster images are bundled in this folder.

This module's illustrations are hand-authored inline SVG components in
`frontend/src/components/illustrations/solarSystem.jsx`, not files in this
folder — mirroring the pattern used for `illustrations/humanEvolution.jsx`.

## Why no NASA / Wikimedia Commons photos

The product brief for this module asked to source freely-licensed
(CC0/public-domain) planet imagery from NASA/NASA JPL or Wikimedia Commons
where possible, since existing hand-drawn line-art illustrations in this app
read as too weak.

That was attempted first. The build sandbox this module was developed in
routes all outbound HTTPS through a policy-enforcing egress proxy that only
allows a small allowlist of hosts (needed for git/npm operations). Direct
downloads from `upload.wikimedia.org`, `images-assets.nasa.gov`, and
`solarsystem.nasa.gov` all failed with a `403` "CONNECT tunnel failed"
response from the proxy — i.e. those hosts are not on this session's egress
allowlist, not a licensing problem. Per the proxy's own operating
instructions, a `403` from the proxy is an organization policy denial that
should be reported rather than retried or routed around, so no further
attempts were made to fetch binary image assets from arbitrary external
hosts.

Per the task's own fallback instruction ("If you cannot find well-licensed
real images for some bodies within reasonable effort, it's fine to fall back
to a new, better-quality SVG illustration... rather than blocking the whole
module"), this module ships new, more detailed gradient-shaded SVG planet
illustrations instead of photos, for every body. They are original work
(no external source), drawn in the same shared `PALETTE`/`IllustrationBase`
system as the rest of `components/illustrations/`, but with radial-gradient
shading, terminators, rings, craters and surface texture — deliberately more
detailed than the flat line-art style used elsewhere, to address the "too
weak" feedback within what this environment could actually build.

## If a future session has open network access

Recommended real replacements, in priority order, all public-domain / CC0
and appropriate for a children's app:
- NASA/JPL-Caltech planet photos via https://images.nasa.gov (search per
  body, e.g. "Jupiter", "Saturn rings") — NASA media is not copyrighted
  (17 U.S.C. §105) and is explicitly free to use, including for commercial
  and educational children's products; always check the individual image's
  usage page for the rare exception (non-NASA source credited on the page).
- Wikimedia Commons categories such as
  `Category:NASA solar system images (uncaptioned)` filtered to
  `{{PD-USGov-NASA}}` or `{{CC0}}` — verify each file's license tag on its
  own File: page before using, not just the search thumbnail.
- openclipart.org for a cartoon-style alternative if a more illustrated tone
  is preferred over real photography.
Each image adopted this way should get its own attribution line here (exact
source URL, author/agency, license, retrieval date) mirroring
`public/audio/piano/NOTICE.md` in this repo.
