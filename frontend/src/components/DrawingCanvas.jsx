import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// A simple in-browser freehand drawing canvas for the "Atelier da
// Imaginação" art module. By default there's no save/export: it's for
// in-the-moment creative play, not persisted artwork (there's no backend
// image storage). Callers that DO want to keep the drawing (e.g. the Nature
// Diary / Moon Diary observation logs) can pass an `onSave` callback and an
// optional `saveLabel` — this renders an extra button that exports the
// canvas as a local data URL (never uploaded anywhere) via toDataURL().

const COLORS = ["#2d2d2d", "#e63946", "#f4a300", "#ffd93d", "#4caf50", "#3d87ff", "#8b5cf6", "#ff6fae"];
const SIZES = { small: 3, medium: 8, large: 16 };

export default function DrawingCanvas({ onSave, saveLabel }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState("medium");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDrawing(e) {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function draw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = SIZES[size];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function stopDrawing() {
    drawingRef.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas || !onSave) return;
    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="drawing-canvas-wrap">
      <div className="drawing-toolbar">
        <div className="drawing-palette">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={"drawing-swatch" + (c === color ? " active" : "")}
              style={{ background: c }}
              aria-label={c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="drawing-sizes">
          {Object.keys(SIZES).map((s) => (
            <button
              key={s}
              type="button"
              className={"drawing-size-btn" + (s === size ? " active" : "")}
              onClick={() => setSize(s)}
            >
              <span className="drawing-size-dot" style={{ width: SIZES[s], height: SIZES[s] }} />
            </button>
          ))}
        </div>
        <button type="button" className="drawing-clear-btn" onClick={handleClear}>
          🧹 {t("modules.artClear")}
        </button>
        {onSave && (
          <button type="button" className="drawing-clear-btn" onClick={handleSave}>
            💾 {saveLabel || t("modules.artClear")}
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}
