# Design: Plugin card is missing the Superteam description in Codex [#12](https://github.com/patinaproject/superteam/issues/12)

## Intent

Make the Superteam plugin render meaningful description text in Codex by aligning the user-facing metadata we ship in the packaged plugin and the source skill metadata we maintain in-repo.

## Problem

The Codex plugin card for Superteam shows the plugin name and action button but no description text. The repository already contains description metadata, which suggests the problem is either the wrong metadata copy, stale copy, or metadata that is not aligned across the source skill and packaged plugin.

## Recommended approach

Treat the repository as owning two metadata surfaces that should stay aligned:

- `plugins/superteam/.codex-plugin/plugin.json` for plugin-card presentation
- `skills/superteam/agents/openai.yaml` as the authoring source for Codex skill UI metadata

After editing the source skill metadata, run `pnpm sync:plugin` so the packaged skill copy under `plugins/superteam/skills/superteam/` matches the source tree.

For this issue, update the shipped plugin descriptions to match the wording selected during this thread and keep the source and packaged skill `short_description` values in sync with that same positioning.

## Alternatives considered

### Update only the marketplace metadata

Rejected because the observed bug is in the installed plugin card, not just marketplace discovery. The packaged plugin manifest remains the most direct fix surface.

### Update only `SKILL.md`

Rejected because the missing description appears in the plugin card UI rather than the skill trigger description shown in the skill body frontmatter.

## Acceptance criteria

- AC-12-1: The packaged plugin manifest exposes a non-empty `description`, `interface.shortDescription`, and `interface.longDescription` for Superteam.
- AC-12-2: The source skill and packaged skill `agents/openai.yaml` files expose the same `short_description` value.
- AC-12-3: Verification shows the updated text in the manifest and both skill metadata files after `pnpm sync:plugin`.

## Verification

- `pnpm sync:plugin`
- `sed -n '1,40p' plugins/superteam/.codex-plugin/plugin.json`
- `sed -n '1,20p' skills/superteam/agents/openai.yaml`
- `sed -n '1,20p' plugins/superteam/skills/superteam/agents/openai.yaml`

## Out of scope

- Fixing a Codex application bug if the UI still ignores the manifest after the packaged metadata is correct
- Broader marketplace catalog changes in `patinaproject/skills`
