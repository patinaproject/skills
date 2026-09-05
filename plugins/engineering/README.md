# Engineering

This plugin adapts [pstack](https://github.com/cursor/plugins/tree/main/pstack/skills) via [Eric Litman's open-pstack port](https://github.com/ericlitman/open-pstack) for Patina Project engineers.

## Install

Claude Code:

```text
/plugin marketplace add patinaproject/skills
/plugin install engineering@patinaproject-skills
```

Codex:

```text
/marketplace add patinaproject/skills
/install engineering
```

Engineering contains its complete runtime. It does not require the Patina
Project Skills plugin or pstack.

The plugin includes `code-review`, a standalone read-only review of committed
changes against repository standards and accepted requirements. Patina mode
uses the same criteria before implementation and before publication.

## Migrate an external code-review install

Remove the `code-review` entry sourced from `mattpocock/skills`. Install or
update Engineering, then re-vendor the project-local skill catalog. Confirm
that both `.agents/skills/code-review` and `.claude/skills/code-review` resolve
to the Engineering plugin copy and that `skills-lock.json` has no external
`code-review` entry.

Update active references to retired review publishers so they invoke Patina's
Opening a PR flow. Standalone `code-review` only returns a report. It does not
replace the publication flow or revive `review-branch`, `polish`, `develop`, or
`ready-pr`.

## Codex requirement

Patina mode requires Codex multi-agent support. Set `multi_agent = true` under
`[features]` in `~/.codex/config.toml`, then restart Codex. Patina mode stops
before work when `spawn_agent` is unavailable.

## Upgrading

To sync a future [open-pstack](https://github.com/ericlitman/open-pstack) release, run `pnpm sync-pstack` from the repository root. It imports the current tip of open-pstack's `main` onto the script-managed carrier branch, applies the rebrand transform (`poteto-mode` → `patina-mode`, `poteto-agent` → `patina-agent`), and merges the result into your branch, leaving conflicts only where Patina edits overlap upstream changes. See `AGENTS.md` at the repository root for the sync command and `docs/adr/ADR-429-*.md` for the carrier-branch model.
