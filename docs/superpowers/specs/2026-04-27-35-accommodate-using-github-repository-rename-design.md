# Design: Accommodate using-github repository rename

Issue: [patinaproject/skills#35](https://github.com/patinaproject/skills/issues/35)

## Intent

Update current marketplace and release-flow surfaces so the renamed plugin is
published and resolved as `using-github` from the canonical repository
`patinaproject/using-github`, removing current install-surface references to
`github-flows`.

## Context

- The issue says `patinaproject/github-flows` is being renamed to
  `patinaproject/using-github`.
- Current marketplace manifests still list the old `github-flows` plugin name
  and repository slug:
  - `.agents/plugins/marketplace.json` uses
    `name: "github-flows"` and
    `https://github.com/patinaproject/github-flows.git`.
  - `.claude-plugin/marketplace.json` uses `name: "github-flows"` and
    `patinaproject/github-flows`.
- `docs/release-flow.md` lists `patinaproject/github-flows` as the member plugin
  repository that dispatches release bumps.
- Historical Superpowers artifacts for issue #22 describe the original
  `github-flows` addition. Those files are records of past design and planning
  decisions, not current install or release configuration.

## Requirements

1. Current marketplace install surfaces must use `using-github` as the plugin
   name and `patinaproject/using-github` as the canonical repository location.
2. Current release-flow documentation must identify `patinaproject/using-github`
   as the member plugin repository that publishes `using-github` releases.
3. The current marketplace and release-flow surfaces must not retain
   `github-flows` as the plugin name, repository slug, or member-plugin label.
4. Existing release pins must remain explicit tagged refs and must not be changed
   unless verification shows the rename requires a different tag.
5. Historical issue artifacts may keep references to
   `patinaproject/github-flows` when they are describing past work rather than a
   current repository location.

## Acceptance Criteria

### AC-35-1

Given a marketplace install surface currently lists the old plugin identity,
when the catalog is inspected, then the plugin entry is named `using-github` and
its source resolves to `patinaproject/using-github`.

### AC-35-2

Given release-flow documentation names the member plugin repository for
`github-flows`, when the documentation is inspected, then it uses
`patinaproject/using-github`.

### AC-35-3

Given marketplace entries for `github-flows` are updated for the repository
rename, when the manifests are inspected, then no current marketplace entry is
named `github-flows` and the replacement `using-github` source `ref` remains an
explicit `vX.Y.Z` tag.

### AC-35-4

Given the repository still contains old-slug references after implementation,
when those references are audited, then each remaining reference is either
historical context or otherwise not a current install, release, cache, or
automation source of truth.

## Approaches Considered

### Recommended: Rename current source-of-truth identity surfaces

Change the two marketplace manifests and the release-flow member-plugin list to
use `using-github` and `patinaproject/using-github`, then audit remaining
references and document why any old references stay. This directly addresses
install and release resolution without rewriting historical planning records.

### Broad rewrite of all historical artifacts

Update every `patinaproject/github-flows` mention across old specs and plans.
This would reduce search noise, but it would also make historical records less
accurate and create unnecessary churn in artifacts that are not current sources
of truth.

### Preserve the plugin name while changing only the repository

Keep the marketplace plugin name as `github-flows` and only update repository
URLs. This would reduce install-surface churn, but it leaves the old name in the
current catalog after the user clarified that `github-flows` should be removed.

## Decision

Use the targeted source-of-truth identity update. The implementation should
update:

- `.agents/plugins/marketplace.json`
- `.claude-plugin/marketplace.json`
- `docs/release-flow.md`

It should remove `github-flows` from current install and release-flow surfaces,
preserve the pinned tag, and leave historical Superpowers artifacts unchanged
unless a remaining reference is found to affect active install, release, cache,
or automation behavior.

## Verification

- Inspect both marketplace manifests to confirm `using-github` points to
  `patinaproject/using-github` and still pins an explicit `vX.Y.Z` ref.
- Inspect `docs/release-flow.md` to confirm the current member plugin list uses
  `patinaproject/using-github`.
- Search the repository for `patinaproject/github-flows` and classify remaining
  matches as historical or actionable.
- Search current marketplace and release-flow surfaces for `github-flows` to
  confirm the old name is removed there.
- Run Markdown lint for edited Markdown files and JSON parsing for edited
  manifests.

## Out of Scope

- Updating old issue #22 planning artifacts that describe the original
  `github-flows` repository before the rename.
- Cutting or changing upstream plugin releases.
- Relying on GitHub redirects as the catalog's canonical repository location.

## Concerns

No approval-relevant concerns remain.
