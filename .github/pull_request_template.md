# Pull Request

PR title rule for squash merges: use the exact commitlint/commitizen format for the PR title so the squash commit can be reused unchanged.

`type: #123 short description`

Examples:

- `docs: #12 add bootstrap skill guide`
- `chore: #34 bootstrap commit hooks`

This title rule applies to pull requests only. GitHub issue titles should stay plain-language and should not use conventional-commit prefixes.

## Summary

-

## Linked issue

- `Closes #<issue>` when this PR is intended to complete the issue
- Otherwise: `Related to #<issue>` plus a short explanation of why this PR does not close it yet
- Omit this section when no issue applies

## Acceptance criteria

### AC-<issue>-<n>

Short outcome summary.

- [ ] `verification command`

### AC-<issue>-<n>

Deferred to `<repo-or-follow-up>`.

## Validation

- Additional validation not tied to a single AC, if any

## Docs updated

- [ ] Not needed
- [ ] Updated in this PR
