#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"

cd "$API_DIR"

if [[ ! -d ".venv" ]]; then
  python3 -m venv .venv
fi

source .venv/bin/activate

pip install -e .[dev]
python -m app.seed

export HARDWARE_MODE="${HARDWARE_MODE:-raspberrypi}"
export GPIO_NUMBERING_MODE="${GPIO_NUMBERING_MODE:-BCM}"

echo "Starting Tipsy API in $HARDWARE_MODE mode"
uvicorn app.main:app --host 0.0.0.0 --port 8000
