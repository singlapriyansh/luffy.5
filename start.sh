#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun is not installed. Install it with: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies with bun..."
  bun install
fi

PORT="${PORT:-3000}"
URL="http://localhost:${PORT}"

# Open in default macOS browser shortly after server starts
(sleep 1 && open "$URL") >/dev/null 2>&1 &

echo "Starting LUFFY AI (React + Bun) at ${URL}..."
exec bun --hot server.js
