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


def test_sync_upload_returns_code_and_download_returns_data():
    payload = {"data": {"profiles": [{"name": "Ana"}], "progress": {"Ana": {"xp": 10}}}}
    upload_resp = client.post("/api/sync/upload", json=payload)
    assert upload_resp.status_code == 200
    body = upload_resp.json()
    code = body["code"]
    assert len(code) == 6
    assert "expires_at" in body

    download_resp = client.get(f"/api/sync/download/{code}")
    assert download_resp.status_code == 200
    assert download_resp.json()["data"] == payload["data"]


def test_sync_download_missing_code_returns_404():
    resp = client.get("/api/sync/download/ZZZZZZ")
    assert resp.status_code == 404


def test_sync_download_code_deleted_after_retrieval():
    upload_resp = client.post("/api/sync/upload", json={"data": {"foo": "bar"}})
    code = upload_resp.json()["code"]

    first = client.get(f"/api/sync/download/{code}")
    assert first.status_code == 200

    second = client.get(f"/api/sync/download/{code}")
    assert second.status_code == 404


def test_sync_download_expired_code_returns_404():
    upload_resp = client.post("/api/sync/upload", json={"data": {"foo": "bar"}})
    code = upload_resp.json()["code"]

    # Manually force expiry directly in the DB.
    import sqlite3
    from datetime import datetime, timedelta, timezone

    conn = sqlite3.connect(main.DB_PATH)
    past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    conn.execute("UPDATE sync_blobs SET expires_at = ? WHERE code = ?", (past, code))
    conn.commit()
    conn.close()

    resp = client.get(f"/api/sync/download/{code}")
    assert resp.status_code == 404


def test_sync_upload_rejects_oversized_payload():
    huge = {"data": {"blob": "x" * (main.SYNC_MAX_BLOB_BYTES + 1)}}
    resp = client.post("/api/sync/upload", json=huge)
    assert resp.status_code == 413


def test_sync_upload_accepts_payload_at_limit():
    # Leave room for the JSON wrapper (`{"blob": "..."}`) so the serialized
    # size stays at/under the limit.
    filler = "x" * (main.SYNC_MAX_BLOB_BYTES - 200)
    resp = client.post("/api/sync/upload", json={"data": {"blob": filler}})
    assert resp.status_code == 200


def test_is_rate_limited_pure_function():
    hits: dict = {}
    limit = 3
    window = 60.0
    # First `limit` calls within the window are allowed.
    for i in range(limit):
        assert main.is_rate_limited(hits, "1.2.3.4", 1000.0 + i, limit, window) is False
    # The next call within the same window is blocked.
    assert main.is_rate_limited(hits, "1.2.3.4", 1000.0 + limit, limit, window) is True
    # A different key has its own independent budget.
    assert main.is_rate_limited(hits, "5.6.7.8", 1000.0, limit, window) is False
    # Once the window has fully elapsed, the original key is allowed again.
    assert main.is_rate_limited(hits, "1.2.3.4", 1000.0 + window + 1, limit, window) is False


def test_sync_download_rate_limited_after_threshold():
    main._sync_download_hits.clear()
    upload_resp = client.post("/api/sync/upload", json={"data": {"foo": "bar"}})
    code = upload_resp.json()["code"]

    last_status = None
    for _ in range(main.SYNC_DOWNLOAD_RATE_LIMIT + 1):
        last_status = client.get(f"/api/sync/download/{code}").status_code
    assert last_status == 429
    main._sync_download_hits.clear()


def test_resolve_static_path_rejects_traversal():
    assert main.resolve_static_path("static", "../../../../etc/passwd") is None
    assert main.resolve_static_path("static", "..%2f..%2fetc/passwd") is not None  # not decoded here; literal chars stay inside static/
    assert main.resolve_static_path("static", "../secret.env") is None


def test_resolve_static_path_allows_normal_files():
    resolved = main.resolve_static_path("static", "assets/index.js")
    assert resolved is not None
    assert resolved.endswith(os.path.join("static", "assets", "index.js"))
