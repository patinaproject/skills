# Pull Request

<!--
  PR title rule (squash merges): use the exact commitlint/commitizen format so
  the squash commit can be reused unchanged — `type: #123 short description`
  (e.g. `docs: #12 add bootstrap skill guide`). This applies to PR titles only;
  GitHub issue titles stay plain-language, no conventional-commit prefix.

  Do not put an `@` immediately before an agent name such as Claude or Codex
  anywhere in this body unless you intend to trigger that agent.
-->

## Linked issue

At least one GitHub closing keyword is required for normal PRs — `Closes #<issue>`,
`Fixes #<issue>`, or `Resolves #<issue>` — one line per issue this PR completes.
`Related to #<issue>`, `Blocks #<issue>`, and `Partially satisfies #<issue>` are
additional references, not replacements for the closing keyword; add a short note
when the relationship is not obvious.

## What changed

Describe the change for a reader who has not seen the work.

<!--
  Add either optional section below only when it earns its place; otherwise omit it.

  ## Testing steps
  Ad hoc — include only when a produced artifact needs human inspection (rendered
  docs, generated files, a template, release notes). Use an unchecked box per
  pass/fail decision and state the observable outcome. GitHub Checks own routine
  automated verification; do not paste passing lint, test, type-check, or hook
  output here.

  ## Do before merging
  Work-specific operator chores that must happen after review and before merge
  (for example, rotate a secret). Keep items concrete and imperative; do not
  duplicate testing steps or CI status.
-->
