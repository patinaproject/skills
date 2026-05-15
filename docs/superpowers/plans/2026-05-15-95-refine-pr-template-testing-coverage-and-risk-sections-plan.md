# Plan: Refine PR template testing, coverage, and risk sections [#95](https://github.com/patinaproject/skills/issues/95)

## Approved design

- Design artifact: `docs/superpowers/specs/2026-05-15-95-refine-pr-template-testing-coverage-and-risk-sections-design.md`
- Gate 1 approval: operator explicitly approved with `lgtm` on 2026-05-15.
- Handoff commit: `12c95a9`
- Binding ACs: `AC-95-1` through `AC-95-9`.

## Goal

Update the canonical and scaffolded PR-body contract so rendered PR bodies put
operator-owned testing ahead of coverage, split `Test coverage` from optional
`Risks`, use emoji coverage statuses, omit empty optional sections, and avoid
pre-checking or inventing operator testing work.

Requirement-changing deltas are out of scope for Executor. If implementation
discovers that section names, emoji status semantics, optional-section behavior,
or scaffold source-of-truth ownership need to differ from the approved design,
halt and route back to Brainstormer.

## Workstreams

### W1: Update PR template source and dogfood copy

Update the scaffolded PR template source and root dogfood copy together.

Files:

- `skills/scaffold-repository/templates/core/.github/pull_request_template.md`
- `.github/pull_request_template.md`

Tasks:

- W1.1 Keep the template's title guidance and linked-issue guidance intact.
- W1.2 Keep optional `Do before merging` guidance after `What changed`, but
  update comments so it sits before optional `Testing steps`.
- W1.3 Replace rendered `## Coverage and risks` with rendered
  `## Test coverage`.
- W1.4 Remove the rendered status legend and all text status labels
  `PASS`, `WARN`, `BLOCKED`, and `N/A` from the active template contract.
- W1.5 Add emoji status guidance in the `Test coverage` comment: `✅` for
  covered, `⚠️` for covered with an associated risk, and `❌` for missing test
  coverage.
- W1.6 Require every `⚠️` row to have a matching AC-tied `## Risks` entry.
- W1.7 Move `Testing steps` above `Test coverage`, but keep the entire
  `Testing steps` section as a commented optional example that authors include
  only when operator-owned manual verification is needed.
- W1.8 Remove the checked "no manual testing needed" fallback. Do not introduce
  any checked testing-step example.
- W1.9 Make `## Risks` a commented optional example, included only for notable
  risks.
- W1.10 Keep the coverage table as the primary AC evidence surface, with no
  checkboxes in that section.

Acceptance criteria covered: AC-95-1 through AC-95-8.

### W2: Align root contributor guidance

Update this repository's human/agent guidance so PR authors follow the new
template rather than the old combined section.

File:

- `AGENTS.md`

Tasks:

- W2.1 Replace `Coverage and risks` guidance with `Test coverage` plus optional
  `Risks`.
- W2.2 Keep the rule that one row per relevant `AC-<issue>-<n>` belongs in the
  coverage table.
- W2.3 State that `Testing steps` is only for operator-owned manual actions or
  inspections and should be omitted when none exist.
- W2.4 State that risks, missing coverage, manual-only validation, deferred
  checks, or caveats belong in optional `Risks`, not in testing steps.
- W2.5 Keep `Do before merging` reserved for concrete pre-merge operational
  chores.

Acceptance criteria covered: AC-95-1, AC-95-2, AC-95-5, AC-95-6, AC-95-7,
AC-95-8, AC-95-9.

### W3: Align scaffolded contributor guidance

Update generated contributor docs so downstream scaffolded repos receive the
same PR-body contract.

Files:

- `skills/scaffold-repository/templates/core/AGENTS.md.tmpl`
- `skills/scaffold-repository/templates/core/CONTRIBUTING.md.tmpl`

Tasks:

- W3.1 Replace old `Coverage and risks` section references with `Test coverage`
  and optional `Risks`.
- W3.2 Update section-order language so optional `Do before merging` appears
  before optional `Testing steps`, then `Test coverage`, then optional `Risks`.
- W3.3 Preserve the instruction to use template-defined section names instead
  of inventing parallel structures.
- W3.4 Preserve checkbox ownership: testing-step checkboxes are unchecked,
  operator-owned outcomes only; no checkboxes in coverage.
- W3.5 Remove or replace any guidance that says `Risks` is a subsection under
  `Coverage and risks`.

Acceptance criteria covered: AC-95-1 through AC-95-9.

### W4: Align scaffold skill helper docs

Update adjacent scaffold skill docs that describe the PR body contract.

Files:

- `skills/scaffold-repository/SKILL.md`
- `skills/scaffold-repository/audit-checklist.md`
- `skills/scaffold-repository/pr-body-template.md`

Tasks:

- W4.1 Update the scaffold skill PR-body convention summary to name multiple
  linked issue references, optional `Testing steps`, `Test coverage`, and
  optional `Risks`.
- W4.2 Update the audit checklist expected PR-template description to require
  `Testing steps`, `Test coverage`, optional `Risks`, emoji status guidance,
  and the no-pre-checked-testing rule.
- W4.3 Route AC-54-7 parity grep evidence in `pr-body-template.md` to
  `Test coverage`; route non-empty blocking output to `Risks`.
- W4.4 Search helper docs for stale `Coverage and risks`, text status legend,
  `### Risks`, and checked no-manual-testing guidance. Update only contract
  references, not historical design artifacts.

Acceptance criteria covered: AC-95-2 through AC-95-9.

### W5: Verify scaffold parity and stale wording

Run the design's targeted searches and repo verification commands.

Commands and expected outcomes:

- W5.1 `rg --hidden -n "Coverage and risks|PASS|WARN|BLOCKED|N/A|checked row|no manual testing needed" .github AGENTS.md skills/scaffold-repository`
  should show no active stale PR-body contract language. Historical or unrelated
  matches must be justified before handoff.
- W5.2 `rg --hidden -n "## Testing steps|## Test coverage|## Risks|✅|⚠️|❌" .github/pull_request_template.md AGENTS.md skills/scaffold-repository`
  should show the new section names, emoji guidance, and optional-section
  ownership in root and scaffold surfaces.
- W5.3 `pnpm apply:scaffold-repository:check` should pass, proving root files
  remain aligned with the emitted scaffold baseline.
- W5.4 `pnpm verify:dogfood` should pass.
- W5.5 `pnpm verify:marketplace` should pass.
- W5.6 `pnpm lint:md` should pass. If lint fails on unrelated historical docs,
  capture exact failures and run targeted lint on changed files.

Acceptance criteria covered: AC-95-1 through AC-95-9.

### W6: Prepare PR body expectations for Finisher

When implementation and local review are complete, the PR body should use the
new template contract.

Tasks:

- W6.1 Use `## Linked issue` with `Closes #95`.
- W6.2 Include `## Testing steps` only if there is an operator-owned manual
  verification action for this PR. Do not include a no-op placeholder.
- W6.3 Use `## Test coverage` with one row per `AC-95-1` through `AC-95-9`.
- W6.4 Use emoji statuses in every coverage row.
- W6.5 Include `## Risks` only if implementation leaves a risk, caveat, missing
  coverage, manual-only validation, deferred check, or merge blocker. Any `⚠️`
  row must have a matching AC-tied risk entry.

Acceptance criteria covered: AC-95-1 through AC-95-9.

## Blockers

None.
