#!/usr/bin/env bash
set -euo pipefail

MARKER='<!-- patinaproject-agent-authored-pr -->'
READY_SKILL='skills/ready-pr/SKILL.md'
READY_WORKFLOW='skills/ready-pr/workflows/ready-for-merge.md'
FEEDBACK_SKILL='skills/codex-pr-feedback-loop/SKILL.md'
FEEDBACK_WORKFLOW='skills/codex-pr-feedback-loop/workflows/thread-automation.md'
HUMAN_TEMPLATE='.github/pull_request_template.md'

require_marker_count() {
  local file="$1"
  local expected="$2"
  local actual

  actual="$({ grep -Fo "$MARKER" "$file" || true; } | wc -l | tr -d '[:space:]')"
  if [ "$actual" -ne "$expected" ]; then
    echo "FAIL: $file contains $actual agent marker(s); expected $expected" >&2
    exit 1
  fi
}

require_marker_count "$READY_SKILL" 1
require_marker_count "$READY_WORKFLOW" 2
require_marker_count "$FEEDBACK_SKILL" 1
require_marker_count "$FEEDBACK_WORKFLOW" 1
require_marker_count "$HUMAN_TEMPLATE" 0

echo 'OK: agent draft provenance marker contract is synchronized across both readiness skills'
