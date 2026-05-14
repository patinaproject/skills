#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

require_file() {
  if [ ! -f "$1" ]; then
    fail "missing required file: $1"
  fi
}

require_text() {
  local file="$1"
  local needle="$2"
  if ! grep -Fq "$needle" "$file"; then
    fail "$file missing required text: $needle"
  fi
}

require_file skills/superteam/SKILL.md
require_file skills/superteam/pre-flight.md
require_file skills/superteam/routing-table.md
require_file skills/superteam/project-deltas.md
require_file skills/superteam/workflow-diagrams.md
require_file skills/superteam-non-interactive/SKILL.md

for role in team-lead brainstormer planner executor reviewer finisher; do
  require_file "skills/superteam/agents/$role.openai.yaml"
  require_file "skills/superteam/.claude/agents/$role.md"
done

for needle in \
  "## Quick start" \
  "## Reference map" \
  "## Examples" \
  "## Glossary" \
  "## Latest-head PR completion gate" \
  "latest_head_feedback_inventory" \
  "latest_head_check_status_inventory" \
  "Finisher completion/status report"
do
  require_text skills/superteam/SKILL.md "$needle"
done

for file in \
  skills/superteam/agents/finisher.openai.yaml \
  skills/superteam/.claude/agents/finisher.md
do
  require_text "$file" "latest-head PR completion gate"
  require_text "$file" "latest-head PR feedback inventory"
  require_text "$file" "latest-head checks/statuses inventory"
  require_text "$file" "Completion requires zero"
  require_text "$file" "Optional non-passing checks/statuses block completion"
  require_text "$file" "Durable wakeup payloads MUST include"
  require_text "$file" "latest pushed SHA"
  require_text "$file" "routed-feedback count"
  require_text "$file" "check/status inventory state"
done

require_text skills/superteam/pre-flight.md "latest_head_feedback_inventory_state"
require_text skills/superteam/pre-flight.md "check_status_inventory_state"
require_text skills/superteam/pre-flight.md 'ready`: the latest-head PR completion gate has passed'
require_text skills/superteam/routing-table.md "latest-head PR completion gate"
require_text skills/superteam/routing-table.md "PR review comments, review threads, bot findings, checks, statuses, mergeability, or CI"

for needle in \
  "## Autonomy Defaults" \
  "Never halt just because an interactive Superteam run would have asked a human" \
  "Gate 1: auto-advance a clean or fully dispositioned design" \
  "Publishing: allow" \
  "to push, create, or update the PR" \
  "SUPERTEAM_ALLOW_PUBLISH=0" \
  "Halting for" \
  "being unset"
do
  require_text skills/superteam-non-interactive/SKILL.md "$needle"
done

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT superteam contract assertion(s) failed" >&2
  exit 1
fi

echo "OK: superteam contract assertions passed"
