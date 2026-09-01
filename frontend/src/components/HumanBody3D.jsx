import React, { useEffect, useRef } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  AmbientLight,
  DirectionalLight,
  CapsuleGeometry,
  SphereGeometry,
  MeshPhongMaterial,
  Mesh,
  Raycaster,
  Vector2,
  Group,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Same flat-color / soft-lighting aesthetic as Globe3D.jsx, but built from
// plain three.js primitives (no globe.gl here — this isn't a sphere-shaped
// scene) since a friendly kid figure is just a handful of capsules/spheres.
// Rough 3D placement of each organ marker, echoing HumanBody.jsx's 2D
// ORGAN_POSITIONS but in x/y/z around the figure (y up, z forward = chest).
const ORGAN_POSITIONS_3D = {
  brain: { x: 0, y: 1.62, z: 0.12 },
  heart: { x: -0.12, y: 1.05, z: 0.24 },
  lungs: { x: 0.14, y: 1.08, z: 0.22 },
  stomach: { x: 0.12, y: 0.88, z: 0.22 },
  liver: { x: -0.14, y: 0.85, z: 0.2 },
  kidneys: { x: 0.18, y: 0.8, z: 0.05 },
  intestines: { x: 0, y: 0.75, z: 0.22 },
  bladder: { x: 0, y: 0.6, z: 0.15 },
  skin: { x: 0.32, y: 0.9, z: 0.05 },
  blood: { x: -0.32, y: 0.9, z: 0.05 },
};

// Small canvas-texture emoji sprite so each organ marker reads clearly at a
// glance (matches the emoji already used on the 2D silhouette) without
// needing any external icon asset.
function makeEmojiSprite(emoji, explored) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  ctx.fillStyle = explored ? "rgba(92, 201, 138, 0.95)" : "rgba(255, 210, 63, 0.95)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.font = "64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + 4);
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new Sprite(material);
  sprite.scale.set(0.34, 0.34, 1);
  return { sprite, material, texture };
}

// Simple rotatable 3D kid figure (capsule/sphere primitives, same
// MeshPhongMaterial + flat-color approach as Globe3D.jsx) with clickable
// organ markers layered in 3D space. Drag-to-rotate / pinch-to-zoom via
// three.js's own OrbitControls, mirroring Globe3D's drag+auto-rotate feel.
export default function HumanBody3D({ organs, activeId, exploredIds, onSelect }) {
  const containerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const organsRef = useRef(organs);
  organsRef.current = organs;
  const exploredRef = useRef(exploredIds);
  exploredRef.current = exploredIds;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const markersRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new Scene();
    scene.background = new Color("#0b1024");

    const width = container.clientWidth;
    const height = 360;
    const camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.05, 3.1);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting: same soft ambient + warm "sun" + cool rim trio as Globe3D.
    const ambient = new AmbientLight(0xffffff, 0.55);
    const sun = new DirectionalLight(new Color("#fff6e0"), 1.1);
    sun.position.set(1.2, 2, 1.5);
    const rim = new DirectionalLight(new Color("#6fb8ff"), 0.4);
    rim.position.set(-1.5, 0.5, -1);
    scene.add(ambient, sun, rim);

    // --- Friendly flat-color kid figure, plain primitives only ---
    const figure = new Group();
    const skin = new MeshPhongMaterial({ color: "#ffcf9e", shininess: 15 });
    const shirt = new MeshPhongMaterial({ color: "#4fb0e6", shininess: 15 });
    const pants = new MeshPhongMaterial({ color: "#3c5a8a", shininess: 15 });

    const head = new Mesh(new SphereGeometry(0.26, 24, 24), skin);
    head.position.set(0, 1.62, 0);
    const torso = new Mesh(new CapsuleGeometry(0.26, 0.55, 8, 16), shirt);
    torso.position.set(0, 1.02, 0);
    const armL = new Mesh(new CapsuleGeometry(0.09, 0.55, 6, 12), skin);
    armL.position.set(-0.42, 1.0, 0);
    armL.rotation.z = 0.18;
    const armR = armL.clone();
    armR.position.x = 0.42;
    armR.rotation.z = -0.18;
    const legL = new Mesh(new CapsuleGeometry(0.11, 0.6, 6, 12), pants);
    legL.position.set(-0.15, 0.35, 0);
    const legR = legL.clone();
    legR.position.x = 0.15;

    figure.add(head, torso, armL, armR, legL, legR);
    scene.add(figure);

    // --- Organ markers: emoji sprites, raycast-clickable ---
    const markerGroup = new Group();
    const markerEntries = [];
    // Only "organ" items get a 3D hotspot on the figure itself (bones and
    // tendons don't map onto sensible body-surface positions the same way
    // and are already reachable as tappable chips in HumanBody.jsx below
    // the 3D view), same split as the 2D BodyDiagram.
    const organItems = organsRef.current.filter((o) => (o.category || "organ") === "organ");
    for (const organ of organItems) {
      const pos = ORGAN_POSITIONS_3D[organ.id] || { x: 0, y: 0.9, z: 0.2 };
      const explored = exploredRef.current.includes(organ.id);
      const { sprite, material, texture } = makeEmojiSprite(organ.emoji, explored);
      sprite.position.set(pos.x, pos.y, pos.z);
      sprite.userData.organId = organ.id;
      markerGroup.add(sprite);
      markerEntries.push({ organ, sprite, material, texture });
    }
    scene.add(markerGroup);
    markersRef.current = markerEntries;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.minDistance = 1.6;
    controls.maxDistance = 5;
    controls.enablePan = false;
    controls.update();

    const raycaster = new Raycaster();
    const pointer = new Vector2();
    let downX = 0;
    let downY = 0;

    function handlePointerDown(e) {
      downX = e.clientX;
      downY = e.clientY;
    }

    function handlePointerUp(e) {
      // Only treat as a "click" (not a drag-rotate release) if the pointer
      // barely moved, so rotating the figure never accidentally opens an
      // organ card.
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.hypot(dx, dy) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerGroup.children, false);
      if (hits.length > 0) {
        const organId = hits[0].object.userData.organId;
        const organ = organsRef.current.find((o) => o.id === organId);
        if (organ) onSelectRef.current(organ);
      }
    }

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    let frameId;
    function animate() {
      controls.update();
      // Markers always face the camera (billboarding is automatic for
      // Sprites), just keep rendering.
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      if (!container) return;
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      if (frameId) cancelAnimationFrame(frameId);
      controls.dispose();
      markerEntries.forEach(({ material, texture }) => {
        material.dispose();
        texture.dispose();
      });
      renderer.dispose();
      if (container) container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-tint marker sprites (explored/active) without rebuilding the whole
  // scene, mirroring Globe3D's lightweight "re-trigger accessor" update.
  useEffect(() => {
    markersRef.current.forEach(({ organ, material, texture }) => {
      const canvas = texture.image;
      const ctx = canvas.getContext("2d");
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);
      const explored = exploredIds.includes(organ.id);
      const active = organ.id === activeId;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
      ctx.fillStyle = active
        ? "rgba(255, 138, 101, 0.95)"
        : explored
        ? "rgba(92, 201, 138, 0.95)"
        : "rgba(255, 210, 63, 0.95)";
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.font = "64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(organ.emoji, size / 2, size / 2 + 4);
      texture.needsUpdate = true;
      void material;
    });
  }, [activeId, exploredIds]);

  return <div ref={containerRef} className="globe-3d-container body-3d-container" />;
}
