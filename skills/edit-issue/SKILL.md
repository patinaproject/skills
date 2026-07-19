---
name: edit-issue
description: Safely update an existing patinaproject issue, including fields, labels, lifecycle state, planning, and native relationships. Use when the user asks to edit, relabel, assign, relate, block, close, cancel, duplicate, or reopen an issue.
---

# Edit Issue

Read [`docs/issue-publishing.md`](../../docs/issue-publishing.md) for field rules
and [`docs/issue-tracker.md`](../../docs/issue-tracker.md) for every remote
operation. Read [`docs/triage-workflow.md`](../../docs/triage-workflow.md) when
the request changes lifecycle readiness.

## Workflow

1. Resolve one current ticket and fetch its fields, labels, state, planning
   data, comments, and relationships.
2. Parse the request into explicit field and relationship changes. Ask only
   when the requested end state is genuinely ambiguous.
3. Validate every referenced remote entity before mutation.
4. Compute the complete final label set because a label mutation replaces all
   labels.
5. Present the intended before/after change set when interactive. An unattended
   path proceeds only when the request already determines the final state.
6. Apply the smallest set of adapter mutations. Use native completed, canceled,
   or duplicate states and set the duplicate relation when appropriate. When
   moving an issue to Todo, apply every ready-state side effect from the triage
   workflow.
7. Fetch the issue again and verify every requested field and relationship.
8. Report the final identifier, URL, and changes; report partial failures
   precisely.

Do not edit the issue body merely to record a native relationship, and do not
change unrelated metadata.
