# ADR-665: Engineering skills and agents use bare names

## Status

Accepted. Reverses the `engineering:` namespacing from #603. Amends ADR-570.

## Context

An Agent Skills install, through `npx skills` or a copied overlay, registers bare
names only. In that install `Skill("engineering:patina-mode")` and
`subagent_type: "engineering:patina-agent"` both fail. A plugin install has the
opposite constraint for agents: plugin agents register under the plugin
namespace. Agent Skills is the primary install shape for Engineering, because it
works in the most runtimes.

## Decision

Engineering skills name other Engineering skills and agents by their bare names.
`setup-engineering` installs every Engineering agent, including the
`patina-agent-<level>` and `effort-<level>` effort agents, under its bare name in
the repository's `.claude/agents/`, so the same names resolve in both install
shapes. The upstream sync gains an `unprefix` transform beside ADR-570's renames
and denylist. It rewrites `pstack:<name>` and `engineering:<name>` to `<name>`,
and the sync fails when a namespaced name survives the rewrite.

## Consequences

A plugin install needs `setup-engineering` for agent dispatch to resolve. The
skill-reference lint checks bare agent names in `subagent_type` and `agent_type`
values, rejects a namespaced Engineering agent there, and checks that the
SessionStart mandate names existing Engineering skills. The Team plugin's
`team:` and `engineering:` references are unchanged.
