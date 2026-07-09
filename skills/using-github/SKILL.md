---
name: using-github
description: GitHub work in a Patina-conventions repository. Use when creating or editing an issue, routing issue-linked branch or PR work, rendering a milestone changelog, or handling PR review feedback.
---

# Using GitHub

This skill is the single entry point for GitHub work. Read the repository
guidance, then route each task to its procedure.

## First Checks

- Read root repository guidance such as `AGENTS.md`.
- Read local docs that govern the files or GitHub surface being changed.
- Stay in the current working directory's default `gh` repository unless the
  repository guidance explicitly allows cross-repo work.

## Required Procedures

Route each task to its procedure before taking GitHub actions. The
`workflows/` files are supporting contracts for this skill, not separate
installable skills.

- New issue: follow `workflows/new-issue.md`.
- Existing issue edit: follow `workflows/edit-issue.md`.
- Start issue work (begin-work): follow `workflows/begin-work.md` — route to
  the `working-on-github-issue` skill, which resolves the issue (from the
  reference or the current branch), marks it started (self-assign and Project
  status, best-effort), and lands on the issue-linked branch, delegating branch
  creation to `new-branch`.
- Develop an issue end to end: route to the `develop` controller, which
  drives `working-on-github-issue` → build → `polish-branch` → `finish-pr`.
- Milestone changelog: follow `workflows/write-changelog.md`.
- PR comments: follow `workflows/pr-comments.md` before replying to,
  resolving, or reporting PR review feedback handled.
- Ready a branch for review (pre-PR gate): route to the `polish-branch` skill —
  it deepens the branch architecture until settled, then reviews it to green via
  `code-review`, before finishing.
- Finish completed work: route to the `finish-pr` skill (it runs after
  `polish-branch`).

## Routing Defaults

Route to `working-on-github-issue` when the user provides an issue reference and asks to
start work, implement, fix, build, investigate, or otherwise begin issue-linked
development; it resolves the issue (from the reference or the current branch),
marks it started, and lands on the issue-linked branch. `working-on-github-issue`
is idempotent: if already on the
computed issue branch it stays put. If on a different issue branch, ask before
changing context. When the user wants one issue driven end to end (or invokes
`/develop`), route to the `develop` controller instead.

Route to `polish-branch` when the build is complete and the branch needs
readying for review before a PR — it deepens the architecture until settled,
then reviews to green. `polish-branch` runs before `finish-pr`.

Route to `finish-pr` when the user explicitly says the work is complete, asks to
publish or open a ready PR, or objective evidence shows implementation and local
verification are done. Objective evidence can include completed plan tasks,
passing documented checks, and a clean implementation diff tied to the issue.

PR creation is a midpoint, not the finish line. Do not route to `finish-pr`
merely because a branch exists, a commit exists, or the user mentioned a future
PR. Do not treat an opened PR as completion; continue through checks and existing
review feedback until ready-to-merge or blocked.

## Shared GitHub Rules

- Branches for issue work use `<issue-number>-<kebab-title>` from the default
  branch.
- Commits and squash PR titles use `type: #123 short description` with no
  scope, unless the change is breaking. Breaking changes use `type!: #123 short
  description`.
- GitHub issue titles are plain-language summaries, not conventional commits.
- Relationships are same-repo `#N` references unless repository guidance says
  otherwise.
- Public issue, PR, and changelog text must pass the public-repo leak guard.
- Duplicate checks happen before filing new issues.
- Label choices come from `gh label list`; do not invent labels, and do not
  manually apply or remove reserved release automation labels.
- Pull request bodies use the repository template headings in order.

## Public-Repo Leak Guard

Before creating or updating public issues, PRs, changelog text, or rendered
release notes:

1. Resolve the target repository and visibility with `gh repo view`.
2. If the target is public, scan the draft for private GitHub URLs and private
   path-shaped content.
3. Refuse confirmed leaks.
4. Surface ambiguous content for explicit review instead of silently rewriting.
