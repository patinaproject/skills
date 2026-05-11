# Plan: Add LABELS.md template to bootstrap core baseline so /github-flows:new-issue works on freshly bootstrapped repos [#39](https://github.com/patinaproject/bootstrap/issues/39)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a parser-compatible `.github/LABELS.md` from the `bootstrap` skill (core + agent-plugin variants) and reconcile this repo's own root file via realignment, in one PR.

**Architecture:** Two whole-file templates at the conventional locations. The core template covers non-plugin repos. The agent-plugin variant is a whole-file override (same shape + a `### Release-please (tool-managed)` subsection inserted between the `## Labels` table and `## Adding or changing labels`). The bootstrap emitter already resolves agent-plugin overrides as whole-file replacements – see `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md` and the agent-plugin `.github/workflows/release.yml` for the existing precedent. The audit checklist gains one row for parser-shape compliance. The repo-root `AGENTS.md` "Source of truth for repo baseline" list gains `.github/LABELS.md`. Finally, the local skill is run in realignment mode against this repo so the root `.github/LABELS.md` is regenerated from the new template.

**Tech Stack:** Markdown templates, husky + markdownlint-cli2, `gh` CLI for label inventory verification, the local `bootstrap` skill for self-realignment.

**Composition mechanism note:** Design doc D2 specifies mid-file composition for the agent-plugin overlay. The existing bootstrap emitter does not implement mid-file composition or sentinel-marker inserts – every "supplement" in `skills/bootstrap/templates/` (the only precedent being `patinaproject-supplement/`) is a whole-file replacement at the same relative path. This plan therefore implements the agent-plugin overlay as **option (c) whole-file override** at `skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl`. The duplication is one nine-row table; acceptable per the parent's guidance. The agent-plugin file embeds the Release-please subsection between the table and the trailing section, satisfying AC-39-3's structural requirements.

---

## File map

- Create: `skills/bootstrap/templates/core/.github/LABELS.md.tmpl` – parser-compatible LABELS.md for non-plugin repos. (T-39-1)
- Create: `skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl` – whole-file override for agent-plugin repos; identical to the core file plus a `### Release-please (tool-managed)` subsection. (T-39-2)
- Modify: `skills/bootstrap/audit-checklist.md` – add a parser-shape row under "Area 2 – GitHub metadata". (T-39-3)
- Modify: `AGENTS.md` (repo root) – add `.github/LABELS.md` to the "Covered files" bullet list under "Source of truth for repo baseline". (T-39-4)
- Modify: `.github/LABELS.md` (repo root) – regenerate from the new agent-plugin template via the local bootstrap skill in realignment mode. (T-39-5)
- Verify: `.github/LABELS.md` (repo root) parser shape per the audit-checklist row added in T-39-3. (T-39-6)

Per-task ATDD detail follows. Tasks are ordered so each one is independently verifiable; commit at the end of each task.

---

## Task T-39-1: Create the core LABELS.md template

**AC advanced:** AC-39-1.

**Files:**

- Create: `skills/bootstrap/templates/core/.github/LABELS.md.tmpl`

**Why this file:** A freshly bootstrapped non-plugin repo must end up with a parser-compatible `.github/LABELS.md`. Per design D1, the core template owns the canonical nine-label baseline. See design doc §Decisions D1 for shape rationale; do not re-litigate column count or row set here.

- [ ] **Step 1: Write the template file**

Create `skills/bootstrap/templates/core/.github/LABELS.md.tmpl` with exactly this content:

