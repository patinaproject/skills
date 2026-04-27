---
name: using-github
description: Use when an agent is asked to perform GitHub work in a repository that should follow github-flows conventions
---

# Using GitHub

Use this skill as the entry point for GitHub work. It orients the agent to the
repository's GitHub rules, then routes task-specific work to the specialized
github-flows skills.

## First Checks

- Read root repository guidance such as `AGENTS.md`.
- Read local docs that govern the files or GitHub surface being changed.
- Use repository templates for issues and pull requests.
- Use canonical labels from the repository label inventory.
- Do not manually apply or remove reserved release automation labels.
- Keep public-repo output free of private repository URLs, private paths, and
  private content.

## Route Work

- New issue: use `/github-flows:new-issue`.
- Existing issue edit: use `/github-flows:edit-issue`.
- Start issue work: use `/github-flows:new-branch`.
- Milestone changelog: use `/github-flows:write-changelog`.
- Pull request: read `.github/pull_request_template.md`, use the repo's PR
  title format, and include acceptance-criteria verification when the issue
  defines acceptance criteria.

## Shared GitHub Rules

- Branches for issue work use `<issue-number>-<kebab-title>` from the default
  branch.
- Commits and squash PR titles use `type: #123 short description` with no
  scope.
- GitHub issue titles are plain-language summaries, not conventional commits.
- Relationships are same-repo `#N` references unless repository guidance says
  otherwise.
- Public issue, PR, and changelog text must pass the public-repo leak guard.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Copying detailed steps from another skill into this one | Keep this skill as a router and use the specialized skill for the procedure. |
| Inventing labels or templates | Read the repository label inventory and templates. |
| Treating PR creation as just a `gh pr create` command | Satisfy the repository PR template, title format, and acceptance-criteria rules first. |
| Including private repository context in public text | Rewrite as a public-safe summary or file in a private repository first. |
