#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WORKFLOW="skills/finish-pr/workflows/ready-for-merge.md"
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_file() {
  local file="$1"
  test -f "$file" || fail "missing expected file: $file"
}

assert_match() {
  local pattern="$1"
  local file="$2"
  if ! rg -n --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
    fail "missing expected pattern in $file: $pattern"
  fi
}

assert_order() {
  local first_pattern="$1"
  local second_pattern="$2"
  local file="$3"
  local first_line second_line
  # These workflow command assertions intentionally use the first occurrence.
  # If examples add duplicate commands earlier, use a unique anchor pattern.
  first_line="$(rg -n --pcre2 -e "$first_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  second_line="$(rg -n --pcre2 -e "$second_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  if [ -z "$first_line" ] || [ -z "$second_line" ] || [ "$first_line" -ge "$second_line" ]; then
    fail "expected pattern '$first_pattern' before '$second_pattern' in $file"
  fi
}

assert_file "$WORKFLOW"

if [ -f "$WORKFLOW" ]; then
  assert_match "Final unresolved review-thread gate" "$WORKFLOW"
  assert_order "gh pr checks --watch" "Final unresolved review-thread gate" "$WORKFLOW"
  assert_order "Final unresolved review-thread gate" "gh pr ready" "$WORKFLOW"
  assert_match "resolveReviewThread" "$WORKFLOW"
  assert_match "isResolved" "$WORKFLOW"
  assert_match "(?i)(?:unresolved.*blocker|blocker.*unresolved)" "$WORKFLOW"
  assert_match "top-level" "$WORKFLOW"
  assert_match "per-finding disposition" "$WORKFLOW"
  assert_match "unaddressed findings" "$WORKFLOW"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT finish-pr workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: finish-pr workflow assertions passed"
