# Pull Request

PR title rule for squash merges: use conventional-commit format for the PR title so the squash commit can be reused unchanged. Issue IDs are optional.

`type: short description`

Examples:

- `docs: add bootstrap skill guide`
- `chore: bootstrap commit hooks`

This title rule applies to pull requests only. GitHub issue titles should stay plain-language and should not use conventional-commit prefixes.

## Summary

-

## Linked issue

- `Closes #<issue>` when this PR is intended to complete the issue
- Otherwise: `Related to #<issue>` plus a short explanation of why this PR does not close it yet
- Omit this section when no issue applies

## Acceptance criteria

<!-- One heading per relevant AC. AC IDs follow the convention in docs/ac-traceability.md. -->

### AC-<issue>-<n>

Short outcome summary.

<!--
  Evidence rows: one per required platform. Fields are pipe-separated in fixed order:
  runner | env | @handle | ISO (UTC timestamp). Omit evidence rows only for ACs
  explicitly marked `[platform: none]`. Do not use detached `- Evidence:` bullets.
-->
- [ ] <Platform> evidence — <runner> | <env> | @<handle> | <ISO>
<!--
  E2E gap row: INCLUDE ONLY when automated coverage has a real gap that a reviewer
  must consciously accept. When present, the row must sit directly above the
  Manual test row and Reviewer MUST check it before merging.
  If automated coverage is comprehensive, OMIT this row entirely — do not use
  placeholder phrases like `no known gap`, `none required`, `n/a`,
  `not applicable`, or `automated coverage is sufficient`.
-->
- [ ] ⚠️ E2E gap: <what automated coverage does not verify>
<!--
  Manual test row uses the literal prefix `Manual test:`, concrete numbered steps,
  and stays unchecked until a human reviewer performs the steps and flips the box
  in the GitHub UI. Reviewer MUST check this box before merging.
-->
- [ ] Manual test: <concrete numbered steps; observed outcome>

### AC-<issue>-<n>

Deferred to `<repo-or-follow-up>`.

## Validation

- Additional validation not tied to a single AC, if any

## Docs updated

- [ ] Not needed
- [ ] Updated in this PR