```markdown
# Labels

This file is the source of truth for when to apply each issue and pull-request label in this repository. It exists so reporters and agents can pick labels without guessing, and so label drift stays visible in review. For the authoritative runtime inventory, run `gh label list --json name,description`.

## Labels

| Name | Description |
| --- | --- |
| `bug` | Apply when the report describes a defect, regression, or unexpected behavior in shipped code or docs. |
| `documentation` | Apply when the change is primarily to Markdown, in-repo docs, or comments that describe behavior. |
| `duplicate` | Apply when another open or closed issue already tracks the same problem; link the canonical issue in the body. |
| `enhancement` | Apply when the report proposes a new capability or improves an existing one without fixing a defect. |
| `good first issue` | Apply when the work is small, well-scoped, and safe for a first-time contributor to pick up. |
| `help wanted` | Apply when maintainers are actively soliciting outside contributions on the issue. |
| `invalid` | Apply when the report is not actionable as filed (wrong repo, not reproducible, out of scope) and cannot be salvaged by editing. |
| `question` | Apply when the issue is a support request or clarification rather than a change request. |
| `wontfix` | Apply when the behavior described is intentional or the maintainers have decided not to act on it; leave a short rationale before closing. |

## Adding or changing labels

Use `gh label list --json name,description` as the canonical inventory and follow the label-hygiene rule in [`AGENTS.md`](../AGENTS.md) (every label must have a non-empty description). Do not introduce new labels in an issue or PR without first updating the repository label set and this file.
```

- [ ] **Step 2: Verify parser-shape preconditions on the new file**

Run:

