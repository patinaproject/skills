#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="skills/new-branch/SKILL.md"
WORKFLOW="skills/new-branch/workflows/issue-branch.md"
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
  if ! rg -n -U --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
    fail "missing expected pattern in $file: $pattern"
  fi
}

assert_order() {
  local first_pattern="$1"
  local second_pattern="$2"
  local file="$3"
  local first_line second_line
  first_line="$(rg -n --pcre2 -e "$first_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  second_line="$(rg -n --pcre2 -e "$second_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  if [ -z "$first_line" ] || [ -z "$second_line" ] || [ "$first_line" -ge "$second_line" ]; then
    fail "expected pattern '$first_pattern' before '$second_pattern' in $file"
  fi
}

assert_file "$SKILL"
assert_file "$WORKFLOW"

if [ -f "$SKILL" ]; then
  assert_match '^name:[[:space:]]*new-branch$' "$SKILL"
  assert_match 'open native GitHub `blockedBy`' "$SKILL"
  assert_match 'explicitly asks to start blocked work anyway' "$SKILL"
fi

if [ -f "$WORKFLOW" ]; then
  assert_match 'issue_json=' "$WORKFLOW"
  assert_match 'issue_number=' "$WORKFLOW"
  assert_match 'issue_title=' "$WORKFLOW"
  assert_match 'issue_state=' "$WORKFLOW"
  assert_match 'gh repo view --json nameWithOwner' "$WORKFLOW"
  assert_match 'blockedBy\(first:100' "$WORKFLOW"
  assert_match 'pageInfo[[:space:]]*\{[[:space:]]*hasNextPage[[:space:]]+endCursor[[:space:]]*\}' "$WORKFLOW"
  assert_match 'while :; do' "$WORKFLOW"
  assert_match 'after:' "$WORKFLOW"
  assert_match 'after=null' "$WORKFLOW"
  assert_match '-f after=' "$WORKFLOW"
  assert_match 'if ! page=' "$WORKFLOW"
  assert_match "\\.errors" "$WORKFLOW"
  assert_match 'dependency query fails' "$WORKFLOW"
  assert_match 'refuse unless the user gives an explicit[[:space:]]+current-turn override' "$WORKFLOW"
  assert_match 'open_blockers_found=0' "$WORKFLOW"
  assert_match 'Open native blockedBy dependencies exist; refuse unless explicit override' "$WORKFLOW"
  assert_match 'state:[[:space:]]*OPEN' "$WORKFLOW"
  assert_match 'number, title, state, and URL' "$WORKFLOW"
  assert_match 'Closed blockers do not halt' "$WORKFLOW"
  assert_match 'Body-prose fallback relationships.*do not halt' "$WORKFLOW"
  assert_match 'Issues this target is blocking.*do not halt' "$WORKFLOW"
  assert_match 'Parent or sub-issue relationships.*do not halt' "$WORKFLOW"
  assert_match 'explicit current-turn override' "$WORKFLOW"
  assert_match 'Open native `blockedBy` dependencies exist' "$WORKFLOW"
  assert_match 'The native `blockedBy` dependency query fails' "$WORKFLOW"

  assert_order 'Resolve the issue' 'Check native dependency blockers' "$WORKFLOW"
  assert_order 'Check native dependency blockers' 'Inspect local branch state' "$WORKFLOW"
  assert_order 'Check native dependency blockers' 'Create or update the local branch' "$WORKFLOW"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT new-branch workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: new-branch workflow assertions passed"
