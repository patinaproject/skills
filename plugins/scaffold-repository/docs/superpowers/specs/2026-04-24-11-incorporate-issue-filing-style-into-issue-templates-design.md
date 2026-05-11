# Design: Incorporate issue filing style into issue templates [#11](https://github.com/patinaproject/bootstrap/issues/11)

## Context

The repository has a documented issue-filing style (title conventions, label guidance, acceptance-criteria format, relationship wording), but the canonical GitHub issue templates under `.github/ISSUE_TEMPLATE/` do not reflect it. Reporters relying on the templates produce issues that miss `Acceptance Criteria` sections, use inconsistent AC-ID formats, or pick labels ad-hoc. This forces reviewers to rewrite issues after the fact and creates drift between `AGENTS.md` (which governs agent behavior) and the human-facing templates (which govern reporter behavior).

The fix is to teach the templates the filing style without bloating them. Long templates discourage filing and hide the signal. The canonical prose belongs in dedicated source-of-truth docs (`.github/LABELS.md` for label taxonomy, `docs/ac-traceability.md` for AC-ID conventions) that `AGENTS.md` and the templates both reference. Templates then become short skeletons with pointers.

## Requirements

### AC-11-1

The feature request template renders the following sections in order: **Problem**, **Proposal**, optional **Non-Goals**, optional **Implementation Notes**, **Acceptance Criteria** (with Given/When/Then phrasing guidance and an AC-ID reference), **Relationships**. The template links to `docs/ac-traceability.md` for AC-ID details rather than inlining the rules.

### AC-11-2

The bug report template reflects the same shared guidance on titles, labels, and relationships as the feature template. Bug-specific sections (Summary, Reproduction, Expected/Actual, Environment) remain, and the template links to `.github/LABELS.md` and any shared filing-style anchor rather than duplicating prose.

### AC-11-3

`.github/LABELS.md` and `docs/ac-traceability.md` exist and document the canonical guidance the templates reference. `.github/LABELS.md` enumerates the current label set (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`, `autorelease: pending`) with when-to-apply guidance for each. `docs/ac-traceability.md` specifies the `AC-<issue-number>-<integer>` format, Given/When/Then phrasing, and the outcome-not-artifact principle.

### AC-11-4

The issue templates and `AGENTS.md` agree on title conventions (plain-language issue titles; no conventional-commit prefixes), label guidance (defer to `.github/LABELS.md`; do not invent labels), and relationship wording (link related issues/PRs explicitly). No section in either template contradicts `AGENTS.md`.

## Design decisions

### Keep templates short; push prose to source-of-truth docs

Each template body targets roughly 15 to 30 lines of rendered Markdown. Prose that belongs to the repository's filing style (label taxonomy, AC-ID convention, traceability expectations) lives in `.github/LABELS.md` and `docs/ac-traceability.md`. The templates link to those docs in a short header blurb and, where helpful, in a section-level pointer.

### Use HTML comments for filing hints, not visible placeholder prose

GitHub renders `<!-- ... -->` as invisible text in the final issue, so reporters see instructions while editing but the filed issue stays clean. This lets us pack more guidance into the template without bloating the rendered issue. Visible placeholder prose is kept to short phrases that frame each section ("What problem does this solve?"). Detailed filing rules go in HTML comments with a link to the source-of-truth doc.

### Section skeletons

**Feature request skeleton:**

```markdown
---
name: Feature request
about: Propose a change or new capability
title: ""
labels: enhancement
---

<!-- Title: plain-language summary (no `feat:` prefix). Labels: see .github/LABELS.md. -->

## Problem

What problem does this solve? Who is affected?

## Proposal

What should change. Be concrete about behavior, file layout, or user-visible impact.

## Non-Goals (optional)

What is explicitly out of scope.

## Implementation Notes (optional)

Constraints, risks, or pointers that help the implementer.

## Acceptance Criteria

<!-- Use AC-<issue-number>-<n> IDs and Given/When/Then phrasing.
     See docs/ac-traceability.md for the full convention. -->

- AC-<issue>-1: Given ..., when ..., then ...

## Relationships

Linked issues, PRs, or discussions (e.g. `Relates to #123`, `Blocks #456`).
```

**Bug report skeleton:**

```markdown
---
name: Bug report
about: Report a defect or unexpected behavior
title: ""
labels: bug
---

<!-- Title: plain-language summary (no `fix:` prefix). Labels: see .github/LABELS.md. -->

## Summary

Plain-language description of what's wrong.

## Reproduction

1.
2.
3.

## Expected behavior

## Actual behavior

Include error messages, logs, or screenshots when relevant.

## Environment

- OS:
- Runtime / tool version:
- Repo commit or release:

## Relationships

Linked issues, PRs, or prior reports.
```

### Source-of-truth doc outlines

`.github/LABELS.md`:

- One-paragraph purpose statement.
- Table or bullet list: each current label with a "when to apply" sentence.
- Short "Adding or changing labels" section: describes the `gh label list --json name,description` check from `AGENTS.md` and points back to it.

`docs/ac-traceability.md`:

- AC-ID format: `AC-<issue-number>-<integer>`, examples.
- Given/When/Then phrasing guidance.
- Outcome-not-artifact principle (ACs describe observable behavior, not implementation artifacts).
- How ACs flow from issue to PR body (points at the `AGENTS.md` PR-body AC rules).

### Consistency with `AGENTS.md`

`AGENTS.md` already specifies the title convention, PR-body AC formatting, and label-description invariant. Templates defer to `AGENTS.md` by reference rather than restating rules, so the templates stay short and drift risk is low.

## Out of scope / Non-Goals

- Fixing the empty description on the `autorelease: pending` label. Record as a follow-up issue; do not bundle into this change.
- Adding new labels or renaming existing ones.
- Converting templates from Markdown front-matter to GitHub issue forms (YAML). Issue forms are a larger UX change with separate tradeoffs; out of scope here.
- Editing `AGENTS.md` prose beyond what is strictly required for template cross-references (the PR-body AC rules already live there and are the source of truth).

## Open questions / concerns

Remaining concerns: None.
