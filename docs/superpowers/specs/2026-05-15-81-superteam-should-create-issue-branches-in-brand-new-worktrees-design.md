# Design: Superteam Creates Issue Branches in Brand-New Worktrees [#81](https://github.com/patinaproject/skills/issues/81)

## Intent

Make Superteam's pre-flight branch preparation handle a freshly created worktree
that has not yet been attached to a named issue branch. The workflow should
create or reuse the issue branch before inspecting committed artifacts or
delegating teammate work.

## Problem

Superteam already auto-switches when an explicit issue is supplied and the
current branch is the repository default branch. A brand-new worktree can also
present as detached `HEAD` or as an unborn branch before the operator has created
an issue branch. In those states, Superteam can fall through into artifact
inspection and author design or plan files outside the expected issue branch.

That failure is especially risky for Superteam because its durable state is
branch-scoped: Gate 1 design artifacts, plan artifacts, implementation commits,
review evidence, and PR publication all assume work happens on the issue branch.

## Requirements

- AC-81-1: Given Superteam is started for an issue from a brand-new worktree,
  when branch preparation runs, then Superteam creates and checks out a new
  branch for that issue before making changes.
- AC-81-2: Given the issue has a number and title, when Superteam creates the
  branch, then the branch name defaults to the GitHub-recommended issue branch
  naming convention.
- AC-81-3: Given Superteam is already on an appropriate non-default issue
  branch, when branch preparation runs, then it does not create an unnecessary
  replacement branch.
- AC-81-4: Given branch creation fails, when Superteam cannot safely continue,
  then it reports the failure clearly and stops before making implementation
  changes.

## Proposed Change

Update `skills/superteam/pre-flight.md` so `## Auto-switch to issue branch`
triggers when the active issue came from an explicit `#<n>` prompt and the
current branch state is not already a matching issue branch. The trigger should
include:

- current branch equals the repository default branch;
- current branch is detached `HEAD`;
- current branch cannot be resolved because the worktree is unborn.

Keep the no-op path for an existing matching issue branch. A non-default branch
whose issue number conflicts with the explicit issue remains a halt, not an
automatic branch replacement.

Branch naming stays self-contained and deterministic:

1. resolve the issue title from `gh issue view <n> --json number,title,state`;
2. lowercase the title;
3. replace runs of non-alphanumeric characters with hyphens;
4. trim leading and trailing hyphens;
5. prepend `<issue-number>-`;
6. truncate the full string to 60 characters, preferring the previous hyphen
   boundary, then trim trailing hyphens.

This preserves the repository's existing `<issue-number>-<kebab-title>`
convention while documenting that it is the GitHub-recommended issue branch
shape for this workflow.

## Surfaces

- `skills/superteam/pre-flight.md`: authoritative portable branch procedure.
- `skills/superteam/SKILL.md`: concise pre-flight summary, rationalization
  table, and red flags.
- `skills/superteam/README.md`: user-facing behavior summary if needed.

No teammate role file needs new ownership. Team Lead already owns pre-flight and
branch preparation, and the shipped Team Lead files already require pre-flight
before delegation.

## Non-Goals

- Do not add a separate branch workflow dependency.
- Do not stash, auto-commit, or rewrite the operator's dirty worktree.
- Do not change Finisher push or PR ownership.
- Do not create or replace branches when Superteam is already on the matching
  issue branch.
- Do not infer a different issue from a detached commit when the operator
  supplied an explicit issue.

## Pressure Tests

1. RED: Superteam starts from detached `HEAD` in a clean new worktree with
   prompt `#81`. Old behavior does not match the default-branch trigger and can
   inspect artifacts before switching. GREEN: pre-flight classifies detached
   `HEAD` as branch preparation required, creates or checks out
   `81-superteam-should-create-issue-branches-in-brand-new-worktrees`, and only
   then inspects artifacts.
2. RED: Superteam starts from an unborn clean branch in a new worktree. Old
   behavior cannot compare the current branch to the default branch and may
   silently continue. GREEN: pre-flight treats unresolved current branch as
   brand-new worktree state, resolves the default branch, and switches to the
   computed issue branch or halts with a clear branch-creation failure.
3. RED: Superteam starts on `81-superteam-should-create-issue-branches-in-brand-new-worktrees`.
   A naive fix creates a replacement branch or rebases unnecessarily. GREEN:
   the matching issue branch remains a no-op.
4. RED: Superteam starts on `64-some-other-issue` while the prompt names `#81`.
   A broad fix silently switches issues. GREEN: pre-flight halts for conflicting
   active issue candidates.

## Workflow-Contract Considerations

This touches `skills/**/*.md` and Superteam's pre-flight contract, so the
writing-skills dimensions apply.

- RED/GREEN baseline obligations: the pressure tests above name the old failing
  states and the new observable behavior.
- Rationalization resistance: keep explicit table rows forbidding detached or
  unborn worktree fallthrough and forbidding branch replacement on mismatched
  non-default branches.
- Red flags: add checks for detached or unborn branch states continuing into
  artifact inspection.
- Token efficiency: keep the detailed algorithm in `pre-flight.md`; keep
  `SKILL.md` to summary, rationale, and red flags.
- Role ownership: Team Lead owns pre-flight; no Brainstormer, Planner,
  Executor, Reviewer, or Finisher contract gains branch ownership.
- Stage-gate bypass paths: branch preparation still happens before artifact
  inspection and before Gate 1 artifact creation; dirty worktrees and branch
  conflicts halt instead of being hidden.

## Adversarial Review

Reviewer context: same-thread fallback.

Findings:

- source: adversarial-review
  severity: material
  location: Proposed Change
  finding: A trigger that treats any non-matching branch as brand-new would
  silently switch away from a real branch and mask issue conflicts.
  disposition: Addressed by requiring no-op on matching issue branches and
  preserving halt behavior for conflicting non-default branch issue numbers.
- source: adversarial-review
  severity: material
  location: Pressure Tests
  finding: Detached `HEAD` and unborn branch states need separate tests because
  they fail through different Git commands.
  disposition: Addressed by separate RED/GREEN pressure tests 1 and 2.
- source: adversarial-review
  severity: minor
  location: Surfaces
  finding: Role files should not duplicate the algorithm because Team Lead
  already points to SKILL.md and pre-flight.
  disposition: Addressed by keeping role files out of scope.

Adversarial review status: findings dispositioned.

Clean pass rationale: The revised design has falsifiable RED/GREEN cases,
preserves Team Lead ownership, keeps detailed procedure text in the supporting
reference, and does not weaken Gate 1, dirty-worktree, or conflicting-issue
halts.

## Verification

- Inspect `skills/superteam/pre-flight.md` for default, detached, and unborn
  branch auto-switch triggers.
- Inspect `skills/superteam/pre-flight.md` for no-op behavior on matching issue
  branches and halt behavior for conflicting non-default issue branches.
- Inspect `skills/superteam/SKILL.md` for matching rationalization and red-flag
  updates.
- Run `pnpm lint:md`.
- Run `bash scripts/verify-superteam-contract.sh`.
