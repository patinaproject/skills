---
name: execute
description: Orchestrate issue-linked development from branch setup through local review and PR readiness. Use when asked to run /execute, complete an issue end to end, or drive the standard issue-to-PR workflow.
---

# Execute

## Quick Start

Given an issue reference or implementation request, run the standard local
development lifecycle:

1. Prepare the issue branch with `new-branch`.
2. Implement through TDD.
3. Run repository-documented verification.
4. Run `review-action` locally.
5. Fix valid local review findings through TDD and rerun review until clean.
6. Hand the clean branch to `finish-pr`.

Example: `/execute #42` prepares the branch for issue `#42`, implements the
issue, reviews the local diff, fixes valid findings, and finishes the ready PR.

## Workflow

1. Read repository guidance, the issue, and any linked acceptance criteria.
2. Invoke `new-branch` for the issue reference and inherit all of its halt
   conditions.
3. Choose the next smallest behavior required by the issue.
4. Use the `tdd` skill when available. If it is unavailable, use the fallback
   loop below.
5. Run focused tests after each red-green-refactor cycle.
6. Run the repository's documented verification commands before local review.
7. Invoke `review-action` and inherit its read-only safety boundary and
   unsupported-workflow halt conditions.
8. Triage every review finding as a technical claim:
   - Fix valid branch-local findings one at a time through TDD.
   - Push back in the report on findings that are wrong, stale, already
     covered, or out of scope.
   - Halt for unclear, unverifiable, permission-sensitive, secret-sensitive,
     external-state-dependent, or product-scope findings.
9. After each valid fix, rerun focused tests, documented verification as
   needed, and `review-action`.
10. Continue until local review is clean or a human-needed blocker appears.
11. Invoke `finish-pr` only after the local review loop is clean, inheriting
    all of its guardrails and stop conditions.

## Fallback TDD

Use this only when the `tdd` skill is not installed.

1. Write one failing test for one behavior.
2. Run the focused test and confirm it fails for the expected reason.
3. Make the smallest implementation change that can pass the test.
4. Rerun the focused test and confirm it passes.
5. Refactor only while tests stay green.
6. Repeat for the next behavior.

Do not write production code before observing a failing test unless the user
explicitly exempts the task from TDD.

## Halt Conditions

Halt and report the current state when:

- Any child skill halts.
- The worktree has unrelated or ambiguous local changes.
- The issue, acceptance criteria, or branch target is ambiguous.
- A test or verification failure is not branch-local.
- Review settings are unsupported by `review-action`.
- A review finding needs human judgment, secrets, permissions, external state,
  or product-scope decisions.
- `finish-pr` reports merge, check, feedback, or publishing blockers.

## Report

The final report should include the issue, branch, verification commands,
review-action result, review findings fixed or pushed back on, and the PR URL
or halt reason.
