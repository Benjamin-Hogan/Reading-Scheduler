#!/usr/bin/env bash
# Smoke-test a running Reading Scheduler instance (default http://localhost:3000).
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  shift 2
  local actual
  actual="$("$@" 2>/dev/null || true)"
  if [[ "$actual" == "$expected" ]]; then
    echo "  OK  $name"
  else
    echo "  FAIL $name (expected $expected, got $actual)"
    FAIL=1
  fi
}

echo "Smoke test: $BASE_URL"
echo ""

check "GET /" "200" curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/"
check "GET /settings" "200" curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/settings"
check "GET /api/auth/session" "signedIn" bash -c "curl -s '$BASE_URL/api/auth/session' | python3 -c \"import sys,json; print('signedIn' if json.load(sys.stdin).get('signedIn') is False else 'bad')\""
check "GET /api/sync unauth" "401" curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/sync"

CONFIG_JSON="$(curl -s "$BASE_URL/api/auth/google/config")"
echo "  INFO oauth config: $(echo "$CONFIG_JSON" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("oauth=%s, books=%s" % (d["oauthConfigured"], d["booksApiConfigured"]))')"

FEED_RESP="$(curl -s -X POST "$BASE_URL/api/calendar/feed" \
  -H 'Content-Type: application/json' \
  -d '{
    "planId": "smoke-test-plan",
    "planName": "Smoke Test Plan",
    "preferredReadTime": "08:00",
    "timezone": "America/New_York",
    "assignments": [{
      "date": "2026-06-30",
      "bookId": "book-1",
      "startPage": 1,
      "endPage": 20,
      "pages": 20
    }],
    "books": [{ "id": "book-1", "title": "Test Book", "totalPages": 300 }]
  }')"

TOKEN="$(echo "$FEED_RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token",""))' 2>/dev/null || true)"
if [[ -n "$TOKEN" ]]; then
  echo "  OK  POST /api/calendar/feed (token created)"
  ICS_CODE="$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/calendar/feed/$TOKEN")"
  if [[ "$ICS_CODE" == "200" ]]; then
    echo "  OK  GET /api/calendar/feed/[token] (ICS)"
  else
    echo "  FAIL GET /api/calendar/feed/[token] (expected 200, got $ICS_CODE)"
    FAIL=1
  fi
  DEL_CODE="$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/calendar/feed/$TOKEN")"
  if [[ "$DEL_CODE" == "200" ]]; then
    echo "  OK  DELETE /api/calendar/feed/[token]"
  else
    echo "  FAIL DELETE /api/calendar/feed/[token] (expected 200, got $DEL_CODE)"
    FAIL=1
  fi
else
  echo "  FAIL POST /api/calendar/feed"
  echo "       $FEED_RESP"
  FAIL=1
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "All smoke checks passed."
  exit 0
else
  echo "Some checks failed."
  exit 1
fi
