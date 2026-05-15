---
name: using-github
description: Use when an agent is asked to perform GitHub work in a repository that should follow using-github conventions
---

# Using GitHub

Use this skill as the single entry point for GitHub work. It owns issue
creation, issue editing, issue branch creation, milestone changelog rendering,
and pull request preparation.

## First Checks

- Read root repository guidance such as `AGENTS.md`.
- Read local docs that govern the files or GitHub surface being changed.
- Use repository templates for issues and pull requests.
- Use canonical labels from the remote label inventory.
- Do not manually apply or remove reserved release automation labels.
- Keep public-repo output free of private repository URLs, private paths, and
  private content.
- Stay in the current working directory's default `gh` repository unless the
  repository guidance explicitly allows cross-repo work.

## Required Procedures

Follow the matching procedure before taking GitHub actions. These files are
supporting workflow contracts for this skill, not separate installable skills.

- New issue: follow `workflows/new-issue.md`.
- Existing issue edit: follow `workflows/edit-issue.md`.
- Start issue work: follow `workflows/new-branch.md`.
- Milestone changelog: follow `workflows/write-changelog.md`.
- PR comments: follow `workflows/pr-comments.md` before replying to,
  resolving, or reporting PR review feedback handled.
- Pull request: read `.github/pull_request_template.md`, use the repo's PR
  title format, and include acceptance-criteria verification when the issue
  defines acceptance criteria.

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
| Invoking removed specialized skills | Use this skill and its required procedure files. |
| Inventing labels or templates | Read the repository label inventory and templates. |
| Treating PR creation as just a `gh pr create` command | Satisfy the repository PR template, title format, and acceptance-criteria rules first. |
| Including private repository context in public text | Rewrite as a public-safe summary or file in a private repository first. |
