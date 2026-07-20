---
name: new-issue
description: Draft and publish a patinaproject issue with duplicate checking, repository filing rules, native relationships, and tracker verification. Use when the user asks to file, create, or publish an issue.
---

# New Issue

Read these canonical files before drafting:

- [`docs/issue-publishing.md`](../../docs/issue-publishing.md) for body,
  metadata, and publishing guardrails;
- [`docs/triage-workflow.md`](../../docs/triage-workflow.md) for the ready bar
  and ready-state side effects; and
- [`docs/issue-tracker.md`](../../docs/issue-tracker.md) for every remote
  operation.

## Workflow

1. Resolve the destination team and load the live label inventory through the
   adapter.
2. Gather the problem, desired outcome, acceptance criteria, optional proposal
   and non-goals, labels, assignee, lifecycle state, planning target, and
   explicitly stated relationships.
3. Search titles and full text for duplicates. Offer the matching issue before
   drafting a new one; an unattended path halts on a strong match.
4. Draft the body using the canonical issue-publishing structure. Keep supplied
   complete bodies verbatim.
5. Apply the confidentiality guard and validate every remote value.
6. Present the complete mutation for approval when interactive. In unattended
   mode, proceed only when every value is unambiguous.
7. Publish through the adapter. Remember that a label write replaces the full
   set.
8. Apply native relationships and verify the result.
9. If the issue was published ready, apply every ready-state side effect.
10. Report the identifier, title, URL, lifecycle state, labels, planning fields,
    and relationships.

Do not prescribe an implementation merely to make the issue look complete.
