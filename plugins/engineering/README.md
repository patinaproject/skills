# Engineering

This plugin adapts [pstack](https://github.com/cursor/plugins/tree/main/pstack/skills) and [Michael Denyer's port](https://github.com/michael-denyer/pstack-claude/blob/main/CHANGES.md) for Patina Project engineers.

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

To sync a future pstack release, reapply the substitution table. Follow the [full re-port recipe](https://github.com/michael-denyer/pstack-claude/blob/main/CHANGES.md) in Michael Denyer's `CHANGES.md`.
