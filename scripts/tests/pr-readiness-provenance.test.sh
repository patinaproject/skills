#!/usr/bin/env bash
set -euo pipefail

MARKER='<!-- patinaproject-agent-authored-pr -->'
FINISH_WORKFLOW='skills/finish-pr/workflows/ready-for-merge.md'
FEEDBACK_WORKFLOW='skills/codex-pr-feedback-loop/workflows/thread-automation.md'

require_literal() {
  local file="$1"
  local literal="$2"

  if ! grep -Fq "$literal" "$file"; then
    echo "FAIL: $file is missing required provenance contract: $literal" >&2
    exit 1
  fi
}

require_literal "$FINISH_WORKFLOW" "Add exactly this hidden marker to the PR body in the same operation that creates an agent draft: \`$MARKER\`."
require_literal "$FINISH_WORKFLOW" "Before \`gh pr ready\`, require the PR body to contain the exact \`$MARKER\` marker."
require_literal "$FINISH_WORKFLOW" 'Never add it retroactively to an'
require_literal "$FEEDBACK_WORKFLOW" "require the exact \`$MARKER\` marker before \`gh pr ready\`; never add the marker retroactively."

if grep -Fq "$MARKER" .github/pull_request_template.md; then
  echo 'FAIL: the human PR template must not carry the agent-authored marker' >&2
  exit 1
fi

echo 'OK: agent draft provenance is written at creation and required before both completion paths'
