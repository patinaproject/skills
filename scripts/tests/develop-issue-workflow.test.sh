#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SKILL="skills/develop-issue/SKILL.md"
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
  if ! rg -n -U --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
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
  first_line="$(rg -n --pcre2 -e "$first_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  second_line="$(rg -n --pcre2 -e "$second_pattern" "$file" | head -n 1 | cut -d: -f1 || true)"
  if [ -z "$first_line" ] || [ -z "$second_line" ] || [ "$first_line" -ge "$second_line" ]; then
    fail "expected pattern '$first_pattern' before '$second_pattern' in $file"
  fi
}

assert_file "$SKILL"

if [ -f "$SKILL" ]; then
  assert_match '^name:[[:space:]]*develop-issue$' "$SKILL"
  assert_match '/develop-issue #123' "$SKILL"

  for child in new-branch tdd diagnose review-code finish-pr; do
    assert_match "\`$child\`" "$SKILL"
  done
  for route in write-a-skill zoom-out prototype; do
    assert_match "\`$route\`" "$SKILL"
  done
  assert_no_match '\`review-action\` remains available separately' "$SKILL"

  assert_match 'Reject missing issue references' "$SKILL"
  assert_match 'Reject multiple issue references' "$SKILL"
  assert_match 'Reject cross-repository issue URLs' "$SKILL"
  assert_match 'same-repository GitHub issue' "$SKILL"
  assert_match 'halt before implementation' "$SKILL"
  assert_match 'Read `AGENTS\.md` and `CLAUDE\.md` if present' "$SKILL"
  assert_match 'existing GitHub Projects' "$SKILL"
  assert_match 'GitHub Project items' "$SKILL"
  assert_match 'Status = `In progress`' "$SKILL"
  assert_match 'project-item inspection' "$SKILL"
  assert_match 'Do not add the issue to projects' "$SKILL"
  assert_match 'Do not create project fields or status[[:space:]]+options' "$SKILL"
  assert_match 'Skip incompatible project items' "$SKILL"
  assert_match 'project-item[[:space:]]+inspection or updates fail due to permissions' "$SKILL"
  assert_match 'project status update result' "$SKILL"
  assert_match 'Conditional routes are not blanket prerequisites' "$SKILL"
  assert_match 'mattpocock/skills@write-a-skill' "$SKILL"
  assert_match 'mattpocock/skills@zoom-out' "$SKILL"
  assert_match 'mattpocock/skills@prototype' "$SKILL"
  assert_match 'The `tdd`, `diagnose`, `write-a-skill`, `zoom-out`, and `prototype` install[[:space:]]+hints intentionally track' "$SKILL"
  assert_match 'Route through `write-a-skill` when the issue changes an installable skill[[:space:]]+package surface' "$SKILL"
  assert_match 'run `write-a-skill` before `tdd`' "$SKILL"
  assert_match 'Use `zoom-out` for ad-hoc, read-only discovery' "$SKILL"
  assert_match 'background explorer' "$SKILL"
  assert_match 'consume the result before choosing an implementation route' "$SKILL"
  assert_match 'Use `prototype` only when the issue explicitly asks for throwaway exploration' "$SKILL"
  assert_match 'Delete or absorb prototype output before local review' "$SKILL"
  assert_match '## Terminal Goal' "$SKILL"
  assert_match 'Production-ready implementation, all visible PR checks passing, and all local[[:space:]]+review findings plus PR review comments addressed' "$SKILL"
  assert_match '## Terminal States' "$SKILL"
  assert_match '`goal-met`' "$SKILL"
  assert_match '`human-blocked`' "$SKILL"
  assert_match 'Do not report `goal-met` while unresolved human-owned blockers remain' "$SKILL"
  assert_match '## Required Exit Gates' "$SKILL"
  assert_match 'Issue scope and acceptance criteria are covered' "$SKILL"
  assert_match 'Repository-documented verification has run' "$SKILL"
  assert_match 'all currently visible required and optional PR checks pass[[:space:]]+for `goal-met`' "$SKILL"
  assert_match 'PR check failures outside branch scope have a concrete disposition' "$SKILL"
  assert_match '`human-blocked` final report' "$SKILL"
  assert_match 'do not report `goal-met` while any visible PR[[:space:]]+check is still failing' "$SKILL"
  assert_match 'Local `review-code` findings are fixed or dispositioned' "$SKILL"
  assert_match 'GitHub PR review comments and hosted review comments surfaced by `finish-pr`[[:space:]]+are fixed or dispositioned' "$SKILL"
  assert_match 'Residual risks and test gaps are named' "$SKILL"
  assert_match '## Capability Map' "$SKILL"
  assert_match '`new-branch`: issue-linked branch setup' "$SKILL"
  assert_match '`tdd`: clear behavior implementation and behavior-level tests' "$SKILL"
  assert_match '`diagnose`: unclear root cause, missing reproduction, flaky behavior, or[[:space:]]+performance regressions' "$SKILL"
  assert_match '`review-code`: fresh-context local branch-diff review' "$SKILL"
  assert_match '`finish-pr`: commit, push, PR creation or update, PR checks, PR feedback[[:space:]]+loops, and ready-to-merge reporting' "$SKILL"
  assert_match '`write-a-skill`: installable skill package surface changes' "$SKILL"
  assert_match '`zoom-out`: read-only discovery when the agent cannot yet explain relevant[[:space:]]+modules, workflows, or vocabulary' "$SKILL"
  assert_match '`prototype`: only explicit throwaway exploration requests' "$SKILL"
  assert_match 'Branch setup is an automatic[[:space:]]+precondition' "$SKILL"
  assert_match 'Run[[:space:]]+`new-branch` when the worktree is not already on the correct issue-linked[[:space:]]+branch' "$SKILL"
  assert_match 'Skip `new-branch` when the current worktree is already correctly[[:space:]]+prepared' "$SKILL"
  assert_match 'Apply triggered conditional routes from the Conditional Routes section' "$SKILL"
  assert_match 'Choose the next capability by naming the current gap between actual state and[[:space:]]+the terminal goal' "$SKILL"
  assert_match 'Do not treat implementation, diagnosis, local review, or publishing as a[[:space:]]+fixed mandatory sequence' "$SKILL"
  assert_match 'Check for reviewable local changes' "$SKILL"
  assert_match 'committed branch diff from the[[:space:]]+default-branch merge base' "$SKILL"
  assert_match 'staged changes, unstaged changes, or untracked[[:space:]]+files' "$SKILL"
  assert_match 'Invoke[[:space:]]+`finish-pr` only after local verification and `review-code` are clean' "$SKILL"
  assert_match 'skipped because no reviewable local changes exist, or every local finding[[:space:]]+has a recorded `ready-for-agent`, `ready-for-human`, or `wontfix`[[:space:]]+disposition' "$SKILL"
  assert_match 'Loop until the terminal goal is met or a human-owned blocker prevents[[:space:]]+further progress' "$SKILL"
  assert_match 'without asking for another user confirmation' "$SKILL"
  assert_match 'all visible PR checks include required and optional checks' "$SKILL"
  assert_match 'Do not make unsupported certainty claims' "$SKILL"
  assert_no_match 'Codex.*Explorer' "$SKILL"
  assert_match 'long-running or resumable execution' "$SKILL"
  assert_match 'checkpoint state' "$SKILL"
  assert_match 'issue reference and URL, branch name, child skill[[:space:]]+status, verification results' "$SKILL"
  assert_match 'local review status, PR review status, check[[:space:]]+status, finding dispositions, blockers, and PR readiness' "$SKILL"
  assert_match 'terminal workflow state' "$SKILL"
  assert_match 'production-readiness evidence supports `goal-met`' "$SKILL"
  assert_match 'documented[[:space:]]+`human-blocked` stop' "$SKILL"
  assert_no_match 'Codex Goal Usage' "$SKILL"
  assert_no_match '/goal' "$SKILL"
  assert_no_match 'background-agent operation' "$SKILL"
  assert_no_match 'spawn a fresh Explorer' "$SKILL"
  assert_match 'never merges a[[:space:]]+pull request' "$SKILL"

  assert_order 'Satisfy the branch setup precondition using `new-branch` when needed' 'Use `finish-pr` for commit' "$SKILL"
  assert_order 'Status = `In progress`' 'Satisfy the branch setup precondition using `new-branch` when needed' "$SKILL"

  for outcome in ready-for-agent ready-for-human wontfix; do
    assert_match "\`$outcome\`" "$SKILL"
  done
  assert_match 'valid work outside the issue' "$SKILL"
  assert_match 'future reviewers would otherwise re-raise' "$SKILL"
  assert_match 'There is no `needs-info` state' "$SKILL"
  assert_match 'Latest `review-code` result, or that it was skipped because no reviewable[[:space:]]+local changes existed' "$SKILL"
  assert_match 'the outcome\.' "$SKILL"
  assert_match 'short, direct, and human-readable' "$SKILL"
  assert_match 'Collapse routine verification into one concise line' "$SKILL"
  assert_match 'include the issue, PR, and branch links' "$SKILL"
  assert_match 'Child skill halt reasons, only when a halt changes' "$SKILL"
  assert_match '\[#190\]\(https://github\.com/patinaproject/skills/issues/190\)' "$SKILL"
  assert_match '\[PR #197\]\(https://github\.com/patinaproject/skills/pull/197\)' "$SKILL"
  assert_match '\[branch `190-human-focused-final-output`\]\(https://github\.com/patinaproject/skills/tree/190-human-focused-final-output\)' "$SKILL"
  assert_match '[Ff]ailed checks, skipped checks, unresolved risks' "$SKILL"
  assert_match 'token or budget[[:space:]]+reporting after the result' "$SKILL"
  assert_match 'Good final output' "$SKILL"
  assert_match 'Bad final output' "$SKILL"
  assert_match 'Done: \[#190\]' "$SKILL"
  assert_match 'Verified: routine checks passed \(targeted tests, lint, type-check, PR checks\)' "$SKILL"
  assert_match 'Avoid final output shaped like a process transcript' "$SKILL"
  assert_match 'translate child skill[[:space:]]+reports into the final-report vocabulary' "$SKILL"
  assert_match 'Do not forward child-skill gate[[:space:]]+inventories' "$SKILL"
  assert_match 'Do not repeat `finish-pr` readiness gates' "$SKILL"
  assert_no_match 'Final gate is clean' "$SKILL"
  assert_order 'Done: \[#190\]' 'Changed:' "$SKILL"
  assert_order 'Changed:' 'Verified: routine checks passed' "$SKILL"
  assert_match 'Production-readiness case' "$SKILL"
  assert_match 'Verification commands and results' "$SKILL"
  assert_match 'Relevant tests added or updated' "$SKILL"
  assert_match 'Local review result and finding dispositions' "$SKILL"
  assert_match 'PR review and check feedback status' "$SKILL"
  assert_match 'Residual risks or test gaps, or `none identified`' "$SKILL"
  assert_no_match '100% production ready' "$SKILL"
  assert_no_match 'fixed mandatory implementation sequence' "$SKILL"
  assert_no_match 'receiving-code-review' "$SKILL"
  assert_no_match 'requesting-code-review' "$SKILL"
  assert_no_match 'Superpowers' "$SKILL"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT develop-issue workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: develop-issue workflow assertions passed"
