# Contributing

Thanks for contributing to `patinaproject/skills`. Start here for repo rules; everything else lives in [`AGENTS.md`](./AGENTS.md).

## Setup

```bash
pnpm install
```

This installs dev tooling and registers the Husky hooks (`commit-msg` + `pre-commit`).

## Commit messages

Commits must follow Conventional Commits with no scope. GitHub issue tags are optional:

```text
type: short description
```

Examples:

- `feat: add a feature`
- `docs: clarify install steps`

The `commit-msg` hook enforces the conventional-commit format. PR titles follow the same format so the squash commit can be reused verbatim.

## Markdown

All Markdown is linted with `markdownlint-cli2`. The `pre-commit` hook runs it on staged files. To lint the whole repo:

```bash
pnpm lint:md
```

## Pull requests

- Keep the PR title in commitlint format.
- Fill in the [PR template](./.github/pull_request_template.md).
- Include an `Acceptance Criteria` section when a linked issue defines ACs.

## Further reading

- [`AGENTS.md`](./AGENTS.md) — shared workflow contract.
- [`CLAUDE.md`](./CLAUDE.md) — Claude Code–specific guidance.
- [`docs/file-structure.md`](./docs/file-structure.md) — repository layout reference.
