# Design: Align marketplace id and add per-tool install docs for every supported editor [#3](https://github.com/patinaproject/bootstrap/issues/3)

## Intent

Make a fresh-clone install of `bootstrap` actually work end-to-end on every supported editor. Two install-time alignment gaps were discovered closing out [#2](https://github.com/patinaproject/bootstrap/pull/2):

1. The Claude Code marketplace id used in `enabledPlugins` and install snippets (`@patinaproject`) does not match the id Claude Code derives from the marketplace repo name (`patinaproject-skills`). Unresolved entries are silently ignored, so the plugin never enables on a fresh machine.
2. `README.md` and `skills/bootstrap/templates/agent-plugin/README.md.tmpl` list every supported tool in a "Supported AI coding tools" table but only document install steps for Claude Code, Codex CLI, and Codex App. Eight tools are named without guidance.

These two gaps must land together: a correct install requires both a resolvable id and discoverable per-tool steps.

## Background

`patinaproject/bootstrap` is the reference Claude Code + Codex plugin distributed via `patinaproject/skills`. Claude Code's `/plugin marketplace add patinaproject/skills` registers the marketplace under the id `patinaproject-skills` (derived from the repo name), but the project's own `enabledPlugins` and the bootstrap-emitted templates still reference the older `@patinaproject` literal. Because Claude Code silently ignores unresolved entries, the failure mode is invisible until a user notices that the plugin never enabled.

The same templates also under-document the long tail of supported editors. The README's "Supported AI coding tools" table promises support for 11 tools but only the first 3 have install instructions, leaving GitHub Copilot, Cursor, Windsurf, Aider, Zed, Cline, Opencode, and Continue.dev users guessing.

## Non-goals

- The `patinaproject/skills` marketplace itself (tracked separately).
- Renaming the marketplace repo.
- Publishing plugins to npm or other non-marketplace distribution.
- Release workflow misfiring on every push to `main` and `RELEASING.md` correctness – carved out into [#4](https://github.com/patinaproject/bootstrap/issues/4).

## Decisions

### Marketplace id

Replace every `superteam@patinaproject` and `bootstrap@patinaproject` literal with the `-skills` suffix (`superteam@patinaproject-skills`, `bootstrap@patinaproject-skills`). Apply across:

- `.claude/settings.json`
- `skills/bootstrap/templates/core/.claude/settings.json`
- `README.md` install snippet
- `skills/bootstrap/SKILL.md` Plugin enablement snippet
- `skills/bootstrap/audit-checklist.md` Area 4 expected-keys note
- `skills/bootstrap/templates/agent-plugin/README.md.tmpl` install snippet
- Both prior `docs/superpowers/{specs,plans}/2026-04-24-1-…` artifacts that quote the old id

Preserve `ted@patinaproject.com` (email) in `SECURITY.md` and `package.json` – these are not marketplace ids.

### Per-tool docs

Restructure the README's `## Installation` section into one named subsection per supported tool, in the same order as the "Supported AI coding tools" table. Anchor every table row to its subsection so a reader can click directly to install steps.

Categorize each tool by what bootstrap actually does for it:

- **Plugin marketplace** (Claude Code, Codex CLI, Codex App): exact `marketplace add` + `install` commands.
- **Emitted instructions file, no extra config** (GitHub Copilot, Cursor, Windsurf): name the file bootstrap emits, point to where the user adds personal overrides.
- **AGENTS.md alone, no extra config** (Aider, Zed, Cline, Opencode): explicit "clone the repo and open it – `AGENTS.md` is read natively" – no phantom commands.
- **Opt-in** (Continue.dev): exact `.continue/config.json` snippet to enable the plugin.

Mirror the same structure in `skills/bootstrap/templates/agent-plugin/README.md.tmpl` using `{{repo}}` / `{{owner}}` placeholders so every scaffolded plugin ships per-tool install instructions for free.

The combined table row for `Aider, Zed, Cline, Codex CLI, Opencode` splits into one row per tool so each can anchor to its own subsection (Codex CLI keeps its plugin-marketplace row).

## Acceptance criteria

- **AC-3-1**: `enabledPlugins` in this repo's `.claude/settings.json` uses `superteam@patinaproject-skills`.
- **AC-3-2**: `skills/bootstrap/templates/core/.claude/settings.json` uses the same id.
- **AC-3-3**: `skills/bootstrap/SKILL.md` "Plugin enablement" snippet uses the same id.
- **AC-3-4**: `skills/bootstrap/audit-checklist.md` Area 4 expected-keys check uses the same id.
- **AC-3-5**: On a fresh machine, `/plugin marketplace add patinaproject/skills` followed by opening this repo in Claude Code enables `superteam` and `bootstrap` without additional steps.
- **AC-3-6**: `README.md` has an `## Installation` section with a subsection per supported tool: Claude Code, Codex CLI, Codex App, GitHub Copilot, Cursor, Windsurf, Aider, Zed, Cline, Opencode, Continue.dev.
- **AC-3-7**: The "Supported AI coding tools" table rows link to those subsections via in-document anchors.
- **AC-3-8**: `skills/bootstrap/templates/agent-plugin/README.md.tmpl` has the same per-tool structure with `{{repo}}` / `{{owner}}` placeholders.
- **AC-3-9**: Tools covered by `AGENTS.md` alone have sections that say so explicitly, with no phantom install commands.
- **AC-3-10**: Continue.dev section shows the exact `.continue/config.json` change required to enable the plugin.

## Verification

- `rg '@patinaproject(?!-skills|\.com)'` returns zero matches.
- `pnpm lint:md` passes.
- README's table rows anchor-link to real `<h3>` subsections in the same file.
- Manual fresh-machine walkthrough per AC-3-5 succeeds (operator-driven, post-merge).
