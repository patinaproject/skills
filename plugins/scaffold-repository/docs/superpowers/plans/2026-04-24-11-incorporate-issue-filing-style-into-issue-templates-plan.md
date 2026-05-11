# Plan: Incorporate issue filing style into issue templates [#11](https://github.com/patinaproject/bootstrap/issues/11)

## Context

The design at `docs/superpowers/specs/2026-04-24-11-incorporate-issue-filing-style-into-issue-templates-design.md` (commit `6c8a55b`) is authoritative. The goal is to align `.github/ISSUE_TEMPLATE/feature_request.md` and `.github/ISSUE_TEMPLATE/bug_report.md` with the repository's issue filing style (title conventions, label taxonomy, AC-ID format, relationships) without bloating the templates.

Operator constraint: templates must stay short. They are skeletons with HTML-comment hints that link to source-of-truth docs (`.github/LABELS.md`, `docs/ac-traceability.md`). Prose lives in those docs and `AGENTS.md`, not in the templates.

## Workstreams

### T-11-1: Add `.github/LABELS.md` (AC-11-3)

Create `.github/LABELS.md` documenting the canonical label set. Contents:

- One-paragraph purpose statement explaining the file is the source of truth for when to apply each label.
- Enumerated entries for the 10 current labels: `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`, `autorelease: pending`. Each entry gets a single "when to apply" sentence.
- "Adding or changing labels" section that points back to the `gh label list --json name,description` invariant in `AGENTS.md` rather than restating it.

### T-11-2: Add `docs/ac-traceability.md` (AC-11-3)

Create `docs/ac-traceability.md` documenting AC conventions. Contents:

- AC-ID format: `AC-<issue-number>-<integer>` with examples (`AC-11-1`, `AC-11-2`).
- Given/When/Then phrasing guidance with a short example.
- Outcome-not-artifact principle: ACs describe observable behavior, not implementation artifacts.
- How ACs flow from the issue body into the PR body (point at the existing PR-body AC rules in `AGENTS.md`; do not duplicate them).

### T-11-3: Rewrite `.github/ISSUE_TEMPLATE/feature_request.md` (AC-11-1)

Replace the current feature request template with the skeleton from the design's §Section skeletons. Required sections in order:

1. Front matter (`name: Feature request`, `about`, `title: ""`, `labels: enhancement`).
2. HTML-comment header pointing at `.github/LABELS.md` and noting the plain-language title convention.
3. `## Problem`
4. `## Proposal`
5. `## Non-Goals (optional)`
6. `## Implementation Notes (optional)`
7. `## Acceptance Criteria` with an HTML comment pointing at `docs/ac-traceability.md` and a single `AC-<issue>-1` seed bullet using Given/When/Then.
8. `## Relationships` with example wording (`Relates to #123`, `Blocks #456`).

Target: roughly 30 rendered lines.

### T-11-4: Rewrite `.github/ISSUE_TEMPLATE/bug_report.md` (AC-11-2)

Replace the current bug template with the bug skeleton from the design. Required sections in order:

1. Front matter (`name: Bug report`, `about`, `title: ""`, `labels: bug`).
2. HTML-comment header pointing at `.github/LABELS.md` and noting the plain-language title convention.
3. `## Summary`
4. `## Reproduction` (numbered list scaffold).
5. `## Expected behavior`
6. `## Actual behavior` with a line reminding reporters to include logs or screenshots.
7. `## Environment` with `OS`, `Runtime / tool version`, `Repo commit or release` bullets.
8. `## Relationships`.

Target: roughly 25 rendered lines.

### T-11-5: Patch issue #11 AC IDs (operator cleanup)

Issue #11's body uses `AC-<this>-N` placeholders. Run `gh issue view 11 --json body --jq .body` to capture the current body, replace every `AC-<this>-` with `AC-11-`, and apply with `gh issue edit 11 --body-file <file>`. Verify with `gh issue view 11` afterward. No AC maps to this directly; it is operator-requested cleanup in service of AC-11-3's AC-ID format invariant.

### T-11-6: Cross-check templates and `AGENTS.md` for contradictions (AC-11-4)

After T-11-3 and T-11-4, diff the template text against `AGENTS.md` sections on title conventions, label guidance, and relationship wording. Only adjust a file if a contradiction exists; the default is no edit. Record the cross-check result in the PR validation notes. Do not broaden `AGENTS.md` prose beyond what is strictly required for template cross-references (per the design's Out of scope).

## Ordering and dependencies

1. T-11-1 and T-11-2 land first (or in the same commit as the templates) so the template links resolve on first render.
2. T-11-3 and T-11-4 land next; they depend on T-11-1 and T-11-2 for link targets.
3. T-11-5 can run independently at any point.
4. T-11-6 runs after T-11-3 and T-11-4.

All template and docs work can land in a single PR. T-11-5 is an issue-body edit and does not require a commit.

## Verification

- `pnpm lint:md` passes on the working tree.
- `find .github/ISSUE_TEMPLATE .github/LABELS.md docs/ac-traceability.md -type f` lists the feature template, bug template, labels doc, and AC traceability doc.
- `wc -l .github/ISSUE_TEMPLATE/feature_request.md .github/ISSUE_TEMPLATE/bug_report.md` reports roughly <=35 lines each. Cite the counts in the PR validation notes as evidence of the "short" constraint.
- `rg -n '\.github/LABELS\.md' .github/ISSUE_TEMPLATE` returns at least one match per template.
- `rg -n 'docs/ac-traceability\.md' .github/ISSUE_TEMPLATE/feature_request.md` returns at least one match.
- `gh issue view 11` body shows `AC-11-1` through `AC-11-4` with no remaining `<this>` placeholders.
- Manual render check: open both templates on GitHub's "New issue" UI (or inspect the raw Markdown) and confirm HTML comments are invisible in the preview while section headings remain in the documented order.
- `rg -n 'feat:|fix:' .github/ISSUE_TEMPLATE` returns no matches outside HTML comments that explicitly forbid those prefixes (guards against accidental reintroduction of conventional-commit prefixes in titles).

## Blockers

None.
