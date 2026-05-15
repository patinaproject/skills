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

- `Closes #<issue>` for each issue this PR completes.
- `Related to #<issue>` / `Blocks #<issue>` / `Partially satisfies #<issue>`
  for each additional issue, with a short explanation when the relationship is
  not obvious.
- `None` when no issue applies.

## What changed

Context: <prior PR, prior QA pass, follow-up issue, or `standalone - <reason>`>

- <change> - <why>

<!--
  The rendered `Context:` line and `- <change> - <why>` bullet shape are the
  structural placeholders this section requires. Replace `<...>` with actual
  values; do not delete the `Context:` line. When this PR has no prior
  context, write `Context: standalone - <reason>` (e.g.
  `Context: standalone - first pass on the new lint rule`). One bullet per
  change; the `- <why>` half states the rationale (user-visible reason or
  triggering observation), not a restatement of the change.

  Include this section only when PR-level operator steps that do not belong to
  QA, coverage gaps, or pending CI must happen after review and before merge:

  ## Do before merging

  - [ ] Rotate the production secret after deploy.

  Keep checklist items concrete, actionable, and imperative. Do not duplicate
  AC-specific coverage gaps, testing steps, or failing/pending PR checks here;
  PR check status is already reported by GitHub. Do not add this section for
  placeholders such as `None`, `N/A`, or `No work-specific pre-merge operator
  steps.`
-->

## Coverage and risks

Legend for status cells:

- PASS - required validation passed with no known relevant gap.
- WARN - sufficient to merge with a known non-blocking gap in Risks.
- BLOCKED - missing, failing, pending, or merge-blocking.
- N/A - not relevant to this AC.

The `AC` column references acceptance-criteria IDs from linked issues in
`AC-<issue>-<n>` form.

<!--
  When showing a partial example outside a PR body, label the whole example as
  an excerpt before the first omitted section or table. Actual PR bodies should
  include one table row per relevant AC when linked issues define ACs. The
  table is the primary AC summary; add prose only when it changes reviewer
  judgment. Report coverage so humans and agents can identify remaining risk,
  not as an inventory of every passed test command. Do not use checkboxes in
  this section.
-->
| AC | Requirement | Evidence | Status |
| --- | --- | --- | --- |
| AC-<issue>-<n> | <short title> | <command, job, manual source, or doc review> | PASS |

<!-- Omit this subsection when there are no notable risks or gaps. -->
### Risks

- <warning, missing coverage, merge blocker, manual-only validation, deferred
  check, or caveat>

## Testing steps

<!--
  List every operator-owned verification step here in the order the operator
  should perform or inspect it. Use checkboxes for pass/fail verification
  decisions or outcomes, not for every individual UI action. Anything the
  operator needs to see or manually verify belongs here. If no manual testing is
  needed, include one checked row explaining why.
-->

- [ ] Verify <observable outcome> after <minimal action context>.
