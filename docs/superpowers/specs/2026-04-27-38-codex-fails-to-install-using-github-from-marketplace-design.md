# Design: Fix duplicate using-github marketplace entries

Issue: [patinaproject/skills#38](https://github.com/patinaproject/skills/issues/38)

## Intent

Restore `using-github` marketplace install behavior by making each marketplace
manifest expose exactly one canonical `using-github` entry, pinned to the
current intended release, and by auditing the catalogs for related consistency
issues before publishing.

## Context

- The current marketplace sources of truth are:
  - [.agents/plugins/marketplace.json](../../../.agents/plugins/marketplace.json)
  - [.claude-plugin/marketplace.json](../../../.claude-plugin/marketplace.json)
- Issue #35 renamed the marketplace entry from `github-flows` to
  `using-github` while preserving the existing `v1.1.0` ref.
- Issue #36 added a release bump for `using-github@v2.0.0`, creating a second
  `using-github` entry in both marketplace manifests.
- The issue reports that `patinaproject/using-github@v1.1.0` still identifies
  its Codex manifest as `github-flows`, while
  `patinaproject/using-github@v2.0.0` identifies as `using-github`.
- Repository guidance requires plugin names, manifest names, marketplace
  entries, source repositories, and explicit tagged refs to stay aligned.

## Requirements

1. `.agents/plugins/marketplace.json` must contain exactly one plugin with
   `name: "using-github"`.
2. `.claude-plugin/marketplace.json` must contain exactly one plugin with
   `name: "using-github"`.
3. The remaining `using-github` entry in both manifests must point to
   `patinaproject/using-github` at the intended current release, `v2.0.0`.
4. The stale `v1.1.0` `using-github` entry must be removed from both
   manifests.
5. Every plugin entry in each manifest must use an explicit `vX.Y.Z` tag.
6. Both manifests must be audited for duplicate plugin names, stale refs,
   mismatched plugin names, mismatched source repositories, and inconsistent
   entries between the Claude and Agents/Codex catalogs.
7. Verification notes must document the manifest files reviewed and confirm no
   other duplicate or inconsistent plugin entries remain.

## Acceptance Criteria

### AC-38-1

The Patina Project marketplace exposes exactly one `using-github` entry in every
marketplace configuration, pointing at the intended current release.

### AC-38-2

The stale `using-github` entry that points at `v1.1.0` is removed or otherwise
corrected so marketplace name, source repository, release ref, and plugin
manifest identity agree.

### AC-38-3

All marketplace configurations in the repository are reviewed for related
catalog issues, including duplicate plugin names, stale release refs,
mismatched plugin names, mismatched source repositories, and inconsistent
entries between Claude and Agents/Codex marketplace manifests.

### AC-38-4

Verification notes document which marketplace configuration files were reviewed
and confirm no other duplicate or inconsistent plugin entries remain.

## Approaches Considered

### Recommended: Remove stale entries and verify catalog invariants

Delete only the stale `using-github@v1.1.0` entries from both manifests, keep the
existing `using-github@v2.0.0` entries unchanged, and add focused verification
that checks duplicates, explicit tag refs, canonical source repositories, and
cross-manifest consistency. This directly fixes the install failure while
keeping the current intended release produced by the release bump.

### Rewrite the stale entries to `v2.0.0`

Change both stale entries from `v1.1.0` to `v2.0.0`. This would align the stale
release ref, but it would leave duplicate `using-github` entries in both
catalogs and fail the marketplace discovery requirement.

### Revert the release bump

Remove the `v2.0.0` entries and keep the older `v1.1.0` entries. This would
avoid duplicates, but it would preserve the manifest identity mismatch that
causes Codex install failure.

## Decision

Use the targeted removal and verification approach. The implementation should
modify only the marketplace manifests unless the audit finds another current
catalog source of truth that is inconsistent.

The remaining canonical entries should be:

- Agents/Codex: `name: "using-github"`,
  `source.url: "https://github.com/patinaproject/using-github.git"`,
  `source.ref: "v2.0.0"`.
- Claude: `name: "using-github"`,
  `source.repo: "patinaproject/using-github"`,
  `source.ref: "v2.0.0"`.

Historical Superpowers artifacts may retain older references when they describe
past issue work rather than current marketplace configuration.

## Verification

- Parse both marketplace JSON files.
- Assert each manifest has exactly one `using-github` entry.
- Assert the remaining `using-github` entries point to
  `patinaproject/using-github` and `v2.0.0`.
- Assert every plugin ref in both manifests matches `vX.Y.Z`.
- Assert each manifest has no duplicate plugin names.
- Compare both manifests by plugin name to confirm names, repository owners,
  repository names, and refs are consistent across Claude and Agents/Codex.
- Run Markdown lint for the new design and implementation plan artifacts.

## Out of Scope

- Changing upstream `patinaproject/using-github` releases.
- Changing release-bump automation behavior unless the audit finds it is
  currently producing malformed entries.
- Rewriting historical issue artifacts that accurately record past marketplace
  states.

## Concerns

No approval-relevant concerns remain.
