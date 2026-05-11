# Plan: Make the README awesome [#4](https://github.com/patinaproject/github-flows/issues/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the root `README.md` so a visitor can identify, trust, evaluate, and try `github-flows` from the first screen, satisfying AC-4-1 through AC-4-5.

**Architecture:** Single-file documentation rewrite. Reorder content into identity (title + tagline) -> trust (badges) -> demo (hero) -> value ("What you get") -> trial (Quick start) -> depth (collapsed install matrix, related links, license). The eleven-editor matrix moves into a `<details>` block. No code or plugin behavior changes.

**Tech Stack:** Markdown, shields.io badges, `markdownlint-cli2` via `pnpm lint:md`.

---

## Active Acceptance Criteria

- **AC-4-1** — First screen shows tagline, hero visual, and a list naming each shipped skill (`new-issue`, `edit-issue`, `new-branch`, `write-changelog`) with its slash-command invocation.
- **AC-4-2** — Badges row at the top covers CI, latest release, and license at minimum.
- **AC-4-3** — Quick-start runs a real invocation against an example issue with no `<!-- placeholder -->` comments and no visible `TODO`.
- **AC-4-4** — Eleven-editor install matrix is reachable but does not occupy the landing view; collapsed under `<details>` (preferred) or moved to `docs/install.md` and linked.
- **AC-4-5** — `pnpm lint:md` passes with no new markdownlint violations against `.markdownlint.jsonc`.

## Files To Read Before Starting

- `docs/superpowers/specs/2026-04-26-4-make-the-readme-awesome-design.md` — approved design (commit `48c8d01`); the canonical source for copy and ordering.
- `README.md` — current content to be rewritten; preserve the existing eleven-editor install matrix verbatim inside the `<details>` block (light edits only as needed for markdownlint).
- `skills/new-issue/SKILL.md`, `skills/edit-issue/SKILL.md`, `skills/new-branch/SKILL.md`, `skills/write-changelog/SKILL.md` — confirm each skill's one-line outcome matches the design's "Skill summaries" copy.
- `.github/workflows/lint-md.yml` — workflow file used to derive the CI badge URL. The badge points to the GitHub Actions workflow file path (`/actions/workflows/lint-md.yml/badge.svg`) and links to the Actions tab filtered by that workflow.
- `package.json` — confirms `"license": "MIT"` and the `lint:md` script command.
- `.markdownlint.jsonc` — rules enforced by `pnpm lint:md`.
- `LICENSE` — destination of the license badge link and the closing pointer.

## File Structure

- Modify: `README.md` (single file rewrite).
- No other files are created or modified. The hero `<img>` is omitted per design (no asset is ready); an HTML comment marks the intended insertion point. The `<details>` block keeps the install matrix in-page, so `docs/install.md` is not created.

## Workstream

Single sequential workstream. Tasks are atomic and ordered top-to-bottom.

### Task T1: Hero header — title, tagline, badges, hero placeholder

**Files:**

- Modify: `README.md` (replace the existing top region from the `# github-flows` H1 through any current intro/comment block).

**Scope:** Sections 1–3 of the design's information architecture: title, tagline, badges row, and the hero visual placeholder. Establishes AC-4-1 (tagline + hero placeholder) and AC-4-2 (badges row).

- [ ] **Step 1: Replace the top of `README.md` with the new hero header.**

Use this exact block for the top of the file:

```markdown
# github-flows

Slash-command skills that let coding agents file issues, start branches, edit issues, and write changelogs in any GitHub repo.

[![CI](https://github.com/patinaproject/github-flows/actions/workflows/lint-md.yml/badge.svg)](https://github.com/patinaproject/github-flows/actions/workflows/lint-md.yml)
[![Latest release](https://img.shields.io/github/v/release/patinaproject/github-flows)](https://github.com/patinaproject/github-flows/releases)
[![License](https://img.shields.io/github/license/patinaproject/github-flows)](./LICENSE)

<!-- Hero asset: replace this comment with an <img src="docs/assets/hero.png" alt="github-flows new-issue running in Claude Code" /> tag once docs/assets/hero.png lands. Tracked as a follow-up. -->
```

