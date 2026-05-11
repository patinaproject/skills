# Plan: Align AGENTS.md and PR template with new source-of-truth docs; include release-please default labels [#14](https://github.com/patinaproject/bootstrap/issues/14)

## Context

Issue #14 requires aligning `AGENTS.md` and `.github/pull_request_template.md` with the two new source-of-truth documents introduced in prior work: `.github/LABELS.md` (canonical label catalog) and `docs/ac-traceability.md` (canonical AC-ID and traceability guidance). It also requires `.github/LABELS.md` to include the release-please default labels so the catalog matches the actual live label set.

The approved design (`docs/superpowers/specs/2026-04-24-14-align-agentsmd-and-pr-template-with-new-source-of-truth-docs-include-release-please-default-labels-design.md`, commit `67bbb51`) is the authoritative reference. Scope is three surgical edits plus linting. No structural restructure of `AGENTS.md`.

## Tasks

### T-14-1: Add release-please default labels to `.github/LABELS.md`

Add a dedicated "Release-please (tool-managed)" subsection to `.github/LABELS.md` that documents both release-please default labels:

- `autorelease: pending` – relocate the existing entry into this subsection.
- `autorelease: tagged` – new entry describing its role (applied by release-please once a release is tagged).

Both entries must carry non-empty descriptions consistent with the rest of the catalog. No other label entries change. Maps to **AC-14-1**.

### T-14-2: Defer label guidance in `AGENTS.md` to `.github/LABELS.md`

Rewrite the body of the "Issue and PR labels" section in `AGENTS.md` so it is a single short paragraph that defers to `.github/LABELS.md` as the source of truth for label names, descriptions, and when to apply them. Keep the existing hygiene block verbatim:

```bash
gh label list --json name,description --jq '.[] | select(.description == "")'
```

Do not duplicate the label catalog inline. Maps to **AC-14-2**.

### T-14-3: Link AC-ID guidance from `AGENTS.md` to `docs/ac-traceability.md`

In the "Project Structure & Module Organization" section of `AGENTS.md`, append one sentence to the existing AC-ID formatting line that points readers to `docs/ac-traceability.md` for the canonical AC-ID rules and traceability guidance. Do not move or rewrite the surrounding Superpowers path guidance. Maps to **AC-14-3**.

### T-14-4: Link AC-ID guidance from the PR template to `docs/ac-traceability.md`

In `.github/pull_request_template.md`, add a single-line HTML comment directly under the `## Acceptance criteria` heading pointing contributors to `docs/ac-traceability.md`. The comment must not render in the submitted PR body and must not change any visible section headings, order, or content. Maps to **AC-14-3**.

### T-14-5: Verification pass

Run the verification commands before committing. Maps to **AC-14-4**.

## Ordering and commits

T-14-1 through T-14-4 are independent content edits and land in one commit. T-14-5 is a pre-commit verification step, not a separate commit.

Commit message (conventional commits, no scope, required issue tag, subject <= 72 chars):

```text
docs: #14 align agents and pr template with source-of-truth docs
```

## Verification

All commands run from the worktree root.

- `pnpm lint:md` → exits 0 with no markdownlint errors.
- `grep -l 'LABELS.md' AGENTS.md` → prints `AGENTS.md`.
- `grep -l 'ac-traceability.md' AGENTS.md .github/pull_request_template.md` → prints both paths.
- `grep 'autorelease: tagged' .github/LABELS.md` → one or more matches.
- `gh label list --json name,description --jq '.[] | select(.description == "")'` → empty output (hygiene invariant preserved; informational, not gating for this PR).
- Visual diff review of `AGENTS.md` and `.github/pull_request_template.md` to confirm no unintended edits outside the scoped sections.

## Blockers

None.
