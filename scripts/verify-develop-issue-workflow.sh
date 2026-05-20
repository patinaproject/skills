#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="skills/develop-issue/SKILL.md"
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

assert_no_match() {
  local pattern="$1"
  local file="$2"
  if rg -n --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
    fail "unexpected pattern in $file: $pattern"
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

if [ -f "$SKILL" ]; then
  assert_match '^name:[[:space:]]*develop-issue$' "$SKILL"
  assert_match '/develop-issue #123' "$SKILL"

  for child in new-branch tdd diagnose review-action finish-pr; do
    assert_match "\`$child\`" "$SKILL"
  done

  assert_match 'Reject missing issue references' "$SKILL"
  assert_match 'Reject multiple issue references' "$SKILL"
  assert_match 'Reject cross-repository issue URLs' "$SKILL"
  assert_match 'same-repository GitHub issue' "$SKILL"
  assert_match 'halt before implementation' "$SKILL"
  assert_match 'Read `AGENTS\.md` and `CLAUDE\.md` if present' "$SKILL"
  assert_match 'Delegate branch setup to `new-branch`' "$SKILL"
  assert_match 'Implement one behavior at a time through `tdd`' "$SKILL"
  assert_match 'Route to `diagnose` when root cause is unclear' "$SKILL"
  assert_match 'Run `review-action` as the local review gate' "$SKILL"
  assert_match 'Delegate final publishing and PR readiness to `finish-pr`' "$SKILL"
  assert_match 'Never merge the pull request' "$SKILL"

  assert_order 'Delegate branch setup to `new-branch`' 'Implement one behavior at a time through `tdd`' "$SKILL"
  assert_order 'Run `review-action` as the local review gate' 'Delegate final publishing and PR readiness to `finish-pr`' "$SKILL"

  for outcome in ready-for-agent ready-for-human wontfix; do
    assert_match "\`$outcome\`" "$SKILL"
  done
  assert_match 'There is no `needs-info` state' "$SKILL"
  assert_no_match 'receiving-code-review' "$SKILL"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT develop-issue workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: develop-issue workflow assertions passed"
