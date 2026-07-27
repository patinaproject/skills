---
name: using-github
description: GitHub forge and pull-request operations in a patinaproject repository. Use for repository metadata, pull requests, review comments, checks, releases, and other forge-only work; do not use it for issue-tracker operations.
---

# Using GitHub

Use GitHub as the source-code forge and, for public repositories, as the issue
provider selected by
[the issue-tracker adapter](../../docs/issue-tracker.md). Issue operations
still belong to the tracker-agnostic skills (`new-issue`, `edit-issue`,
`working-on-issue`, and `write-changelog`).

## First checks

- Read root repository guidance and the docs governing the changed forge
  surface.
- Stay in the current working directory's default `gh` repository unless the
  repository explicitly allows cross-repo work.
- Resolve repository visibility before publishing text and apply the
  public-repository leak guard.

## Routes

- Pull request review feedback: read
  [the PR-comments workflow](workflows/pr-comments.md).
- Ready a completed branch: run `polish`, then `ready-pr`.
- Create or update a pull request: use `ready-pr` so the repository template,
  draft convention, checks, and review loop remain one contract.
- Merge a pull request: use `merge-pr` so merge intent stays behind repository
  auto-merge, protection, review, and strategy policy.
- Inspect checks, releases, repository settings, or other forge metadata with
  `gh` after reading the owning repository guidance.

Pull request bodies use the repository template headings in order. Commits and
PR titles follow [the repository guidance](../../AGENTS.md). Public PR and release text must not
leak private repository URLs, credentials, or private path-shaped content.

Route issue creation, editing, labels, assignment, closure, search,
relationships, branches, and state through the adapter even when it selects
GitHub.
