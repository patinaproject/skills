# Acceptance criteria traceability

This doc defines the acceptance-criteria (AC) convention used in issues and pull requests. Keeping AC IDs stable across the issue, design, plan, and PR lets reviewers trace a requirement end to end.

## AC-ID format

Use `AC-<issue-number>-<integer>`, numbered from 1 within a single issue. Examples: `AC-11-1`, `AC-11-2`, `AC-123-7`. The issue number is the GitHub issue the ACs belong to, not the PR number.

## Given/When/Then phrasing

Write each AC as a single sentence in Given/When/Then form so the precondition, trigger, and observable outcome are explicit.

Example:

- AC-11-1: Given a reporter opens the feature request template, when they fill every required section, then the rendered issue contains Problem, Proposal, Acceptance Criteria, and Relationships in that order.

## Outcome, not artifact

ACs describe observable behavior, not implementation steps. Prefer "the template renders section X" over "edit file Y"; prefer "`gh issue view` shows AC-11-1" over "run sed on the body". Implementation choices belong in the design or plan, not in the AC.

## From issue to PR

The PR body mirrors the issue's ACs using the `### AC-<issue>-<n>` heading-per-AC format specified in [`AGENTS.md`](../AGENTS.md). One heading per relevant AC, a short outcome summary, and checkboxes only for operator actions that must happen before merge. Do not restate those rules here – extend `AGENTS.md` if they need to change.

Test coverage and per-AC verification rows – a `## Test coverage` matrix with
`Unit` plus the affected supported-platform columns, symbol-only status cells,
compact colon-style platform test rows (`- <Platform> test: <command, workflow
job, tool, or harness>, <environment>[, <link, verifier, or ISO>]`), required
gap checkboxes for merge-blocking missing/failing/pending validation, and prose
or explicitly optional checkbox explanations for known non-blocking gaps – are
defined by the canonical PR template at
[`.github/pull_request_template.md`](../.github/pull_request_template.md).
The template comments are the source of truth for the coverage matrix,
slim-test grammar, per-AC unit-test detail rule, per-AC content order,
operator-check rule, checkbox imperative-style rule, status-symbol rule, matrix
consistency rule, platform-evidence-or-gap rule, observable test-gap rule,
optional non-blocking gap rule, placeholder deletion rule, and
gap-acknowledgement rule; do not duplicate that grammar here.
