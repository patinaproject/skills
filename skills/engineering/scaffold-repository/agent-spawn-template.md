# Agent Spawn Template

`bootstrap` is primarily a single-agent skill. This template exists for symmetry with other Patina Project skills and for cases where a host runtime delegates the realignment pass to a subagent.

When spawning a subagent for `bootstrap`:

- Provide the target repo path and the user-selected prompts (owner, repo, description, visibility, is-agent-plugin, use-superteam, optional Continue.dev).
- Require the subagent to read [`audit-checklist.md`](./audit-checklist.md) before touching any file.
- Require the subagent to show a diff preview for every proposed change and wait for explicit user confirmation before writing. No flags, no silent overwrites.
- Require the subagent to group recommendations in the documented order and emit a single final report listing accepted, skipped, and deferred items.
