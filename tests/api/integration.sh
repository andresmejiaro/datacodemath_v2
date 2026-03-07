#!/usr/bin/env bash
# API Integration Tests
# DO NOT MODIFY — managed by Claude Code (architecture).
# Run against dev server: bash tests/api/integration.sh
# Run against deployed:   BASE_URL=https://your-site.vercel.app bash tests/api/integration.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4321}"
SECRET="${BLOG_API_SECRET:-test-secret}"
PASS=0
FAIL=0

green() { printf '\033[32m%s\033[0m\n' "$1"; }
red()   { printf '\033[31m%s\033[0m\n' "$1"; }

assert_status() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" -eq "$expected" ]; then
    green "  PASS: $label (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $label — expected HTTP $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_body_contains() {
  local label="$1" needle="$2" body="$3"
  if echo "$body" | grep -q "$needle"; then
    green "  PASS: $label"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $label — expected body to contain: $needle"
    red "        got: $body"
    FAIL=$((FAIL + 1))
  fi
}

assert_body_not_contains() {
  local label="$1" needle="$2" body="$3"
  if echo "$body" | grep -q "$needle"; then
    red "  FAIL: $label — body must NOT contain: $needle"
    FAIL=$((FAIL + 1))
  else
    green "  PASS: $label"
    PASS=$((PASS + 1))
  fi
}

echo ""
echo "=== POST /api/publish — Security ==="

# Must reject missing auth header
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -d '{"type":"blog_post","title":"T","slug":"t","content_markdown":"x"}')
assert_status "Reject missing Authorization header" 401 "$STATUS"

# Must reject wrong token
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong-token" \
  -d '{"type":"blog_post","title":"T","slug":"t","content_markdown":"x"}')
assert_status "Reject wrong Bearer token" 401 "$STATUS"

# Must reject malformed auth scheme
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $SECRET" \
  -d '{"type":"blog_post","title":"T","slug":"t","content_markdown":"x"}')
assert_status "Reject non-Bearer auth scheme" 401 "$STATUS"

echo ""
echo "=== POST /api/publish — Validation ==="

# Must reject invalid type
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"type":"invalid","content_markdown":"x"}')
assert_status "Reject invalid type field" 400 "$STATUS"

# Must reject blog_post without title+slug
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"type":"blog_post","content_markdown":"some content"}')
assert_status "Reject blog_post missing title and slug" 400 "$STATUS"

# Must reject missing content_markdown
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"type":"activity"}')
assert_status "Reject missing content_markdown" 400 "$STATUS"

# Must reject invalid date
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"type":"activity","content_markdown":"x","published_at":"not-a-date"}')
assert_status "Reject invalid published_at" 400 "$STATUS"

# Must reject non-JSON body
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/publish" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d 'not json at all')
assert_status "Reject non-JSON body" 400 "$STATUS"

echo ""
echo "=== GET /api/posts.json ==="

BODY=$(curl -s "$BASE_URL/api/posts.json")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/posts.json")
assert_status "Returns 200 without auth" 200 "$STATUS"
assert_body_contains "Response contains 'posts' key" '"posts"' "$BODY"
assert_body_contains "Response is JSON array" '\[' "$BODY"

# Must not expose internal fields
assert_body_not_contains "Does not expose content_markdown in list" 'content_markdown' "$BODY"
assert_body_not_contains "Does not expose platformVariants in list" 'platformVariants' "$BODY"

echo ""
echo "=== GET /api/posts.json — Response shape ==="

# Each post entry should have required fields
assert_body_contains "Post entries have slug" '"slug"' "$BODY"
assert_body_contains "Post entries have type" '"type"' "$BODY"
assert_body_contains "Post entries have publishedAt" '"publishedAt"' "$BODY"

echo ""
echo "=== Summary ==="
green "  Passed: $PASS"
if [ "$FAIL" -gt 0 ]; then
  red "  Failed: $FAIL"
  exit 1
else
  green "  All tests passed."
fi
