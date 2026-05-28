#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="skills/finish-pr/SKILL.md"
WORKFLOW="skills/finish-pr/workflows/ready-for-merge.md"
TRIAGE="skills/finish-pr/workflows/triage.md"
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

assert_order() {
  local first_pattern="$1"
  local second_pattern="$2"
  local file="$3"
  local first_line second_line
  # These workflow command assertions intentionally use the first occurrence.
  # If examples add duplicate commands earlier, use a unique anchor pattern.
  first_line="$(rg -n --pcre2 -e "$first_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  second_line="$(rg -n --pcre2 -e "$second_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  if [ -z "$first_line" ] || [ -z "$second_line" ] || [ "$first_line" -ge "$second_line" ]; then
    fail "expected pattern '$first_pattern' before '$second_pattern' in $file"
  fi
}

assert_file "$SKILL"
assert_file "$WORKFLOW"
assert_file "$TRIAGE"

if [ -f "$SKILL" ]; then
  assert_match "currently available PR feedback" "$SKILL"
  assert_match "eligible conversation resolution" "$SKILL"
  assert_match "re-query PR feedback after checks" "$SKILL"
  assert_match "Failing checks do" "$SKILL"
  assert_match "not halt the skill by themselves" "$SKILL"
  assert_match "concrete non-ready check dispositions" "$SKILL"
  assert_match "ready-for-review is distinct from" "$SKILL"
  assert_match "final ready-to-merge" "$SKILL"
  assert_match "report the PR as not ready-to-merge" "$SKILL"
  assert_match "human-friendly language" "$SKILL"
  assert_match "must not call it" "$SKILL"
  assert_match "compress ready-to-merge evidence" "$SKILL"
  assert_match "human line instead of listing the gates" "$SKILL"
  assert_no_match "/goal" "$SKILL"
  assert_no_match "create_goal|update_goal" "$SKILL"
  assert_no_match "goal lifecycle" "$SKILL"
  assert_no_match "agent-managed goal" "$SKILL"
fi

