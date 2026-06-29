#!/usr/bin/env bash
# Prepare .env for Docker Compose from .env.local (Google creds) + generated secrets.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — copy from .env.local.example and add your Google credentials."
  cp -n .env.local.example .env.local 2>/dev/null || true
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

# Ensure PORT is set for compose host mapping
if ! grep -qE '^PORT=.+' .env; then
  if grep -q '^PORT=' .env; then
    sed -i 's/^PORT=.*/PORT=3000/' .env
  else
    echo "PORT=3000" >> .env
  fi
fi

# Generate SESSION_SECRET if missing or empty
current_secret="$(grep -E '^SESSION_SECRET=' .env 2>/dev/null | cut -d= -f2- || true)"
if [[ -z "${current_secret}" ]]; then
  secret="$(openssl rand -base64 32)"
  if grep -q '^SESSION_SECRET=' .env; then
    sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=${secret}|" .env
  else
    echo "SESSION_SECRET=${secret}" >> .env
  fi
  echo "Generated SESSION_SECRET in .env"
fi

echo ""
echo "Docker env ready. Compose loads: .env (PORT, SESSION_SECRET) then .env.local (Google API)."
echo ""
python3 - <<'PY'
import re
from pathlib import Path

def parse(path):
    d = {}
    if not Path(path).exists():
        return d
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        d[k.strip()] = v.strip().strip('"').strip("'")
    return d

merged = {**parse(".env"), **parse(".env.local")}
checks = [
    ("SESSION_SECRET", True),
    ("GOOGLE_BOOKS_API_KEY", False),
    ("GOOGLE_CLIENT_ID", False),
    ("GOOGLE_CLIENT_SECRET", False),
]
for key, required in checks:
    val = merged.get(key, "")
    if val:
        print(f"  {key}: set")
    elif required:
        print(f"  {key}: MISSING (required)")
    else:
        print(f"  {key}: not set (optional — book search / calendar export disabled)")
PY

echo ""
echo "Next:"
echo "  docker compose up -d --build"
echo "  # or pull from GHCR:"
echo "  docker compose -f docker-compose.ghcr.yml up -d"
