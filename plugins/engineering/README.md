# Engineering

This plugin adapts [pstack](https://github.com/cursor/plugins/tree/main/pstack/skills) via [Michael Denyer's pstack-claude port](https://github.com/michael-denyer/pstack-claude) for Patina Project engineers.

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

## Codex requirement

Patina mode requires Codex multi-agent support. Set `multi_agent = true` under
`[features]` in `~/.codex/config.toml`, then restart Codex. Patina mode stops
before work when `spawn_agent` is unavailable.

## Upgrading

To sync a future [pstack-claude](https://github.com/michael-denyer/pstack-claude) release, run `pnpm sync-pstack` from the repository root. It imports the current tip of pstack-claude's `main` onto the script-managed carrier branch, applies the rebrand transform (`poteto-mode` → `patina-mode`, `poteto-agent` → `patina-agent`), and merges the result into your branch, leaving conflicts only where Patina edits overlap upstream changes. See `AGENTS.md` at the repository root for the sync command and `docs/adr/ADR-429-*.md` for the carrier-branch model.
