import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";
import { MeshPhongMaterial, Color, CanvasTexture, DirectionalLight, AmbientLight } from "three";
import { feature } from "topojson-client";
// Land shapes come from the "world-atlas" npm package, bundled locally by Vite
// at build time (no runtime CDN/network fetch needed). This keeps the globe
// self-contained and network-independent (works offline/on tablets once the PWA
// service worker has cached the build), while still drawing real, filled
// continent shapes with lit shading instead of a flat ocean-blue sphere.
//
// countries-110m.json (instead of land-110m.json's single merged "land"
// object) has one Feature per country, each keyed by its ISO 3166-1 NUMERIC
// id — this is what lets us draw visible per-country border lines and make
// each country's whole outline clickable, not just its pin marker.
import countriesTopo from "world-atlas/countries-110m.json";

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

// Builds a small ocean-color canvas texture procedurally (no network fetch):
// a vertical gradient from deep navy at the "poles" to a brighter tropical
// blue at the "equator" band, giving the ocean visible depth instead of one
// flat color. Cheap (256x128) so it stays light on iPad-class GPUs.
function buildOceanTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0a2f52");
  gradient.addColorStop(0.35, "#124a78");
  gradient.addColorStop(0.5, "#1f6fa8");
  gradient.addColorStop(0.65, "#124a78");
  gradient.addColorStop(1, "#0a2f52");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint lat/long grid lines for a "map" feel.
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += canvas.width / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += canvas.height / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
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

    const oceanMaterial = new MeshPhongMaterial({
      map: buildOceanTexture(),
      color: new Color("#ffffff"),
      specular: new Color("#bfe4ff"),
      shininess: 22,
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
        hoveredIdRef.current === f.id ? "#5cc98a" : "#3fa066"
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
