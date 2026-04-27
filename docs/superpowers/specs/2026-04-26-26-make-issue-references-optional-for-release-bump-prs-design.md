# Make Issue References Optional for Release Bump PRs Design

## Intent

Issue #26 updates the marketplace maintenance workflow so bot-generated plugin
release bump PRs no longer imply that each release closes a standing
marketplace issue. The issue-ID exception is limited to bot-created version bump
PRs; human-authored commits and PRs continue to require issue references.

## Problem

The plugin release bump workflow currently hardcodes issue #12 into generated
PR titles, commit messages, and PR body text. In particular, each generated PR
body says it closes the marketplace side of issue #12 for that release. That
wording makes routine release publication look like partial issue closure and
keeps old issue context attached to unrelated future releases.

The surrounding repo policy correctly expects issue references for human work:
commitlint, Commitizen prompts, PR title linting, PR body linting, the PR
template, and contributor docs expect an issue reference or closing keyword.
That policy should remain in place for humans, but bot-generated release bump
PRs need a narrow exception because no issue necessarily applies to every
version bump.

- Automated release bump PRs should not need synthetic issue references when no
  issue applies.
- Human-authored maintenance PRs should still include issue IDs.

## Proposal

Adopt a narrow bot-release-bump exception:

- Generated plugin release bump PRs use titles and commit messages such as
  `chore: bump <plugin> to <tag>`.
- Generated plugin release bump PR bodies list the plugin, tag, and source repo,
  but omit the release-specific `Closes the marketplace side...` sentence.
- Commitlint continues to require conventional commits with no scopes and
  subjects that start with `#<issue>`.
- Commitizen continues to require issue references for guided human commits.
- PR title linting continues to require issue references for normal PRs, but
  allows bot-authored release bump PRs from `bot/bump-*` branches to use
  no-issue titles.
- PR body linting continues to require a closing keyword for normal PRs, but
  allows bot-authored release bump PR bodies to omit one while remaining
  non-empty.
- Contributor docs and the PR template continue to show issue references as
  required for human PRs, while release-flow docs document the bot bump
  exception.

## Non-Goals / Implementation Notes

- Do not change marketplace manifest contents.
- Do not make issue references optional for human-authored commits or PRs.
- Do not remove support for meaningful `Closes #<issue>` or
  `Related to #<issue>` references from PR bodies.
- Preserve existing GitHub Actions pinning comments and full SHA action refs.

## Acceptance Criteria

### AC-26-1

Given the plugin release bump workflow opens a generated PR, when the PR title,
commit message, and body are rendered, then none of those fields contains the
hardcoded `#12` release-bump reference or the sentence `Closes the marketplace
side of patinaproject/skills#12 for this release.`

### AC-26-2

Given a human-authored commit message such as
`chore: bump bootstrap to v1.2.3`, when commitlint runs, then it fails because
the subject does not start with an issue ID.

### AC-26-3

Given a bot-authored release bump PR from a `bot/bump-*` branch with a title
such as `chore: bump bootstrap to v1.2.3`, when PR title linting runs, then the
title is accepted without an issue ID.

### AC-26-4

Given a human-authored PR title or body without an issue reference, when PR
linting runs, then the PR is rejected.

### AC-26-5

Given contributors read the repo guidance, PR template, release flow docs, or
Commitizen prompt, when they create a maintenance commit or PR, then the docs
make clear that issue references are required for humans and optional only for
bot-generated release bump PRs.

## Context

Relates to #26.

## Out of Scope

This issue does not change release dispatch behavior, marketplace publication
rules, dependency installation, or GitHub label policy.
