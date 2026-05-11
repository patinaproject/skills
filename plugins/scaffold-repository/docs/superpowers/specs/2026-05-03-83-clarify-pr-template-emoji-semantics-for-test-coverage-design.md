# Design: Clarify PR template emoji semantics for test coverage [#83](https://github.com/patinaproject/bootstrap/issues/83)

## Intent

Clarify the pull request template's test coverage matrix so authors can tell
the difference between missing tests and acknowledged test gaps. The change
keeps the existing PR body shape while tightening the symbol legend and the
relationship between matrix warnings and per-AC `Test gap` rows.

## Requirements

- R1: The test coverage matrix legend defines `✅` as required validation
  passed with no blocking gap for that column.
- R2: The legend defines `❌` as tests that should exist but are missing.
- R3: The legend defines `⚠️` as required validation that has an acknowledged
  gap, warning, unresolved concern, or failing/pending state that requires
  reviewer attention.
- R4: The legend defines `➖` as not relevant to this AC.
- R5: The template instructions state that every `⚠️` matrix cell must have
  one or more corresponding `⚠️ Test gap:` checkboxes under the relevant AC.
- R6: The existing `⚠️ Test gap:` row semantics stay focused on observable
  behavior, missing coverage, or unresolved validation concerns; the change
  does not turn test gaps into generic review comments or operator actions.
- R7: Root `.github/pull_request_template.md` remains byte-identical to the
  bootstrap template source at
  `skills/bootstrap/templates/core/.github/pull_request_template.md`.
- R8: `docs/ac-traceability.md` continues to delegate the detailed PR-body
  grammar to the canonical PR template, with wording updated only if needed to
  avoid contradicting the clarified symbol semantics.
- R9: The new template wording remains concise: update the symbol legend and
  the `⚠️ Test gap:` instruction without duplicating the full grammar from
  `docs/ac-traceability.md`.
- R10: PR authors and Superteam `Finisher` own rendering the matrix-to-gap
  relationship correctly in PR bodies; `Reviewer` and `Finisher` own flagging
  mismatches before publish-state readiness.
- R11: A matrix `⚠️` without corresponding per-AC `⚠️ Test gap:` detail, or a
  per-AC `⚠️ Test gap:` without a matching matrix warning when the gap maps to
  a matrix column, blocks readiness until reconciled.

## Non-Goals

- Do not redesign the pull request template or change its top-level sections.
- Do not add or remove test coverage matrix columns.
- Do not change the requirement that known test gaps are unchecked checkboxes.
- Do not introduce automated PR-body linting for the new relationship rule in
  this issue.

## Acceptance Criteria

- AC-83-1: Given an author reads the pull request template's `## Test coverage`
  legend, when tests that should exist are missing, then the legend tells the
  author to use `❌`.
- AC-83-2: Given an author reads the pull request template's `## Test coverage`
  legend, when required coverage has an acknowledged gap or warning, then the
  legend tells the author to use `⚠️`.
- AC-83-3: Given an author reads the acceptance-criteria guidance, when a real
  automated coverage gap must be called out, then the existing `⚠️ Test gap:`
  guidance remains unchanged.
- AC-83-4: Given an author marks any test coverage table cell with `⚠️`, when
  the author fills in the corresponding acceptance-criteria section, then that
  section contains one or more `⚠️ Test gap:` rows explaining the warning.

## Implementation Shape

1. Update `skills/bootstrap/templates/core/.github/pull_request_template.md`
   first.
2. Mirror the template to `.github/pull_request_template.md` according to the
   repository's round-trip discipline.
3. Review `docs/ac-traceability.md` for stale references to the old symbol
   semantics and adjust only if a direct contradiction remains.

## Verification

- Compare the mirrored PR template files with `cmp -s`.
- Search both PR template copies for the clarified symbol meanings.
- Search for stale wording that still says `❌` covers unresolved gaps.
- RED baseline: inspect the current template and record that it permits the
  target failure mode by defining `❌` as covering unresolved gaps and not
  requiring every matrix warning to map to per-AC `⚠️ Test gap:` rows.
- GREEN pressure test: render or inspect a sample PR-body excerpt with one
  missing-test cell and one acknowledged-gap cell, then verify the clarified
  template tells authors to use `❌` only for the missing-test cell and `⚠️`
  plus one or more `⚠️ Test gap:` rows for the acknowledged-gap cell.
- Run Markdown lint after the design, plan, and implementation docs are in
  place.

## Rationalization Resistance

| Rationalization | Reality |
| --- | --- |
| "`❌` already covers gaps, so no template change is needed." | Issue #83 explicitly separates missing tests from acknowledged gaps; the legend must teach that split. |
| "A table `⚠️` is self-explanatory." | The template must require corresponding `⚠️ Test gap:` rows so reviewers can inspect the reason. |
| "I'll use `❌` or `✅` to avoid creating an unchecked gap row." | Symbol choice must describe the validation state honestly; acknowledged gaps use `⚠️` and require per-AC detail. |
| "Only the root PR template matters." | The bootstrap template source is authoritative; root changes must be mirrored from it. |
| "This is only wording, so no verification is needed." | PR-template wording is workflow behavior; verification must prove the shipped template and root mirror agree. |

## Red Flags

- A remaining `❌` definition that includes unresolved gaps, failing validation,
  or pending validation.
- A `⚠️` definition that does not require corresponding `⚠️ Test gap:` detail.
- A matrix `⚠️` with no matching per-AC `⚠️ Test gap:` detail.
- A per-AC `⚠️ Test gap:` that maps to a matrix column but leaves that column
  marked `✅`, `❌`, or `➖`.
- Root and template-source PR templates differ after implementation.
- `docs/ac-traceability.md` contradicts the clarified symbol split.

## Brainstormer Self-Review

- Placeholder scan: no placeholders remain.
- Internal consistency: `❌` is reserved for missing tests, while `⚠️` carries
  acknowledged gap and warning states with required per-AC detail.
- Scope check: the change is limited to PR-template semantics and any directly
  contradictory traceability pointer.
- Ambiguity check: failing or pending validation is intentionally treated as a
  warning/gap state unless the concrete problem is missing tests that should
  exist.
