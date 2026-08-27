---
name: working-on-issue
description: "Align issue state when starting or resuming issue-linked work: resolve the ticket, use its tracker-provided branch, self-assign when unassigned, and mark it started. Use as the shared begin/resume step for one issue."
---

# Working On Issue

Resolve and align one issue before implementation. Read
`docs/issue-tracker.md` at the repository root for every tracker
operation; do not embed tracker commands here.

If `docs/issue-tracker.md` is absent, stop before any tracker operation and
report the missing path plus the skill that provides it: `scaffold-repository`
emits it as part of the core baseline. Do not fall back to invented tracker
commands or to a local-markdown tracker — this skill delegates its whole
tracker vocabulary to the adapter, so proceeding without it silently guesses
the provider.

This skill is best-effort and idempotent. Chat renaming, branch setup,
assignment, and state are independent actions: record a failed action and
continue with the others.

## Resolve one issue

Resolve in this order:

1. an explicit current issue reference supplied by the caller;
2. a current issue reference in the branch name, interpreted through the
   adapter's reference vocabulary; or
3. no issue.

Reject multiple explicit references. When no issue resolves, report `no-issue`
and return; the caller decides whether issue association is required.

Fetch the resolved ticket and relationships through the adapter. Record its
identifier, URL, title, assignee, state, blockers, and adapter-provided branch
name.

## Align

### Chat title

When the host exposes a current-chat rename capability, set the title to
`<Issue ID> <Title sentence case>` using the adapter's canonical identifier and
the fetched issue title. Convert natural-language words to sentence case while
preserving technical names, acronyms, identifiers, and code terms exactly. Use
one space between the identifier and title, and no other issue data.

Treat an unavailable rename capability as a supported no-op. Record a failed
rename but continue every other alignment action. Repeated runs set the same
title without additional state. A `no-issue` result returns before this action,
leaving the current chat title unchanged.

### Branch

Compare the current branch with the adapter-provided branch name.

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
- rename, assignment, or state failures that need human action; and
- every intentional or accidental non-issue-linked branch deviation.

Never edit the issue body or judge whether its scope is actionable.
