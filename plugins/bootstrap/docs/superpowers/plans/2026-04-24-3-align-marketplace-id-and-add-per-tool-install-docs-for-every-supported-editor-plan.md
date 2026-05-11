# Plan: Align marketplace id and add per-tool install docs for every supported editor [#3](https://github.com/patinaproject/bootstrap/issues/3)

## Workstream A – Marketplace id rename

Replace every plugin-id literal `@patinaproject` with `@patinaproject-skills`. Preserve email addresses (`ted@patinaproject.com`) and bare GitHub paths (`patinaproject/skills`) untouched.

**Files**:

- `.claude/settings.json` → `superteam@patinaproject-skills`
- `skills/bootstrap/templates/core/.claude/settings.json` → same
- `README.md` → `/plugin install bootstrap@patinaproject-skills`
- `skills/bootstrap/SKILL.md` → "Plugin enablement" snippet
- `skills/bootstrap/audit-checklist.md` → Area 4 expected-keys note
- `skills/bootstrap/templates/agent-plugin/README.md.tmpl` → `/plugin install {{repo}}@patinaproject-skills`
- `docs/superpowers/specs/2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-design.md` (3 occurrences)
- `docs/superpowers/plans/2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-plan.md` (1 occurrence)

**Tasks**:

- **T-A1**: Update `.claude/settings.json` and `skills/bootstrap/templates/core/.claude/settings.json` (AC-3-1, AC-3-2).
- **T-A2**: Update `skills/bootstrap/SKILL.md` (AC-3-3).
- **T-A3**: Update `skills/bootstrap/audit-checklist.md` (AC-3-4).
- **T-A4**: Update `skills/bootstrap/templates/agent-plugin/README.md.tmpl` install snippet (id half).
- **T-A5**: Update prior superpowers spec + plan to keep their snippets accurate.

**Verification**: `rg '@patinaproject(?!-skills|\.com)'` returns zero matches.

## Workstream B – Per-tool install docs

Rewrite `## Installation` in `README.md` and mirror the structure in `skills/bootstrap/templates/agent-plugin/README.md.tmpl`. Update the "Supported AI coding tools" table to link rows to the new subsections via in-document anchors.

**Subsection plan (order matches the table)**:

| # | Tool | Category | Content |
|---|------|----------|---------|
| 1 | Claude Code | Marketplace | `marketplace add` + `install` + invoke command (id-corrected) |
| 2 | OpenAI Codex CLI | Marketplace | `codex plugin marketplace add` + invoke |
| 3 | OpenAI Codex App | Marketplace | enable + invoke |
| 4 | GitHub Copilot | Emitted file | `.github/copilot-instructions.md` is read natively; clone and use Copilot Chat |
| 5 | Cursor | Emitted file | `.cursor/rules/<repo>.mdc` rule file; clone, no extra config; personal rules go in user-scoped Cursor settings |
| 6 | Windsurf | Emitted file | `.windsurfrules` is read natively; clone, no extra config |
| 7 | Aider | AGENTS.md | Aider reads `AGENTS.md`; clone and run `aider` in repo |
| 8 | Zed | AGENTS.md | Zed's assistant reads `AGENTS.md`; clone and open |
| 9 | Cline | AGENTS.md | Cline reads `AGENTS.md`; clone and open in VS Code |
| 10 | Opencode | AGENTS.md | Opencode reads `AGENTS.md`; clone and open |
| 11 | Continue.dev | Opt-in | exact `.continue/config.json` snippet enabling the plugin |

**Table edits**: split the combined "Aider, Zed, Cline, Codex CLI, Opencode" row into one row per tool (Codex CLI already has its own row – don't duplicate; just anchor each row). Anchor every tool name with `[Name](#anchor-slug)`.

**Tasks**:

- **T-B1**: Rewrite `README.md` "Supported AI coding tools" table with anchored, split rows (AC-3-7).
- **T-B2**: Rewrite `README.md` `## Installation` section with all 11 subsections (AC-3-6, AC-3-9, AC-3-10).
- **T-B3**: Mirror the same `## Installation` structure in `skills/bootstrap/templates/agent-plugin/README.md.tmpl` with `{{repo}}` / `{{owner}}` placeholders (AC-3-8).

**Verification**: every table row anchor resolves to an `<h3>` in the same file; each AGENTS.md-only subsection contains explicit "no additional config" wording with no install commands; Continue.dev subsection shows a `.continue/config.json` snippet; `pnpm lint:md` passes.

## Order

A then B. Workstream A is mechanical and can land first; Workstream B is a larger rewrite. Each workstream is a single Executor commit.

## Blockers

None.
