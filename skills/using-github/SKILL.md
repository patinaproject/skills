---
name: using-github
description: GitHub forge and pull-request operations in a patinaproject repository. Use for repository metadata, pull requests, review comments, checks, releases, and other forge-only work; do not use it for issue-tracker operations.
---

# Using GitHub

Use GitHub only as the source-code forge. Issue operations belong to the
tracker-agnostic skills (`new-issue`, `edit-issue`, `working-on-issue`, and
`write-changelog`), which consult
[the issue-tracker adapter](../../docs/issue-tracker.md).

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
- Ready a completed branch: run `polish`, then `finish-pr`.
- Create or update a pull request: use `finish-pr` so the repository template,
  draft convention, checks, and review loop remain one contract.
- Inspect checks, releases, repository settings, or other forge metadata with
  `gh` after reading the owning repository guidance.

Pull request bodies use the repository template headings in order. Commits and
PR titles follow [the repository guidance](../../AGENTS.md). Public PR and release text must not
leak private repository URLs, credentials, or private path-shaped content.

Do not create, edit, label, assign, close, search, or relate issues through
GitHub. Do not derive issue branches or issue state from forge metadata when an
issue adapter operation exists.
