# PR Body Template

`scaffold-repository` does not produce PRs itself. Use the PR template at `.github/pull_request_template.md` at the repository root. It is the canonical PR body format for every Patina Project repository and is what the emitted baseline includes.

This file exists so downstream skills that inspect adjacent skill files find a predictable set of supporting docs.

## Commit-type guidance validation reminder

GitHub Checks are the source of truth for routine automated verification. When
a PR touches commit-type guidance (any of `AGENTS.md`, `CONTRIBUTING.md`,
`docs/release-flow.md`, skill contracts, plugin manifests, marketplace
catalogs, or workflow files), do not paste parity grep output into the PR body
when the automated check passes. If the check is missing, blocked, or the
command is the only realistic way to verify a repository contract, mention the
behavior or repository contract and the limitation in `What changed` or an
outcome-oriented `Testing steps` item. Use `Do before merging` only when a
human operator still has a work-specific action to perform before merge.
