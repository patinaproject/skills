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

closing_check_script() {
  awk '
    /^      - name: Check for closing keyword in PR body$/ { step = 1; next }
    step && /^        run: \|$/ { run = 1; next }
    run && /^      - name:/ { exit }
    run { sub(/^          /, ""); print }
  ' "$WORKFLOW"
}

run_closing_check() {
  local body="$1"
  closing_check_script | env \
    PR_BODY="$body" \
    GITHUB_REPOSITORY="patinaproject/skills" \
    bash >/dev/null 2>&1
}

assert_file "$WORKFLOW"

if [ -f "$WORKFLOW" ]; then
  assert_match "name: Pull Request" "$WORKFLOW"
  assert_match "pull_request:" "$WORKFLOW"
  assert_match "runs-on: blacksmith-2vcpu-ubuntu-2404" "$WORKFLOW"
  assert_match "Validate conventional commits" "$WORKFLOW"
  assert_match 'subjectPattern:.*#\[1-9\]' "$WORKFLOW"
  assert_match 'Closes #N' "$WORKFLOW"
  assert_match 'normalized=.*sanitized.*GITHUB_REPOSITORY' "$WORKFLOW"
  assert_match 'printf.*normalized' "$WORKFLOW"
  assert_no_match 'PAT-' "$WORKFLOW"
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

OPENING_BODY='## Why

Use one pull request body contract.

## Scope

Closes #445

## Blast Radius

Pull request authors use the opening-a-pr sections.

## Verification

The closing-reference check accepts this body.'

if ! run_closing_check "$OPENING_BODY"; then
  fail "opening-a-pr body with a closing reference failed the workflow check"
fi

BODY_WITHOUT_CLOSE='## Why

Use one pull request body contract.

## Scope

Retire the old headings.

## Blast Radius

Pull request authors use the opening-a-pr sections.

## Verification

The closing-reference check rejects this body.'

if run_closing_check "$BODY_WITHOUT_CLOSE"; then
  fail "opening-a-pr body without a closing reference passed the workflow check"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT pull request workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: pull request workflow assertions passed"
