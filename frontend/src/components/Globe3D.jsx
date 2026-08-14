import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";
import { MeshPhongMaterial, Color, CanvasTexture, DirectionalLight, AmbientLight } from "three";
import { feature } from "topojson-client";
// Land shapes come from the "world-atlas" npm package, bundled locally by Vite
// at build time (no runtime CDN/network fetch needed). This keeps the globe
// self-contained and network-independent (works offline/on tablets once the PWA
// service worker has cached the build), while still drawing real, filled
// continent shapes with lit shading instead of a flat ocean-blue sphere.
import landTopo from "world-atlas/land-110m.json";

const landFeatures = feature(landTopo, landTopo.objects.land).features;

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

  useEffect(() => {
    if (!containerRef.current) return;

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
      .polygonsData(landFeatures)
      .polygonCapColor(() => "#3fa066")
      .polygonSideColor(() => "rgba(30,80,50,0.6)")
      .polygonStrokeColor(() => "#245c3d")
      .polygonAltitude(0.008)
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
