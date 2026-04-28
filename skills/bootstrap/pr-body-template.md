# PR Body Template

`bootstrap` does not produce PRs itself. When a change to this repository is driven by the `superteam` workflow, use the PR template at `.github/pull_request_template.md` at the repository root. It is the canonical PR body format for every Patina Project repository and is what the emitted baseline includes.

This file exists so downstream skills that inspect adjacent skill files find a predictable set of supporting docs.

## Validation reminder for commit-type guidance changes

When a PR touches commit-type guidance (any of `AGENTS.md`, `AGENTS.md.tmpl`, `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`, `RELEASING.md.tmpl`, or the per-tool surfaces under `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md` and their templates), paste the AC-54-7 parity grep output into the PR body's `Validation` section — or write `empty output verified` if the grep produced no output. Non-empty output is a hard blocker.
