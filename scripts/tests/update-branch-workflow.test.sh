#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="skills/update-branch/SKILL.md"
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

assert_file "$SKILL"

if [ -f "$SKILL" ]; then
  assert_match '^name:[[:space:]]*update-branch$' "$SKILL"
  assert_match '/update-branch' "$SKILL"
  assert_match 'update branch' "$SKILL"
  assert_match 'merge (the )?latest (base|default) branch.*into this branch' "$SKILL"
  assert_match 'pure `git`' "$SKILL"
  assert_match 'do not use `gh pr update-branch`' "$SKILL"
  assert_match 'GitHub.{0,80}update API' "$SKILL"
  assert_match 'origin/HEAD' "$SKILL"
  assert_match 'git remote set-head origin -a' "$SKILL"
  assert_match 'optional base' "$SKILL"
  assert_match 'release/1\.x' "$SKILL"
  assert_match 'origin/<name>' "$SKILL"
  assert_match 'detached HEAD' "$SKILL"
  assert_match 'missing `origin`|no `origin`' "$SKILL"
  assert_match 'default branch' "$SKILL"
  assert_match 'Before fetch or[[:space:]]+merge' "$SKILL"
  assert_match 'stripping[[:space:]]+the leading `origin/`' "$SKILL"
  assert_match 'git status --short' "$SKILL"
  assert_match 'Auto-commit only when' "$SKILL"
  assert_match 'must never happen silently|not silent' "$SKILL"
  assert_match 'cohesive' "$SKILL"
  assert_match 'branch-local' "$SKILL"
  assert_match 'secrets' "$SKILL"
  assert_match 'required issue tag' "$SKILL"
  assert_match 'git merge --no-ff' "$SKILL"
  assert_match 'already up to date|Already up to date' "$SKILL"
  assert_match 'Never push[[:space:]]+automatically|never push[[:space:]]+automatically' "$SKILL"
  assert_match 'git push origin HEAD' "$SKILL"
  assert_match 'documented verification' "$SKILL"
  assert_match 'auto-commit|auto-committing' "$SKILL"
  assert_match 'conflict resolution|resolving conflicts|resolved conflicts' "$SKILL"
fi

node --input-type=module <<'NODE'
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(
  Object.hasOwn(packageJson.scripts, "update-branch"),
  false,
  "update-branch must remain an instruction-only skill, not a package helper script",
);
NODE

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT update-branch workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: update-branch workflow assertions passed"
