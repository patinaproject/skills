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

- At least one GitHub closing keyword is required for normal PRs:
  `Closes #<issue>`, `Fixes #<issue>`, or `Resolves #<issue>`.
- Add one closing-keyword line for each issue this PR completes.
- `Related to #<issue>` / `Blocks #<issue>` / `Partially satisfies #<issue>`
  are additional references, not replacements for the required closing keyword.
  Include a short explanation when the relationship is not obvious.

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
  verification evidence, testing steps, or pending CI must happen after review
  and before merge:

  ## Do before merging

  - [ ] Rotate the production secret after deploy.

  Keep checklist items concrete, actionable, and imperative. Do not duplicate
  testing steps or failing/pending PR checks here; PR check status is already
  reported by GitHub. Do not add this section for placeholders such as `None`,
  `N/A`, or `No work-specific pre-merge operator steps.`
-->

<!--
  Optional: include this whole section only when operator-owned manual
  verification is needed. Delete the full commented example when there is no
  operator-owned manual verification; do not leave a checked or unchecked "no
  manual testing needed" row.

## Testing steps

  Include only operator-owned actions or inspections. Use unchecked checkboxes
  for pass/fail verification decisions or outcomes, not for automated command
  output, no-op placeholders, or every individual UI action.

- [ ] Verify <observable outcome> after <minimal action context>.
-->

## Verification

<!--
  Include automated checks, targeted inspections, or explicit reasons when a
  documented check was not run. Do not use checkboxes here; reserve checkboxes
  for operator-owned manual verification in `Testing steps` and pre-merge
  operational chores in `Do before merging`.
-->
- `<command or inspection>` — <result>
