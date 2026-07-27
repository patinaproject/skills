#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

assert_accepts() {
  local message="$1"
  if ! printf '%s\n' "$message" | pnpm exec commitlint >/dev/null 2>&1; then
    echo "FAIL: expected commitlint to accept: $message" >&2
    exit 1
  fi
}

assert_rejects() {
  local message="$1"
  if printf '%s\n' "$message" | pnpm exec commitlint >/dev/null 2>&1; then
    echo "FAIL: expected commitlint to reject: $message" >&2
    exit 1
  fi
}

assert_accepts "feat: #12 add a thing"
assert_rejects "feat: PAT-12 add a thing"
assert_rejects "feat: add a thing"
assert_rejects "feat(repo): #12 add a thing"
assert_rejects "feat: #12 add a thing whose description intentionally exceeds the seventy-two character subject limit"

echo "OK: GitHub issue reference contract passed"
