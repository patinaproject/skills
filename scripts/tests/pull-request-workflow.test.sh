#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WORKFLOW=".github/workflows/pull-request.yml"
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

assert_no_match() {
  local pattern="$1"
  local file="$2"
  if rg -n --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
    fail "unexpected pattern in $file: $pattern"
  fi
}

assert_file "$WORKFLOW"

if [ -f "$WORKFLOW" ]; then
  assert_match "name: Pull Request" "$WORKFLOW"
  assert_match "pull_request:" "$WORKFLOW"
  assert_match "runs-on: blacksmith-2vcpu-ubuntu-2404" "$WORKFLOW"
  assert_match "Validate conventional commits" "$WORKFLOW"
  assert_match "subjectPattern:.*PAT-" "$WORKFLOW"
  assert_match 'Fixes PAT-N' "$WORKFLOW"
  assert_match 'bare #N legacy issue reference' "$WORKFLOW"
  assert_match 'Compare title `!` with breaking-change markers' "$WORKFLOW"
  assert_match "GH_TOKEN: .*github.token" "$WORKFLOW"
  assert_match "PR_NUMBER: .*github.event.pull_request.number" "$WORKFLOW"
  assert_match 'pulls/\$PR_NUMBER/commits' "$WORKFLOW"
  assert_match "commit_has_footer=false" "$WORKFLOW"
  assert_match "commit_has_footer=true" "$WORKFLOW"
  assert_match "breaking_has_footer=false" "$WORKFLOW"
  assert_match 'if \[ "\$body_has_footer" = true \] \|\| \[ "\$commit_has_footer" = true \]' "$WORKFLOW"
  assert_match 'PR commit messages include.*BREAKING CHANGE.*footer' "$WORKFLOW"
  assert_match 'Add.*to the type' "$WORKFLOW"
  assert_no_match 'Compare title `!` with body BREAKING CHANGE footer' "$WORKFLOW"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT pull request workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: pull request workflow assertions passed"
