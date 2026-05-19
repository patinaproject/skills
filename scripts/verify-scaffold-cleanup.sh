#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "required command not found: $command_name"
  fi
}

assert_absent_path() {
  local path="$1"
  if [ -e "$path" ]; then
    fail "stale scaffold path still exists: $path"
  fi
}

assert_no_match() {
  local pattern="$1"
  local output
  local status
  shift
  set +e
  output="$(rg -n -e "$pattern" "$@" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    fail "stale scaffold reference matched: $pattern"
    printf '%s\n' "$output" >&2
  elif [ "$status" -ne 1 ]; then
    fail "scaffold cleanup search failed for pattern: $pattern"
    printf '%s\n' "$output" >&2
  fi
}

require_command "rg"

assert_absent_path "skills/scaffold-repository/templates"
assert_absent_path "scripts/apply-scaffold-repository.js"
assert_absent_path "scripts/verify-scaffold-agent-plugin-readme.js"

assert_no_match "apply:scaffold-repository|apply-scaffold-repository|scaffold-repository self-apply|self-apply" \
  AGENTS.md README.md docs package.json .github/workflows skills/scaffold-repository

assert_no_match "skills/scaffold-repository/templates|skills/bootstrap/templates|\\.tmpl" \
  AGENTS.md README.md docs package.json .github/workflows skills/scaffold-repository

assert_no_match "Cursor|Windsurf|Continue\\.dev|\\.cursor/|\\.windsurfrules|\\.continue/" \
  skills/scaffold-repository

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT scaffold cleanup assertion(s) failed" >&2
  exit 1
fi

echo "OK: scaffold cleanup assertions passed"
