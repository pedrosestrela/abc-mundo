import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";

// Thin wrapper around globe.gl (three.js under the hood): a rotatable,
// zoomable textured Earth with one clickable point per explored country.
// Texture assets come from three-globe's own published example assets
// (same package globe.gl depends on) — no third-party tracking involved.
const EARTH_TEXTURE = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BUMP_TEXTURE = "https://unpkg.com/three-globe/example/img/earth-topology.png";
const BG_TEXTURE = "https://unpkg.com/three-globe/example/img/night-sky.png";

export default function Globe3D({ countries, visited, onSelect }) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const globe = Globe()(containerRef.current)
      .globeImageUrl(EARTH_TEXTURE)
      .bumpImageUrl(BUMP_TEXTURE)
      .backgroundImageUrl(BG_TEXTURE)
      .pointsData(countries)
      .pointLat("lat")
      .pointLng("lng")
      .pointLabel((c) => `${c.flag} ${c.name}`)
      .pointRadius(0.5)
      .pointAltitude(0.02)
      .pointColor((c) => (visited.includes(c.iso) ? "#6bcb77" : "#ffd93d"))
      .onPointClick((c) => onSelect(c))
      .width(containerRef.current.clientWidth)
      .height(360);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.6;
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
      globeRef.current.pointColor((c) => (visited.includes(c.iso) ? "#6bcb77" : "#ffd93d"));
    }
  }, [visited]);

  return <div ref={containerRef} className="globe-3d-container" />;
}
