# Design: Rename marketplace display names to Patina Project [#6](https://github.com/patinaproject/skills/issues/6)

## Summary

Update the public-facing marketplace display names in `patinaproject/skills` so the marketplace is presented as `Patina Project` in Codex and Claude surfaces, while keeping the internal catalog slug `patinaproject-skills` unchanged.

This issue is limited to marketplace presentation metadata and supporting documentation. It does not change plugin ownership, install sources, repository slugs, or package layout.

## Goals

- Present the marketplace consistently as `Patina Project` anywhere user-facing marketplace metadata is shown
- Preserve `patinaproject-skills` as the internal marketplace identifier for compatibility
- Keep the catalog documentation aligned with the display-name change so contributors understand the intentional split between public label and internal slug

## Non-Goals

- Renaming the repository
- Renaming the marketplace slug from `patinaproject-skills`
- Changing the `superteam` plugin slug, source repository, install path, or ref
- Reworking marketplace structure, packaging, or source-of-truth boundaries beyond the display-name copy update

## Acceptance Criteria

### AC-6-1

Codex marketplace metadata exposes the marketplace to users as `Patina Project` without changing the top-level marketplace slug `patinaproject-skills`.

### AC-6-2

Claude marketplace metadata exposes the owning catalog as `Patina Project` without changing the underlying marketplace identifier or upstream plugin source references.

### AC-6-3

Contributor-facing documentation explains that `Patina Project` is the public-facing marketplace name while `patinaproject-skills` remains the internal catalog slug for this repository.

## Context

The current approved direction is to rename only the public-facing marketplace display names to `Patina Project`. Existing local edits already point at that outcome in `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, and `README.md`.

This design formalizes that scope so execution stays intentionally narrow:

- presentation metadata changes are in scope
- internal slugs and source references are not
- docs should explain the distinction instead of hiding it

## Approach Options

### Option 1: Update user-facing labels only

Change only the fields that appear as marketplace-facing names or owner labels, and update docs to explain the distinction between display name and slug.

Pros:

- Matches the approved scope exactly
- Minimizes compatibility risk
- Avoids accidental downstream effects on install commands or internal identifiers

Cons:

- Leaves the internal slug and public label intentionally different, which needs clear documentation

### Option 2: Rename public labels and internal slug together

Change display names and also rename `patinaproject-skills` to `Patina Project`-aligned identifiers everywhere.

Pros:

- Removes the visible mismatch between label and slug

Cons:

- Out of scope for the approved direction
- Higher compatibility risk for existing references and install surfaces
- Would require broader validation and likely follow-up migration work

### Option 3: Documentation-only clarification

Keep marketplace metadata unchanged and only explain the intended branding in docs.

Pros:

- Lowest edit surface

Cons:

- Fails to deliver the actual public-facing rename
- Leaves user-visible marketplace naming inconsistent across surfaces

## Chosen Approach

Use option 1.

Rename only the public-facing marketplace display metadata to `Patina Project` and document that the repository still uses `patinaproject-skills` as its internal catalog slug. This satisfies the branding goal while preserving current install and compatibility behavior.

## Requirements

1. The Codex marketplace catalog must keep `"name": "patinaproject-skills"` and set the user-visible marketplace label to `Patina Project`.
2. The Claude marketplace catalog must keep its current marketplace identifier and upstream plugin source references while presenting the owning catalog as `Patina Project`.
3. Documentation must explicitly state that `Patina Project` is the public-facing marketplace name and `patinaproject-skills` remains the internal slug.
4. Documentation must continue to describe `patinaproject/superteam` as the source of truth for the upstream plugin package.
5. No change in this issue may alter plugin slugs, source URLs, source types, install paths, refs, or packaging ownership.

## Affected Surfaces

- `.agents/plugins/marketplace.json`: Codex-facing marketplace presentation metadata
- `.claude-plugin/marketplace.json`: Claude-facing marketplace presentation metadata
- `README.md`: contributor and user-facing explanation of label versus slug behavior

## Data and Metadata Strategy

The marketplace will continue to use `patinaproject-skills` as the stable internal identifier. Public-facing fields that drive presentation should use `Patina Project`.

This split is intentional:

- the slug preserves compatibility and existing references
- the display name aligns the marketplace with the Patina Project brand
- the upstream plugin source remains `patinaproject/superteam`

## Risks and Guardrails

- Do not rename the top-level marketplace `name` field away from `patinaproject-skills`
- Do not change the `superteam` plugin name or its source configuration
- Do not expand the issue into a repository rebrand or catalog schema refactor
- Keep docs explicit about why the label and slug differ so the mismatch is understood as deliberate rather than accidental

## Verification

- Inspect `.agents/plugins/marketplace.json` to confirm the display metadata is `Patina Project` while the marketplace `name` remains `patinaproject-skills`
- Inspect `.claude-plugin/marketplace.json` to confirm the public-facing owner/catalog naming reflects `Patina Project` without changing plugin source references
- Inspect `README.md` to confirm it explains the public-name versus internal-slug distinction and preserves the existing source-of-truth boundary for `superteam`
- Search the edited surfaces for `patinaproject-skills` and `Patina Project` to confirm the intended split is documented consistently
