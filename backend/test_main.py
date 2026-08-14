"""Tests for the ABC Mundo FastAPI backend.

DB_PATH is read once at import time in main.py (module-level global used by
sqlite3.connect calls throughout), so we point it at a fresh temp file
*before* importing main, keeping tests isolated from any real ./data/*.db.
"""
import os
import tempfile

import pytest

_tmp_dir = tempfile.mkdtemp()
os.environ["DB_PATH"] = os.path.join(_tmp_dir, "test_abcmundo.db")

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402

client = TestClient(main.app)


def test_health_returns_ok():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_progress_ping_accepts_valid_payload():
    resp = client.post(
        "/api/progress/ping",
        json={"profile_name": "Explorer", "module": "alphabet", "event": "letter_viewed"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] in ("logged", "ignored")


def test_progress_ping_accepts_empty_payload():
    resp = client.post("/api/progress/ping", json={})
    assert resp.status_code == 200


def test_progress_summary_returns_valid_json():
    resp = client.get("/api/progress/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert "summary" in body
    assert isinstance(body["summary"], list)


def test_progress_summary_reflects_logged_events():
    client.post(
        "/api/progress/ping",
        json={"profile_name": "Explorer", "module": "reading", "event": "word_read"},
    )
    resp = client.get("/api/progress/summary")
    assert resp.status_code == 200
    summary = resp.json()["summary"]
    assert any(row["module"] == "reading" and row["event"] == "word_read" for row in summary)


def test_resolve_static_path_rejects_traversal():
    assert main.resolve_static_path("static", "../../../../etc/passwd") is None
    assert main.resolve_static_path("static", "..%2f..%2fetc/passwd") is not None  # not decoded here; literal chars stay inside static/
    assert main.resolve_static_path("static", "../secret.env") is None


def test_resolve_static_path_allows_normal_files():
    resolved = main.resolve_static_path("static", "assets/index.js")
    assert resolved is not None
    assert resolved.endswith(os.path.join("static", "assets", "index.js"))
