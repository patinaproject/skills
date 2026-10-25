# Code

This plugin adapts [pstack](https://github.com/cursor/plugins/tree/main/pstack/skills) via [Michael Denyer's pstack-claude port](https://github.com/michael-denyer/pstack-claude) for Patina Project engineers.

## Install

Claude Code:

```text
/plugin marketplace add patinaproject/skills
/plugin install code@patinaproject-skills
```

Codex:

```text
/marketplace add patinaproject/skills
/install code
```

Code contains its complete runtime. It does not require the Patina
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

To sync a future [pstack-claude](https://github.com/michael-denyer/pstack-claude) release, run `pnpm sync-upstream-skills pstack` from the repository root. It reads the pin and the rebrand transform from `upstream-skills.json`: the renames `poteto-mode` → `patina-mode`, `poteto-agent` → `patina-agent`, `poteto-help` → `patina-help`, and the matching headings, plus a denylist that fails the sync if an upstream name survives. It merges upstream's changes since the pin into the tree and stages them without committing. Conflicts appear only where Patina edits overlap upstream changes. `upstream-skills-forks.json` declares each deliberate Patina edit. See `docs/adr/ADR-570-sync-upstream-skills.md` for the mechanism.
