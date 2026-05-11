# Plan: Sharpen commit-type guidance for product-surface changes [#54](https://github.com/patinaproject/bootstrap/issues/54)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execution mode is `subagent-driven`.

**Goal:** Replace the rationalizable "explanatory-only" commit-type rule with a path-first, glob-anchored discipline shipped through `skills/bootstrap/templates/**` and mirrored to root, so agents reliably pick `feat:` / `fix:` (not `docs:` / `chore:`) for product-surface changes.

**Architecture:** Templates-first / round-trip discipline. The canonical "Commit type selection" section lives in `skills/bootstrap/templates/core/AGENTS.md.tmpl` (lead with glob list + path-first rule, then type table, then rationalization table, red-flags STOP block, WRONG → RIGHT pair). The same content mirrors into `CONTRIBUTING.md.tmpl`, the per-tool surfaces (`.cursor/rules/{{repo}}.mdc`, `.windsurfrules`, `.github/copilot-instructions.md`) get a four-element block (glob list + path-first rule + WRONG → RIGHT + canonical link), and the bootstrap skill's own internals (`SKILL.md`, `agent-spawn-template.md`, `audit-checklist.md`, `pr-body-template.md`) align with the new rule. Realignment mirrors templates into root.

**Tech Stack:** Markdown only. No code; no CI changes; no commitlint changes. Verification by `grep`, `pnpm lint:md`, `.husky/commit-msg`, and a cold-context subagent dispatch.

**Source-of-truth design:** [`docs/superpowers/specs/2026-04-28-54-sharpen-commit-type-guidance-for-product-surface-changes-design.md`](../specs/2026-04-28-54-sharpen-commit-type-guidance-for-product-surface-changes-design.md). The design is the contract; this plan does not re-derive requirements from the issue alone.

---

## Surface inventory

Group A – **Templates** (under `skills/bootstrap/templates/**`, edited FIRST):

