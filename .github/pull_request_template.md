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

Context: <prior PR, prior QA pass, or follow-up issue this PR builds on, or `standalone — <reason>` when there is none>

- <change> — <why>

<!--
  The rendered `Context:` line and `- <change> — <why>` bullet shape are the
  structural placeholders this section requires. Replace `<...>` with actual
  values; do not delete the `Context:` line. When this PR has no prior
  context, write `Context: standalone — <reason>` (e.g.
  `Context: standalone — first pass on the new lint rule`). One bullet per
  change; the `— <why>` half states the rationale (user-visible reason or
  triggering observation), not a restatement of the change.

  Include this section only when PR-level operator steps that do not belong to
  a specific AC must happen after review and before merge:

  ## Do before merging

  - [ ] Rotate the production secret after deploy.

  Keep checklist items concrete, actionable, and imperative. Do not duplicate
  AC-specific coverage gaps, testing steps, or failing/pending PR checks here;
  PR check status is already reported by GitHub. Do not add this section for
  placeholders such as `None`, `N/A`, or `No work-specific pre-merge operator
  steps.` To include an intentionally optional checkbox, put a
  `pr-checkbox: optional` HTML comment immediately above that checkbox.
-->

## Test coverage

Legend for status cells:

- ✅ — required validation passed with no known relevant gap for this column.
- ⚠️ — validation exists and is sufficient to merge with a known non-blocking gap documented under the AC.
- ❌ — required validation is missing, failing, pending, or merge-blocked.
- ➖ — not relevant to this AC.

The `AC` column references the acceptance-criteria IDs from the linked issue, in `AC-<issue>-<n>` form.

<!--
  When showing a partial example outside a PR body, label the whole example as
  an excerpt before the first omitted section or table. Actual PR bodies must
  not omit relevant AC headings.

  Include one matrix row per relevant AC, then one subsection per AC with only
  tester-useful coverage context: what was validated, where it ran, evidence,
  known gaps or caveats, and whether manual testing is still needed. Keep the
  `Unit` column, then add one column per supported platform affected by this
  PR. Each cell summarizes the required-validation state for that AC and
  column. Use only these symbols in status cells:
  ✅ = required validation passed, with no known relevant gap for this column
  ⚠️ = validation exists and is sufficient to merge, with a known non-blocking
       gap documented under this AC
  ❌ = required validation is missing, failing, pending, or blocked by a
       merge-blocking gap
  ➖ = not relevant to this AC

  Use `➖` only when that verification type is not relevant to the AC. If an AC
  includes evidence or a gap that clearly maps to a matrix column, that cell
  must not be `➖`. If a known non-blocking gap remains after sufficient
  validation, use `⚠️` and document the gap under the AC in prose. If required
  validation is missing, failing, pending, blocked by an unresolved concern, or
  otherwise cannot yet be trusted for merge, use `❌` and document the gap under
  the AC in prose. Do not use checkboxes in this section; tester actions belong
  under `## Testing steps`.
-->
| AC | Title | Unit | <Platform> |
| --- | --- | --- | --- |
| AC-<issue>-<n> | <short title> | ➖ | ➖ |

### AC-<issue>-<n>

Coverage summary focused on what helps a human tester understand the state of this AC.

- Evidence: `<Platform> test: <command, workflow job, tool, or harness>, <environment>[, <link, verifier, or ISO>]`.
- Gap: <missing, pending, or non-blocking validation, or `None`>.
- Manual testing needed: <yes/no and why>.

<!--
  Repeat one subsection per relevant AC. Keep this section evidence-only and
  checkbox-free. Include only information that helps a reviewer or tester
  understand coverage, gaps, and whether manual exercise is still needed.
-->

<!--
  Deferred or out-of-scope ACs still get a subsection so reviewers can see why
  no testing is reported for them:

  ### AC-<issue>-<n>

  Deferred to `<repo-or-follow-up>`.
-->

## Testing steps

<!--
  Add concrete tester actions here. Use checkboxes only in this section or in
  `## Do before merging`. Steps should cover any `❌` or `⚠️` gaps called out
  in `## Test coverage` when a human can close or evaluate the gap. If no
  manual testing is needed, include one checked row explaining why.
-->

- [ ] <imperative testing step and expected result>
