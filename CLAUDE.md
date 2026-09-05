@AGENTS.md

## Claude Code

- Keep the shared workflow contract in `AGENTS.md`; put Claude-only guidance below this import instead of duplicating the repo rules.
- Project-level Claude Code configuration lives in `.claude/settings.json`. Skills enabled for this repo are declared under `enabledPlugins`.
- When you add Claude-specific teammates, prefer project subagents under `.claude/agents/`.
- When you need Claude-specific enforcement for teammate creation or completion, prefer project hooks in `.claude/settings.json`.
- Never write tests that assert on the prose content of documentation files; test code behavior and machine-consumed contracts only (see `AGENTS.md` → Testing Guidelines and `docs/adr/ADR-224-no-tests-on-documentation-content.md`).

<!-- BEGIN engineering:patina-mode (managed by setup-engineering; re-running overwrites this block) -->
<EXTREMELY_IMPORTANT>
You have the Patina Project Engineering plugin, forked from pstack.

Before responding to any non-trivial engineering task — a feature, bug fix, refactor, debugging, performance work, or any multi-step code change — invoke the `engineering:patina-mode` skill with the Skill tool and follow it. It is the default entry point and routes to the specific Engineering skills from there. Pure questions and trivial one-line edits don't need it.

When the intent is already specific, enter directly: `engineering:tdd` (bug with a reproducible failure), `engineering:architect` (types and module shape before code that crosses a function boundary), `engineering:how` (how a subsystem works), `engineering:why` (why it was built this way), `engineering:arena` (N parallel attempts at one task), `engineering:interrogate` (multi-model diff review).

If you were dispatched as a subagent to execute a specific task, ignore this block — patina-mode governs the orchestrating session, and it already shaped your dispatch.

User instructions (CLAUDE.md, AGENTS.md, direct requests) take precedence over this mandate. Other session-start mandates (such as superpowers) compose with it: their skill-check discipline stands, and patina-mode is the implementation entry point they route to for non-trivial code work.
</EXTREMELY_IMPORTANT>
<!-- END engineering:patina-mode -->