```bash
grep -n "^## Labels$" skills/bootstrap/templates/core/.github/LABELS.md.tmpl
grep -n "^| Name | Description |$" skills/bootstrap/templates/core/.github/LABELS.md.tmpl
awk '/^## Labels$/{flag=1; next} /^## /{flag=0} flag && /^\| `?[a-z]/ {gsub(/[`| ]/,""); print $0}' skills/bootstrap/templates/core/.github/LABELS.md.tmpl
```

Expected:

- `## Labels` appears exactly once.
- `| Name | Description |` appears exactly once.
- The third command prints the first column values in order: `bug`, `documentation`, `duplicate`, `enhancement`, `goodfirstissue`, `helpwanted`, `invalid`, `question`, `wontfix` – alphabetically sorted, with `bug` and `enhancement` both present.

- [ ] **Step 3: Lint the file with markdownlint**

Run:

```bash
pnpm exec markdownlint-cli2 skills/bootstrap/templates/core/.github/LABELS.md.tmpl
```

Expected: exit code 0 (no findings).

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/templates/core/.github/LABELS.md.tmpl
git commit -m "feat: #39 add core LABELS.md template for bootstrap"
```

---

## Task T-39-2: Create the agent-plugin LABELS.md whole-file override

**AC advanced:** AC-39-3.

**Files:**

- Create: `skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl`

**Why this file:** The agent-plugin tree gets its own LABELS.md so the Release-please subsection ships only for repos that actually run release-please. The bootstrap emitter resolves this as a whole-file replacement of the core file (precedent: `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md` replaces the core RELEASING.md whole-file). The structural shape – single `## Labels` heading, single `| Name |` table, alphabetical first column, `### Release-please (tool-managed)` subsection placed after the table and before `## Adding or changing labels` – satisfies AC-39-3 without breaking the parser.

- [ ] **Step 1: Write the template file**

Create `skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl` with exactly this content:

```markdown
# Labels

This file is the source of truth for when to apply each issue and pull-request label in this repository. It exists so reporters and agents can pick labels without guessing, and so label drift stays visible in review. For the authoritative runtime inventory, run `gh label list --json name,description`.

## Labels

| Name | Description |
| --- | --- |
| `bug` | Apply when the report describes a defect, regression, or unexpected behavior in shipped code or docs. |
| `documentation` | Apply when the change is primarily to Markdown, in-repo docs, or comments that describe behavior. |
| `duplicate` | Apply when another open or closed issue already tracks the same problem; link the canonical issue in the body. |
| `enhancement` | Apply when the report proposes a new capability or improves an existing one without fixing a defect. |
| `good first issue` | Apply when the work is small, well-scoped, and safe for a first-time contributor to pick up. |
| `help wanted` | Apply when maintainers are actively soliciting outside contributions on the issue. |
| `invalid` | Apply when the report is not actionable as filed (wrong repo, not reproducible, out of scope) and cannot be salvaged by editing. |
| `question` | Apply when the issue is a support request or clarification rather than a change request. |
| `wontfix` | Apply when the behavior described is intentional or the maintainers have decided not to act on it; leave a short rationale before closing. |

### Release-please (tool-managed)

`release-please` creates and applies these labels automatically on the standing release PR; do not apply or remove them by hand. They may not appear in `gh label list` until the first release cycle runs.

- `autorelease: pending`: Applied to the release PR while a release is in progress.
- `autorelease: tagged`: Applied to the release PR once the release has been tagged.

## Adding or changing labels

Use `gh label list --json name,description` as the canonical inventory and follow the label-hygiene rule in [`AGENTS.md`](../AGENTS.md) (every label must have a non-empty description). Do not introduce new labels in an issue or PR without first updating the repository label set and this file.
```

- [ ] **Step 2: Verify parser-shape preconditions and Release-please placement**

Run:

```bash
grep -cn "^## Labels$" skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl
grep -cn "^| Name | Description |$" skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl
grep -n "^## Labels$\|^### Release-please (tool-managed)$\|^## Adding or changing labels$" skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl
```

Expected:

- First two commands each print `1` (single `## Labels` heading and single `| Name |` header row – parser invariant preserved).
- Third command prints three lines whose line numbers are strictly increasing in this order: `## Labels`, `### Release-please (tool-managed)`, `## Adding or changing labels`.

- [ ] **Step 3: Lint the file with markdownlint**

Run:

```bash
pnpm exec markdownlint-cli2 skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl
```

Expected: exit code 0 (no findings).

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl
git commit -m "feat: #39 add agent-plugin LABELS.md template with release-please section"
```

---

## Task T-39-3: Add parser-shape audit row

**AC advanced:** AC-39-5.

**Files:**

- Modify: `skills/bootstrap/audit-checklist.md`

**Why this file:** The audit checklist is the canonical source for what realignment mode walks. AC-39-5 requires `.github/LABELS.md` presence and parser-shape compliance to be a checked item under "Area 2 – GitHub metadata". Per design D3, the check is shape compliance, not row-content equivalence.

- [ ] **Step 1: Insert the new row into Area 2**

In `skills/bootstrap/audit-checklist.md`, locate the "Area 2 – GitHub metadata" table. Insert a new row immediately after the `.github/CODEOWNERS` row (so all `.github/*.md` and `.github/*.yaml`-style metadata files stay grouped before the `workflows/` rows).

The exact line to insert (using the table's existing column layout):

```markdown
| `.github/LABELS.md` | yes | present; contains a `## Labels` heading; the heading is followed by a markdown table whose header row starts with `\| Name \|`; the first data column lists `bug` and `enhancement` and is alphabetically sorted |
```

- [ ] **Step 2: Verify the row was added correctly**

Run:

```bash
grep -n "LABELS.md" skills/bootstrap/audit-checklist.md
```

Expected: one new line under Area 2 containing `.github/LABELS.md` and the parser-shape check text from Step 1. The existing "Reserved GitHub labels" sub-table is untouched.

- [ ] **Step 3: Lint the file with markdownlint**

Run:

```bash
pnpm exec markdownlint-cli2 skills/bootstrap/audit-checklist.md
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/audit-checklist.md
git commit -m "docs: #39 audit LABELS.md presence and parser shape"
```

---

## Task T-39-4: Add `.github/LABELS.md` to AGENTS.md "Source of truth" list

**AC advanced:** AC-39-4 (prerequisite for the realignment loop in T-39-5).

**Files:**

- Modify: `AGENTS.md` (repo root)

**Why this file:** Per design D5, `.github/LABELS.md` must be in the "Covered files" bullet list under `## Source of truth for repo baseline` so future hand-edits to the root file are blocked by the workflow contract. Note: `skills/bootstrap/templates/core/AGENTS.md.tmpl` does **not** currently contain this section – the "Source of truth" block is bootstrap-repo-specific and lives only at the repo root. (Verified via `grep -n "Source of truth" skills/bootstrap/templates/core/AGENTS.md.tmpl` returning no matches.) So the only edit needed for D5 is at the root `AGENTS.md`.

- [ ] **Step 1: Read the current "Covered files" block**

Run:

```bash
sed -n '21,44p' AGENTS.md
```

Expected: a bullet list starting with the `.github/workflows/*` entry and including bullets for `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, and `.github/copilot-instructions.md`, then a `RELEASING.md` line and so on.

- [ ] **Step 2: Insert the new bullet adjacent to the other `.github/*` entries**

Edit `AGENTS.md` to insert the following bullet line immediately after `- \`.github/copilot-instructions.md\`` (keeps all `.github/*` entries grouped):

```markdown
- `.github/LABELS.md`
```

- [ ] **Step 3: Verify the bullet is present and grouped**

Run:

```bash
grep -n "^- \`.github/" AGENTS.md
```

Expected: four lines, in order – `.github/workflows/*`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `.github/copilot-instructions.md`, `.github/LABELS.md`. (Five total `.github/*` bullets.)

- [ ] **Step 4: Lint the file with markdownlint**

Run:

```bash
pnpm exec markdownlint-cli2 AGENTS.md
```

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md
git commit -m "docs: #39 add LABELS.md to source-of-truth covered files"
```

---

## Task T-39-5: Realign this repo's `.github/LABELS.md` from the new template

**AC advanced:** AC-39-4 (and provides the artifact AC-39-1 / AC-39-2 / AC-39-3 will be verified against in T-39-6).

**Files:**

- Modify: `.github/LABELS.md` (repo root) – replace the current bullet-list shape with the table shape emitted by `skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl`. This repo is itself an agent plugin (it ships `.claude-plugin/`, `.codex-plugin/`, `release-please-config.json`), so the agent-plugin variant is the correct source.

**Why this file:** The "Source of truth for repo baseline" rule requires the template change and the mirrored root change to ship in the same PR. The current root file is a bullet list and would itself trip the `/github-flows:new-issue` parser; D4 makes converting it to the table shape part of this issue.

- [ ] **Step 1: Invoke the local bootstrap skill in realignment mode**

In a Claude Code session against this worktree, run:

```text
/bootstrap
```

Then answer prompts as follows:

- The skill auto-detects realignment mode (this repo has existing baseline files). No mode flag to set.
- When the realignment walks Area 2 and reaches `.github/LABELS.md`, it will report the file as **divergent** (current shape: bullet list under `## Current labels`; template shape: table under `## Labels` plus `### Release-please (tool-managed)` subsection).
- When prompted with `Action? (accept / skip / defer)` for the `.github/LABELS.md` recommendation, answer `accept`.
- For all other files in this realignment pass, answer `skip` (this PR is scoped to issue #39; out-of-scope baseline drift is not in scope here).

If the skill asks for `<owner>` / `<repo>` / agent-plugin detection, accept the autodetected values (`patinaproject` / `bootstrap` / yes – verifiable with `git remote get-url origin` and the presence of `.claude-plugin/`).

If `/bootstrap` is unavailable or the skill cannot be invoked from this Claude Code session, fall back to manually copying the agent-plugin template into place:

```bash
cp skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl .github/LABELS.md
```

The template currently contains no `{{...}}` placeholders that need substitution at emit time, so a literal copy is byte-for-byte equivalent to what the skill would emit for this repo. (Verify with `grep -c '{{' skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl` – expected output: `0`.)

- [ ] **Step 2: Verify the regenerated root file matches the template**

Run:

```bash
diff skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl .github/LABELS.md
```

Expected: empty diff (exit code 0). If the realignment skill performed any placeholder substitution, the diff will surface those lines and Step 1 should be re-run to capture what the skill actually emitted.

- [ ] **Step 3: Lint the regenerated file**

Run:

```bash
pnpm exec markdownlint-cli2 .github/LABELS.md
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add .github/LABELS.md
git commit -m "docs: #39 regenerate root LABELS.md from template"
```

---

## Task T-39-6: Verify the parser-shape audit assertion against the regenerated root file

**AC advanced:** AC-39-1, AC-39-2 (validation), AC-39-3, AC-39-5 (canonical assertion exercised end-to-end).

**Files:**

- Verify only: `.github/LABELS.md` (repo root). No code changes in this task.

**Why this task:** Per design §Validation strategy, the audit checklist's parser-shape assertion is the canonical test for AC-39-1, AC-39-3, and AC-39-4. Running it explicitly against the regenerated root file is the proof-of-correctness step before opening the PR.

- [ ] **Step 1: Walk the new audit row against the root file**

Run each check in turn against `.github/LABELS.md`:

```bash
test -f .github/LABELS.md && echo "present: yes"
grep -c "^## Labels$" .github/LABELS.md
grep -n "^| Name |" .github/LABELS.md
awk '/^## Labels$/{flag=1; next} /^## /{flag=0} flag && /^\| `?[a-z]/ {gsub(/[`| ]/,""); print $0}' .github/LABELS.md
```

Expected:

- First line: `present: yes`.
- Second command: `1` (exactly one `## Labels` heading).
- Third command: one match whose row text begins with `| Name |`.
- Fourth command: prints the first-column names in order – `bug`, `documentation`, `duplicate`, `enhancement`, `goodfirstissue`, `helpwanted`, `invalid`, `question`, `wontfix`. The list is alphabetical and includes both `bug` and `enhancement`.

If any check fails, STOP. Re-run T-39-5 to regenerate, then redo this step. Do not paper over a failure by hand-editing the root file.

- [ ] **Step 2: Verify the Release-please subsection placement**

Run:

```bash
grep -n "^## Labels$\|^### Release-please (tool-managed)$\|^## Adding or changing labels$" .github/LABELS.md
```

Expected: three lines whose line numbers strictly increase in the order `## Labels`, `### Release-please (tool-managed)`, `## Adding or changing labels`. This is the AC-39-3 placement assertion against the live root file.

- [ ] **Step 3: Confirm no second `## Labels` heading or second `| Name |` table sneaked in**

Run:

```bash
grep -c "^## Labels$" .github/LABELS.md
grep -c "^| Name |" .github/LABELS.md
```

Expected: both print `1`. (The Release-please subsection must not introduce a duplicate `## Labels` heading or a second table – this is the parser invariant from AC-39-3.)

- [ ] **Step 4: Manual AC-39-2 spot-check (optional but recommended)**

In a Claude Code session against this worktree, invoke `/github-flows:new-issue` and confirm Step 1's parser succeeds against the regenerated `.github/LABELS.md` (no malformed-table or file-not-found halt; the workflow proceeds to its label-selection step). If `/github-flows:new-issue` is not available in the executor's environment, document this as a deferred manual verification in the PR body's `Validation` section rather than blocking the PR.

- [ ] **Step 5: No commit needed**

This task verifies prior work; no files change. Do not create an empty commit.

---

## Self-review

- **Spec coverage:** AC-39-1 → T-39-1 + T-39-6 verifies. AC-39-2 → T-39-6 step 4. AC-39-3 → T-39-2 + T-39-6 steps 2–3. AC-39-4 → T-39-5 (template + root mirrored in one PR). AC-39-5 → T-39-3.
- **Out of scope per design (D-OOS):** parser changes, per-repo customization, label backfill on diverged repos, CI re-validation against `gh label list`. None of these tasks attempt them.
- **Composition mechanism:** option (c) whole-file override at `skills/bootstrap/templates/agent-plugin/.github/LABELS.md.tmpl`. Documented in the Architecture note above with file evidence.
- **Mirror obligation:** T-39-4 + T-39-5 ensure the `AGENTS.md` "Source of truth" list and the root `.github/LABELS.md` ship together with the template adds. The template-only commits (T-39-1, T-39-2, T-39-3) and the mirrored-root commits (T-39-4, T-39-5) all live on the same PR branch.
