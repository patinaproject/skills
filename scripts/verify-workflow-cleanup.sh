#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_no_match() {
  local pattern="$1"
  shift
  local output
  if output="$(rg -n "$pattern" "$@" 2>/dev/null)"; then
    fail "unexpected retired workflow reference for pattern '$pattern':"
    printf '%s\n' "$output" >&2
  fi
}

assert_match() {
  local pattern="$1"
  shift
  if ! rg -n "$pattern" "$@" >/dev/null; then
    fail "missing expected reference for pattern '$pattern' in: $*"
  fi
}

ACTIVE_PATHS=(
  AGENTS.md
  CONTRIBUTING.md
  README.md
  .github/pull_request_template.md
  .claude/settings.json
  .claude-plugin/marketplace.json
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  .agents/plugins/marketplace.json
  docs
  skills/scaffold-repository
  skills/using-github
)

test ! -e docs/superpowers || fail "docs/superpowers should be removed after spec migration"

assert_no_match "docs/superpowers/(specs|plans)" "${ACTIVE_PATHS[@]}"
assert_no_match "AC-[0-9]+|AC-<|acceptance criteria|Test coverage|Coverage and risks|## Risks|\\bRisks\\b" \
  AGENTS.md CONTRIBUTING.md .github/pull_request_template.md \
  skills/scaffold-repository skills/using-github
assert_no_match "obra/superpowers|superpowers@claude-plugins-official|superteam@patinaproject-skills|<use-superteam>" \
  AGENTS.md CONTRIBUTING.md README.md .claude/settings.json \
  skills/scaffold-repository

assert_match "[Dd]eprecated" README.md .claude-plugin/marketplace.json .agents/plugins/marketplace.json
assert_match "[Dd]eprecated" skills/superteam/SKILL.md skills/superteam/README.md skills/superteam-non-interactive/SKILL.md

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT workflow cleanup assertion(s) failed" >&2
  exit 1
fi

echo "OK: workflow cleanup assertions passed"
