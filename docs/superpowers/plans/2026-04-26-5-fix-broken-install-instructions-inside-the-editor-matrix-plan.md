# Plan: Fix broken install instructions inside the editor matrix [#5](https://github.com/patinaproject/github-flows/issues/5)

## Context

The `<details>` "Install in another editor" matrix in `README.md` has two copy-paste bugs that break the documented install path:

- The Claude Code section step 3 (lines 65–67) invokes `/github-flows:github-flows`, a slash-command that does not exist. The plugin only ships `new-issue`, `edit-issue`, `new-branch`, and `write-changelog`.
- The OpenAI Codex CLI section step 2 (lines 79–81) re-runs `codex plugin marketplace add ...` and points at the wrong repo (`patinaproject/github-flows` instead of `patinaproject/skills`). Codex CLI has no non-interactive `codex plugin install <name>`; per-plugin install happens via the TUI `/plugins` flow.

Per the approved design, both fixes are confined to those two sections. No restructuring, no other edits to `README.md`, no edits to other files. A whole-matrix re-read is required as a final sweep to satisfy AC-5-3.

## Tasks

### T1 — Fix Claude Code section step 3 (AC-5-1)

**File:** `README.md` (lines 65–67)

Replace the bogus `/github-flows:github-flows` slash-command with a real, smoke-test-worthy invocation that mirrors the Quick start.

Change the fenced `text` block under step 3 from:

```text
/github-flows:github-flows
```

to:

```text
/github-flows:new-issue patinaproject/github-flows "Tried github-flows install steps"
```

Keep the surrounding prose ("Open a target repository (or an issue in one) in Claude Code and invoke:") unchanged.

Verification:

- `grep -n '/github-flows:github-flows' README.md` returns no matches.
- The replaced command names one of the four real skills (`new-issue`).

### T2 — Fix OpenAI Codex CLI section step 2 (AC-5-2)

**File:** `README.md` (lines 77–81, plus the step-2 lead-in)

Replace the duplicated `codex plugin marketplace add patinaproject/github-flows@v0.1.0` block and its parenthetical with a one-line instruction pointing at the interactive `/plugins` flow.

Drop the "(pin to a tag for reproducible installs)" parenthetical — Codex has no plugin-level `@<tag>` pinning; pinning is a marketplace-level concern that only applies to step 1.

Rewrite step 2 so that it reads as a single prose sentence (no fenced code block required) directing the reader to:

> Run `codex` to start a session, type `/plugins` to open the plugin browser, find `github-flows` under the `patinaproject/skills` marketplace, and select **Install plugin**.

Step 1 (`codex plugin marketplace add patinaproject/skills`) and step 3 stay exactly as-is.

Verification:

- Step 2 directs the reader through `codex` → `/plugins` → select `github-flows` under `patinaproject/skills` → **Install plugin**.
- Step 2 does not invoke a non-existent `codex plugin install <name>` CLI command.
- Step 2 references the `patinaproject/skills` marketplace (consistent with step 1).
- `grep -nc 'codex plugin marketplace add' README.md` returns `1`.

### T3 — Whole-matrix re-read sweep (AC-5-3)

**File:** `README.md` (the entire `<details>` "Install in another editor" block)

Re-read every section under the matrix end-to-end (Claude Code, OpenAI Codex CLI, OpenAI Codex App, GitHub Copilot, Cursor, Windsurf, Aider, Zed, Cline, Opencode, Continue.dev). Confirm each documented command is:

- unique within its section (no duplicated lines), and
- references something that actually exists — a real skill name (`new-issue`, `edit-issue`, `new-branch`, `write-changelog`), a real repo file (`AGENTS.md`, `.cursor/rules/github-flows.mdc`, `.windsurfrules`, `.github/copilot-instructions.md`), or a real CLI/TUI command.

The design's whole-matrix sweep already concluded no other section needs changes; this task is the executor's confirmation pass. If something is found that contradicts the design, halt and route back rather than expanding scope.

### T4 — Markdown lint and commit (AC-5-3)

Run `pnpm lint:md` and confirm it passes against the modified `README.md`.

Once T1 and T2 are applied and the sweep in T3 is clean, stage only `README.md` and commit with the conventional message:

```bash
git add README.md
git commit -m "fix: #5 correct broken install instructions in editor matrix"
```

Do not push.

## Verification

- [ ] `grep -n '/github-flows:github-flows' README.md` returns no matches.
- [ ] `grep -nc 'codex plugin marketplace add' README.md` returns `1`.
- [ ] Manual end-to-end re-read of the install matrix confirms every command is unique within its section and refers to something real.
- [ ] `pnpm lint:md` exits 0.
- [ ] Commit on branch `5-fix-broken-install-instructions-inside-the-editor-matrix` touches only `README.md`.
