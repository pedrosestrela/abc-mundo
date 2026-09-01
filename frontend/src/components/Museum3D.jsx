import React, { useEffect, useRef } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  AmbientLight,
  DirectionalLight,
  BoxGeometry,
  CylinderGeometry,
  MeshPhongMaterial,
  Mesh,
  Group,
  Raycaster,
  Vector2,
  CanvasTexture,
  SpriteMaterial,
  Sprite,
  DoubleSide,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Same flat-color / soft-3-point-lighting look as Globe3D.jsx, applied to a
// simple box "room": a floor + back/side walls (BoxGeometry faces rendered
// from the inside via DoubleSide) with each exhibit standing on its own
// pedestal, arranged in a shallow arc so every exhibit is visible without
// needing to walk around. Clicking a pedestal/emoji opens the same
// guess-then-reveal exhibit flow Museum.jsx already drives.
function makeEmojiSprite(emoji, done) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  ctx.fillStyle = done ? "rgba(92, 201, 138, 0.95)" : "rgba(255, 210, 63, 0.95)";
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
  sprite.scale.set(0.5, 0.5, 1);
  return { sprite, material, texture };
}

export default function Museum3D({ exhibits, exploredIds, onSelect }) {
  const containerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const exhibitsRef = useRef(exhibits);
  exhibitsRef.current = exhibits;
  const markersRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new Scene();
    scene.background = new Color("#160f24");

    const width = container.clientWidth;
    const height = 360;
    const camera = new PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 4.4);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambient = new AmbientLight(0xffffff, 0.6);
    const sun = new DirectionalLight(new Color("#fff6e0"), 1.1);
    sun.position.set(1.5, 3, 2);
    const rim = new DirectionalLight(new Color("#b98cff"), 0.4);
    rim.position.set(-2, 1, -1.5);
    scene.add(ambient, sun, rim);

    // --- Room shell: floor + back wall + two side walls, flat colors ---
    const room = new Group();
    const floorMat = new MeshPhongMaterial({ color: "#5a4a7c", shininess: 5, side: DoubleSide });
    const wallMat = new MeshPhongMaterial({ color: "#8a72c2", shininess: 5, side: DoubleSide });

    const roomWidth = 6;
    const roomDepth = 4;
    const roomHeight = 3;

    const floor = new Mesh(new BoxGeometry(roomWidth, 0.1, roomDepth), floorMat);
    floor.position.set(0, -0.05, 0);
    const backWall = new Mesh(new BoxGeometry(roomWidth, roomHeight, 0.1), wallMat);
    backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
    const leftWall = new Mesh(new BoxGeometry(0.1, roomHeight, roomDepth), wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = roomWidth / 2;
    room.add(floor, backWall, leftWall, rightWall);
    scene.add(room);

    // --- Exhibits: pedestal + floating emoji sprite, arranged in an arc ---
    const pedestalMat = new MeshPhongMaterial({ color: "#e8c66b", shininess: 20 });
    const list = exhibitsRef.current;
    const markerGroup = new Group();
    const markerEntries = [];
    const n = Math.max(list.length, 1);
    const spread = Math.min(roomWidth - 1, n * 1.1);
    list.forEach((exhibit, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = (t - 0.5) * spread;
      const z = -roomDepth / 2 + 1.1 + Math.abs(t - 0.5) * 0.6;

      const pedestal = new Mesh(new CylinderGeometry(0.28, 0.32, 0.7, 16), pedestalMat);
      pedestal.position.set(x, 0.35, z);
      room.add(pedestal);

      const explored = exploredIds.includes(exhibit.explKey);
      const { sprite, material, texture } = makeEmojiSprite(exhibit.emoji, explored);
      sprite.position.set(x, 1.15, z);
      sprite.userData.exhibitId = exhibit.id;
      markerGroup.add(sprite);
      markerEntries.push({ exhibit, sprite, material, texture });
    });
    scene.add(markerGroup);
    markersRef.current = markerEntries;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, -0.5);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controls.minDistance = 2;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI / 2.05;
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
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.hypot(dx, dy) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerGroup.children, false);
      if (hits.length > 0) {
        const exhibitId = hits[0].object.userData.exhibitId;
        const exhibit = exhibitsRef.current.find((e) => e.id === exhibitId);
        if (exhibit) onSelectRef.current(exhibit);
      }
    }

    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    let frameId;
    function animate() {
      controls.update();
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

  useEffect(() => {
    markersRef.current.forEach(({ exhibit, material, texture }) => {
      const canvas = texture.image;
      const ctx = canvas.getContext("2d");
      const size = canvas.width;
      ctx.clearRect(0, 0, size, size);
      const explored = exploredIds.includes(exhibit.explKey);
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
      ctx.fillText(exhibit.emoji, size / 2, size / 2 + 4);
      texture.needsUpdate = true;
      void material;
    });
  }, [exploredIds]);

  return <div ref={containerRef} className="globe-3d-container museum-3d-container" />;
}
