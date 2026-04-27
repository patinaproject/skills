# Design: Accommodate using-github repository rename

Issue: [patinaproject/skills#35](https://github.com/patinaproject/skills/issues/35)

## Intent

Update current marketplace and release-flow surfaces so the `github-flows`
plugin resolves through the renamed canonical repository,
`patinaproject/using-github`, while preserving the plugin's marketplace name and
existing tagged release pin.

## Context

- The issue says `patinaproject/github-flows` is being renamed to
  `patinaproject/using-github`.
- Current marketplace manifests still point the `github-flows` plugin at the old
  repository slug:
  - `.agents/plugins/marketplace.json` uses
    `https://github.com/patinaproject/github-flows.git`.
  - `.claude-plugin/marketplace.json` uses `patinaproject/github-flows`.
- `docs/release-flow.md` lists `patinaproject/github-flows` as the member plugin
  repository that dispatches release bumps.
- Historical Superpowers artifacts for issue #22 describe the original
  `github-flows` addition. Those files are records of past design and planning
  decisions, not current install or release configuration.

## Requirements

1. Current marketplace install surfaces must use `patinaproject/using-github` as
   the canonical repository location for the `github-flows` plugin.
2. Current release-flow documentation must identify `patinaproject/using-github`
   as the member plugin repository that publishes `github-flows` releases.
3. The marketplace plugin name must remain `github-flows` unless a separate
   issue explicitly changes the install name.
4. Existing release pins must remain explicit tagged refs and must not be changed
   unless verification shows the rename requires a different tag.
5. Historical issue artifacts may keep references to
   `patinaproject/github-flows` when they are describing past work rather than a
   current repository location.

## Acceptance Criteria

### AC-35-1

Given a marketplace install surface points at the old GitHub repository slug,
when the catalog is inspected, then the `github-flows` plugin source resolves to
`patinaproject/using-github`.

### AC-35-2

Given release-flow documentation names the member plugin repository for
`github-flows`, when the documentation is inspected, then it uses
`patinaproject/using-github`.

### AC-35-3

Given marketplace entries for `github-flows` are updated for the repository
rename, when the manifests are inspected, then the plugin name remains
`github-flows` and its source `ref` remains an explicit `vX.Y.Z` tag.

### AC-35-4

Given the repository still contains old-slug references after implementation,
when those references are audited, then each remaining reference is either
historical context or otherwise not a current install, release, cache, or
automation source of truth.

## Approaches Considered

### Recommended: Update current source-of-truth references only

Change the two marketplace manifests and the release-flow member-plugin list to
use `patinaproject/using-github`, then audit remaining references and document
why any old-slug references stay. This directly addresses install and release
resolution without rewriting historical planning records.

### Broad rewrite of all historical artifacts

Update every `patinaproject/github-flows` mention across old specs and plans.
This would reduce search noise, but it would also make historical records less
accurate and create unnecessary churn in artifacts that are not current sources
of truth.

### Rename the plugin itself

Change the marketplace plugin name from `github-flows` to `using-github`. This
may eventually be desirable, but it would alter the install interface and is
larger than the issue's requested repository-slug accommodation.

## Decision

Use the targeted source-of-truth update. The implementation should update:

- `.agents/plugins/marketplace.json`
- `.claude-plugin/marketplace.json`
- `docs/release-flow.md`

It should preserve the plugin name `github-flows`, preserve the pinned tag, and
leave historical Superpowers artifacts unchanged unless a remaining reference is
found to affect active install, release, cache, or automation behavior.

## Verification

- Inspect both marketplace manifests to confirm `github-flows` points to
  `patinaproject/using-github` and still pins an explicit `vX.Y.Z` ref.
- Inspect `docs/release-flow.md` to confirm the current member plugin list uses
  `patinaproject/using-github`.
- Search the repository for `patinaproject/github-flows` and classify remaining
  matches as historical or actionable.
- Run Markdown lint for edited Markdown files and JSON parsing for edited
  manifests.

## Out of Scope

- Renaming the marketplace plugin from `github-flows` to `using-github`.
- Updating old issue #22 planning artifacts that describe the original
  `github-flows` repository before the rename.
- Cutting or changing upstream plugin releases.
- Relying on GitHub redirects as the catalog's canonical repository location.

## Concerns

No approval-relevant concerns remain.
