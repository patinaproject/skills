---
name: using-github
description: Use when an agent is asked to perform GitHub work in a repository that should follow using-github conventions
---

# Using GitHub

Use this skill as the single entry point for GitHub work. It owns issue
creation, issue editing, issue-linked branch routing, milestone changelog
rendering, and pull request lifecycle routing.

## First Checks

- Read root repository guidance such as `AGENTS.md`.
- Read local docs that govern the files or GitHub surface being changed.
- Use the repository pull request template; issue body shape is owned by the
  workflow creating the issue.
- Use canonical labels from the remote label inventory.
- Do not manually apply or remove reserved release automation labels.
- Keep public-repo output free of private repository URLs, private paths, and
  private content.
- Stay in the current working directory's default `gh` repository unless the
  repository guidance explicitly allows cross-repo work.
- Before issue-linked development begins, route through `new-branch` unless the
  current branch is already the correct issue branch.
- After development is objectively complete, route through `finish-pr`; PR
  creation is a midpoint, not the finish line.

## Required Procedures

Follow the matching procedure before taking GitHub actions. These files are
supporting workflow contracts for this skill, not separate installable skills.

- New issue: follow `workflows/new-issue.md`.
- Existing issue edit: follow `workflows/edit-issue.md`.
- Start issue work: use the `new-branch` skill.
- Milestone changelog: follow `workflows/write-changelog.md`.
- PR comments: follow `workflows/pr-comments.md` before replying to,
  resolving, or reporting PR review feedback handled.
- Finish completed work: use the `finish-pr` skill.

## Routing Defaults

Use `new-branch` when the user provides an issue reference and asks to start
work, implement, fix, build, investigate, or otherwise begin issue-linked
development. If already on the computed issue branch, continue without switching.
If on a different issue branch, ask before changing context.

Use `finish-pr` when the user explicitly says the work is complete, asks to
publish or open a ready PR, or objective evidence shows implementation and local
verification are done. Objective evidence can include completed plan tasks,
passing documented checks, and a clean implementation diff tied to the issue.

Do not route to `finish-pr` merely because a branch exists, a commit exists, or
the user mentioned a future PR. Do not treat an opened PR as completion; continue
through checks and existing review feedback until ready-to-merge or blocked.

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
- Label choices come from `gh label list`; do not invent labels.
- Pull request bodies use the repository template headings in order.

## Public-Repo Leak Guard

Before creating or updating public issues, PRs, changelog text, or rendered
release notes:

1. Resolve the target repository and visibility with `gh repo view`.
2. If the target is public, scan the draft for private GitHub URLs and private
   path-shaped content.
3. Refuse confirmed leaks.
4. Surface ambiguous content for explicit review instead of silently rewriting.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Starting issue work on an ad hoc branch | Route through `new-branch` first. |
| Treating PR creation as completion | Route through `finish-pr` and continue through checks and feedback. |
| Inventing labels or PR structure | Read the repository label inventory and pull request template. |
| Including private repository context in public text | Rewrite as a public-safe summary or file in a private repository first. |
