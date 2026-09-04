---
name: setup-engineering
description: Install Engineering's repo-level machinery for skills-only consumers — the default-on patina-mode mandate, the patina-agent and comment-sicko subagents, and Codex multi_agent — and configure which models Engineering uses per role. Use for /setup-engineering, setting Engineering up in a repository, or changing Engineering's model choices.
menu-description: install Engineering machinery and per-role model choices
---

# Setup Engineering

Engineering ships as a full plugin (hook, subagents, models) and also as a
vendored skill catalog. Vendoring carries the skills but not the hook or the
subagents, so a skills-only consumer loses the default-on entry point and the
delegation targets the playbooks name. This skill installs that machinery into
the target repo and, on Codex, the user's Codex config, then writes the per-role
model override sheet.

Run both parts. The machinery install is non-interactive and idempotent; the
model override sheet is interactive.

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

The 30+ `.codex-plugin/prompts/*` stubs give Codex `/command` entry points but
are not required: skills load natively by name on Codex, so patina-mode is
reachable without them. Leave them to the full plugin install.

## Configure per-role models

Write `~/.claude/engineering-models.md`, a per-role model override sheet you
include from your global `CLAUDE.md`. Each Engineering skill names a default
model inline; the override sheet is the layer that adapts those defaults to the
models you actually have access to.

**Platform note.** On Codex or another non-Claude runtime, the override sheet is
`~/.codex/engineering-models.md`, the slugs are your Codex models (for example
`gpt-5.5`) not `claude-*`, and you load it by adding the sheet's contents to
`~/.codex/AGENTS.md` (Codex has no `@`-include into a rules file). The role rows
in step 5 are identical; only the slugs, the file path, and the load mechanism
change. Detect Codex slugs from `~/.codex/config.toml` (`model = ...`) plus
whatever the user confirms. See [`codex-tools.md`](../patina-mode/references/codex-tools.md).

Claude Code has no auto-applied "rules" mechanism like Cursor's `.mdc`.
Inclusion is explicit: the user adds a line to `~/.claude/CLAUDE.md` (or their
project `CLAUDE.md`) such as:

```text
@~/.claude/engineering-models.md
```

so the file is loaded as context for every session.

### 1. Detect available models

Enumerate the model slugs you can pass to an `Agent` subagent in this session — that is the dependable source. The currently available Claude models and the default panel are listed in [Models](#models) below; the quad is chosen for cross-family, cross-tier diversity, and the single-role default stays out of the panels because it already covers the single-model roles. Ask the user to confirm or paste any additional slugs they want available. Never write a real slug you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even though they are not detected slugs; both mean the role runs on the parent session's model, which the `Agent` call expresses by omitting `model`.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If `~/.claude/engineering-models.md` already exists, read it and treat its values as the current choices. Otherwise start from those defaults.

### 3. Map and confirm

Show every role with its current model, marking any real slug not in the detected set as needing a choice. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` as the options. Prefer `AskUserQuestion` over free text. For panel roles (how critics, arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it whose model family differs from the parent's when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every real slug written must be in the detected set; `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again. An override pointing at a model the user cannot use breaks every delegation that reads it.

### 5. Write the override sheet

Write `~/.claude/engineering-models.md` with the shape below. Overwrite the whole file so re-runs stay idempotent.

```markdown
# Engineering model configuration

Per-role model overrides for Engineering skills. Each Engineering SKILL.md names its defaults in a Models section; the values here override those defaults. Delete a line to fall back to the skill default. A value of `inherit-parent` or `auto` runs that role on the parent session's model (the `Agent` call omits `model`); an alias entry in a panel list still counts toward that panel's fan-out.

feature, refactoring: claude-opus-5
bug-fix: claude-fable-5
perf-issue: claude-fable-5
hillclimb: claude-fable-5
judgment and prose: claude-opus-5
strongest judgment: claude-fable-5
how explorer: claude-opus-5
how explainer: claude-opus-5
how critics: claude-opus-5, claude-fable-5, claude-sonnet-5
why investigators: claude-opus-5
why synthesizer: claude-opus-5
reflect tooling: claude-opus-5
reflect judgment, divergent, synthesizer: claude-opus-5
arena runners: claude-opus-5, claude-fable-5, claude-sonnet-5
arena cross-judge pool: claude-opus-5, claude-fable-5, claude-sonnet-5
swarm workers: claude-opus-5
architect runners: claude-opus-5, claude-fable-5, claude-sonnet-5
interrogate reviewers: claude-opus-5, claude-fable-5, claude-sonnet-5
```

### 6. Wire it in

If `~/.claude/CLAUDE.md` does not already include `~/.claude/engineering-models.md`, append the `@~/.claude/engineering-models.md` line so it loads on every session. If the user prefers project scope, add the include to the project's `CLAUDE.md` instead.

### 7. Confirm

Tell the user what the machinery install wrote (the mandate block, the two
subagents, and on Codex the `multi_agent` flag), where the model override was
written, and how it loads (via the `@` include in CLAUDE.md). Re-running this
skill updates all of it in place.

## Models

Maintained inline here — update this list as the available models change.

- Available Claude models: Opus 5 (`claude-opus-5`), Opus 4.8 (`claude-opus-4-8`), Opus 4.6 (`claude-opus-4-6`), Fable 5 (`claude-fable-5`), Sonnet 5 (`claude-sonnet-5`), Sonnet 4.6 (`claude-sonnet-4-6`), Haiku 4.5 (`claude-haiku-4-5`)
- Default panel: `claude-opus-5`, `claude-fable-5`, `claude-sonnet-5`
- Single-role default: `claude-opus-5`
