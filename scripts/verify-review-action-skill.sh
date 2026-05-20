#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="skills/review-action/SKILL.md"
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
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

test -f "$SKILL" || fail "missing expected file: $SKILL"

if [ -f "$SKILL" ]; then
  assert_match '^name:[[:space:]]*review-action$' "$SKILL"
  assert_match 'works from instructions alone and must not depend on' "$SKILL"
  assert_match 'repository-local helper scripts' "$SKILL"
  assert_match '## Workflow Selection' "$SKILL"
  assert_match 'Preference order:' "$SKILL"
  assert_match 'Outcomes:' "$SKILL"
  assert_match 'Prefer workflow files named `code-review\.yml` or `code-review\.yaml`' "$SKILL"
  assert_match 'top-level `name:` is `Code Review`' "$SKILL"
  assert_match 'step name contains `code review`' "$SKILL"
  assert_match 'No plausible code-review workflow: halt with a clarification request' "$SKILL"
  assert_match 'Multiple plausible code-review workflows: halt with a clarification request' "$SKILL"
  assert_match '`\.github/workflows/code-review\.yml` \(or the `\.yaml` equivalent\)' "$SKILL"
  assert_match 'must select the code-review workflow' "$SKILL"
  assert_match '`use_commit_signing`, `track_progress`, and `allowed_bots`' "$SKILL"
  assert_match 'Local review emulation is read-only and terminal-only' "$SKILL"
  assert_match '`--allowedTools` limited to `Read`' "$SKILL"
  assert_match '`--disallowedTools` for' "$SKILL"
  assert_match 'edits, commits, pushes, and comments' "$SKILL"
  assert_no_match 'If multiple supported review actions are detected, halt as a v1 scope boundary' "$SKILL"
fi

node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(
  Object.hasOwn(packageJson.scripts, "review-action"),
  false,
  "review-action must remain a portable skill, not a package helper script"
);
NODE

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT review-action skill assertion(s) failed" >&2
  exit 1
fi

echo "OK: review-action skill assertions passed"
