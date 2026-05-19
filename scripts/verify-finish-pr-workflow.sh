#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WORKFLOW="skills/finish-pr/workflows/ready-for-merge.md"
TRIAGE="skills/finish-pr/workflows/triage.md"
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
assert_file "$TRIAGE"

if [ -f "$WORKFLOW" ]; then
  assert_match "Final unresolved review-thread gate" "$WORKFLOW"
  assert_match "mergeStateStatus" "$WORKFLOW"
  assert_match "baseRefName" "$WORKFLOW"
  assert_match "git fetch origin <base-branch>" "$WORKFLOW"
  assert_match "git merge --no-commit --no-ff origin/<base-branch>" "$WORKFLOW"
  assert_match "Do not use browser automation" "$WORKFLOW"
  assert_match "Do not rebase or force-push" "$WORKFLOW"
  assert_match "Do not merge the pull request itself" "$WORKFLOW"
  assert_match "restart the readiness loop on the new head" "$WORKFLOW"
  assert_match "product" "$WORKFLOW"
  assert_match "judgment, secrets, permissions, destructive git operations, unrelated scope" "$WORKFLOW"
  assert_order "mergeability gate" "gh pr checks --watch" "$WORKFLOW"
  assert_order "gh pr checks --watch" "Final unresolved review-thread gate" "$WORKFLOW"
  assert_order "Final unresolved review-thread gate" "gh pr ready" "$WORKFLOW"
  assert_match "resolveReviewThread" "$WORKFLOW"
  assert_match "isResolved" "$WORKFLOW"
  assert_match "(?i)(?:unresolved.*blocker|blocker.*unresolved)" "$WORKFLOW"
  assert_match "top-level" "$WORKFLOW"
  assert_match "per-finding disposition" "$WORKFLOW"
  assert_match "unaddressed findings" "$WORKFLOW"
fi

if [ -f "$TRIAGE" ]; then
  assert_match "merge conflicts" "$TRIAGE"
  assert_match "Merge Conflict Rules" "$TRIAGE"
  assert_match "headRefOid" "$TRIAGE"
  assert_match "baseRefName" "$TRIAGE"
  assert_match "mergeStateStatus" "$TRIAGE"
  assert_match 'Classify branch-local, in-scope, verifiable conflicts as `fix-now`' "$TRIAGE"
  assert_match 'Classify conflicts as `needs-human`' "$TRIAGE"
  assert_match "Do not rebase, force-push, use browser conflict resolution, or merge the pull" "$TRIAGE"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT finish-pr workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: finish-pr workflow assertions passed"
