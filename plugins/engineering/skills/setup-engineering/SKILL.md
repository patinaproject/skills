---
name: setup-engineering
description: Install Engineering's repo-level machinery for skills-only consumers — the default-on patina-mode mandate, the patina-agent and comment-sicko subagents, and Codex multi_agent. Use for /setup-engineering or setting Engineering up in a repository.
menu-description: install Engineering repo-level machinery
---

# Setup Engineering

Engineering ships as a full plugin (hook, subagents) and also as a vendored
skill catalog. Vendoring carries the skills but not the hook or the subagents,
so a skills-only consumer loses the default-on entry point and the delegation
targets the playbooks name. This skill installs that machinery into the target
repo and, on Codex, the user's Codex config.

The machinery install is non-interactive and idempotent.

## Install repo-level machinery

`scripts/install-machinery.sh` (in this skill's base directory) owns the
idempotency and no-clobber contract. Run it rather than editing the target files
by hand. It writes a single marker-delimited mandate block and leaves everything
outside the markers untouched, so re-running updates in place with no
duplication.

What it materializes, from the byte-identical payloads under `assets/`:

- The **patina-mode mandate** (from `assets/mandate.md`) into the repo's
  `CLAUDE.md`, wrapped in managed markers. This is the skills-only substitute
  for the plugin's `SessionStart` hook. The hook's own text defers to `CLAUDE.md`,
  so the block is an equal-or-stronger default-on trigger: a non-trivial task
  routes through patina-mode without the user invoking it.
- The **`patina-agent` and `comment-sicko` subagents** (from `assets/agents/`)
  into the repo's `.claude/agents/`, so `subagent_type: "patina-agent"` resolves
  and playbook delegates read patina-mode's SKILL.md first instead of drifting to
  `general-purpose`.

Run it from the target repo:

```bash
bash "<this-skill>/scripts/install-machinery.sh"
```

The script defaults `--repo` to the current Git toplevel and the instructions
file to `<repo>/CLAUDE.md`. Pass `--repo <dir>` or `--instructions <file>` to
target elsewhere.

### Codex

Codex has no `SessionStart` hook and no subagent registry. There the default-on
trigger is the same mandate block in the repo's `AGENTS.md`, which Codex reads
per project, and delegates route through the spawn-prompt convention in the
patina-mode `references/codex-tools.md` (dispatch a `spawn_agent` told to read
the `patina-mode` skill, or `agents/comment-sicko.md`, first). Subagent dispatch
also needs the `multi_agent` feature. Add `--codex` to install both:

```bash
bash "<this-skill>/scripts/install-machinery.sh" --codex
```

That upserts the mandate block into `<repo>/AGENTS.md` and enables `multi_agent`
under `[features]` in `<repo>/.codex/config.toml`, both idempotently. Writing the
repo-scoped config rather than the user's global `~/.codex/config.toml` keeps the
machinery committed and shared across contributors. Codex honors a repo-scoped
`.codex/config.toml` only for a project the user has marked trusted, so the flag
takes effect after Codex's one-time trust prompt. Override the paths with
`--codex-agents <file>` and `--codex-config <file>`.

Skills load natively by name on Codex, so patina-mode is reachable without any
`.codex-plugin/prompts/*` `/command` stubs; open-pstack ships none and this base
follows it.

## Model configuration

Model choice per role is not part of this install. Engineering routes models
through the provider-qualified descriptors in patina-mode's
[`references/provider-dispatch.md`](../patina-mode/references/provider-dispatch.md),
written and refreshed by `/setup-pstack`. Run that skill to configure or change
which models each role uses.

## Confirm

Tell the user what the machinery install wrote — the mandate block, the two
subagents, and on Codex the `multi_agent` flag. Re-running this skill updates all
of it in place.
