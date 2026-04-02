#!/bin/bash
set -e

echo "🚀 Iniciando Curator en modo desarrollo..."
cd "$(dirname "$0")/.."

# Iniciar sidecar solo si el entorno virtual y el archivo main.py existen y contienen código
if [ -d "sidecar/.venv" ] && [ -f "sidecar/main.py" ] && [ -s "sidecar/main.py" ]; then
  echo "🐍 Iniciando sidecar Python..."
  cd sidecar
  source .venv/bin/activate
  python3 main.py --dev &
  SIDECAR_PID=$!
  cd ..
  
  cleanup() {
    echo "🛑 Deteniendo procesos..."
    kill $SIDECAR_PID 2>/dev/null || true
  }
  trap cleanup EXIT
else
  echo "ℹ️ Sidecar omitido (no configurado o sin código)."
fi

echo "🖥️ Iniciando Tauri Dev..."
pnpm tauri dev
