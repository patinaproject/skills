# Make Issue References Optional for Release Bump PRs Design

## Intent

Issue #26 updates the marketplace maintenance workflow so routine plugin release
bump PRs no longer imply that each release closes a standing marketplace issue.
The repo should still support issue references when they are meaningful, but the
automation, lint rules, and contributor guidance should not require them.

## Problem

The plugin release bump workflow currently hardcodes issue #12 into generated
PR titles, commit messages, and PR body text. In particular, each generated PR
body says it closes the marketplace side of issue #12 for that release. That
wording makes routine release publication look like partial issue closure and
keeps old issue context attached to unrelated future releases.

The surrounding repo policy also reinforces the same requirement: commitlint,
Commitizen prompts, PR title linting, PR body linting, the PR template, and
contributor docs expect an issue reference or closing keyword. That creates two
problems for marketplace maintenance:

- Automated release bump PRs need synthetic issue references even when no issue
  applies.
- Human-authored maintenance PRs cannot omit issue IDs without fighting local
  and CI policy.

## Proposal

Adopt a single optional-issue-reference policy:

- Generated plugin release bump PRs use titles and commit messages such as
  `chore: bump <plugin> to <tag>`.
- Generated plugin release bump PR bodies list the plugin, tag, and source repo,
  but omit the release-specific `Closes the marketplace side...` sentence.
- Commitlint continues to require conventional commits with no scopes and
  non-empty subjects, but no longer requires subjects to start with `#<issue>`.
- Commitizen continues to allow issue references, but treats the ticket prompt
  as optional.
- PR title linting continues to enforce conventional-commit titles and no
  scopes, but no longer requires the subject to start with an issue reference.
- PR body linting still requires a non-empty body, but no longer requires a
  closing keyword.
- Contributor docs and the PR template describe issue IDs as optional and show
  no-issue examples.

The repo can still use `Closes #<issue>` or `Related to #<issue>` when a PR
genuinely completes or relates to an issue.

## Non-Goals / Implementation Notes

- Do not change marketplace manifest contents.
- Do not remove support for issue references from commits, PR titles, or PR
  bodies.
- Do not introduce a special policy only for release-bump PRs; the simpler repo
  policy is that issue references are optional everywhere unless a specific
  issue relationship is meaningful.
- Preserve existing GitHub Actions pinning comments and full SHA action refs.

## Acceptance Criteria

### AC-26-1

Given the plugin release bump workflow opens a generated PR, when the PR title,
commit message, and body are rendered, then none of those fields contains the
hardcoded `#12` release-bump reference or the sentence `Closes the marketplace
side of patinaproject/skills#12 for this release.`

### AC-26-2

Given a commit message such as `chore: bump bootstrap to v1.2.3`, when
commitlint runs, then it passes without requiring an issue ID.

### AC-26-3

Given a PR title with a conventional-commit type, no scope, and a non-empty
subject that does not start with an issue reference, when PR title linting runs,
then the title is accepted.

### AC-26-4

Given a PR body that follows the repository PR template but does not include a
closing keyword, when PR body linting runs, then the body is accepted as long as
it is non-empty.

### AC-26-5

Given contributors read the repo guidance, PR template, release flow docs, or
Commitizen prompt, when they create a maintenance commit or PR, then the
documented examples and prompts make clear that issue references are optional.

## Context

Relates to #26.

## Out of Scope

This issue does not change release dispatch behavior, marketplace publication
rules, dependency installation, or GitHub label policy.
