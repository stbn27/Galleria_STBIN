#!/bin/bash
set -e

echo "🎨 Preparando entorno para Curator Gallery (STBIN)..."

echo "1. Instalación de dependencias del sistema (ejecutar manualmente):"
echo "   sudo apt update && sudo apt upgrade -y"
echo "   sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev ffmpeg libheif-dev pkg-config python3-pip python3-venv"

echo "2. Instalación de Rust (ejecutar manualmente si no está instalado):"
echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"

echo "3. Instalación de Node.js y pnpm (ejecutar manualmente):"
echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
echo "   nvm install 20 && nvm use 20"
echo "   npm install -g pnpm"

echo "4. Configurando sidecar Python..."
mkdir -p sidecar
cd sidecar
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install deepface==0.0.93 insightface Pillow numpy scikit-learn piexif pyinstaller
cd ..

echo "5. Instalando dependencias de Node..."
if command -v pnpm &> /dev/null; then
  pnpm install
else
  echo "⚠️ pnpm no encontrado. Instálalo primero para continuar con las dependencias del frontend."
fi

echo "✅ Estructura base completada. Sigue las instrucciones de arriba para las dependencias de sistema."
