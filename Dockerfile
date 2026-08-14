# Multi-stage build: Node build stage + Python slim runtime stage.

FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
WORKDIR /app

# Litestream binary for sqlite replication to S3-compatible storage.
ADD https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz && rm /tmp/litestream.tar.gz

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./backend/static

COPY litestream.yml /etc/litestream.yml
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV DB_PATH=/data/abcmundo.db
EXPOSE 8080

CMD ["./start.sh"]
