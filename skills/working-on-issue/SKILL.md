---
name: working-on-issue
description: Prepare an issue for development by finding it, switching to its branch, assigning it when unassigned, and marking it started. Use whenever issue-linked work begins or resumes.
---

# Working on an issue

Read `docs/issue-tracker.md` at the repository root before any issue operation.
It defines the tracker and its commands. If the file is missing, stop and say
that `scaffold-repository` provides it.

Run every time issue-linked work begins or resumes. Repeating the same actions
is safe. Renaming the task, changing branches, assigning the issue, and changing
its status are separate actions. If one fails, record the failure and continue
with the others.

## Find one issue

Look for an issue in this order:

1. the one explicit issue reference in the user's current request
2. an issue reference in the current branch name, interpreted by
   `docs/issue-tracker.md`
3. no issue

Reject a request with more than one explicit issue reference. When no issue is
found, return `no-issue`. The calling skill decides whether it can continue.

Fetch the issue and its relationships using `docs/issue-tracker.md`. Record the
ID, URL, title, assignee, status, blockers, and issue branch name.

## Prepare the issue

### Rename the Codex task

When the app can rename the current task, set its title to
`<Issue ID> <Title sentence case>`. Keep acronyms, identifiers, technical names,
and code terms unchanged. A missing rename tool is fine. Record other rename
failures and continue.

### Switch branches

Compare the current branch with the issue branch.

- If they match, stay on the current branch.
- If they differ, run `new-branch` with the issue.
- Keep a different branch only when the user explicitly says the current branch
  must not change. Report the branch and the reason.

Finish on the issue branch unless the user required the exception above.

### Assign the issue

If the issue has no assignee, claim it using `docs/issue-tracker.md`. Leave an
existing assignee unchanged. Record a failed assignment and continue.

### Mark it started

If the issue is neither started nor complete, mark it started using
`docs/issue-tracker.md`. Do not move it to a review status. The pull request's
draft and ready states show review progress.

## Report

Return the issue ID, URL, title, ending branch, and whether `new-branch` ran.
Include only rename, assignment, status, or branch failures that need attention.
Never edit the issue body or decide whether its requested work is clear enough.
