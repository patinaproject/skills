#!/usr/bin/env bash
set -euo pipefail

# The draft-to-ready flip is gated by the readiness predicate alone. The former
# hidden `<!-- patinaproject-agent-authored-pr -->` marker stranded every draft
# that ready-pr did not itself create, so no readiness surface may reintroduce
# it. The marker is a literal machine-consumed token, not prose, so guarding its
# absence stays inside ADR-224. The predicate wording itself is prose and is
# deliberately left to review and `pnpm lint:md`.

MARKER='<!-- patinaproject-agent-authored-pr -->'

READINESS_SURFACES=(
  'skills/ready-pr/SKILL.md'
  'skills/ready-pr/workflows/ready-for-merge.md'
  'skills/codex-pr-feedback-loop/SKILL.md'
  'skills/codex-pr-feedback-loop/workflows/thread-automation.md'
  '.github/pull_request_template.md'
)

for surface in "${READINESS_SURFACES[@]}"; do
  test -f "$surface"

  if grep -Fq "$MARKER" "$surface"; then
    echo "FAIL: $surface reintroduces the agent-authored provenance marker" >&2
    exit 1
  fi
done

echo 'OK: no readiness surface requires a provenance marker for the draft-to-ready flip'
