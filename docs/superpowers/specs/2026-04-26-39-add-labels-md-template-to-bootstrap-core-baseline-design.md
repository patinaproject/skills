# Design: Add LABELS.md template to bootstrap core baseline so /github-flows:new-issue works on freshly bootstrapped repos [#39](https://github.com/patinaproject/bootstrap/issues/39)

## Context

`/github-flows:new-issue` Step 1 hard-requires `.github/LABELS.md` and parses it strictly: a `## Labels` heading followed by a `| Name |` markdown table whose rows are alphabetically sorted by the first column, with at least `bug` and `enhancement` present. If the file is missing or shaped differently, the workflow halts before it can pick a label.

The `bootstrap` skill does not currently emit this file. `skills/bootstrap/templates/core/.github/` ships `CODEOWNERS.tmpl`, `ISSUE_TEMPLATE/`, `actionlint.yaml`, `pull_request_template.md`, and `workflows/`, but no `LABELS.md.tmpl`. As a side-effect, the bootstrap repo's own `.github/LABELS.md` was hand-authored as a bullet list and would itself trip the parser.

This design adds the template, reconciles the bootstrap repo's root file, updates the audit checklist, and adds the file to the AGENTS.md "Source of truth for repo baseline" list.

## Intent

Make `/github-flows:new-issue` work out of the box on any freshly bootstrapped repo by shipping a parser-compatible `.github/LABELS.md` from the `bootstrap` skill, while preserving the human-readable description column the bootstrap repo already documents.

## Decisions

### D1. Template location and shape

Create `skills/bootstrap/templates/core/.github/LABELS.md.tmpl` with:

- An H1 (`# Labels`) and a short prose intro identifying the file as the source of truth for label application, with a pointer to `gh label list --json name,description` as the authoritative runtime inventory.
- A `## Labels` heading (exact text — the parser keys on this).
- A two-column markdown table with header `| Name | Description |` and the divider row `| --- | --- |`.
- One row per label, alphabetically sorted by `Name` (lowercase ASCII sort).
- Canonical row set, minimum: `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`.
- A trailing `## Adding or changing labels` section pointing back at `AGENTS.md` label-hygiene rules.

**Column choice — two columns, not three.** The `/github-flows:new-issue` parser only reads column 1 (`Name`). A `Description` column is enough for humans to pick the right label and matches what `gh label list --json name,description` already returns, so the file stays trivially diff-able against the live inventory. A third "When to apply" column would duplicate the description in practice (the existing bullet-list shape of the bootstrap repo proves this — its bullets are single-sentence "apply when" descriptions) and adds a column the parser ignores. Keeping it at two columns is the YAGNI choice.

### D2. Agent-plugin mode handling

The Release-please labels (`autorelease: pending`, `autorelease: tagged`) only make sense when the repo cuts releases via release-please, which today maps 1:1 to agent-plugin mode (the `agent-plugin/` template tree is what installs `release.yml`, `release-please-config.json`, and the manifest).

Mirror the existing per-mode supplement pattern by creating a parallel template under the agent-plugin tree:

- `skills/bootstrap/templates/agent-plugin/.github/LABELS.md.supplement.tmpl`

The supplement contains a `### Release-please (tool-managed)` subsection — heading plus a short note that the labels are tool-applied and must not be hand-edited, plus two `- \`autorelease: pending\`: …` and `- \`autorelease: tagged\`: …` bullets.

Bootstrap's emitter, when running in agent-plugin mode, appends the supplement's body **after** the core template's `## Labels` table and **before** the `## Adding or changing labels` section. This keeps the parser's table-shape assertion intact (the supplement does not introduce a second `## Labels` heading or a second `| Name |` table) while documenting the reserved labels for humans.

This mirrors how `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md` and `release.yml` extend their core counterparts: a thin overlay file under a mode-specific subtree, composed at emit time. No new templating mechanism is introduced.

### D3. Audit checklist update

Add a row under "Area 2 — GitHub metadata" of `skills/bootstrap/audit-checklist.md`:

| File | Required | Check |
|---|---|---|
| `.github/LABELS.md` | yes | present; contains a `## Labels` heading; the heading is followed by a markdown table whose header row starts with `\| Name \|`; the first data column lists `bug` and `enhancement` and is alphabetically sorted |

The check is parser-shape compliance, not row-content equivalence with the template. A repo that has diverged its label set after bootstrap is not in violation, as long as the parser still passes.

