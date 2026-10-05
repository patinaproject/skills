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

## What it contains

- Skills are Markdown instructions that agents read at runtime.
- Agents include `patina-agent` and `comment-sicko`, with effort-specific
  variants for supported model settings.
- Hooks and local scripts cover session setup, PR watching, orchestration, and
  worktree auditing.
- The bundled Pi extension supplies subagent, question, and wake-up tools,
  `/loop`, and the same routing mandate.

## Data handling

The plugin has no server or telemetry. Anything its skills ask an agent to
read, including session transcripts, goes to the configured model provider.
Scripts run locally, and pull-request tools use the user's GitHub CLI login.

## Codex requirement

Patina mode requires Codex multi-agent support. Set `multi_agent = true` under
`[features]` in `~/.codex/config.toml`, then restart Codex. Patina mode stops
before work when `spawn_agent` is unavailable.

## Upgrading

To sync a future [pstack-claude](https://github.com/michael-denyer/pstack-claude) release, run `pnpm sync-pstack` from the repository root. It applies the rebrand transform (`poteto-mode` → `patina-mode`, `poteto-agent` → `patina-agent`) to the current tip of pstack-claude's `main` and to the last synced commit recorded in `upstream.json`. It applies the difference between them to your branch and stages it without committing. Conflicts appear only where Patina edits overlap upstream changes. See `AGENTS.md` at the repository root for the sync command and `docs/adr/ADR-541-*.md` for the mechanism.
