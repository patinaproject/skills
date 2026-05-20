#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="skills/review-code/SKILL.md"
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
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

test -f "$SKILL" || fail "missing expected file: $SKILL"

if [ -f "$SKILL" ]; then
  assert_match '^name:[[:space:]]*review-code$' "$SKILL"
  assert_match 'fresh-context reviewer' "$SKILL"
  assert_match 'read-only Explorer or reviewer background agent' "$SKILL"
  assert_match 'Codex.*spawn a fresh Explorer background agent' "$SKILL"
  assert_match 'without asking[[:space:]]+for another user confirmation' "$SKILL"
  assert_match 'Close[[:space:]]+the Explorer or reviewer agent after its final report is consumed' "$SKILL"
  assert_match 'Do not let[[:space:]]+old review agents pile up' "$SKILL"
  assert_match 'If fresh reviewer dispatch is unavailable, halt' "$SKILL"
  assert_match 'Do not fall back to same-thread review' "$SKILL"
  assert_match 'read-only and findings-only' "$SKILL"
  assert_match 'Do not edit files, stage changes, commit, push, create pull requests, post GitHub comments, or mutate review threads' "$SKILL"
  assert_match 'merge-base' "$SKILL"
  assert_match 'defaultBranchRef --jq \.defaultBranchRef\.name' "$SKILL"
  assert_match 'Normalize the fallback by stripping the leading' "$SKILL"
  assert_match 'git remote set-head origin --auto' "$SKILL"
  assert_match 'Do not update refs during' "$SKILL"
  assert_match 'git rev-parse --verify origin/<default-branch>' "$SKILL"
  assert_match 'gh repo view --json nameWithOwner --jq' "$SKILL"
  assert_match '\.nameWithOwner' "$SKILL"
  assert_match 'gh api repos' "$SKILL"
  assert_match '--jq \.commit\.sha' "$SKILL"
  assert_match 'freshness is unverified' "$SKILL"
  assert_match 'Freshness unverified: gh unavailable; reviewed current' "$SKILL"
  assert_no_match 'git fetch' "$SKILL"
  assert_match 'staged, unstaged, and untracked' "$SKILL"
  assert_match 'Load repository instructions' "$SKILL"
  assert_match 'generated files, lockfiles, vendored files, and dogfood overlay paths' "$SKILL"
  assert_match 'Group findings by severity' "$SKILL"
  assert_match 'file and line reference' "$SKILL"
  assert_match 'rationale' "$SKILL"
  assert_match 'suggested fix' "$SKILL"
  assert_match '## Distinction From Hosted Review' "$SKILL"
  assert_match 'This skill only covers local isolated branch-diff review' "$SKILL"
  assert_match '`code-review\.yml`' "$SKILL"
  assert_no_match 'repository-local helper script' "$SKILL"
fi

node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(
  Object.hasOwn(packageJson.scripts, "review-code"),
  false,
  "review-code must remain a portable skill, not a package helper script",
);
NODE

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT review-code skill assertion(s) failed" >&2
  exit 1
fi

echo "OK: review-code skill assertions passed"
