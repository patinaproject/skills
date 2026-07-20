---
name: working-on-issue
description: "Align issue state when starting or resuming issue-linked work: resolve the ticket, use its tracker-provided branch, self-assign when unassigned, and mark it started. Use as the shared begin/resume step for one issue."
---

# Working On Issue

Resolve and align one issue before implementation. Read
[`docs/issue-tracker.md`](../../docs/issue-tracker.md) for every tracker
operation; do not embed tracker commands here.

This skill is best-effort and idempotent. Branch setup, assignment, and state
are independent actions: record a failed action and continue with the others.

## Resolve one issue

Resolve in this order:

1. an explicit current issue reference supplied by the caller;
2. a current issue reference in the branch name, interpreted through the
   adapter's reference vocabulary; or
3. no issue.

Reject multiple explicit references. When no issue resolves, report `no-issue`
and return; the caller decides whether issue association is required.

Fetch the resolved ticket and relationships through the adapter. Record its
identifier, URL, title, assignee, state, blockers, and `gitBranchName`.

## Align

### Branch

Compare the current branch with `gitBranchName` from the fetched issue.

- If they match, stay on it.
- Otherwise invoke `new-branch` with the resolved issue.
- Keep a different branch only when the caller explicitly declared the current
  branch immutable. Report that deviation and its reason.

End on the adapter-provided branch unless an explicit immutable-branch override
applies.

### Assignment

When the issue has no assignee, use the adapter's claim operation. When it is
already assigned, do nothing. Record a failed assignment but do not halt.

### Started state

When the issue is not started or completed, use the adapter's start-work
operation. Do not create or target a review state; the pull request's own
draft/ready state represents review and integration automation owns later issue
transitions.

## Report

Return:

- the identifier, URL, and title, or `no-issue`;
- the ending branch and whether `new-branch` ran;
- assignment or state failures that need human action; and
- every intentional or accidental non-issue-linked branch deviation.

Never edit the issue body or judge whether its scope is actionable.
