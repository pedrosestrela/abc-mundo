"""ABC Mundo backend.

Minimal FastAPI + sqlite3 (stdlib) backend. Serves the built frontend as
static files (if present) and exposes a tiny best-effort progress-ping API.
No authentication, no ORM, kept intentionally small.
"""
import os
import sqlite3
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI
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


# Serve built frontend (if present) at "/". Must not crash if missing,
# since this file may be imported/run before the frontend is built.
if os.path.isdir("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
