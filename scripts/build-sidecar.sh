#!/bin/bash
set -e
cd "$(dirname "$0")/../sidecar"
if [ -d ".venv" ]; then
  source .venv/bin/activate
  pyinstaller --onefile --name curator-sidecar --distpath dist/ main.py
else
  echo "❌ Entorno virtual no encontrado en sidecar/.venv"
  exit 1
fi
