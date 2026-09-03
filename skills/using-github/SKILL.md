---
name: using-github
description: Work with repository settings, pull requests, reviews, checks, and releases on GitHub. Use for GitHub operations other than issue tracking.
---

# Using GitHub

Read `docs/issue-tracker.md` at the repository root before any issue work. That
file says whether the repository uses GitHub or another tracker and provides
the commands for issue searches, edits, labels, assignment, relationships,
branches, and status changes. If the file is missing, stop and say that
`scaffold-repository` provides it.

Use `/to-spec` when the user needs to publish a new specification or issue.
Begin issue work with the Engineering plugin's `working-on-issues` skill.
Follow `docs/issue-tracker.md` for all other issue work, even when it selects
GitHub.

For GitHub work:

1. Read the repository's root instructions and any documents that govern the
   requested operation.
2. Use the current directory's default `gh` repository unless the repository
   instructions allow work in another repository.
3. Check whether the repository is public before publishing text. Do not expose
   private URLs, credentials, or private paths in public pull requests or
   releases.
4. Use the appropriate instructions below.

- For pull request comments, read
  [the pull request comment instructions](workflows/pr-comments.md).
- To build, publish, and merge completed work, use the Engineering plugin's
  `patina-mode` skill, which owns the pull request and shipping workflow.
- To create or update a pull request by hand, follow the pull request template
  with `gh pr create --body-file`, honoring its draft, checks, and review rules.
- For checks, releases, repository settings, and other GitHub data, use `gh`
  after reading the repository instructions.

Use the pull request template headings in their existing order. Follow the
commit and pull request title rules in the repository's `AGENTS.md`.
