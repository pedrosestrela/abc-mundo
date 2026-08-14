#!/bin/sh
set -e

mkdir -p "$(dirname "${DB_PATH:-/data/abcmundo.db}")"

cd /app/backend

if [ -n "$LITESTREAM_BUCKET" ]; then
  litestream restore -if-replica-exists "${DB_PATH:-/data/abcmundo.db}" || true
  exec litestream replicate -exec "uvicorn main:app --host 0.0.0.0 --port 8080"
else
  exec uvicorn main:app --host 0.0.0.0 --port 8080
fi
