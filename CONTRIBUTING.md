# Contributing

Thanks for contributing to `patinaproject/skills`. Start here for repo rules; everything else lives in [`AGENTS.md`](./AGENTS.md).

## Setup

```bash
pnpm install
```

This installs dev tooling and registers the Husky hooks (`commit-msg` + `pre-commit`).

## Commit messages

Commits must follow Conventional Commits with no scope and a required Linear issue tag:

```text
type: PAT-123 short description
```

Examples:

- `feat: PAT-42 add a feature`
- `docs: PAT-17 clarify install steps`

The `commit-msg` hook enforces this. PR titles follow the same format so the squash commit can be reused verbatim.

## Markdown

All Markdown is linted with `markdownlint-cli2`. The `pre-commit` hook runs it on staged files. To lint the whole repo:

```bash
pnpm lint:md
```

## Pull requests

- Keep the PR title in commitlint format.
- Fill in the [PR template](./.github/pull_request_template.md): a `Linked issue`
  closing keyword and a plain-prose `What changed` for a reader who has not seen
  the work.
- Treat GitHub Checks as the source of truth for routine automated verification.
- Add `Testing steps` only ad hoc, when a produced artifact needs human
  inspection (rendered docs, generated files, a template, release notes).
- Bot-generated release bump PRs from `bot/bump-*` branches are the only no-issue exception.

## Further reading

- [`AGENTS.md`](./AGENTS.md) — shared workflow contract.
- [`CLAUDE.md`](./CLAUDE.md) — Claude Code–specific guidance.
- [`docs/file-structure.md`](./docs/file-structure.md) — repository layout reference.
