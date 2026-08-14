import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";
import {
  MeshStandardMaterial,
  Color,
  CanvasTexture,
  DirectionalLight,
  AmbientLight,
  SphereGeometry,
  Mesh,
} from "three";
import { feature } from "topojson-client";
// Land shapes come from the "world-atlas" npm package, bundled locally by Vite
// at build time (no runtime CDN/network fetch needed). This keeps the globe
// self-contained and network-independent (works offline/on tablets once the PWA
// service worker has cached the build), while still drawing real, filled
// continent shapes with lit shading instead of a flat ocean-blue sphere.
//
// countries-50m.json (instead of the old countries-110m.json) has one
// Feature per country at 1:50-million-scale resolution — noticeably more
// detailed coastlines/borders than the old 110m data, while still a compact
// bundled JSON (~740KB raw vs ~108KB for 110m; still tiny compared to the
// 10m variant at ~3.6MB, which would be overkill for a stylized kids' globe).
// This is what lets us draw visible per-country border lines and make
// each country's whole outline clickable, not just its pin marker.
import countriesTopo from "world-atlas/countries-50m.json";

const countryFeatures = feature(countriesTopo, countriesTopo.objects.countries).features;

// countries.json (the app's ~53-country curated dataset) keys countries by
// ISO 3166-1 ALPHA-2 code (e.g. "PT"), but world-atlas's countries-110m.json
// keys each polygon feature by its ISO 3166-1 NUMERIC id (e.g. 620). This is
// a minimal alpha-2 -> numeric lookup covering just the countries actually
// used by this app (double-checked against known codes: Portugal=620,
// Spain=724, France=250, Japan=392, Angola=024, Cabo Verde=132).
const ISO_NUMERIC_BY_ALPHA2 = {
  PT: 620, ES: 724, FR: 250, DE: 276, IT: 380, GB: 826, US: 840, BR: 76,
  CN: 156, JP: 392, IN: 356, EG: 818, ZA: 710, AU: 36, CA: 124, MX: 484,
  KR: 410, GR: 300, KE: 404, SE: 752, MA: 504, NG: 566, ET: 231, TZ: 834,
  TH: 764, ID: 360, TR: 792, PH: 608, AR: 32, PE: 604, CL: 152, CO: 170,
  NO: 578, NL: 528, PL: 616, IE: 372, NZ: 554, FJ: 242, CU: 192, CR: 188,
  AO: 24, MZ: 508, CV: 132, GW: 624, ST: 678, TL: 626, BE: 56, CH: 756,
  AT: 40, RU: 643, VN: 704, SA: 682, IS: 352,
};

