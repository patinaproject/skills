# Contributing

Thanks for contributing to `superteam`. Start here for repo rules; everything else lives in [`AGENTS.md`](./AGENTS.md).

## Setup

```bash
pnpm install
```

This installs dev tooling and registers the Husky hooks (`commit-msg` + `pre-commit`).

## Commit messages

Commits must follow Conventional Commits with no scope and a required GitHub issue tag:

```text
type: #123 short description
```

Examples:

- `feat: #42 add a feature`
- `docs: #17 clarify install steps`

Choose the commit type by product impact, not by file extension.

| Change | Type |
|--------|------|
| Adds or changes shipped behavior, including behavior expressed in Markdown skill files, workflow gates, prompt contracts, plugin metadata, marketplace behavior, generated agent instructions, or other user-visible configuration | `feat:` |
| Corrects broken shipped behavior in those same product surfaces | `fix:` |
| Explains the product without changing shipped behavior or release semantics | `docs:` |
| Performs maintenance that does not alter user-facing behavior | `chore:` |

Edits to `skills/**/SKILL.md` and adjacent skill workflow contracts are product/runtime changes by default, not documentation edits. Use `docs:` for those files only when the change is clearly explanatory-only and does not alter installed skill behavior.

Changes that should produce a release must not use non-bumping types such as `docs:` or `chore:`. Use the release-triggering type that matches the product impact.

The `commit-msg` hook enforces this. PR titles follow the same format so the squash commit can be reused verbatim.

## Markdown

All Markdown is linted with `markdownlint-cli2`. The `pre-commit` hook runs it on staged files. To lint the whole repo:

```bash
pnpm lint:md
```

## Pull requests

- Keep the PR title in commitlint format.
- Fill in the [PR template](./.github/pull_request_template.md).
- Include an `Acceptance Criteria` section when the linked issue defines ACs.

## Further reading

- [`AGENTS.md`](./AGENTS.md) — shared workflow contract.
- [`CLAUDE.md`](./CLAUDE.md) — Claude Code–specific guidance.
- [`docs/file-structure.md`](./docs/file-structure.md) — repository layout reference.
