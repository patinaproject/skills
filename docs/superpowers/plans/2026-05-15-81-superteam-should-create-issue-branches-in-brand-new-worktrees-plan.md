# Plan: Superteam Creates Issue Branches in Brand-New Worktrees [#81](https://github.com/patinaproject/skills/issues/81)

## Approved Design

- Design artifact: `docs/superpowers/specs/2026-05-15-81-superteam-should-create-issue-branches-in-brand-new-worktrees-design.md`
- Gate 1 approval: operator explicitly approved on 2026-05-15.
- Handoff commit: `919c80d`

## Workstreams

### W1: Update the portable pre-flight branch procedure

Update `skills/superteam/pre-flight.md`.

Tasks:

- W1.1 Expand the auto-switch trigger from default-branch-only to explicit issue
  plus branch state that is not already the matching issue branch.
- W1.2 Define branch-state classification for default branch, detached `HEAD`,
  and unborn/unresolvable current branch.
- W1.3 Preserve dirty-worktree refusal before branch creation or checkout.
- W1.4 Preserve no-op behavior for the matching issue branch.
- W1.5 Preserve halt behavior for conflicting non-default issue branches.
- W1.6 Make clear that normal Superteam issue prompts activate branch
  preparation automatically; `new branch` is not required.

Acceptance criteria covered: AC-81-1, AC-81-2, AC-81-3, AC-81-4, AC-81-5.

### W2: Update top-level Superteam contract guardrails

Update `skills/superteam/SKILL.md`.

Tasks:

- W2.1 Add concise pre-flight summary language for detached and unborn worktree
  auto-branch preparation.
- W2.2 Add rationalization resistance rows against requiring `new branch` and
  against continuing from detached or unborn worktree states.
- W2.3 Add red flags for artifact inspection before auto-switch from detached or
  unborn branch state.

Acceptance criteria covered: AC-81-1, AC-81-4, AC-81-5.

### W3: Verify the workflow contract

Tasks:

- W3.1 Inspect `skills/superteam/pre-flight.md` for default, detached, unborn,
  matching-branch, and conflicting-branch behavior.
- W3.2 Inspect `skills/superteam/SKILL.md` for matching summary,
  rationalization, and red-flag updates.
- W3.3 Run `bash scripts/verify-superteam-contract.sh`.
- W3.4 Run `pnpm lint:md`.

## Blockers

None.