// Simple deterministic pseudo-random helper (mulberry32) so the procedural
// noise below is stable across renders instead of flickering on re-mount.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cheap layered "value noise": scatter semi-transparent soft-edged blobs of
// varying size/opacity across the canvas. Layering a handful of these at
// different scales gives an organic depth-variation look (patchy currents,
// subtle color drift) without a real Perlin-noise implementation or any
// external texture asset.
function paintBlobNoise(ctx, width, height, rng, { count, minR, maxR, color, alpha }) {
  for (let i = 0; i < count; i++) {
    const x = rng() * width;
    const y = rng() * height;
    const r = minR + rng() * (maxR - minR);
    const a = alpha * (0.4 + rng() * 0.6);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${color},${a})`);
    grad.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Builds a high-resolution ocean-color canvas texture procedurally (no
// network fetch): a vertical gradient from deep navy at the "poles" to a
// brighter tropical blue at the "equator" band, plus layered soft-blob noise
// for visible depth/current variation instead of one flat color, plus faint
// lat/long grid lines for a "map" feel. 2048x1024 keeps it sharp under zoom
// while remaining a single cheap 2D-canvas draw (no per-frame cost), so it
// stays light on iPad-class GPUs.
function buildOceanTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#081f38");
  gradient.addColorStop(0.35, "#0f3f66");
  gradient.addColorStop(0.5, "#1c6a9c");
  gradient.addColorStop(0.65, "#0f3f66");
  gradient.addColorStop(1, "#081f38");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const rng = mulberry32(20260814);
  // Large slow "current" blobs, then finer texture on top.
  paintBlobNoise(ctx, width, height, rng, {
    count: 40,
    minR: 120,
    maxR: 320,
    color: "60,150,190",
    alpha: 0.12,
  });
  paintBlobNoise(ctx, width, height, rng, {
    count: 40,
    minR: 60,
    maxR: 150,
    color: "10,30,55",
    alpha: 0.14,
  });
  paintBlobNoise(ctx, width, height, rng, {
    count: 120,
    minR: 10,
    maxR: 40,
    color: "140,210,235",
    alpha: 0.06,
  });

  // Faint lat/long grid lines for a "map" feel.
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= width; x += width / 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += height / 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// A subtle land-fill noise texture is not used for the polygon cap color
// (globe.gl's polygon layer takes a flat CSS color per feature, not a UV-
// mapped material), so land "texture" instead comes from a slightly richer
// two-tone palette (see polygonCapColor below) plus the per-country stroke
// lines and altitude/hover lift already in place — a real bump/roughness
// map would require switching the polygon layer to custom mesh geometry,
// out of scope for this pass.

// Builds a soft, wispy cloud-cluster texture on a transparent background:
// clusters of overlapping translucent white blobs, so a slightly-larger
// sphere textured with this and rendered above the globe reads as patchy
// cloud cover. Procedural + cheap (1 canvas draw at mount, independent slow
// rotation afterwards costs nothing but a per-frame rotation.y increment).
function buildCloudTexture() {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const rng = mulberry32(4242);
  const clusterCount = 26;
  for (let c = 0; c < clusterCount; c++) {
    const cx = rng() * width;
    const cy = rng() * height * 0.85 + height * 0.075;
    const puffs = 4 + Math.floor(rng() * 6);
    for (let p = 0; p < puffs; p++) {
      const x = cx + (rng() - 0.5) * 60;
      const y = cy + (rng() - 0.5) * 30;
      const r = 12 + rng() * 28;
      const alpha = 0.05 + rng() * 0.1;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Land fill is a flat CSS color per globe.gl polygon feature (the layer
// isn't a UV-mapped mesh, so a real bump/noise texture isn't available
// here) — so instead we give each country a small deterministic hue/
// lightness jitter off the base green, seeded by its numeric id. This
// breaks up the "one flat cutout color" look into a subtle patchwork, a
// cheap stand-in for real biome variation without needing elevation data.
const LAND_PALETTE = ["#3fa066", "#3c9a72", "#47a45e", "#399372", "#43a35a"];
function landFillColor(feature) {
  const id = Number(feature.id) || 0;
  return LAND_PALETTE[id % LAND_PALETTE.length];
}

// Thin wrapper around globe.gl (three.js under the hood): a rotatable,
// zoomable Earth with shaded ocean + filled continents plus one clickable,
// pulsing marker per explored country.

export default function Globe3D({ countries, visited, onSelect }) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const countriesRef = useRef(countries);
  countriesRef.current = countries;
  const hoveredIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Numeric-id -> app-country lookup, rebuilt each mount from the current
    // countries prop, so polygon clicks/hovers can find the matching entry
    // in countries.json (via ISO_NUMERIC_BY_ALPHA2) and reuse the exact same
    // selection handler the pin markers already call.
    const countryByNumericId = new Map();
    for (const c of countriesRef.current) {
      const numeric = ISO_NUMERIC_BY_ALPHA2[c.iso];
      if (numeric != null) countryByNumericId.set(String(numeric), c);
    }

    // MeshStandardMaterial (physically-based roughness/metalness workflow)
    // instead of the old MeshPhongMaterial: reacts to the scene's directional
    // + ambient lights with a softer, more "real water" falloff than Phong's
    // specular highlight model, at no extra runtime cost.
    const oceanMaterial = new MeshStandardMaterial({
      map: buildOceanTexture(),
      color: new Color("#ffffff"),
      roughness: 0.62,
      metalness: 0.08,
    });

    const globe = Globe()(containerRef.current)
      .globeMaterial(oceanMaterial)
      .showAtmosphere(true)
      .atmosphereColor("#7fd4ff")
      .atmosphereAltitude(0.22)
      .backgroundColor("#0b1024")
      // Per-country border polygons REPLACE the old single merged-landmass
      // blob (globe.gl only supports one polygons layer at a time). Every
      // country still gets the same green fill, but now with its own visible
      // stroke, so borders read as real lines instead of one solid shape.
      // Countries in the app's curated dataset (~53, via
      // ISO_NUMERIC_BY_ALPHA2) are also clickable and get a hover highlight;
      // everything else stays background-only (visible land, not tappable).
      .polygonsData(countryFeatures)
      .polygonCapColor((f) =>
        hoveredIdRef.current === f.id ? "#5cc98a" : landFillColor(f)
      )
      .polygonSideColor(() => "rgba(30,80,50,0.6)")
      .polygonStrokeColor((f) => (countryByNumericId.has(String(f.id)) ? "#173d28" : "#245c3d"))
      .polygonAltitude((f) => (hoveredIdRef.current === f.id ? 0.012 : 0.008))
      .onPolygonClick((f) => {
        const c = countryByNumericId.get(String(f.id));
        if (!c) return;
        onSelectRef.current(c);
        if (globeRef.current) {
          globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.6 }, 1200);
        }
      })
      .onPolygonHover((f) => {
        const nextId = f && countryByNumericId.has(String(f.id)) ? f.id : null;
        if (hoveredIdRef.current === nextId) return;
        hoveredIdRef.current = nextId;
        // Re-trigger accessor evaluation for the affected layer properties.
        globe.polygonCapColor(globe.polygonCapColor());
        globe.polygonAltitude(globe.polygonAltitude());
      })
      .htmlElementsData(countries)
      .htmlLat("lat")
      .htmlLng("lng")
      .htmlAltitude(0.02)
      .htmlElement((c) => {
        const el = document.createElement("div");
        el.className = "globe-marker" + (visited.includes(c.iso) ? " globe-marker-visited" : "");
        el.title = `${c.flag} ${c.name}`;
        el.innerHTML = `<span class="globe-marker-pulse"></span><span class="globe-marker-dot"></span>`;
        el.style.pointerEvents = "auto";
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          onSelect(c);
          // Smooth fly-to: ease the camera toward the clicked country and
          // zoom in slightly, instead of an instant jump-cut.
          if (globeRef.current) {
            globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.6 }, 1200);
          }
        });
        return el;
      })
      .width(containerRef.current.clientWidth)
      .height(360);

    // Lighting: keep globe.gl's default ambient light (soft fill) but boost
    // the directional "sun" so the sphere shows clear shading/depth instead
    // of looking flat, and angle it for a pleasant terminator.
    const lights = globe.lights();
    const ambient = lights.find((l) => l.type === "AmbientLight") || new AmbientLight(0xffffff, 0.6);
    ambient.intensity = 0.55;
    const sun = lights.find((l) => l.type === "DirectionalLight") || new DirectionalLight(0xffffff, 1);
    sun.intensity = 1.1;
    sun.position.set(1, 0.6, 1);
    globe.lights([ambient, sun]);

    // Renderer sharpness: globe.gl already enables antialias by default, but
    // pixelRatio is uncapped, which on a high-DPI tablet (iPad) both wastes
    // fill-rate for no visible benefit past ~2x and risks frame stutter.
    // Cap it explicitly for a good sharpness/performance balance.
    const renderer = globe.renderer();
    if (renderer) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    // Subtle cloud layer: a slightly-larger transparent sphere textured with
    // a procedurally-generated wispy-cloud canvas, rotating independently
    // (and a little faster than the globe's own auto-rotate) for a simple
    // but effective "polished 3D planet" cue. Cheap: one extra low-poly
    // sphere + one static canvas texture, no per-frame texture regeneration.
    const globeRadius = globe.getGlobeRadius();
    const cloudGeometry = new SphereGeometry(globeRadius * 1.008, 48, 48);
    const cloudMaterial = new MeshStandardMaterial({
      map: buildCloudTexture(),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      roughness: 1,
    });
    const cloudMesh = new Mesh(cloudGeometry, cloudMaterial);
    globe.scene().add(cloudMesh);

    let animationFrameId;
    function animateClouds() {
      cloudMesh.rotation.y += 0.0006;
      animationFrameId = requestAnimationFrame(animateClouds);
    }
    animateClouds();

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.6;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;
    globeRef.current = globe;

    function handleResize() {
      if (containerRef.current) globe.width(containerRef.current.clientWidth);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.htmlElementsData([...countries]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visited]);

  return <div ref={containerRef} className="globe-3d-container" />;
}