| File | Edits required | ACs |
|---|---|---|
| `skills/bootstrap/templates/core/AGENTS.md.tmpl` | Rewrite "Commit type selection" section: lead block (glob list + path-first rule sentence) BEFORE type table, retain/tighten type table, add rationalization table (9 rows), red-flags STOP block (no "adds or changes a rule" qualifier), one WRONG → RIGHT pair drawn from a real historical commit, and round-trip discipline reference linking to the AC-54-7 grep parity check. Delete the "Edits to `skills/**/SKILL.md` … unless explanatory-only" qualifier. | AC-54-1, AC-54-4, AC-54-5, AC-54-6 |
| `skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl` | Mirror the canonical lead block (glob list + path-first rule) and type table; cross-link to AGENTS.md for the full rationalization table + red flags. Delete the same "explanatory-only" qualifier. | AC-54-1, AC-54-4, AC-54-6 |
| `skills/bootstrap/templates/core/RELEASING.md` | Add a one-sentence cross-link near the "Conventional Commit types" block stating that mistyped commits silently suppress releases; point readers to AGENTS.md "Commit type selection". | AC-54-1 |
| `skills/bootstrap/templates/agent-plugin/.cursor/rules/{{repo}}.mdc` | Replace the single-line "Behavior-changing skill, workflow, prompt … must use release-triggering commit types" bullet with the four-element block: (a) verbatim product-surface glob list, (b) one-sentence path-first rule, (c) one WRONG → RIGHT pair, (d) link to canonical `AGENTS.md` section. ≤ 20 added lines. | AC-54-3 |
| `skills/bootstrap/templates/agent-plugin/.windsurfrules` | Same four-element block. ≤ 20 added lines. | AC-54-3 |
| `skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md` | Same four-element block. ≤ 20 added lines. | AC-54-3 |
| `skills/bootstrap/templates/agent-plugin/README.md.tmpl` | If it currently teaches commit types, mirror the lead block. If it does not, leave alone (per design's role-ownership table). | AC-54-3 (verification only) |

Group B – **Root mirrors** (realigned via the local `bootstrap` skill in realignment mode AFTER Group A lands):

- `AGENTS.md`
- `CONTRIBUTING.md`
- `RELEASING.md`
- `.cursor/rules/bootstrap.mdc`
- `.windsurfrules`
- `.github/copilot-instructions.md`

Group C – **Bootstrap skill internals** (this skill is a product surface; AC-54-8 meta-example):

| File | Edits required | ACs |
|---|---|---|
| `skills/bootstrap/SKILL.md` | Same "Commit type selection" rewrite as `AGENTS.md.tmpl` (this section is duplicated in SKILL.md lines 104-117 today). Lead with glob list + path-first rule; delete "explanatory-only" qualifier; cross-link to AGENTS.md for rationalization table. | AC-54-1, AC-54-4, AC-54-5, AC-54-6 |
| `skills/bootstrap/audit-checklist.md` | Add a checklist item under "Agent + repo docs" verifying the canonical commit-type section in `AGENTS.md`/`AGENTS.md.tmpl` leads with the glob list + path-first rule (so a realignment run catches drift on this design's content). | AC-54-2, AC-54-7 |
| `skills/bootstrap/agent-spawn-template.md` | If the spawn template references commit types, point it at the canonical AGENTS.md section. Otherwise leave alone. | AC-54-3 (verification only) |
| `skills/bootstrap/pr-body-template.md` | Add a Validation-section reminder: paste the AC-54-7 grep parity output (or "empty output verified") when the PR touches commit-type guidance. | AC-54-7 |

Group D – **Adjacent prompt surfaces** (verified in scope or explicitly out):

- `.claude/agents/` – none today (verified via `find skills -maxdepth 2`); no edits.
- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` – manifests; not commit-type instruction surfaces. No edits unless realignment of unrelated fields surfaces drift, in which case skip per templates-first discipline.
- `release-please-config.json`, `.release-please-manifest.json` – out of scope; no version-bump implication for this PR (the bootstrap plugin's own version will be bumped by release-please from the `feat:` squash title; no manual edit).
- `scripts/sync-plugin-versions.mjs`, `scripts/check-plugin-versions.mjs` – out of scope; no commit-type content.

## Canonical AGENTS.md "Commit type selection" section structure

The new section MUST appear in this order in both `skills/bootstrap/templates/core/AGENTS.md.tmpl` and root `AGENTS.md` (and the duplicated copy in `skills/bootstrap/SKILL.md`):

1. **Lead block (FIRST, before the type table) – AC-54-6 ordering requirement:**
   - Verbatim product-surface glob list (rendered as a code block or bulleted code spans):
     `skills/**`, `skills/bootstrap/templates/**`, `.claude-plugin/**`, `.codex-plugin/**`, `.cursor/**`, `.windsurfrules`, `.github/copilot-instructions.md`, `.github/workflows/**`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md`, `.github/LABELS.md`, `AGENTS.md`, `AGENTS.md.tmpl`, `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`, `RELEASING.md.tmpl`.
   - One-sentence path-first rule (verbatim, identical across all surfaces):
     `If any file in the diff is under one of these globs, the commit type is feat: or fix: – never docs: or chore:.`

2. **Type table** (existing four-row table, kept as-is for reference; the lead block makes it advisory rather than the primary decision tool).

3. **Rationalization table** (9 named excuses + counters, copied verbatim from the design's "Rationalization table (planted in canonical section)" subsection). Headers: `| Rationalization | Reality |`.

4. **Red Flags STOP block** (markdown blockquote starting `**STOP and reconsider if any of these are true:**` with three bullets, copied verbatim from the design's Red Flags subsection – and per HIGH-2 / MEDIUM-2 closure the bullet 3 wording does NOT contain "adds or changes a rule"; every edit to those files is `feat:` or `fix:` by path).

5. **WRONG → RIGHT pair** (≥1, drawn from a real historical commit). The plan picks `082c5e9` because it is the most pedagogical: it touched a plugin manifest AND skill body AND multiple templates, all three product-surface categories at once, and the rationalization in its subject ("standardize") is one of the named red-flag verbs.
   - WRONG: `docs: #46 standardize Patina Project name`
   - RIGHT: `feat: #46 standardize Patina Project name across product surfaces`

6. **Round-trip discipline reference**: one sentence noting that on this repo, the AGENTS.md content is shipped through `skills/bootstrap/templates/core/AGENTS.md.tmpl` and round-tripped via the `bootstrap` skill in realignment mode, with the AC-54-7 parity grep as the verification artifact. Link to `RELEASING.md` for the release-triggering implication.

The "Edits to `skills/**/SKILL.md` and adjacent skill workflow contracts are product/runtime changes by default, not documentation edits. Use `docs:` for those files only when the change is clearly explanatory-only and does not alter installed skill behavior." paragraph is **deleted entirely** in all surfaces. The path-first rule replaces it.

## Per-tool surface block (AC-54-3)

The verbatim block emitted into `.cursor/rules/{{repo}}.mdc`, `.windsurfrules`, and `.github/copilot-instructions.md` (and their root mirrors), tightened to ≤ 20 lines each:

````markdown
### Commit type – path-first rule

If any file in the diff is under one of these globs, the commit type is `feat:` or `fix:` – never `docs:` or `chore:`:

- `skills/**`
- `skills/bootstrap/templates/**`
- `.claude-plugin/**`, `.codex-plugin/**`
- `.cursor/**`, `.windsurfrules`, `.github/copilot-instructions.md`
- `.github/workflows/**`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md`, `.github/LABELS.md`
- `AGENTS.md`, `AGENTS.md.tmpl`, `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`, `RELEASING.md.tmpl`

Example – wording standardization across plugin manifests, skill bodies, and templates:

- WRONG: `docs: #46 standardize Patina Project name`
- RIGHT: `feat: #46 standardize Patina Project name across product surfaces`

Full rationalization table and red flags: see [`AGENTS.md` "Commit type selection"](/AGENTS.md#commit-type-selection).
````

The `{{repo}}.mdc` template uses `[\`AGENTS.md\` "Commit type selection"](/AGENTS.md#commit-type-selection)` as the link form. The `.windsurfrules` and `.github/copilot-instructions.md`templates use the same anchor with their existing relative paths (`AGENTS.md` and `../AGENTS.md` respectively). The verbatim glob bullet list is identical across all three surfaces – the AC-54-7 grep parity check enforces this.

## Round-trip parity grep (AC-54-7)

Run from repo root. Empty output = pass; any non-empty output is a hard blocker.

```bash
for f in \
  AGENTS.md \
  skills/bootstrap/templates/core/AGENTS.md.tmpl \
  CONTRIBUTING.md \
  skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl \
  .github/copilot-instructions.md \
  skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md \
  .cursor/rules/*.mdc \
  skills/bootstrap/templates/agent-plugin/.cursor/rules/*.mdc \
  .windsurfrules \
  skills/bootstrap/templates/agent-plugin/.windsurfrules ; do
  grep -q 'skills/\*\*' "$f" && \
  grep -q '\.claude-plugin/\*\*' "$f" && \
  grep -q '\.codex-plugin/\*\*' "$f" && \
  grep -q '\.windsurfrules' "$f" && \
  grep -q 'copilot-instructions\.md' "$f" \
    || echo "MISSING glob list in: $f"
done
```

The output (or the literal phrase `empty output verified`) MUST be pasted into the PR body's `Validation` section. Non-empty output blocks merge.

## Bootstrap skill realignment behavior (AC-54-2 + AC-54-8)

- All Group A and Group C edits use commit type `feat:` (per the very rule being added; AC-54-8 meta-example).
- After Group A + C land, Group B is generated by running the local `bootstrap` skill in realignment mode against this repo. The skill's audit-checklist (now updated by Group C) catches the drift on AGENTS.md / CONTRIBUTING.md / per-tool surfaces and proposes the diff. The implementer accepts and commits.
- Realignment commits also use `feat:` (root files are product surfaces).
- **Branch commits vs squash commit**: the squash PR title is what release-please reads, so as long as the squash title is `feat: #54 sharpen commit-type guidance for product-surface changes`, individual branch commits MAY mix `feat:` (Group A, B, C) and `docs:` (the design doc commit on `d34eb5f` already exists; the plan commit will be `docs:` per the brainstormer/planner artifact carve-out). All branch commits remain conventional-commits-compliant and pass the husky `commit-msg` hook.
- Both template commits and root-mirror commits ride in the same PR.

## GREEN cold-context subagent verification (AC-54-1)

After all edits land but before requesting review, the implementer dispatches one cold-context subagent (no prior conversation context, no design-doc loaded) with the following prompt and sample diff:

**Prompt to subagent:**

```text
You are about to commit the following diff in the patinaproject/bootstrap repository.
Read AGENTS.md (especially the "Commit type selection" section) and propose a one-line
conventional-commit subject for this change. Do not write code; just answer with the
commit subject and a one-sentence rationale.

Diff (synthetic; treat as if real):

  diff --git a/skills/bootstrap/SKILL.md b/skills/bootstrap/SKILL.md
  @@ -7,1 +7,1 @@
  - `bootstrap` scaffolds a repository – new or existing – to the Patina Project baseline.
  + `bootstrap` scaffolds a repository (new or existing) to the Patina Project baseline.

The issue number to reference is #99 (synthetic).
```

**Pass criterion:** Subagent picks `feat:` or `fix:` (most likely `feat:` because the change touches `skills/**`). Either is acceptable. `docs:` or `chore:` is a fail; the implementer must iterate on the guidance until a fresh subagent picks correctly.

**Recorded artifact:** Paste the subagent's verbatim response into the PR body's Validation section under an `### AC-54-1` heading, with the chosen type called out.

## ATDD task ordering

Workstreams W1 → W5 run sequentially because the round-trip discipline requires templates first, then realignment. Within W1, the three template-edit tasks (T1.2, T1.3, T1.4) are independent of each other and CAN be fanned out by the Executor via `superpowers:dispatching-parallel-agents`. T1.5 (per-tool surfaces) is also independent of T1.2-T1.4 and can be parallelized. T2 onward must be strictly sequential.

| Workstream | Tasks | Phase | Parallelizable? |
|---|---|---|---|
| W1: Templates + bootstrap-skill internals | T1.1 RED, T1.2 GREEN AGENTS.md.tmpl, T1.3 GREEN CONTRIBUTING.md.tmpl, T1.4 GREEN SKILL.md, T1.5 GREEN per-tool templates, T1.6 GREEN audit-checklist + pr-body-template, T1.7 GREEN RELEASING.md cross-link, T1.8 commit | RED → GREEN | T1.2/T1.3/T1.4/T1.5 parallel; T1.6/T1.7 parallel after; T1.1, T1.8 sequential |
| W2: Run grep RED | T2.1 grep on templates only, expect MISSING for root files (RED before realignment) | RED | sequential |
| W3: Realignment to root mirrors | T3.1 run bootstrap skill realignment, T3.2 accept root diffs, T3.3 commit | REFACTOR | sequential |
| W4: GREEN verification | T4.1 grep parity (empty), T4.2 markdown lint, T4.3 cold-context subagent verification | GREEN | T4.1/T4.2 parallel; T4.3 last |
| W5: PR | T5.1 PR body assembly, T5.2 push branch, T5.3 open PR | – | sequential |

---

## Workstream W1 – Templates + bootstrap-skill internals

### Task T1.1: RED – write the parity-check grep and confirm it currently fails

**Files:**

- Read: `skills/bootstrap/templates/core/AGENTS.md.tmpl` (current state, lacks lead glob list).

- [ ] **Step 1: Run the AC-54-7 grep one-liner against current `main`-equivalent state**

Run from repo root:

```bash
for f in \
  AGENTS.md \
  skills/bootstrap/templates/core/AGENTS.md.tmpl \
  CONTRIBUTING.md \
  skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl \
  .github/copilot-instructions.md \
  skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md \
  .cursor/rules/*.mdc \
  skills/bootstrap/templates/agent-plugin/.cursor/rules/*.mdc \
  .windsurfrules \
  skills/bootstrap/templates/agent-plugin/.windsurfrules ; do
  grep -q 'skills/\*\*' "$f" && \
  grep -q '\.claude-plugin/\*\*' "$f" && \
  grep -q '\.codex-plugin/\*\*' "$f" && \
  grep -q '\.windsurfrules' "$f" && \
  grep -q 'copilot-instructions\.md' "$f" \
    || echo "MISSING glob list in: $f"
done
```

Expected: NON-empty output naming several surfaces missing the glob list (`AGENTS.md`, `AGENTS.md.tmpl`, `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`, all four per-tool surfaces). This is the RED-phase failing test.

- [ ] **Step 2: Record the RED-phase output verbatim**

Save the grep output to a scratch file or paste into the eventual PR body's `Validation` section under "RED-phase baseline". Confirm the test fails before any GREEN edit.

### Task T1.2: GREEN – rewrite canonical section in `AGENTS.md.tmpl`

**Files:**

- Modify: `skills/bootstrap/templates/core/AGENTS.md.tmpl` (replace lines 104-117 inclusive – the existing "Commit type selection" subsection).

- [ ] **Step 1: Replace the section body**

Replace the existing block (the "Choose the commit type by product impact …" paragraph through the "Use `docs:` … explanatory-only …" paragraph) with the new section in this exact order: (1) lead block – glob list + path-first rule; (2) type table (kept verbatim from current); (3) rationalization table (9 rows, copied from the design); (4) red-flags STOP blockquote (three bullets, no "adds or changes a rule" qualifier on bullet 3); (5) WRONG → RIGHT pair using `082c5e9`; (6) round-trip discipline reference paragraph linking to `RELEASING.md`.

The full text follows the canonical structure spelled out under "Canonical AGENTS.md 'Commit type selection' section structure" above. Use the verbatim glob list and path-first rule sentence from this plan; do NOT paraphrase.

- [ ] **Step 2: Verify the section ordering matches AC-54-6**

The lead block (glob list + path-first rule) MUST appear before the type table. Re-read the section and confirm.

- [ ] **Step 3: Verify deletion of the "explanatory-only" qualifier**

Run:

```bash
grep -n "explanatory-only\|clearly explanatory" skills/bootstrap/templates/core/AGENTS.md.tmpl
```

Expected: empty output. Any hit means the loophole is still present and the file must be re-edited.

### Task T1.3: GREEN – mirror lead block in `CONTRIBUTING.md.tmpl`

**Files:**

- Modify: `skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl` (existing "Choose the commit type by product impact" block at line 26).

- [ ] **Step 1: Replace the section**

Insert the lead block (glob list + path-first rule sentence, identical to AGENTS.md.tmpl) BEFORE the existing four-row type table. Delete any "explanatory-only" qualifier text. Add a one-sentence cross-link "See [`AGENTS.md` 'Commit type selection'](AGENTS.md#commit-type-selection) for the full rationalization table and red flags."

- [ ] **Step 2: Verify deletion of the qualifier**

```bash
grep -n "explanatory-only\|clearly explanatory" skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl
```

Expected: empty.

### Task T1.4: GREEN – mirror canonical section in `skills/bootstrap/SKILL.md`

**Files:**

- Modify: `skills/bootstrap/SKILL.md` (lines 104-117).

- [ ] **Step 1: Replace the section**

The bootstrap skill's own SKILL.md duplicates the AGENTS.md "Commit type selection" section. Replace it with the same canonical structure (lead block, type table, rationalization table, red flags, WRONG → RIGHT, round-trip reference).

- [ ] **Step 2: Verify**

```bash
grep -n "explanatory-only\|clearly explanatory" skills/bootstrap/SKILL.md
```

Expected: empty.

### Task T1.5: GREEN – per-tool surface templates (AC-54-3, four-element block)

**Files:**

- Modify: `skills/bootstrap/templates/agent-plugin/.cursor/rules/{{repo}}.mdc`
- Modify: `skills/bootstrap/templates/agent-plugin/.windsurfrules`
- Modify: `skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md`

- [ ] **Step 1: Replace the existing single-line "Behavior-changing skill, workflow, prompt …" bullet in each file with the four-element block**

Use the verbatim block from the "Per-tool surface block (AC-54-3)" section above. The glob list, path-first rule sentence, WRONG → RIGHT pair, and canonical link MUST be byte-identical across all three files (modulo the link target's relative path: `/AGENTS.md` for `.mdc`, `AGENTS.md` for `.windsurfrules`, `../AGENTS.md` for `.github/copilot-instructions.md`).

- [ ] **Step 2: Verify each surface ≤ 20 added lines**

```bash
wc -l skills/bootstrap/templates/agent-plugin/.cursor/rules/*.mdc \
       skills/bootstrap/templates/agent-plugin/.windsurfrules \
       skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md
```

Expected: each file gains ≤ 20 lines vs the pre-edit count (17/11/11).

- [ ] **Step 3: Verify glob-list parity across the three templates**

```bash
for f in skills/bootstrap/templates/agent-plugin/.cursor/rules/*.mdc \
         skills/bootstrap/templates/agent-plugin/.windsurfrules \
         skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md ; do
  grep -c 'skills/\*\*\|\.claude-plugin/\*\*\|\.codex-plugin/\*\*' "$f"
done
```

Expected: each file outputs `3` (or higher if globs appear elsewhere). Mismatched counts indicate drift.

### Task T1.6: GREEN – bootstrap skill audit-checklist + pr-body-template

**Files:**

- Modify: `skills/bootstrap/audit-checklist.md`
- Modify: `skills/bootstrap/pr-body-template.md`

- [ ] **Step 1: Add an audit-checklist item**

Under "Agent + repo docs" (or the equivalent section), append:

```markdown
- AGENTS.md and AGENTS.md.tmpl: the "Commit type selection" section leads with the product-surface glob list and one-sentence path-first rule BEFORE the type table; contains a rationalization table, red-flags STOP block, and at least one WRONG → RIGHT pair. Verify with the parity grep in `docs/superpowers/specs/2026-04-28-54-…-design.md` AC-54-7.
```

- [ ] **Step 2: Update pr-body-template.md**

Add a Validation-section reminder line:

```markdown
- Commit-type guidance changes: paste output of the AC-54-7 parity grep (or `empty output verified`) here.
```

### Task T1.7: GREEN – `RELEASING.md` cross-link

**Files:**

- Modify: `skills/bootstrap/templates/core/RELEASING.md` (near line 124, "Determined from releasable Conventional Commit types – no human choice").

- [ ] **Step 1: Add a one-sentence cross-link**

Append after the existing "Conventional Commit types" paragraph:

```markdown
Mistyped commits silently suppress releases. See [`AGENTS.md` "Commit type selection"](AGENTS.md#commit-type-selection) for the path-first rule and rationalization table.
```

### Task T1.8: Commit Workstream 1

- [ ] **Step 1: Stage all template + skill-internal edits**

```bash
git add \
  skills/bootstrap/templates/core/AGENTS.md.tmpl \
  skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl \
  skills/bootstrap/templates/core/RELEASING.md \
  skills/bootstrap/templates/agent-plugin/.cursor/rules/{{repo}}.mdc \
  skills/bootstrap/templates/agent-plugin/.windsurfrules \
  skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md \
  skills/bootstrap/SKILL.md \
  skills/bootstrap/audit-checklist.md \
  skills/bootstrap/pr-body-template.md
```

- [ ] **Step 2: Commit with `feat:`**

```bash
git commit -m "feat: #54 sharpen commit-type guidance in templates"
```

Subject ≤ 72 chars (verified: 51). Husky `commit-msg` hook validates; husky `pre-commit` runs markdownlint-cli2.

Expected: commit succeeds; `pnpm lint:md` (run by lint-staged) passes on staged Markdown.

---

## Workstream W2 – RED grep against templates-only state

### Task T2.1: Run AC-54-7 parity grep; confirm root files still missing

- [ ] **Step 1: Run the parity grep**

Same one-liner as T1.1.

Expected: non-empty output naming the six root files (`AGENTS.md`, `CONTRIBUTING.md`, `.github/copilot-instructions.md`, `.cursor/rules/bootstrap.mdc`, `.windsurfrules`) – the realignment loop has not yet run. Templates should NO LONGER appear in the missing list.

- [ ] **Step 2: Confirm template-side passes**

The grep output must NOT include any path under `skills/bootstrap/templates/**`. If it does, return to W1 and fix.

---

## Workstream W3 – Realignment to root mirrors

### Task T3.1: Run the local `bootstrap` skill in realignment mode

- [ ] **Step 1: Invoke the bootstrap skill**

From the repo root, invoke the local `bootstrap` skill (e.g. `/bootstrap` or the equivalent skill invocation in the harness). Provide context that the target is this repo and the mode is realignment.

The skill walks `skills/bootstrap/audit-checklist.md`. The new audit-checklist item from T1.6 plus the existing "Agent + repo docs" batch will surface drift on `AGENTS.md`, `CONTRIBUTING.md`, `RELEASING.md`, `.cursor/rules/bootstrap.mdc`, `.windsurfrules`, `.github/copilot-instructions.md`.

- [ ] **Step 2: Accept the proposed root diffs**

For each diff preview, accept (do not skip or defer). The skill never overwrites without confirmation; this is the explicit confirmation step.

### Task T3.2: Verify root mirrors match templates verbatim

- [ ] **Step 1: Spot-check by diff**

```bash
diff <(sed -n '/### Commit type selection/,/^## /p' AGENTS.md) \
     <(sed -n '/### Commit type selection/,/^## /p' skills/bootstrap/templates/core/AGENTS.md.tmpl)
```

Expected: empty (or only template-substitution differences if any).

### Task T3.3: Commit the root realignment

- [ ] **Step 1: Stage and commit**

```bash
git add AGENTS.md CONTRIBUTING.md RELEASING.md \
        .cursor/rules/bootstrap.mdc .windsurfrules .github/copilot-instructions.md
git commit -m "feat: #54 realign root commit-type guidance from templates"
```

Subject ≤ 72 chars (verified: 56). Both `feat:` per AC-54-8.

---

## Workstream W4 – GREEN verification

### Task T4.1: AC-54-7 parity grep is now empty

- [ ] **Step 1: Run the parity grep**

Same one-liner. Expected: **empty output**.

- [ ] **Step 2: Capture the verification artifact**

Save the (empty) output to paste in PR body. If non-empty, the listed surface(s) are still missing the glob list – return to W1/W3 to fix; this is a hard blocker.

### Task T4.2: Markdown lint

- [ ] **Step 1: Run repo-wide markdown lint**

```bash
pnpm lint:md
```

Expected: exit 0.

### Task T4.3: Cold-context subagent verification (AC-54-1 GREEN)

- [ ] **Step 1: Dispatch one cold-context subagent**

Use the prompt from "GREEN cold-context subagent verification" above. Do not load the design doc; the subagent should rely solely on the updated `AGENTS.md`.

- [ ] **Step 2: Record the response**

Capture the subagent's commit subject + rationale verbatim.

- [ ] **Step 3: Pass/fail check**

Pass = subagent picks `feat:` or `fix:`. Fail = `docs:` or `chore:`. On fail, return to W1 and tighten the guidance further; re-run W3 + W4. AC-54-1 cannot be claimed until a cold-context subagent passes.

---

## Workstream W5 – PR

### Task T5.1: Assemble PR body

The PR body MUST follow `.github/pull_request_template.md` headings verbatim (`Summary`, `Linked issue`, `Acceptance criteria`, `Validation`, `Docs updated`).

- [ ] **Step 1: Render PR body**

Use the template. Under `Acceptance criteria`, include eight `### AC-54-N` headings (AC-54-1 through AC-54-8) with one-line outcome summaries under each. Under `Validation`, paste:

- The empty AC-54-7 grep output (or `empty output verified`).
- The `pnpm lint:md` exit-zero confirmation.
- The cold-context subagent's verbatim response (under AC-54-1).
- The husky `commit-msg` hook accepted both branch commits (passing each `feat: #54 …` subject).

Under `Summary`, call out the meta-example: this PR is itself the test of the rule it ships. Branch commits use `feat:` for content-bearing changes (W1 and W3) and `docs:` for the planner artifact (the plan-doc commit referenced below).

### Task T5.2: Push branch and open PR

- [ ] **Step 1: Push**

```bash
git push -u origin 54-sharpen-commit-type-guidance-for-product-surface-changes
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "feat: #54 sharpen commit-type guidance for product-surface changes" \
  --body-file <rendered-pr-body.md>
```

Title length: 71 chars (verified ≤ 72). PR-title lint will accept.

If "for product-surface changes" needs to be truncated to fit a stricter local limit, use `feat: #54 sharpen commit-type guidance for product surfaces` (60 chars) – but do NOT truncate without need.

---

## Commit-type discipline for the implementation itself (AC-54-8 meta-example)

- **Squash PR title (and merge commit subject)**: `feat: #54 sharpen commit-type guidance for product-surface changes`. release-please reads this and bumps minor.
- **Branch commits**:
  - `d34eb5f docs: #54 add design doc for sharpening commit-type guidance` (already on branch; pure design-doc, `docs:` correct per the spec carve-out).
  - `3cbaeeb docs: #54 address adversarial review on commit-type design` (already on branch; same carve-out).
  - The plan-doc commit landed by this Planner: `docs: #54 add implementation plan for commit-type guidance` (this file under `docs/superpowers/plans/**`; same brainstormer/planner artifact carve-out as AC-54-8).
  - W1 commit: `feat: #54 sharpen commit-type guidance in templates` – touches `skills/bootstrap/templates/**` and `skills/bootstrap/SKILL.md`. Both are product surfaces. `feat:` is correct.
  - W3 commit: `feat: #54 realign root commit-type guidance from templates` – touches root product surfaces. `feat:` is correct.
- **PR body**: explicitly call out this commit-type breakdown as the worked example for AC-54-8.

---

## Validation evidence to record in PR body

Per `.github/pull_request_template.md` headings (verbatim, in template order):

| Template heading | Evidence |
|---|---|
| `Summary` | One paragraph: shipped path-first commit-type guidance through templates → root, closed the "explanatory-only" loophole, called out meta-example AC-54-8. |
| `Linked issue` | `Closes #54`. |
| `Acceptance criteria` | Eight `### AC-54-N` headings (AC-54-1 through AC-54-8), each with a one-line outcome summary and verification under it. |
| `Validation` | (a) AC-54-7 parity grep output (empty), (b) `pnpm lint:md` exit 0, (c) commit-msg hook accepted each `feat: #54 …` and `docs: #54 …` subject, (d) cold-context subagent response (under AC-54-1), (e) markdownlint clean for changed files. |
| `Docs updated` | Yes – `AGENTS.md`, `CONTRIBUTING.md`, `RELEASING.md`, `.cursor/rules/bootstrap.mdc`, `.windsurfrules`, `.github/copilot-instructions.md`, `skills/bootstrap/SKILL.md`, plus templates under `skills/bootstrap/templates/**` and supporting `audit-checklist.md` / `pr-body-template.md`. |

Per-AC verification under `Acceptance criteria`:

- **AC-54-1**: cold-context subagent picks `feat:`/`fix:` on the synthetic skill diff. (W4.3 evidence.)
- **AC-54-2**: realignment commit (W3.3) lands in same PR as templates commit (W1.8); both reference `#54`.
- **AC-54-3**: per-tool surfaces contain (a) glob list, (b) path-first rule, (c) WRONG → RIGHT, (d) link to canonical. (Manual inspection + W4.1 grep parity.)
- **AC-54-4**: rationalization table has 9 rows including the named excuses. (Manual inspection of canonical section.)
- **AC-54-5**: WRONG → RIGHT pair drawn from `082c5e9`. (Manual inspection.)
- **AC-54-6**: lead block (glob list + path-first rule) appears BEFORE the type table; glob list contains every path required by the design. (Manual inspection.)
- **AC-54-7**: parity grep empty. (W4.1 output.)
- **AC-54-8**: this PR's commits use the rule it ships; called out in `Summary`.

---

## Risks and blockers (none observed; mitigations recorded)

- **release-please version bump**: the bootstrap plugin version will minor-bump from `1.3.0` to `1.4.0` once this PR's `feat:` squash lands. `release-please-config.json` and `.release-please-manifest.json` need no manual edit (release-please owns the bump). Confirmed by reading both files: they reference plugin manifest paths but auto-update them via `extra-files` jsonpath.
- **Sync scripts**: `scripts/sync-plugin-versions.mjs` and `scripts/check-plugin-versions.mjs` operate on plugin manifest versions only; no commit-type content. No edits required. Confirmed by inspection of `skills/bootstrap/SKILL.md` line 165.
- **Per-tool surface realignment wiring**: the bootstrap skill's audit-checklist already covers `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md` under batch 5 ("AI platform surfaces") per `skills/bootstrap/SKILL.md` line 47. Confirmed: realignment can mirror these templates into root. No blocker.
- **Adjacent prompt surfaces**: no `.claude/agents/` files exist in this repo; verified by `find skills -maxdepth 2`. No edits required there.
- **Markdown link to `AGENTS.md` anchor**: the section heading `### Commit type selection` produces the anchor `#commit-type-selection`. Verified by markdownlint conventions. If markdownlint complains about anchor casing in any surface, switch to a plain relative-path link (`AGENTS.md`) without the fragment.

No blockers identified. Plan is ready for execution.

---

## Self-review

- **Spec coverage**: Eight ACs (AC-54-1 through AC-54-8) each map to at least one task: AC-54-1 → T4.3; AC-54-2 → T3.1, T3.3; AC-54-3 → T1.5; AC-54-4 → T1.2 (rationalization table); AC-54-5 → T1.2 (WRONG → RIGHT pair); AC-54-6 → T1.2 (ordering + glob list); AC-54-7 → T2.1, T4.1; AC-54-8 → T1.8, T3.3, T5.1 (commit subjects + PR-body callout).
- **Placeholder scan**: No `TODO`, `TBD`, "implement later", or "fill in details" present. All exact paths and grep one-liners spelled out.
- **Type/path consistency**: glob list spelled the same way every time it appears (lead block, per-tool surfaces, audit checklist, grep parity check). Path-first rule sentence is a single canonical sentence reused verbatim. WRONG → RIGHT pair uses `082c5e9` consistently.
