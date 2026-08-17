"""ABC Mundo backend.

Minimal FastAPI + sqlite3 (stdlib) backend. Serves the built frontend as
static files (if present) and exposes a tiny best-effort progress-ping API.
No authentication, no ORM, kept intentionally small.
"""
import json
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DB_PATH = os.environ.get("DB_PATH", "./data/abcmundo.db")


def get_db_dir() -> str:
    return os.path.dirname(os.path.abspath(DB_PATH)) or "."


def init_db() -> None:
    db_dir = get_db_dir()
    if db_dir and not os.path.isdir(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS progress_events (
                id INTEGER PRIMARY KEY,
                profile_name TEXT,
                module TEXT,
                event TEXT,
                created_at TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sync_blobs (
                code TEXT PRIMARY KEY,
                data TEXT,
                created_at TEXT,
                expires_at TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


init_db()

app = FastAPI(title="ABC Mundo API")


class ProgressPing(BaseModel):
    profile_name: Optional[str] = None
    module: Optional[str] = None
    event: Optional[str] = None


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/progress/ping")
def progress_ping(payload: ProgressPing):
    try:
        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                "INSERT INTO progress_events (profile_name, module, event, created_at) "
                "VALUES (?, ?, ?, ?)",
                (
                    payload.profile_name,
                    payload.module,
                    payload.event,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            conn.commit()
        finally:
            conn.close()
        return {"status": "logged"}
    except Exception:
        # Best-effort only; never let progress logging break the client.
        return {"status": "ignored"}


@app.get("/api/progress/summary")
def progress_summary():
    try:
        conn = sqlite3.connect(DB_PATH)
        try:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT module, event, COUNT(*) as count FROM progress_events "
                "GROUP BY module, event ORDER BY count DESC"
            ).fetchall()
            return {"summary": [dict(r) for r in rows]}
        finally:
            conn.close()
    except Exception:
        return {"summary": []}


SYNC_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"  # no 0/O/1/I to avoid confusion
SYNC_CODE_LENGTH = 6
SYNC_EXPIRY_HOURS = 48


def generate_sync_code() -> str:
    return "".join(secrets.choice(SYNC_CODE_ALPHABET) for _ in range(SYNC_CODE_LENGTH))


class SyncUpload(BaseModel):
    data: Any


@app.post("/api/sync/upload")
def sync_upload(payload: SyncUpload):
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=SYNC_EXPIRY_HOURS)
    conn = sqlite3.connect(DB_PATH)
    try:
        # Opportunistic cleanup of expired rows on every upload, avoiding the
        # need for any separate scheduled-job infrastructure.
        conn.execute("DELETE FROM sync_blobs WHERE expires_at < ?", (now.isoformat(),))

        code = generate_sync_code()
        # Extremely unlikely, but guard against a code collision.
        for _ in range(5):
            existing = conn.execute("SELECT 1 FROM sync_blobs WHERE code = ?", (code,)).fetchone()
            if not existing:
                break
            code = generate_sync_code()

        conn.execute(
            "INSERT INTO sync_blobs (code, data, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (code, json.dumps(payload.data), now.isoformat(), expires_at.isoformat()),
        )
        conn.commit()
        return {"code": code, "expires_at": expires_at.isoformat()}
    finally:
        conn.close()


@app.get("/api/sync/download/{code}")
def sync_download(code: str):
    now = datetime.now(timezone.utc)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT code, data, expires_at FROM sync_blobs WHERE code = ?", (code.upper(),)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Code not found")

        expires_at = row["expires_at"]
        if expires_at < now.isoformat():
            conn.execute("DELETE FROM sync_blobs WHERE code = ?", (row["code"],))
            conn.commit()
            raise HTTPException(status_code=404, detail="Code expired")

        data = json.loads(row["data"])
        # One-time-use: delete once successfully retrieved.
        conn.execute("DELETE FROM sync_blobs WHERE code = ?", (row["code"],))
        conn.commit()
        return {"data": data}
    finally:
        conn.close()


# Serve built frontend (if present) at "/". Must not crash if missing,
# since this file may be imported/run before the frontend is built.
# A catch-all (rather than StaticFiles(html=True) mounted at "/") is needed
# so that deep links into React Router routes (e.g. /phonics, /piano) return
# index.html instead of a 404 — StaticFiles only auto-serves index.html for
# "/", not for unknown sub-paths.
STATIC_DIR = "static"


def resolve_static_path(static_dir, requested_path):
    """Resolve a client-requested path against static_dir, rejecting any
    result that escapes it (e.g. via "../" traversal) so the SPA fallback
    route can never be used to read arbitrary files off the container."""
    static_root = os.path.abspath(static_dir)
    candidate = os.path.abspath(os.path.join(static_root, requested_path))
    is_contained = candidate == static_root or candidate.startswith(static_root + os.sep)
    return candidate if is_contained else None


if os.path.isdir(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        candidate = resolve_static_path(STATIC_DIR, full_path) if full_path else None
        if candidate and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
