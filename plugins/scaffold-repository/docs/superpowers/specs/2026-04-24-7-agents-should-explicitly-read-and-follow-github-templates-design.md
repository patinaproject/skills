# Design: Agents should explicitly read and follow .github templates when filing issues and PRs [#7](https://github.com/patinaproject/bootstrap/issues/7)

## Intent

Add explicit, hard-to-miss instructions in `AGENTS.md` (and the bootstrap-emitted `AGENTS.md` template) telling AI agents to read and follow `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/*.md` before creating PRs or issues. The current PR-body guidance in `AGENTS.md` describes content rules but never points at the template file as the source of truth, so agents reach for `gh ... --body "..."` with their own structure and silently bypass the template.

## Background

Discovered while closing out [#3](https://github.com/patinaproject/bootstrap/issues/3) / [#5](https://github.com/patinaproject/bootstrap/pull/5): the PR was opened with sections `Summary` / `Out of scope` / `Acceptance Criteria` / `Verification` instead of the template's `Summary` / `Linked issue` / `Acceptance criteria` / `Validation` / `Docs updated`. The fix had to come after the fact when the operator noticed.

The root cause is a documentation gap, not a tooling gap. `AGENTS.md` is the contract every agent reads first. Once it explicitly says "read the template file and structure your body to match," the bypass becomes a contract violation rather than an honest miss.

## Non-goals

- Updating the `superteam` skill itself in `patinaproject/skills` (separate cross-repo change).
- Adding new issue templates or restructuring existing ones.
- Programmatic enforcement (CI diff against the template).

## Decisions

### Add a dedicated `## Working with .github/ templates` section to `AGENTS.md`

Add the section between the existing `## Issue and PR labels` section and `## GitHub Actions pinning` so it sits inside the "things every contributor must do for issues/PRs" cluster. It must:

1. Name the exact file paths an agent should read first: `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/*.md`.
2. State the rule: a PR/issue body must use the template's section names and order verbatim, even when the body is passed inline via `--body`.
3. Recommend `gh ... --body-file <path>` workflow as the default; show the inline-body fallback as acceptable only when every template section is reproduced verbatim.
4. Cross-reference the existing PR-body acceptance-criteria rules so they read as a refinement of the template, not a parallel contract.

### Mirror the section into `skills/bootstrap/templates/core/AGENTS.md.tmpl`

Identical structure, same wording, so every scaffolded repo inherits the rule on day one. The template's wording must not reference repo-specific filenames that may not exist in a freshly-scaffolded repo (e.g. `bug_report.md` is part of the core baseline, but the wording should still degrade gracefully if a future scaffold removes one of the issue templates).

## Acceptance criteria

- **AC-7-1**: `AGENTS.md` has a `## Working with .github/ templates` section that explicitly tells agents to read `.github/pull_request_template.md` before creating a PR and the matching `.github/ISSUE_TEMPLATE/*.md` before creating an issue.
- **AC-7-2**: The section recommends `gh ... --body-file` (or a body that mirrors the template structure verbatim) and warns against inventing alternative section names.
- **AC-7-3**: The same section is present, with parallel wording, in `skills/bootstrap/templates/core/AGENTS.md.tmpl`.
- **AC-7-4**: No phantom file references – the section only names files that exist in the core baseline (`.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`).
- **AC-7-5**: `pnpm lint:md` passes.

## Verification

- `rg -n '## Working with' AGENTS.md skills/bootstrap/templates/core/AGENTS.md.tmpl` returns one match in each file.
- `rg -n 'pull_request_template.md' AGENTS.md skills/bootstrap/templates/core/AGENTS.md.tmpl` returns at least one match in each file.
- `rg -n 'ISSUE_TEMPLATE' AGENTS.md skills/bootstrap/templates/core/AGENTS.md.tmpl` returns at least one match in each file.
- `pnpm lint:md` exits 0.
- Manual readthrough: the new section's tone matches the surrounding `AGENTS.md` voice (terse, imperative).

Remaining concerns: None.
