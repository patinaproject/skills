# Pull Request

<!--
  PR title rule for squash merges: use the exact commitlint/commitizen format
  for the PR title so the squash commit can be reused unchanged.
  Pattern: `type: \#123 short description`
  Examples:
  - `docs: \#12 add bootstrap skill guide`
  - `chore: \#34 bootstrap commit hooks`
  This title rule applies to pull requests only. GitHub issue titles should stay
  plain-language and should not use conventional-commit prefixes.

  Do not put an `@` immediately before agent names such as Claude or Codex
  anywhere in the PR body unless you intentionally want to trigger that agent in
  a supported GitHub surface.
-->

## Linked issue

- `Closes #<issue>` when this PR is intended to complete the issue
- Otherwise: `Related to #<issue>` plus a short explanation of why this PR does not close it yet
- `None` when no issue applies

## What changed

-

<!--
  Include this section only when PR-level operator steps that do not belong to
  a specific AC must happen after review and before merge:

  ## Do before merging

  - [ ] Rotate the production secret after deploy.

  Keep checklist items concrete, actionable, and imperative. Do not duplicate
  AC-specific test gaps, operator checks, or failing/pending PR checks here;
  PR check status is already reported by GitHub. Do not add this section for
  placeholders such as `None`, `N/A`, or `No work-specific pre-merge operator
  steps.` To include an intentionally optional checkbox, put a
  `pr-checkbox: optional` HTML comment immediately above that checkbox.
-->

## Test coverage

<!--
  When showing a partial example outside a PR body, label the whole example as
  an excerpt before the first omitted section or table. Actual PR bodies must
  not omit relevant AC headings.

  Include one row per AC with validation evidence, a required test gap, or an
  operator check. Keep the `Unit` column, then add one column per supported
  platform affected by this PR. Deferred or bookkeeping-only ACs may be
  summarized in the AC section without a matrix row, but every relevant AC
  still needs an AC heading. Each cell summarizes the required-validation state
  for that AC and column. Use only these symbols in status cells:
  ✅ = required validation passed, with no blocking gap for this column
  ❌ = required validation missing, failing, or blocked by an unresolved gap
  ➖ = not relevant to this AC

  Use `➖` only when that verification type is not relevant to the AC. If an AC
  includes evidence, a test gap, or an operator check that clearly maps to a
  matrix column, that cell must not be `➖`. If required validation is still
  pending, use `❌` and add a test-gap checkbox until that validation passes.
-->
| AC | Title | Unit | <Platform> |
| --- | --- | --- | --- |
| AC-<issue>-<n> | <short title> | ➖ | ➖ |

## Acceptance criteria

<!--
  One heading per relevant AC. AC IDs follow the convention in
  docs/ac-traceability.md. Under each AC, use this order when present:
  summary, evidence rows, test-gap checkboxes, operator-check checkboxes.
-->

### AC-<issue>-<n>

Short outcome summary that states the current reviewer-relevant result,
including unresolved blockers or pending validation when present.

<!--
  For each supported platform that is relevant to this AC, include one evidence
  row or report the missing validation as a test-gap checkbox. Keep evidence
  rows compact and use a colon after the evidence label:
  `<Platform> test: <command, workflow job, tool, or harness>, <environment>[, <link, verifier, or ISO>]`.
  Name the concrete command, workflow job, tool, or harness when known. Use a
  neutral verifier value, such as a person, role, or run identifier. Add a unit
  evidence row only when unit evidence is the meaningful validation for this AC;
  otherwise keep unit details in the matrix or CI summary.
  If an unresolved critical or major review finding affects validation for this
  AC, describe the missing observable behavior or validation as a test-gap
  checkbox unless it belongs in Do before merging.
-->
- <Platform> test: <command, workflow job, tool, or harness>, <environment>[, <link, verifier, or ISO>]
<!--
  Include every known Test gap that the operator must consciously review. Use
  `Test gap:` to describe missing coverage or an unresolved validation concern,
  not to restate a code-review finding or duplicate an operator action. Test
  gaps must be about observable behavior, missing coverage, or validation that
  cannot yet be trusted. Treat CI that must rerun after a fix as a test gap
  unless the operator must manually trigger or inspect a specific job. Delete
  unused placeholder checkbox rows.
  Example: - [ ] ⚠️ Test gap: <observable behavior or validation not verified>
-->
- [ ] ⚠️ Test gap: <observable behavior, missing coverage, or unresolved validation concern>
<!--
  Include every known operator action below any test-gap checkboxes for this
  AC. Use the literal prefix `Operator check:` for product testing, diff
  inspection, coverage-report review, review-finding review, deployment
  evidence review, or other operator work. Include an expected decision or
  result for each operator check. Do not add generic diff-review
  checks unless the operator must inspect a specific risk, artifact, or
  unresolved decision. Do not duplicate a test gap as an operator check unless
  the operator action can close or validate the gap. Do not add product retest
  checkboxes for maintainability-only findings unless there is a behavior risk
  the operator can validate. Keep manual product or workflow validation as an
  operator check when a human must exercise observable behavior after a gap is
  fixed. Do not add CI-rerun operator checks unless the operator must manually
  trigger or inspect a specific job. When updating an existing PR body,
  preserve every existing manual-review or manual-test instruction under its AC
  in this checkbox form. Phrase checkbox text in imperative style. Delete
  unused placeholder checkbox rows.
-->
- [ ] Operator check: <imperative operator action and expected decision or result>

### AC-<issue>-<n>

Deferred to `<repo-or-follow-up>`.
