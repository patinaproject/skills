#!/usr/bin/env bash
set -euo pipefail

# The draft-to-ready flip is gated by the readiness predicate alone. The former
# hidden `<!-- patinaproject-agent-authored-pr -->` provenance marker stranded
# every draft that ready-pr did not itself create, so no readiness surface may
# reintroduce it.

MARKER='<!-- patinaproject-agent-authored-pr -->'
READY_SKILL='skills/ready-pr/SKILL.md'
READY_WORKFLOW='skills/ready-pr/workflows/ready-for-merge.md'
FEEDBACK_SKILL='skills/codex-pr-feedback-loop/SKILL.md'
FEEDBACK_WORKFLOW='skills/codex-pr-feedback-loop/workflows/thread-automation.md'
HUMAN_TEMPLATE='.github/pull_request_template.md'

READINESS_SURFACES=(
  "$READY_SKILL"
  "$READY_WORKFLOW"
  "$FEEDBACK_SKILL"
  "$FEEDBACK_WORKFLOW"
)

# Prose wraps across lines, so match against a whitespace-collapsed copy rather
# than requiring a phrase to sit on one line.
unwrapped() {
  tr '\n' ' ' <"$1" | tr -s '[:space:]' ' '
}

require_absent() {
  local file="$1"
  local needle="$2"
  local label="$3"

  if unwrapped "$file" | grep -Fq "$needle"; then
    echo "FAIL: $file reintroduces $label" >&2
    exit 1
  fi
}

require_present() {
  local file="$1"
  local needle="$2"

  if ! unwrapped "$file" | grep -Fq "$needle"; then
    echo "FAIL: $file no longer states: $needle" >&2
    exit 1
  fi
}

for surface in "${READINESS_SURFACES[@]}" "$HUMAN_TEMPLATE"; do
  require_absent "$surface" "$MARKER" 'the agent-authored provenance marker'
  require_absent "$surface" 'provenance' 'a provenance precondition on the flip'
done

# The predicate is the whole gate, so every readiness surface must still spell
# out both of its parts.
for surface in "$READY_SKILL" "$FEEDBACK_SKILL"; do
  require_present "$surface" 'review loop is clean'
  require_present "$surface" 'unresolved review threads remain'
done

for surface in "$READY_WORKFLOW" "$FEEDBACK_WORKFLOW"; do
  require_present "$surface" 'readiness predicate'
  require_present "$surface" 'actually reviewed'
  require_present "$surface" 'unresolved GraphQL review threads'
  require_present "$surface" 'gh pr ready'
  require_present "$surface" 'one-way'
done

echo 'OK: the draft-to-ready flip is predicate-only and carries no provenance-marker requirement'