Notes:

- Tagline replaces "Let agents use GitHub more ergonomically".
- Badges are inline links (markdownlint-friendly) and order is CI -> release -> license, matching the design.
- Per design, no visible `TODO` text and no broken `<img>` reference; the HTML comment is the intended insertion point.

- [ ] **Step 2: Verify markdownlint locally.**

Run: `pnpm lint:md`
Expected: exits 0; no new violations.

- [ ] **Step 3: Commit.**

```bash
git add README.md
git commit -m "docs: #4 add README hero header with tagline and badges"
```

### Task T2: "What you get" skills section

**Files:**

- Modify: `README.md` (insert new `## What you get` section directly after the hero placeholder comment).

**Scope:** Section 4 of the design. Names each shipped skill with its slash-command invocation and a one-line outcome. Closes the skills-list half of AC-4-1.

- [ ] **Step 1: Append the section.**

Add directly below the hero asset HTML comment:

```markdown
## What you get

- **`/github-flows:new-issue`** — File a new GitHub issue with smart label selection, duplicate detection, and a public-repo leak guard.
- **`/github-flows:edit-issue`** — Edit an existing issue's title, body, labels, assignees, milestone, state, close reason, or relationships, preferring GraphQL where REST falls short.
- **`/github-flows:new-branch`** — Start work on an issue: branch from the default branch as `<issue-number>-<kebab-title>`, rebase, and install dependencies via the highest-priority lockfile.
- **`/github-flows:write-changelog`** — Render a user-facing changelog from a GitHub milestone, sourced from closed issues and their merging PRs.
```

- [ ] **Step 2: Cross-check copy against `skills/*/SKILL.md`.**

Read each `skills/<name>/SKILL.md` description. The slash-command invocations and outcomes above are fixed by the design; if a SKILL.md description has drifted, leave the README copy as written here (the design is canonical) and note the drift in the PR description rather than editing SKILL.md.

- [ ] **Step 3: Verify markdownlint.**

Run: `pnpm lint:md`
Expected: exits 0.

- [ ] **Step 4: Commit.**

```bash
git add README.md
git commit -m "docs: #4 add What you get skills section to README"
```

### Task T3: Quick start

**Files:**

- Modify: `README.md` (insert `## Quick start` section after `## What you get`).

**Scope:** Section 5 of the design. Three numbered steps targeting Claude Code with a real invocation against this repo's issue tracker. Satisfies AC-4-3 (no placeholder text, no `TODO`).

- [ ] **Step 1: Append the Quick start section.**

````markdown
## Quick start

