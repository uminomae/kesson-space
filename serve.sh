#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_PORT=3001
PORT="${1:-$DEFAULT_PORT}"
HOST="${HOST:-127.0.0.1}"

if [[ "${PORT}" == "--help" || "${PORT}" == "-h" ]]; then
  cat <<'EOF'
Usage:
  ./serve.sh [PORT]

Examples:
  ./serve.sh
  ./serve.sh 3001
  HOST=0.0.0.0 ./serve.sh 3001
EOF
  exit 0
fi

if ! [[ "${PORT}" =~ ^[0-9]+$ ]]; then
  echo "[serve] invalid port: ${PORT}" >&2
  exit 1
fi

if command -v python3 >/dev/null 2>&1; then
  PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
  PY_CMD="python"
else
  echo "[serve] python3/python is required but not found." >&2
  exit 1
fi

cd "${ROOT_DIR}"
echo "[serve] cd ${ROOT_DIR}"
echo "[serve] http://${HOST}:${PORT}/"
exec "${PY_CMD}" -m http.server "${PORT}" --bind "${HOST}"
