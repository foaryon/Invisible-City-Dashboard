#!/usr/bin/env bash
# The Invisible City — one-click launcher (Linux / macOS).
# Ensures dependencies + a built UI, then starts the server and opens the browser.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "The Invisible City needs Node.js 22+  —  install it from https://nodejs.org"
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js 22 or newer is required (found $(node -v))."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run only)…"
  npm ci || npm install
fi
if [ ! -f apps/web/dist/index.html ]; then
  echo "Building the app (first run only)…"
  npm run build --workspace apps/web
fi

export OPEN_BROWSER=1
export PORT="${PORT:-3001}"
# Bind all interfaces so a phone on the same Wi-Fi can open the dashboard too.
export HOST="${HOST:-0.0.0.0}"
echo ""
echo "  Starting The Invisible City …  (press Ctrl+C to stop)"
echo "  The exact address for your phone is printed below."
echo ""
exec npm run start --workspace apps/api
