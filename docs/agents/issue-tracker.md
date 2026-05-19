# Issue tracker: GitHub

Issues, PRDs, and durable product/design context for this repository live in GitHub Issues for `patinaproject/skills`. Use the `gh` CLI from inside this checkout so it resolves the repository from `origin`.

## Conventions

- Create issues with the canonical templates in `.github/ISSUE_TEMPLATE/`.
- Read issues with `gh issue view <number> --comments --json number,title,body,labels,comments,state,url`.
- List issues with `gh issue list --state open --json number,title,labels,url`.
- Comment with `gh issue comment <number> --body "..."`
- Apply labels only from `gh label list`; do not invent new labels.
- Use same-repo issue references such as `#103`; do not use cross-repo issue links for workflow relationships.

## Publishing

When a skill says to publish to the issue tracker, create or update a GitHub issue in this repository. Use GitHub issues as the durable record for routine design and planning context instead of adding committed one-off plan files.
