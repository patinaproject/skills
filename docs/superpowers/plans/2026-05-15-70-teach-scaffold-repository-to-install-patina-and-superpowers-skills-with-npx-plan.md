# Teach scaffold-repository to install Patina and Superpowers skills with npx Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scaffolded repositories document and expose a repeatable `npx skills` install path for both Patina Project skills and Superpowers skills.

**Architecture:** Treat scaffold templates as the source of generated behavior. Add the portable install command to the emitted package scripts, surface it in generated README and AGENTS guidance, and teach the realignment checklist plus README verifier to catch stale scaffold outputs.

**Tech Stack:** Markdown skill contracts and templates, JSON package scripts, Node verifier script, PNPM validation commands.

---

## Approved Inputs

- Issue: [#70](https://github.com/patinaproject/skills/issues/70)
- Design: `docs/superpowers/specs/2026-05-15-70-teach-scaffold-repository-to-install-patina-and-superpowers-skills-with-npx-design.md`
- Gate 1 approval: operator said `lgtm`
- Adversarial review: clean; checked AC coverage, file surface, RED/GREEN baseline, rationalization resistance, red flags, token efficiency, role ownership, and stage-gate bypass paths.

## File Structure

- Modify `skills/scaffold-repository/templates/core/package.json.tmpl`: add a generated `skills:install` script.
- Modify `skills/scaffold-repository/templates/agent-plugin/README.md.tmpl`: document the portable `npx skills` path first and keep marketplace paths as host-specific alternatives.
- Modify `skills/scaffold-repository/templates/core/AGENTS.md.tmpl`: tell Superteam-enabled repos how to install required skills before invoking Superteam.
- Modify `skills/scaffold-repository/SKILL.md`: update the skill contract for new-repo mode, prompt semantics, plugin enablement, and emitted package scripts.
- Modify `skills/scaffold-repository/audit-checklist.md`: add stale checks for missing `skills:install` and missing Superteam install guidance.
- Modify `scripts/verify-scaffold-agent-plugin-readme.js`: assert the generated README and contract surfaces include the new install path.

## Task 1: Add the Generated Package Script

**Files:**

- Modify: `skills/scaffold-repository/templates/core/package.json.tmpl`

- [ ] **Step 1: Inspect the current script block**

Run:

```bash
sed -n '1,80p' skills/scaffold-repository/templates/core/package.json.tmpl
```

Expected: the `scripts` object contains `prepare`, `commitlint`, `lint:md`, `sync:versions`, and `check:versions`, but no `skills:install`.

- [ ] **Step 2: Add `skills:install`**

Edit the `scripts` object so it contains:

```json
"skills:install": "npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills -y && npm_config_ignore_scripts=true npx skills@1.5.6 add obra/superpowers -y"
```

Keep the existing scripts unchanged. Use `skills@1.5.6` to match the repository's documented CLI pin in `docs/release-flow.md`, and use `npm_config_ignore_scripts=true` to avoid nested install hooks during skill installation.

- [ ] **Step 3: Verify JSON validity**

Run:

```bash
node -e 'JSON.parse(require("fs").readFileSync("skills/scaffold-repository/templates/core/package.json.tmpl","utf8")); console.log("package template ok")'
```

Expected: `package template ok`.

## Task 2: Update Generated README Install Guidance

**Files:**

- Modify: `skills/scaffold-repository/templates/agent-plugin/README.md.tmpl`

- [ ] **Step 1: Inspect the current installation section**

Run:

```bash
sed -n '1,90p' skills/scaffold-repository/templates/agent-plugin/README.md.tmpl
```

Expected: installation starts with Claude Code marketplace instructions and does not lead with `npx skills`.

- [ ] **Step 2: Add a portable install subsection before host sections**

Under `## Installation`, replace the opening paragraph with guidance that says the portable cross-runtime path is:

```bash
pnpm skills:install
```

Then show the equivalent direct commands:

```bash
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills -y
npm_config_ignore_scripts=true npx skills@1.5.6 add obra/superpowers -y
```

State that Superteam-capable workflows need both command sources: Patina Project skills provide the workflow skills and Superpowers provides the supporting execution/review skills.

- [ ] **Step 3: Preserve host marketplace instructions**

Keep `### Claude Code`, `### OpenAI Codex CLI`, and `### OpenAI Codex App`. Reframe them as host-specific marketplace alternatives after the portable `npx skills` path. Do not remove the existing Claude Code `/plugin marketplace add` and `/plugin install` commands.

- [ ] **Step 4: Render-check placeholders**

Run:

```bash
node scripts/verify-scaffold-agent-plugin-readme.js
```

Expected before Task 6 updates: it may fail only because the verifier has not learned the new expectations yet. Any placeholder or existing assertion failure must be fixed immediately.

## Task 3: Update Generated Contributor Guidance

**Files:**

- Modify: `skills/scaffold-repository/templates/core/AGENTS.md.tmpl`

- [ ] **Step 1: Add a Superteam install note near development commands**

Add a concise bullet under `## Build, Test, and Development Commands`:

```markdown
- `pnpm skills:install`: install the Patina Project skills and Superpowers skills required for Superteam-oriented workflows.
```

- [ ] **Step 2: Add a Superteam readiness note near artifact guidance**

After the Superpowers artifact filename guidance, add:

```markdown
When this repo uses the Superteam workflow, run `pnpm skills:install` before invoking Superteam. The script installs both `patinaproject/skills` and `obra/superpowers` through `npx skills`, which is the portable cross-runtime install path. Host marketplace plugin enablement may still be present, but it is not the only setup step.
```

- [ ] **Step 3: Inspect for repeated wording**

Run:

```bash
rg -n "skills:install|obra/superpowers|patinaproject/skills|marketplace" skills/scaffold-repository/templates/core/AGENTS.md.tmpl
```

Expected: one command bullet and one Superteam readiness paragraph; no long duplicate install walkthrough.

## Task 4: Update scaffold-repository Contract and Realignment Checks

**Files:**

- Modify: `skills/scaffold-repository/SKILL.md`
- Modify: `skills/scaffold-repository/audit-checklist.md`

- [ ] **Step 1: Update new-repo behavior**

In `SKILL.md`, change the `<use-superteam>` behavior so it says the skill emits:

- `docs/superpowers/specs/.gitkeep`
- `docs/superpowers/plans/.gitkeep`
- generated docs that explain `pnpm skills:install`
- the `skills:install` package script that installs both `patinaproject/skills` and `obra/superpowers` through `npx skills`

- [ ] **Step 2: Update package and plugin sections**

In `SKILL.md`, add `skills:install` to the package-script convention and update `## Plugin enablement` so it says `.claude/settings.json` remains declarative host enablement while `npx skills` is the portable setup path.

- [ ] **Step 3: Update Superpowers opt-in checklist**

In `audit-checklist.md`, extend `Area 6 - Superpowers opt-in` with checks for:

- `package.json` has `scripts.skills:install`
- `AGENTS.md` mentions `pnpm skills:install`
- generated install docs mention both `patinaproject/skills` and `obra/superpowers`

Classify missing items as `stale`, not `missing`, when the repo already has `docs/superpowers/`.

- [ ] **Step 4: Check wording**

Run:

```bash
rg -n "skills:install|obra/superpowers|patinaproject/skills|enabledPlugins|declarative" skills/scaffold-repository/SKILL.md skills/scaffold-repository/audit-checklist.md
```

Expected: the contract mentions both direct sources and states that declarative plugin enablement is not the sole install path.

## Task 5: Update README Verification

**Files:**

- Modify: `scripts/verify-scaffold-agent-plugin-readme.js`

- [ ] **Step 1: Add assertions for portable install guidance**

Add assertions against the rendered README:

```js
assertIncludes(rendered, "pnpm skills:install", "Portable skills install script");
assertIncludes(rendered, "npx skills@1.5.6 add patinaproject/skills", "Patina Project skills npx install");
assertIncludes(rendered, "npx skills@1.5.6 add obra/superpowers", "Superpowers npx install");
```

- [ ] **Step 2: Add assertions for contract and checklist**

Add assertions that `skillContract` and `auditChecklist` include:

```text
skills:install
patinaproject/skills
obra/superpowers
```

- [ ] **Step 3: Run verifier**

Run:

```bash
node scripts/verify-scaffold-agent-plugin-readme.js
```

Expected: `verify-scaffold-agent-plugin-readme: ok`.

## Task 6: Run Full Verification and Commit Implementation

**Files:**

- Verify all modified implementation files.

- [ ] **Step 1: Run targeted search checks**

Run:

```bash
rg -n "npx skills@1\\.5\\.6 add patinaproject/skills|npx skills@1\\.5\\.6 add obra/superpowers|pnpm skills:install|skills:install" skills/scaffold-repository scripts/verify-scaffold-agent-plugin-readme.js
```

Expected: matches in templates, skill contract, audit checklist, and verifier.

- [ ] **Step 2: Run scaffold README verifier**

Run:

```bash
pnpm verify:scaffold-readme
```

Expected: `verify-scaffold-agent-plugin-readme: ok`.

- [ ] **Step 3: Run dogfood and marketplace checks**

Run:

```bash
pnpm verify:dogfood
pnpm verify:marketplace
```

Expected: both pass.

- [ ] **Step 4: Run scaffold baseline check**

Run:

```bash
pnpm apply:scaffold-repository:check
```

Expected: `check: all scaffold-repository baseline files are in sync`. If it reports drift on root files intentionally round-tripped from templates, inspect the diff and apply the template-consistent update rather than suppressing the check.

- [ ] **Step 5: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: markdownlint passes for tracked non-Superpowers Markdown files.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git status --short
git add skills/scaffold-repository/SKILL.md skills/scaffold-repository/audit-checklist.md skills/scaffold-repository/templates/core/package.json.tmpl skills/scaffold-repository/templates/core/AGENTS.md.tmpl skills/scaffold-repository/templates/agent-plugin/README.md.tmpl scripts/verify-scaffold-agent-plugin-readme.js
git commit -m "feat: #70 add scaffold skills install path"
```

Expected: a feature commit containing only implementation files.

## Task 7: Local Review Handoff

**Files:**

- Review branch diff after implementation commit.

- [ ] **Step 1: Inspect branch diff**

Run:

```bash
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
```

Expected: expected design, plan, and implementation files; no whitespace errors.

- [ ] **Step 2: Review acceptance coverage**

Run:

```bash
rg -n "AC-70|skills:install|patinaproject/skills|obra/superpowers|npx skills" docs/superpowers skills/scaffold-repository scripts/verify-scaffold-agent-plugin-readme.js
```

Expected: every acceptance criterion has an implementation or verification surface.

- [ ] **Step 3: Hand off to Reviewer**

Ask Reviewer to classify findings as implementation-level, plan-level, or spec-level. Because the diff touches `skills/**`, Reviewer must use `superpowers:writing-skills` dimensions when checking the skill and template changes.

## Self-Review

- Spec coverage: Tasks 1-5 implement `AC-70-1` through `AC-70-5`; Task 6 verifies the generated script and docs; Task 7 preserves local review routing.
- Placeholder scan: no unresolved placeholder markers remain.
- Type consistency: command names are consistently `skills:install`, `patinaproject/skills`, `obra/superpowers`, and `skills@1.5.6`.
- Scope: the plan changes scaffold-repository generated behavior only; it does not change Superteam's own prerequisite warning.
