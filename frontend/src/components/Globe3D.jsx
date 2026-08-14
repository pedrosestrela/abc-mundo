import React, { useEffect, useRef } from "react";
import Globe from "globe.gl";
import { MeshPhongMaterial, Color } from "three";

// Thin wrapper around globe.gl (three.js under the hood): a rotatable,
// zoomable Earth with one clickable point per explored country.
// Deliberately NOT using an external texture image (e.g. from a CDN):
// that would make the globe depend on a third-party host being reachable
// at runtime, which is fragile for a PWA meant to work offline/on tablets.
// Instead the globe uses a solid ocean-blue material + atmosphere glow,
// self-contained and network-independent.

export default function Globe3D({ countries, visited, onSelect }) {
  const containerRef = useRef(null);
  const globeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const globe = Globe()(containerRef.current)
      .globeMaterial(new MeshPhongMaterial({ color: new Color("#1b4b6b"), shininess: 8 }))
      .showAtmosphere(true)
      .atmosphereColor("#7fd4ff")
      .atmosphereAltitude(0.18)
      .backgroundColor("#0b1024")
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
