# Design: Claude plugin description in Claude Desktop is generic ("Patina Project plugin: bootstrap") [#33](https://github.com/patinaproject/bootstrap/issues/33)

## Problem Statement

When a user opens Claude Desktop's plugin customization menu and views the bootstrap plugin entry, the rendered description is the generic fallback string **"Patina Project plugin: bootstrap"** – not a description authored by this repository. This string is not stored anywhere in the repo; Claude Desktop constructs it automatically when the surface it reads has no usable description.

The root cause has two compounding parts:

1. `.claude-plugin/plugin.json` contains a `description` field, but Claude Desktop's customization menu is not reading it (or the value is being overridden by the absence of a marketplace entry).
2. `patinaproject/skills` `.claude-plugin/marketplace.json` has `plugins: []` – bootstrap is not listed, so there is no marketplace-level description either.

Users browsing the menu cannot determine the plugin's purpose or decide whether to enable it.

## Surface Investigation and Leading Hypothesis

Claude Desktop appears to resolve plugin descriptions through at least one of two sources:

- **Local `plugin.json` `description`**: the `description` field in `.claude-plugin/plugin.json`, read directly from the installed plugin directory.
- **Marketplace listing `description`**: the description attached to the plugin's entry in the centralized `.claude-plugin/marketplace.json` in `patinaproject/skills`.

The fallback string "Patina Project plugin: bootstrap" is a pattern consistent with an auto-generated label (`<org> plugin: <name>`) produced when neither source provides usable copy. The local `description` in `.claude-plugin/plugin.json` currently reads:

> "Claude Code plugin that scaffolds and realigns repositories to the Patina Project baseline."

This is functional prose, so either Claude Desktop is not reading the local field at all (the marketplace is the authoritative source), or it is reading it but the marketplace absence causes the fallback to override it. Without access to Claude Desktop's source, the exact resolution order is unconfirmed.

**Decision: fix both surfaces.** Updating only the local `description` may be insufficient if the marketplace is the primary source. Updating only the marketplace does not keep the two surfaces consistent. Fixing both – with identical copy – eliminates the ambiguity, is low-risk, and keeps the repo and marketplace aligned regardless of which surface wins.

## Agreed Description Copy

The new description, fitting the ~120-character constraint to avoid truncation in the menu:

> "Scaffold a new repository to the Patina Project baseline – commits, PRs, PNPM tooling, agent docs, and AI-tool plugin surfaces – or realign on rerun."

Character count: 148. For the `description` field (single-line, may truncate), a shorter variant is used:

> "Scaffold or realign repositories to the Patina Project baseline: commits, PRs, PNPM tooling, agent docs, and plugin surfaces."

Character count: 125. Either variant is acceptable; the shorter form is preferred for the `description` key in `plugin.json` where space is constrained.

## Required Scope

### In-scope for this PR (patinaproject/bootstrap)

1. **Template edit (source of truth):** Update `skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl` with the new description. This is the required first step per AGENTS.md "Source of truth for repo baseline".

2. **Root mirror via realignment:** Run the local bootstrap skill in realignment mode to propagate the template change to `.claude-plugin/plugin.json`. Commit the template change and the mirrored root change together.

3. **Template convention for generated repos:** The current template uses the placeholder `{{repo-description}}` for the `description` field in generated repos. No structural change is needed – the template already guides maintainers to supply their own copy. The existing convention is sufficient for AC-33-4.

### Out of scope for this PR (separate PR in patinaproject/skills)

1. **Marketplace entry:** Add a `bootstrap` entry to `.claude-plugin/marketplace.json` in `patinaproject/skills`. This edit touches a separate repository and must be a separate PR there. It is tracked as a dependency of AC-33-3.

**Rationale for separating the marketplace PR:** `patinaproject/skills` is an independent repository with its own review cycle, versioning, and deployment gate. Coupling it into this PR would block merging the local description fix on an unrelated repo's CI. The two changes are independently deployable; sequencing them (bootstrap PR first, marketplace PR second) is the right call.

## Non-Goals

- Renaming the plugin or changing its slug (`bootstrap`).
- Reorganizing the bootstrap skill directory or its template tree.
- Adding `displayName`, `shortDescription`, `longDescription`, or `defaultPrompt` fields to `.claude-plugin/plugin.json` (those belong to the Codex manifest surface; Claude Desktop does not consume them from the Claude plugin manifest).
- Changing `.codex-plugin/plugin.json` content – the Codex manifest already has strong copy and is out of scope.
- Verifying the fix inside Claude Desktop via automated test (manual verification post-deploy is sufficient).

## Acceptance Criteria

### AC-33-1

Given a user opens Claude Desktop's plugin customization menu, when they view the bootstrap plugin entry, then they see the new repo-authored description rather than "Patina Project plugin: bootstrap".

Verification:

- [ ] After the bootstrap PR merges and the marketplace PR is live, open Claude Desktop → plugin customization menu → bootstrap entry.
- [ ] Confirm the displayed description matches the agreed copy, not the generic fallback.

### AC-33-2

Given the bootstrap repo at HEAD (after this PR merges), when a reviewer reads `.claude-plugin/plugin.json`, then the `description` field is the new agreed copy and its value matches the `description` emitted by `skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl` after a realignment run.

Verification:

- [ ] `grep '"description"' .claude-plugin/plugin.json` returns the agreed literal copy.
- [ ] `grep '"description"' skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl` returns the `{{repo-description}}` placeholder (not the literal copy – the template uses a placeholder that realignment expands into the root file).
- [ ] Both the root file and the template are in sync: the root value reflects what the template placeholder resolves to after realignment (no drift).

### AC-33-3

Given the `patinaproject/skills` marketplace at HEAD (after the separate marketplace PR merges), when a reviewer reads `.claude-plugin/marketplace.json`, then `plugins[]` includes a `bootstrap` entry with the same description.

Note: This AC is satisfied by a separate PR in `patinaproject/skills` and is out of scope for this PR. It is listed here to document the full required outcome.

Verification:

- [ ] `jq '.plugins[] | select(.name == "bootstrap")' .claude-plugin/marketplace.json` returns a non-empty result with the agreed description.

### AC-33-4

Given a fresh repository bootstrapped via this skill after the change ships, when the generated `.claude-plugin/plugin.json` is produced, then the `description` placeholder guides the maintainer toward an informative description (no generic fallback is hard-coded into the generated file).

Verification:

- [ ] In `skills/bootstrap/templates/agent-plugin/.claude-plugin/plugin.json.tmpl`, the `description` field uses the `{{repo-description}}` placeholder (not a hard-coded generic string).
- [ ] A test invocation of bootstrap on a scratch repo produces a `.claude-plugin/plugin.json` where `description` reflects the supplied `{{repo-description}}` value.

## Open Questions and Concerns

None. The surface investigation hypothesis (fix both) is the safe and correct call regardless of which surface Claude Desktop reads. The marketplace PR split is confirmed as the right sequencing decision.