if [ -f "$WORKFLOW" ]; then
  assert_match "Operating Contract" "$WORKFLOW"
  assert_match "durable, resumable workflow" "$WORKFLOW"
  assert_match "completed branch-local work through PR publication, feedback, checks, and final" "$WORKFLOW"
  assert_match "without broadening into unrelated issue work or merging the pull" "$WORKFLOW"
  assert_match "validation loop is the readiness loop" "$WORKFLOW"
  assert_match "observe all visible checks" "$WORKFLOW"
  assert_match "End only when the final ready-to-merge gates pass or a documented" "$WORKFLOW"
  assert_match "current checkpoint, evidence gathered, next" "$WORKFLOW"
  assert_match "Reporting Guidance" "$WORKFLOW"
  assert_no_match "Human Relevance Filter" "$WORKFLOW"
  assert_no_match "Apply this filter" "$WORKFLOW"
  assert_match "Progress reports and final handoffs should say whether the PR is ready" "$WORKFLOW"
  assert_match "failed, skipped, interrupted" "$WORKFLOW"
  assert_match "otherwise" "$WORKFLOW"
  assert_match "changes readiness, explains a blocker, identifies residual risk" "$WORKFLOW"
  assert_match "Leave out exact verification commands, command inventories" "$WORKFLOW"
  assert_match "check names, and gate inventories when everything passes" "$WORKFLOW"
  assert_match "Progress reports" "$WORKFLOW"
  assert_match "should mention the current checkpoint and next action without repeated check" "$WORKFLOW"
  assert_match "lists\\. Show exact commands" "$WORKFLOW"
  assert_no_match "/goal" "$WORKFLOW"
  assert_no_match "create_goal|update_goal" "$WORKFLOW"
  assert_no_match "goal lifecycle" "$WORKFLOW"
  assert_no_match "agent-managed goal" "$WORKFLOW"
  assert_match "Final unresolved review-thread gate" "$WORKFLOW"
  assert_match "mergeStateStatus" "$WORKFLOW"
  assert_match "baseRefName" "$WORKFLOW"
  assert_match "git fetch origin <base-branch>" "$WORKFLOW"
  assert_match "git merge --no-commit --no-ff origin/<base-branch>" "$WORKFLOW"
  assert_match "git merge --abort" "$WORKFLOW"
  assert_match "Do not use browser automation" "$WORKFLOW"
  assert_match "Do not rebase or force-push" "$WORKFLOW"
  assert_match "Do not merge the pull" "$WORKFLOW"
  assert_match "restart the readiness loop on the new head" "$WORKFLOW"
  assert_match "product judgment, secrets, permissions" "$WORKFLOW"
  assert_match "destructive git operations, unrelated scope" "$WORKFLOW"
  assert_order "mergeability gate" "Fetch the full PR feedback surface" "$WORKFLOW"
  assert_order "Fetch the full PR feedback surface" "Triage every currently available feedback item" "$WORKFLOW"
  assert_order "Triage every currently available feedback item" "tool-enforced 10-minute timeout" "$WORKFLOW"
  assert_order "tool-enforced 10-minute timeout" "Re-query the full PR feedback surface" "$WORKFLOW"
  assert_order "Re-query the full PR feedback surface" "Final unresolved review-thread gate" "$WORKFLOW"
  assert_order "Final unresolved review-thread gate" "gh pr ready" "$WORKFLOW"
  assert_match "Ready-for-review is distinct from ready-to-merge" "$WORKFLOW"
  assert_match "known failing checks remain" "$WORKFLOW"
  assert_match "fail-fast bounded-watch" "$WORKFLOW"
  assert_match "tool-enforced 10-minute timeout" "$WORKFLOW"
  assert_match "timeout 10m gh pr checks --watch --fail-fast" "$WORKFLOW"
  assert_match "gtimeout 10m gh pr checks --watch --fail-fast" "$WORKFLOW"
  assert_match "perl -e" "$WORKFLOW"
  assert_match "exit code 124" "$WORKFLOW"
  assert_match "fail-fast watch exit" "$WORKFLOW"
  assert_no_match "^[[:space:]]*gh pr checks --watch[[:space:]]*$" "$WORKFLOW"
  assert_no_match "^[[:space:]]*gh pr checks --watch --fail-fast[[:space:]]*$" "$WORKFLOW"
  assert_no_match 'Do not use `--fail-fast` by default' "$WORKFLOW"
  assert_match "10-minute observation" "$WORKFLOW"
  assert_match "windows and watch all checks" "$WORKFLOW"
  assert_match "two consecutive" "$WORKFLOW"
  assert_match "10-minute no-progress windows" "$WORKFLOW"
  assert_match "After any watch command exit" "$WORKFLOW"
  assert_match "After any watch timeout" "$WORKFLOW"
  assert_match "snapshot all check states" "$WORKFLOW"
  assert_match "all check buckets, unresolved review threads" "$WORKFLOW"
  assert_match "review decision, and current PR head" "$WORKFLOW"
  assert_match "PR head SHA, or feedback inventory" "$WORKFLOW"
  assert_match "(?i)do not filter to required checks only" "$WORKFLOW"
  assert_match "skipped-problematic, or otherwise non-pass" "$WORKFLOW"
  assert_match "Fix branch-local check causes" "$WORKFLOW"
  assert_match "Do not halt solely because a check failed" "$WORKFLOW"
  assert_match "per-failing-check dispositions" "$WORKFLOW"
  assert_match "push follow-up commits when appropriate" "$WORKFLOW"
  assert_match "resolveReviewThread" "$WORKFLOW"
  assert_match "isResolved" "$WORKFLOW"
  assert_match "newly available" "$WORKFLOW"
  assert_match "changed, unresolved" "$WORKFLOW"
  assert_match "evidence-pending feedback" "$WORKFLOW"
  assert_match "body hash or update time" "$WORKFLOW"
  assert_match "deferred-until-checks dispositions" "$WORKFLOW"
  assert_match "Prior eligible resolutions stand" "$WORKFLOW"
  assert_match "(?i)(?:unresolved.*blocker|blocker.*unresolved)" "$WORKFLOW"
  assert_match "top-level" "$WORKFLOW"
  assert_match "per-finding disposition" "$WORKFLOW"
  assert_match "unaddressed findings" "$WORKFLOW"
  assert_match "fix-now.*pending checks" "$WORKFLOW"
  assert_match "explain.*stale.*defer.*before checks" "$WORKFLOW"
  assert_match "Mandatory final ready-to-merge check" "$WORKFLOW"
  assert_match "immediately before the final" "$WORKFLOW"
  assert_match "gh pr view <pr-number-or-url> --json" "$WORKFLOW"
  assert_match "gh pr checks <pr-number-or-url>" "$WORKFLOW"
  assert_match "local worktree is clean" "$WORKFLOW"
  assert_match 'local branch equals the PR `headRefName`' "$WORKFLOW"
  assert_match 'local `HEAD` equals the PR `headRefOid`' "$WORKFLOW"
  assert_match '`mergeStateStatus` is `CLEAN`' "$WORKFLOW"
  assert_match "PR is not a draft" "$WORKFLOW"
  assert_match 'every current check has status `COMPLETED` and conclusion `SUCCESS`' "$WORKFLOW"
  assert_match 'no paginated GraphQL review thread has `isResolved: false`' "$WORKFLOW"
  assert_match "gh api graphql --paginate" "$WORKFLOW"
  assert_match 'Replace `<pr-number-or-url>`, `<owner>`, `<repo>`, and `<pr-number>`' "$WORKFLOW"
  assert_match 'reviewThreads\(first:100, after:\$endCursor\)' "$WORKFLOW"
  assert_match "comments\\(first:100\\)" "$WORKFLOW"
  assert_match "pageInfo\\{hasNextPage endCursor\\}" "$WORKFLOW"
  assert_match "author\\{login\\} body url createdAt path line originalLine diffHunk" "$WORKFLOW"
  assert_match 'If every gate passes, report `ready-to-merge`' "$WORKFLOW"
  assert_match 'If any gate fails, report' "$WORKFLOW"
  assert_match "human-friendly language" "$WORKFLOW"
  assert_match "Do not dump the full command" "$WORKFLOW"
  assert_match "Do not describe a blocked outcome" "$WORKFLOW"
  assert_match "Compress ready-to-merge evidence into one human line" "$WORKFLOW"
  assert_match "Do not write gate inventories" "$WORKFLOW"
  assert_match "Verified: routine checks passed. No human action needed before" "$WORKFLOW"
  assert_no_match "Verified: local suite and PR checks passed" "$WORKFLOW"
  assert_match "Avoid final output shaped like a readiness checklist" "$WORKFLOW"
  assert_no_match "Final gate is clean" "$WORKFLOW"
  assert_order "Mandatory final ready-to-merge check" "Final report includes" "$WORKFLOW"
