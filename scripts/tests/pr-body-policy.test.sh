#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TEMPLATE=".github/pull_request_template.md"
AGENTS="AGENTS.md"
SCAFFOLD_SKILL="skills/scaffold-repository/SKILL.md"
SCAFFOLD_AUDIT="skills/scaffold-repository/audit-checklist.md"
SCAFFOLD_PR_DOC="skills/scaffold-repository/pr-body-template.md"
FINISH_PR_WORKFLOW="skills/finish-pr/workflows/ready-for-merge.md"
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

for file in \
  "$TEMPLATE" \
  "$AGENTS" \
  "$SCAFFOLD_SKILL" \
  "$SCAFFOLD_AUDIT" \
  "$SCAFFOLD_PR_DOC" \
  "$FINISH_PR_WORKFLOW"
do
  test -f "$file" || fail "missing expected file: $file"
done

assert_match "## What changed" "$TEMPLATE"
assert_match "## Testing steps" "$TEMPLATE"
assert_match "GitHub Checks.*routine automated verification" "$TEMPLATE"
assert_match "human-owned behavior or artifact" "$TEMPLATE"
assert_match "app behavior or reviewable artifacts" "$TEMPLATE"
assert_match "command.*exception.*behavior or repository contract" "$TEMPLATE"
assert_no_match "^## Verification$" "$TEMPLATE"
assert_no_match "\\[[xX]\\]" "$TEMPLATE"
assert_no_match "^[[:space:]]*(?:[-*][[:space:]]*)?(?:No manual testing needed|N/A|None)[[:punct:][:space:]]*$" "$TEMPLATE"
assert_no_match "command output|command transcript|routine automated evidence" "$TEMPLATE"

assert_match "GitHub Checks.*routine automated verification" "$AGENTS"
assert_match "Testing steps.*human-owned behavior or artifact" "$AGENTS"
assert_no_match "verification evidence" "$AGENTS"

assert_match "GitHub Checks.*routine automated verification" "$FINISH_PR_WORKFLOW"
assert_match "reviewer-friendly PR body" "$FINISH_PR_WORKFLOW"
assert_match "Do not copy command transcripts" "$FINISH_PR_WORKFLOW"
assert_no_match "verification evidence" "$FINISH_PR_WORKFLOW"
assert_no_match "template's[[:space:]]+verification section" "$FINISH_PR_WORKFLOW"

assert_match "GitHub Checks.*routine automated verification" "$SCAFFOLD_SKILL"
assert_match "human-owned behavior or artifact" "$SCAFFOLD_SKILL"
assert_no_match "verification evidence" "$SCAFFOLD_SKILL"

assert_match "stale.*command transcripts" "$SCAFFOLD_AUDIT"
assert_match "stale.*routine automated evidence" "$SCAFFOLD_AUDIT"
assert_no_match "## Verification" "$SCAFFOLD_AUDIT"

assert_match "GitHub Checks.*routine automated verification" "$SCAFFOLD_PR_DOC"
assert_match "command.*only realistic way to verify.*repository contract" "$SCAFFOLD_PR_DOC"
assert_no_match "Verification section" "$SCAFFOLD_PR_DOC"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT PR body policy assertion(s) failed" >&2
  exit 1
fi

echo "OK: PR body policy assertions passed"
