#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
ADMIN_DIR="$ROOT_DIR/apps/admin-ui"
TOUCHSCREEN_DIR="$ROOT_DIR/apps/touchscreen-ui"

cleanup() {
  for pid in $(jobs -p); do
    kill "$pid" >/dev/null 2>&1 || true
  done
}

trap cleanup EXIT INT TERM

cd "$API_DIR"
if [[ ! -d ".venv" ]]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -e .[dev]
python -m app.seed
(
  cd "$API_DIR"
  export HARDWARE_MODE="${HARDWARE_MODE:-mock}"
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) &

(
  cd "$ADMIN_DIR"
  npm install
  npm run dev -- --host 0.0.0.0 --port 5173
) &

(
  cd "$TOUCHSCREEN_DIR"
  npm install
  npm run dev -- --host 0.0.0.0 --port 5174
) &

echo "API:          http://127.0.0.1:8000"
echo "Admin UI:     http://127.0.0.1:5173"
echo "Touchscreen:  http://127.0.0.1:5174"

wait
