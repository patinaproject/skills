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
- An adversarial audit found the marketplace repository README is stale: it
  omits `using-github` from the tracked member plugin list, still describes
  released plugins as pending first tagged releases, and documents install
  examples centered on `superteam` rather than every currently listed plugin.
- The same audit found the release-bump workflow updates every matching plugin
  name when duplicates exist, but it does not fail on or repair duplicate
  entries. A duplicate can therefore survive a future bump unless validation is
  added.
- Upstream release checks confirmed:
  - `bootstrap@v1.2.0` Codex and Claude manifests both declare
    `name: "bootstrap"` and `version: "1.2.0"`.
  - `superteam@v1.1.0` Codex and Claude manifests both declare
    `name: "superteam"` and `version: "1.1.0"`.
  - `using-github@v1.1.0` Codex and Claude manifests both still declare
    `name: "github-flows"` and `version: "1.1.0"`.
  - `using-github@v2.0.0` Codex and Claude manifests both declare
    `name: "using-github"` and `version: "2.0.0"`.
- The `using-github@v2.0.0` upstream editor surfaces are aligned with the new
  identity: `.cursor/rules/using-github.mdc`, `.windsurfrules`,
  `.github/copilot-instructions.md`, `AGENTS.md`, `README.md`, and
  `skills/using-github/SKILL.md` all route active GitHub work through
  `/using-github`. Remaining `github-flows` mentions in that release are
  compatibility notes or historical planning artifacts, not active marketplace
  entries.

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
8. The repository README must reflect the marketplace's current supported
   plugins and install surfaces across Codex and Claude instead of stale
   first-release or `superteam`-only language.
9. Release-bump automation or CI validation must reject duplicate marketplace
   plugin names and cross-manifest inconsistencies so future bumps cannot leave
   a broken catalog shape silently in place.
10. Verification must include upstream release manifest checks for every plugin
    entry in both marketplace manifests and editor-surface checks for active
    `using-github` rename fallout in supported editor guidance.

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

### Recommended: Remove stale entries, refresh docs, and add catalog validation

Delete only the stale `using-github@v1.1.0` entries from both manifests, keep the
existing `using-github@v2.0.0` entries unchanged, refresh marketplace README
language, and add focused validation that checks duplicates, explicit tag refs,
canonical source repositories, upstream manifest identity, editor-surface
rename fallout, and cross-manifest consistency. This directly fixes the install
failure while keeping the current intended release produced by the release bump,
and it prevents future release-bump or manual edits from reintroducing the same
catalog class silently.

### Minimal manifest-only cleanup

Remove the stale entries and stop. This would satisfy the narrow install
failure, but it would leave stale README guidance and no guard against duplicate
or inconsistent marketplace entries.

### Rewrite the stale entries to `v2.0.0`

Change both stale entries from `v1.1.0` to `v2.0.0`. This would align the stale
release ref, but it would leave duplicate `using-github` entries in both
catalogs and fail the marketplace discovery requirement.

### Revert the release bump

Remove the `v2.0.0` entries and keep the older `v1.1.0` entries. This would
avoid duplicates, but it would preserve the manifest identity mismatch that
causes Codex install failure.

## Decision

Use the targeted removal, documentation refresh, and validation approach. The
implementation should modify the marketplace manifests, README, and validation
surface needed to enforce the audited catalog invariants.

The remaining canonical entries should be:

- Agents/Codex: `name: "using-github"`,
  `source.url: "https://github.com/patinaproject/using-github.git"`,
  `source.ref: "v2.0.0"`.
- Claude: `name: "using-github"`,
  `source.repo: "patinaproject/using-github"`,
  `source.ref: "v2.0.0"`.

Historical Superpowers artifacts may retain older references when they describe
past issue work rather than current marketplace configuration.

The validation surface should catch at least these failure classes:

- duplicate plugin names within either marketplace manifest;
- missing plugin names in either Claude or Agents/Codex;
- mismatched source repositories or refs between manifests;
- non-`vX.Y.Z` refs;
- marketplace name/ref pairs whose upstream `.codex-plugin/plugin.json` or
  `.claude-plugin/plugin.json` declares a different plugin name or version;
- current README or active editor guidance that still presents `github-flows` as
  the installable marketplace identity.

## Verification

- Parse both marketplace JSON files.
- Assert each manifest has exactly one `using-github` entry.
- Assert the remaining `using-github` entries point to
  `patinaproject/using-github` and `v2.0.0`.
- Assert every plugin ref in both manifests matches `vX.Y.Z`.
- Assert each manifest has no duplicate plugin names.
- Compare both manifests by plugin name to confirm names, repository owners,
  repository names, and refs are consistent across Claude and Agents/Codex.
- Fetch each listed plugin release and confirm `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json`, and, when present, `package.json` use the same
  plugin name and version as the marketplace entry.
- Inspect README install guidance for all currently listed plugins:
  `bootstrap`, `superteam`, and `using-github`.
- Inspect active editor guidance for rename fallout:
  `.claude/settings.json`, Codex/Agents marketplace metadata, Claude marketplace
  metadata, upstream `using-github@v2.0.0` AGENTS/CLAUDE/Copilot/Cursor/Windsurf
  surfaces, and absence of repo-local `.vscode`, `.idea`, `.windsurf`, `.zed`,
  `.cursor`, `.continue`, or `.codex` configuration beyond the discovered
  marketplace and Claude settings surfaces.
- Run Markdown lint for the new design and implementation plan artifacts.

## Out of Scope

- Changing upstream `patinaproject/using-github` releases.
- Rewriting upstream plugin repository content when the current tagged release
  surfaces already align with the intended identity.
- Rewriting historical issue artifacts that accurately record past marketplace
  states.

## Concerns

No approval-relevant concerns remain.
