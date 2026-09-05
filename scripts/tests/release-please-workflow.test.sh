#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WORKFLOW=".github/workflows/release-please.yml"
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_match() {
  local pattern="$1"
  if ! rg -n --pcre2 -e "$pattern" "$WORKFLOW" >/dev/null 2>&1; then
    fail "missing expected workflow contract: $pattern"
  fi
}

assert_no_match() {
  local pattern="$1"
  if rg -n --pcre2 -e "$pattern" "$WORKFLOW" >/dev/null 2>&1; then
    fail "unexpected workflow contract: $pattern"
  fi
}

if [ ! -f "$WORKFLOW" ]; then
  echo "FAIL: missing expected file: $WORKFLOW" >&2
  exit 1
fi

assert_match 'actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1'
assert_match 'id: app-token'
assert_match 'app-id:.*secrets\.RELEASE_PLEASE_APP_ID'
assert_match 'private-key:.*secrets\.RELEASE_PLEASE_PRIVATE_KEY'
assert_match 'token:.*steps\.app-token\.outputs\.token'
assert_no_match 'RELEASE_PLEASE_TOKEN'
assert_no_match 'gh pr merge.*\|\| true'

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT release-please workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: release-please workflow assertions passed"