fi

if [ -f "$TRIAGE" ]; then
  assert_match "merge conflicts" "$TRIAGE"
  assert_match "Merge Conflict Rules" "$TRIAGE"
  assert_match "headRefOid" "$TRIAGE"
  assert_match "baseRefName" "$TRIAGE"
  assert_match "mergeStateStatus" "$TRIAGE"
  assert_match "git merge --abort" "$TRIAGE"
  assert_match 'Classify branch-local, in-scope, verifiable conflicts as `fix-now`' "$TRIAGE"
  assert_match 'Classify conflicts as `needs-human`' "$TRIAGE"
  assert_match "Do not rebase or force-push by default" "$TRIAGE"
  assert_match "Do not use browser conflict" "$TRIAGE"
  assert_match "merge the pull request itself" "$TRIAGE"
  assert_match "Handle currently available feedback before watching checks" "$TRIAGE"
  assert_match "fix-now.*pending" "$TRIAGE"
  assert_match "explain.*stale.*defer.*before checks" "$TRIAGE"
  assert_match "isResolved: true" "$TRIAGE"
  assert_match "Re-query the full feedback surface after checks finish" "$TRIAGE"
  assert_match "Wait for all checks only after currently available feedback has been handled" "$TRIAGE"
  assert_match "tool-enforced 10-minute timeout" "$TRIAGE"
  assert_match "timeout 10m gh pr checks --watch --fail-fast" "$TRIAGE"
  assert_match "gtimeout 10m gh pr checks --watch --fail-fast" "$TRIAGE"
  assert_match "perl -e" "$TRIAGE"
  assert_match "exit code 124" "$TRIAGE"
  assert_match "fail-fast watch exit" "$TRIAGE"
  assert_no_match "^[[:space:]]*gh pr checks --watch[[:space:]]*$" "$TRIAGE"
  assert_no_match "^[[:space:]]*gh pr checks --watch --fail-fast[[:space:]]*$" "$TRIAGE"
  assert_match "10-minute observation windows" "$TRIAGE"
  assert_match "two consecutive 10-minute no-progress windows" "$TRIAGE"
  assert_match "full PR state resync" "$TRIAGE"
  assert_match "failed, canceled, skipped-problematic, or otherwise non-pass" "$TRIAGE"
  assert_match "reportable check disposition" "$TRIAGE"
  assert_match 'Do not classify a check as `needs-human` solely because it failed' "$TRIAGE"
  assert_match "needs missing secrets" "$TRIAGE"
  assert_match "permission failure" "$TRIAGE"
  assert_match "external outage" "$TRIAGE"
  assert_match "Classify flaky, infrastructure-owned, external-outage, missing-secret, and" "$TRIAGE"
  assert_match 'permission-limited check failures as `explain`' "$TRIAGE"
  assert_no_match 'Use `gh pr checks --watch`; do not use fail-fast by default' "$TRIAGE"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT finish-pr workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: finish-pr workflow assertions passed"
