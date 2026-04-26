# Design: Add `patinaproject/github-flows` to the marketplace

Issue: [patinaproject/skills#22](https://github.com/patinaproject/skills/issues/22)

## Intent

Register a new member plugin, `patinaproject/github-flows`, in both marketplace manifests so users can install it via the standard `patinaproject/skills` flow, and confirm the existing release-bump automation already covers it without changes.

## Context

- Two marketplace manifests are the source of truth:
  - [.claude-plugin/marketplace.json](../../../.claude-plugin/marketplace.json) (Claude Code)
  - [.agents/plugins/marketplace.json](../../../.agents/plugins/marketplace.json) (Codex)
- Existing entries (`bootstrap`, `superteam`) are the shape contract.
- [.github/workflows/plugin-release-bump.yml](../../../.github/workflows/plugin-release-bump.yml) already handles **insert-if-missing** for any plugin name — no workflow change is required to support a new plugin.
- [docs/release-flow.md](../../../docs/release-flow.md) hard-codes an invariant: *every plugin entry pins an explicit `vX.Y.Z` ref; branch refs are not allowed; an untagged plugin is not listed at all.*

## Decision

**Wait for the first tagged release.** Do not add a `main`-tracking entry, because that violates the repo's invariant. Once `patinaproject/github-flows` cuts `v0.1.0`, the existing `plugin-release-bump.yml` workflow will receive the dispatch and open the marketplace bump PR automatically — which is precisely the third acceptance criterion (AC-22-2) of the issue.

This issue therefore resolves with **no manifest change in this PR**. What this PR delivers instead:

1. A `docs/release-flow.md` update adding `patinaproject/github-flows` to the "Current member plugins tracked by this flow" list, so the catalog of expected dispatchers is current.
2. Verification notes confirming the existing automation already covers `github-flows` insert-on-first-release without code changes.

When the upstream `release.yml` in `patinaproject/github-flows` fires `plugin-released` with `v0.1.0`, the bump PR will land the actual marketplace entry.

## Requirements

- R1: `docs/release-flow.md` lists `patinaproject/github-flows` as a tracked member plugin.
- R2: No manifest change is made until the first tagged release exists.
- R3: The existing `plugin-release-bump.yml` workflow is verified to handle the new plugin name without modification (its `exists_*=0` branch already constructs new entries with the canonical shape).
- R4: The PR description records the plan-of-record for the actual marketplace insertion (via the automated bump PR on first release).

## Acceptance criteria mapping

- **AC-22-1** (manifest lists `github-flows` alongside other Patina plugins with the same shape): satisfied by the automated bump PR opened when `v0.1.0` is published, **not by this PR**. This PR documents the contract that the bump PR must fulfill.
- **AC-22-2** (release dispatch updates the manifest entry to `v0.1.0`): satisfied by existing `plugin-release-bump.yml` — verified, no change required.
- **AC-22-3** (`/plugin install github-flows@patinaproject-skills` works after install): satisfied transitively once AC-22-1 is satisfied via the bump PR.

## Concerns

- **C1**: Issue body's fallback ("track `main` or the manifest's usual default") directly conflicts with the documented invariant in `docs/release-flow.md`. The design resolves this by deferring the manifest entry to the automated first-release bump PR. **Operator confirmation requested.**
- **C2**: AC-22-1 is not closed by *this* PR — it is closed by the bump PR. The issue should remain open after this PR merges, or the PR description should explicitly state that AC-22-1 will close on the upstream release. **Operator confirmation requested on whether this PR uses `Closes #22` or a non-closing reference.**

## Out of scope

- Authoring `github-flows` skills (tracked upstream).
- Changes to `plugin-release-bump.yml` (already handles new plugins).
- Cutting the upstream `v0.1.0` release.
