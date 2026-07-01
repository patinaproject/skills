---
name: working-on-github-issue
description: "Begin work on one same-repository GitHub issue: validate the reference, mark it started (self-assign and Project status, best-effort), and land on its issue-linked branch. Use when starting issue-linked work, or when a controller skill needs the shared begin-work step before building."
---

# Start On Issue

## Quick Start

Invoke with exactly one same-repository GitHub issue reference:

```text
/working-on-github-issue #123
/working-on-github-issue https://github.com/<owner>/<repo>/issues/123
```

This skill is the shared **begin-work** step: validate the issue, mark it
started, and land on the issue-linked branch. It is idempotent — re-running
while already started and on the issue branch is a no-op, so a controller can
call it unconditionally.

It does not judge acceptance-criteria actionability, build, review, or open a
pull request. The controller that calls it owns those decisions.

## Required Child Skill

- `new-branch`: issue-linked branch setup.

If `new-branch` is missing, halt and report the install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill new-branch -y
```

## Input Contract

1. Accept one bare issue number, `#<number>`, or same-repository GitHub issue
   URL.
2. Reject a missing issue reference.
3. Reject multiple issue references.
4. Reject a cross-repository issue URL.
5. Resolve the issue through the current working directory's default `gh`
   repository.

Actionability and prior-approval judgment belong to the calling controller, not
to this skill.

## Mark Started

Marking started has two independent actions: self-assignment and GitHub Project
status. Run each on a best-effort basis; neither blocks branch setup, and
neither causes a halt.

### Self-assignment

- Read the issue's current assignees from its `assignees` field (for example
  `gh issue view <number> --json assignees`). Assign only when that list is
  empty.
- When the issue has zero assignees, assign it to the current
  `gh`-authenticated user with a single issue-level call,
  `gh issue edit <number> --add-assignee @me`, run once. Resolve "myself" to
  `@me`; never hardcode a username, so the skill stays reusable across every
  consumer.
- When the issue already has one or more assignees — `@me` or anyone else — do
  nothing. Do not add `@me` as an additional assignee.
- This is one issue-level call, not a per-project-item operation.
- If the assignment call fails (permissions, missing write access, API error),
  skip and record the reason, then continue to branch setup.

### GitHub Project status

- Inspect the issue's existing GitHub Projects through its GitHub Project items
  (the issue's `projectItems` data). For each existing GitHub Project item:
  - Use project-item inspection to find a compatible field where
    Status = `In progress` is offered as an exact option and update that project
    item to `In progress`.
  - Do not add the issue to projects. Do not create project fields or status
    options.
  - Skip incompatible project items and continue when the project lacks a
    compatible status field, lacks the `In progress` option, or project-item
    inspection or updates fail due to permissions.
- Record the project status update result and the self-assignment result,
  including each updated item and skipped item reason, for the caller's report.

## Branch

Verify the current branch is the issue-linked branch for the target issue — its
name encodes the issue number per the `<issue>-<slug>` convention `new-branch`
produces.

- When it already matches, stay on it; do not run `new-branch`.
- Otherwise — including when the worktree starts on a non-default but
  non-issue-linked branch — run `new-branch` to establish the issue-linked
  branch.
- When a host-provided branch cannot or should not be renamed onto the
  issue-linked name, surface that deviation instead of forcing a switch.

End on the issue-linked branch.

## Final Report

Report for the caller:

- Issue reference, URL, and resolved title.
- Branch landed on, and whether `new-branch` ran.
- Self-assignment result only when it failed or created a human next action;
  stay silent on a successful assignment or one skipped because the issue was
  already assigned.
- Project status result only when it changed readiness, failed, or was skipped
  for a reason the caller needs.
- Any deviation that needs human attention, such as a host branch that could not
  be renamed onto the issue-linked name.
