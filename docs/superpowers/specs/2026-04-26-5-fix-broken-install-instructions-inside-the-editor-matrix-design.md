# Design: Fix broken install instructions inside the editor matrix [#5](https://github.com/patinaproject/github-flows/issues/5)

## Context

`README.md` has an "Install in another editor" `<details>` matrix that documents how to install or wire up `github-flows` in editors beyond the Quick start (Claude Code, Codex CLI, Codex App, Copilot, Cursor, Windsurf, Aider, Zed, Cline, Opencode, Continue.dev).

The plugin actually ships four skills under `skills/`:

- `/github-flows:new-issue`
- `/github-flows:edit-issue`
- `/github-flows:new-branch`
- `/github-flows:write-changelog`

There is no skill named `github-flows`, and Codex marketplace registration and plugin installation are distinct operations. Two sections of the matrix currently contradict that reality.

## Problem

The matrix contains two confirmed copy-paste bugs that make the documented install path fail:

1. **Claude Code section, step 3** (`README.md` lines 65–67) tells the reader to run:

   ```text
   /github-flows:github-flows
   ```

   That slash-command does not exist. A reader following the steps gets "unknown command" rather than a successful invocation.

2. **OpenAI Codex CLI section, step 2** (`README.md` lines 79–81) repeats the marketplace-add command instead of installing the plugin:

   ```bash
   codex plugin marketplace add patinaproject/github-flows@v0.1.0
   ```

   Step 1 already adds the marketplace. Step 2 should install the plugin from that marketplace. The current line is wrong on two axes: it duplicates the marketplace-add verb, and it points at `patinaproject/github-flows` while step 1 (correctly) adds `patinaproject/skills` — the plugin lives in the `patinaproject/skills` marketplace, not its own repo.

A whole-matrix sweep surfaced no further duplicated or non-existent commands. The other editor sections either rely on natively-read repo files (`AGENTS.md`, `.cursor/rules/github-flows.mdc`, `.windsurfrules`, `.github/copilot-instructions.md`) or use plain natural-language invocations, none of which name a non-existent skill.

## Proposed changes

All edits are confined to the `<details>` block in `README.md`. No restructuring; section order, headings, and surrounding prose stay the same.

### Claude Code section (step 3)

Replace the bogus command with a real, smoke-test-worthy invocation. `/github-flows:new-issue` is the most representative entry point and matches the Quick start, so use it:

```text
/github-flows:new-issue patinaproject/github-flows "Tried github-flows install steps"
```

Keep the surrounding prose ("Open a target repository (or an issue in one) in Claude Code and invoke:") unchanged. Optionally tighten the lead-in to clarify it is a smoke test, mirroring the Quick start's framing.

### OpenAI Codex CLI section (step 2)

Replace the duplicated `codex plugin marketplace add ...` line with the interactive install flow that the Codex CLI actually exposes. There is no non-interactive `codex plugin install <name>` command; the official Codex docs only document `codex plugin marketplace {add,remove,upgrade}` for non-interactive use, and per-plugin installation happens through the TUI.

Step 1 stays as-is (`codex plugin marketplace add patinaproject/skills`). Step 2 becomes a one-line instruction pointing at the interactive `/plugins` flow:

> Run `codex` to start a session, type `/plugins` to open the plugin browser, find `github-flows` under the `patinaproject/skills` marketplace, and select **Install plugin**.

No code block is required for step 2 — it is a TUI walkthrough, not a shell command. If a fenced block helps formatting consistency with the rest of the matrix, use a `text` block containing only the `/plugins` keystroke.

Drop the prior "pin to a tag for reproducible installs" parenthetical entirely. Codex has no plugin-level `@<tag>` pinning; pinning is a marketplace-level concern and only applies to step 1, via `--ref <git-ref>` on `codex plugin marketplace add` (or the `<owner>/<repo>@<ref>` shorthand). If reviewers want to surface that, a short trailing note on step 1 — not step 2 — is the right place. Keep it minimal and only if it adds value.

### Whole-matrix sweep

No other section needs changes. Executor should still re-read each section end-to-end as a final pass to satisfy AC-5-3.

## Acceptance Criteria

### AC-5-1

Claude Code section step 3 invokes a slash-command that exists in this plugin. Verification:

- [ ] After the edit, `README.md` step 3 names one of `new-issue`, `edit-issue`, `new-branch`, or `write-changelog` (recommend `new-issue`).
- [ ] `grep -n '/github-flows:github-flows' README.md` returns no matches.

### AC-5-2

OpenAI Codex CLI section step 2 documents the interactive `/plugins` install flow rather than re-adding the marketplace. Verification:

- [ ] After the edit, step 2 directs the reader to run `codex`, open `/plugins`, locate `github-flows`, and select **Install plugin** — it does not invoke a non-existent `codex plugin install <name>` CLI command.
- [ ] Step 2 references the `patinaproject/skills` marketplace (consistent with step 1) when naming where to find the plugin.
- [ ] `grep -nc 'codex plugin marketplace add' README.md` returns `1` (only the step-1 occurrence remains).

### AC-5-3

The install matrix as a whole contains no duplicated or non-existent commands. Verification:

- [ ] Re-read every section under "Install in another editor" and confirm each command is unique within its section and references something that exists (a real skill, real file, or real CLI command).
- [ ] `pnpm lint:md` passes.

## Out of scope

- Restructuring the install matrix or changing section order.
- Adding the hero image referenced by the HTML comment near the top of `README.md`.
- Quick start changes outside the `<details>` matrix.
- Any edits outside `README.md`.

## Remaining concerns

None. The Codex CLI plugin install grammar has been verified against the official Codex docs (`developers.openai.com/codex/plugins`, `developers.openai.com/codex/cli/reference`, and the `openai/codex` repo): non-interactive `codex` exposes `codex plugin marketplace {add,remove,upgrade}` only, and per-plugin installation is a TUI flow under `/plugins`. Step 2 reflects that flow.