The existing "Reserved GitHub labels" sub-table (which already covers `autorelease: pending` via `gh label list`) is untouched. Audit verifies the file shape; it does not re-verify the runtime label inventory from the file.

### D4. Bootstrap repo self-reconciliation

Per `AGENTS.md` "Source of truth for repo baseline": the template change and the mirrored root change must ship together in the same PR. The Executor will:

1. Add the template (D1) and the supplement (D2).
2. Run the local `bootstrap` skill against this repo in realignment mode and accept the proposed diff for `.github/LABELS.md` — converting it from the current bullet-list shape to the table shape.
3. Verify the parser shape on the regenerated root file (the audit check from D3 is the canonical assertion).

The regenerated root file must include the agent-plugin Release-please subsection because the bootstrap repo is itself an agent plugin (it ships `.claude-plugin/`, `.codex-plugin/`, `.cursor/`, `.windsurfrules`, `release-please-config.json`).

### D5. AGENTS.md "Source of truth" list update

Add `.github/LABELS.md` to the "Covered files" bullet list under `## Source of truth for repo baseline` in both:

- `AGENTS.md` (repo root, mirrored from the template).
- `skills/bootstrap/templates/core/AGENTS.md.tmpl` (the source).

Place it adjacent to the other `.github/*` entries to keep the list grouped.

## Out of scope

- Changing `/github-flows:new-issue` parser semantics (e.g. fallback to `gh label list`). The issue explicitly defers this.
- Per-repo customization tooling for label sets. Downstream repos can hand-edit after bootstrap; that path is already covered by the existing `AGENTS.md` label-hygiene guidance.
- Backfilling label descriptions on repos that have already diverged from the canonical inventory.
- Adding a CI check that re-validates the file against `gh label list` at PR time. The audit checklist covers it interactively; a CI check is a separate decision.

## Acceptance criteria

### AC-39-1

A freshly bootstrapped repo has a parser-compatible `.github/LABELS.md` at its root.

- Given a target repo bootstrapped from this skill in initial mode,
- When the bootstrap skill emits files,
- Then `.github/LABELS.md` exists at the repo root with a `## Labels` heading and a `| Name | Description |` markdown table whose first column is alphabetically sorted and includes at least `bug` and `enhancement`.

### AC-39-2

`/github-flows:new-issue` Step 1 succeeds on a freshly bootstrapped repo.

- Given a target repo bootstrapped from this skill (post-bootstrap, no further hand-edits to `.github/LABELS.md`),
- When an agent runs `/github-flows:new-issue`,
- Then Step 1's parser succeeds (no malformed-table or file-not-found halt) and the workflow proceeds to Step 2.

### AC-39-3

Agent-plugin mode adds a Release-please subsection without breaking the parser.

- Given a target repo bootstrapped in agent-plugin mode,
- When the bootstrap skill emits `.github/LABELS.md`,
- Then the file contains a `### Release-please (tool-managed)` subsection covering `autorelease: pending` and `autorelease: tagged`, placed after the `## Labels` table and before `## Adding or changing labels`,
- And the file still satisfies AC-39-1 (single `## Labels` heading, single `| Name |` table, alphabetical first column).

### AC-39-4

The bootstrap repo's own `.github/LABELS.md` is regenerated from the template in the same PR.

- Given the bootstrap repo,
- When the local `bootstrap` skill is run in realignment mode and the proposed diff is accepted,
- Then `.github/LABELS.md` at the bootstrap repo root matches the table shape emitted by the template (no bullet-list shape remains) and includes the agent-plugin Release-please subsection,
- And both the template change and the mirrored root change are committed together in the same PR (per `AGENTS.md` "Source of truth for repo baseline").

### AC-39-5

The audit checklist enforces presence and parser-shape compliance.

- Given the bootstrap audit checklist,
- When an auditor walks `skills/bootstrap/audit-checklist.md` against any bootstrapped repo,
- Then `.github/LABELS.md` presence and parser-shape compliance is one of the checked items under "Area 2 — GitHub metadata".

## Validation strategy

The Planner / Executor will rely on the audit checklist's parser-shape assertion (AC-39-5) as the canonical test for AC-39-1, AC-39-3, and AC-39-4. AC-39-2 is validated by manually invoking `/github-flows:new-issue` Step 1 against the bootstrap repo's regenerated root file (the bootstrap repo is itself a freshly-realigned target).

Markdownlint must pass on the new template files and the regenerated root file under the repo's `.markdownlint.jsonc` rules — the husky `pre-commit` hook covers this on staged files.