Get from zero to a real invocation in under a minute (assumes [Claude Code](https://docs.claude.com/claude-code)):

1. Add the Patina Project marketplace:

   ```text
   /plugin marketplace add patinaproject/skills
   ```

2. Install the plugin:

   ```text
   /plugin install github-flows@patinaproject
   ```

3. File a real issue against this repo to confirm everything works:

   ```text
   /github-flows:new-issue patinaproject/github-flows "Tried github-flows quick start"
   ```

The skill drafts the issue, runs duplicate detection, and asks you to confirm before posting.
````

- [ ] **Step 2: Verify the section contains no placeholder text.**

Run: `grep -nE 'TODO|<!-- placeholder|<your-' README.md`
Expected: no matches inside the Quick start section. (Hits inside the Task T1 hero asset HTML comment are fine — that comment uses neither `TODO` nor `<!-- placeholder`.)

- [ ] **Step 3: Verify markdownlint.**

Run: `pnpm lint:md`
Expected: exits 0.

- [ ] **Step 4: Commit.**

```bash
git add README.md
git commit -m "docs: #4 add Quick start section to README"
```

### Task T4: Collapse install matrix into `<details>`

**Files:**

- Modify: `README.md` (relocate the existing eleven-editor install matrix into a collapsible block titled "Install in another editor", placed after `## Quick start`).

**Scope:** Section 6 of the design. Closes AC-4-4. Preserves the existing matrix content; only structural wrapping and minimal markdownlint touch-ups.

- [ ] **Step 1: Wrap the existing install matrix.**

Cut the existing install matrix (the eleven-editor table/list currently in `README.md`) and paste it inside this wrapper, placed after `## Quick start`:

```markdown
## Install in another editor

<details>
<summary>Show install steps for Cursor, Windsurf, Copilot, Codex, and others</summary>

<!-- existing eleven-editor install matrix goes here, unmodified except for markdownlint fixes -->

</details>
```

Per the design's markdownlint rules: leave a blank line after `<summary>` and before `</details>` so the embedded Markdown parses.

- [ ] **Step 2: Verify the matrix is reachable but no longer dominates the landing view.**

Visual check: open `README.md` rendered (e.g., `gh browse` or GitHub preview after pushing). The matrix must be collapsed by default and the badges/skills/quick-start must all be above it.

- [ ] **Step 3: Verify markdownlint.**

Run: `pnpm lint:md`
Expected: exits 0. If the matrix triggers new violations inside the `<details>` block (commonly MD033/MD041/blank-line rules), apply the smallest possible fix — do not rewrite matrix content.

- [ ] **Step 4: Commit.**

```bash
git add README.md
git commit -m "docs: #4 collapse README install matrix into details block"
```

### Task T5: Related links and license footer

**Files:**

- Modify: `README.md` (append `## Related` and `## License` sections at the end).

**Scope:** Sections 7–8 of the design. Consolidates closing links and points to `LICENSE`.

- [ ] **Step 1: Append the closing sections.**

```markdown
## Related

- [Patina Project marketplace (`patinaproject/skills`)](https://github.com/patinaproject/skills)
- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Release process](./RELEASING.md)

## License

MIT — see [`LICENSE`](./LICENSE).
```

- [ ] **Step 2: Remove any leftover stub sections.**

Search for and delete any lingering scaffolded content from the previous README, including empty `## What this plugin does` or `## Usage` headings and their `<!-- … -->` instructional comments. The hero asset HTML comment from Task T1 is the only HTML comment that should remain.

Run: `grep -nE 'What this plugin does|^## Usage' README.md`
Expected: no matches.

- [ ] **Step 3: Confirm `package.json` license field matches.**

Run: `grep -E '"license"' package.json`
Expected: `"license": "MIT",`. If it has changed, update the `## License` line accordingly.

- [ ] **Step 4: Verify markdownlint.**

Run: `pnpm lint:md`
Expected: exits 0.

- [ ] **Step 5: Commit.**

```bash
git add README.md
git commit -m "docs: #4 add Related links and License footer to README"
```

### Task T6: Final verification

**Files:** none modified — verification only.

**Scope:** Closes AC-4-5 and confirms AC-4-1 through AC-4-4 hold in the rendered README.

- [ ] **Step 1: Run markdownlint across the repo.**

Run: `pnpm lint:md`
Expected: exits 0.

- [ ] **Step 2: Confirm no `TODO` or placeholder text leaked.**

Run: `grep -nE 'TODO|<!-- placeholder|<your-repo>' README.md`
Expected: no matches.

- [ ] **Step 3: Render-check the README.**

Push the branch and open it on GitHub (or use `gh pr view --web` once the PR exists). Confirm visually:

- Title, tagline, three badges, and the hero comment are the first thing rendered. (AC-4-1, AC-4-2)
- "What you get" lists all four skills with slash-command invocations. (AC-4-1)
- "Quick start" is fully self-contained and contains a real invocation. (AC-4-3)
- "Install in another editor" appears collapsed by default and contains the full eleven-editor matrix when expanded. (AC-4-4)

- [ ] **Step 4: Confirm CI green on the PR.**

Run: `gh pr checks` (after the PR exists).
Expected: `lint-md` passes. (AC-4-5)

## Verification Summary

- `pnpm lint:md` — must exit 0 (AC-4-5).
- Visual inspection of the rendered README confirms AC-4-1, AC-4-2, AC-4-3, AC-4-4.
- `grep -nE 'TODO|<!-- placeholder|<your-repo>' README.md` — must return no matches (AC-4-3).
- CI `lint-md` workflow passes on the PR (AC-4-5).
