# Design: Redesign pull request template around test coverage and operator actions [#65](https://github.com/patinaproject/bootstrap/issues/65)

## Intent

Redesign the bootstrap PR body contract so generated PRs separate issue linkage, change summary, operator-only pre-merge actions, test coverage, and acceptance-criteria outcomes. The template must make test reporting project-specific, keep checkbox semantics reserved for operator actions, and keep root guidance aligned with the shipped bootstrap templates.

## Requirements

- R1: The canonical PR template renders top-level sections in this order: `Linked issue`, `What changed`, `Do before merging`, `Test coverage`, `Acceptance criteria`.
- R2: `Linked issue` is always present and instructs authors to use a closing reference, a related reference with explanation, or `None`.
- R3: `Test coverage` uses a matrix with `Unit` plus one column per supported platform for the project, and unsupported platform columns are removed before opening a PR.
- R4: Per-AC unit/platform test rows, manual test rows, and optional `Test gap` rows live under `Acceptance criteria`, not in `Test coverage`.
- R5: Checkboxes are reserved for work-specific operator actions that must happen before merge.
- R6: The PR-template grammar uses `test` wording instead of `evidence` wording for coverage rows.
- R7: The shipped baseline uses en dashes instead of em dashes.
- R8: Root files, bootstrap template sources, agent/editor guidance, and traceability docs describe the same PR body contract.

## Acceptance criteria

- AC-65-1: Given a PR body is rendered from the template, when an author fills it out, then the top-level sections appear in the canonical order: Linked issue, What changed, Do before merging, Test coverage, Acceptance criteria.
- AC-65-2: Given an issue applies to a PR, when the author fills Linked issue, then the section contains either a closing reference, a related reference with explanation, or `None` when no issue applies.
- AC-65-3: Given a project supports Unit tests and one or more platforms, when the author fills Test coverage, then the matrix keeps Unit and includes one column per supported project platform only.
- AC-65-4: Given acceptance criteria need test reporting, when the author fills each AC block, then unit/platform test rows, manual test rows, and optional Test gap rows live under Acceptance criteria and use plain bullets unless they are operator actions.
- AC-65-5: Given a pre-merge step requires operator action, when the author fills Do before merging, then checkboxes are used only for those work-specific operator actions and are omitted for test-reporting rows.
- AC-65-6: Given bootstrap emits baseline repo guidance, when the template changes, then root files, template sources, AGENTS guidance, and traceability docs describe the same PR body contract.

## Surfaces

- `skills/bootstrap/templates/core/.github/pull_request_template.md`
- `.github/pull_request_template.md`
- `skills/bootstrap/templates/core/AGENTS.md.tmpl`
- `AGENTS.md`
- `docs/ac-traceability.md`
- `skills/bootstrap/pr-body-template.md`
- mirrored agent/editor and contributor guidance emitted by bootstrap templates

## Workflow-Contract Safeguards

- RED baseline: the previous template mixed old test-reporting rows, manual tests, gap acknowledgements, validation, docs updates, and issue linkage in overlapping sections. That made it easy for agents to put test rows in the wrong section or use checkboxes for rows that no operator could perform.
- GREEN target: the new template names each responsibility once, keeps test reporting under the owning AC, and reserves checkboxes for operator action.
- Rationalization resistance: the template comments explicitly forbid detached `Test:` bullets, placeholder `Test gap` rows, unsupported platform columns, and checkboxes on non-operator rows.
- Token efficiency: detailed grammar lives in the PR template comments; `docs/ac-traceability.md` points to that source instead of duplicating the rules.
- Role ownership: authors fill the template, reviewers inspect the visible PR body, and operators only receive checklist items when actual pre-merge actions are required.
- Stage-gate bypass prevention: root guidance requires the PR body to use the template headings in order and keeps acceptance-criteria evidence under `Acceptance criteria`.

## Adversarial Review

Status: clean.

Reviewer context: same-thread fallback.

Checked dimensions:

- RED/GREEN baseline obligations are documented above.
- Rationalization resistance is present through explicit template comments.
- Red flags are addressed by keeping checkbox use narrow and making `Test gap` visible only when real.
- Token efficiency is preserved by avoiding duplicate grammar in traceability docs.
- Role ownership is explicit in the template and guidance.
- Stage-gate bypass paths are closed by AGENTS heading-order guidance and root/template parity checks.

Findings: none.
