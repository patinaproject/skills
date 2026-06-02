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

# Per the "no tests on documentation content" rule (docs/adr/0001), this test
# asserts only on filesystem state and non-`.md` config targets. Retired
# references inside agent/skill prose are covered by `lint:md`, not here.
ACTIVE_CONFIG_PATHS=(
  .claude/settings.json
  .claude-plugin/marketplace.json
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  .agents/plugins/marketplace.json
)
REMOVED_SKILL_PATHS=(
  skills/review-action
  skills/office-hours
  skills/plan-ceo-review
  skills/superteam
  skills/superteam-non-interactive
  .agents/skills/review-action
  .agents/skills/office-hours
  .agents/skills/plan-ceo-review
  .agents/skills/superteam
  .agents/skills/superteam-non-interactive
  .claude/skills/review-action
  .claude/skills/office-hours
  .claude/skills/plan-ceo-review
  .claude/skills/superteam
  .claude/skills/superteam-non-interactive
)

for removed_path in "${REMOVED_SKILL_PATHS[@]}"; do
  test ! -e "$removed_path" || fail "retired skill path still exists: $removed_path"
done

test ! -e docs/superpowers || fail "docs/superpowers should be removed after spec migration"

assert_no_match "docs/superpowers/(specs|plans)" "${ACTIVE_CONFIG_PATHS[@]}"
assert_no_match "obra/superpowers|superpowers@claude-plugins-official|superteam@patinaproject-skills|<use-superteam>" \
  .claude/settings.json
assert_no_match "review-action|office-hours|plan-ceo-review|superteam-non-interactive|skills/superteam" \
  .claude-plugin/marketplace.json .claude-plugin/plugin.json \
  .codex-plugin/plugin.json .agents/plugins/marketplace.json
assert_no_match "skills:restore|skills:refresh" \
  .claude/settings.json

test ! -e scripts/install-skills.sh ||
  fail "scripts/install-skills.sh should be removed in favor of skills experimental_install"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT workflow cleanup assertion(s) failed" >&2
  exit 1
fi

echo "OK: workflow cleanup assertions passed"
