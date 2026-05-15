# PR Body Template

`scaffold-repository` does not produce PRs itself. When a change to this repository is driven by the `superteam` workflow, use the PR template at `.github/pull_request_template.md` at the repository root. It is the canonical PR body format for every Patina Project repository and is what the emitted baseline includes.

This file exists so downstream skills that inspect adjacent skill files find a predictable set of supporting docs.

## Commit-type guidance validation reminder

When a PR touches commit-type guidance (any of `AGENTS.md`, `AGENTS.md.tmpl`, `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`, `RELEASING.md.tmpl`, or the per-tool surfaces under `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md` and their templates), include the AC-54-7 parity grep output as evidence in the relevant `Test coverage` table row, or write `empty output verified` if the grep produced no output. Non-empty blocking output belongs in `Risks` and is a hard blocker. Use `Do before merging` only when a human operator still has a work-specific action to perform before merge.
