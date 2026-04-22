# Plan: Plugin card is missing the Superteam description in Codex [#12](https://github.com/patinaproject/superteam/issues/12)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Superteam plugin ship explicit plugin-card description text and aligned skill UI metadata for Codex.

**Architecture:** Keep plugin-card copy in `plugins/superteam/.codex-plugin/plugin.json`, keep source skill UI copy in `skills/superteam/agents/openai.yaml`, and rely on `pnpm sync:plugin` to refresh the packaged skill metadata copy. Verification is file-level because this repository does not include a runnable Codex UI test harness.

**Tech Stack:** JSON manifests, YAML skill metadata, pnpm repo scripts, git

---

## File structure

- Modify: `plugins/superteam/.codex-plugin/plugin.json`
- Modify: `skills/superteam/agents/openai.yaml`
- Sync output: `plugins/superteam/skills/superteam/agents/openai.yaml`
- Create: `docs/superpowers/specs/2026-04-22-12-plugin-card-is-missing-the-superteam-description-in-codex-design.md`
- Create: `docs/superpowers/plans/2026-04-22-12-plugin-card-is-missing-the-superteam-description-in-codex-plan.md`

### Task 1: Align the shipped plugin card metadata

**Files:**
- Modify: `plugins/superteam/.codex-plugin/plugin.json`

- [ ] **Step 1: Update the plugin manifest copy**

Set the manifest values to:

```json
{
  "description": "Build with a team of agents using Superpowers",
  "interface": {
    "shortDescription": "Build with a team of agents using Superpowers",
    "longDescription": "Move a GitHub issue to a testable, demoable outcome as quickly as possible through brainstorm, plan, execute, review, and CI follow-through."
  }
}
```

- [ ] **Step 2: Verify the manifest content**

Run: `sed -n '1,40p' plugins/superteam/.codex-plugin/plugin.json`
Expected: `description`, `shortDescription`, and `longDescription` match the approved copy for issue `#12`.

### Task 2: Align the source and packaged skill UI metadata

**Files:**
- Modify: `skills/superteam/agents/openai.yaml`
- Modify: `plugins/superteam/skills/superteam/agents/openai.yaml`

- [ ] **Step 1: Update the source skill UI metadata**

Set the source file content to:

```yaml
interface:
  display_name: "Superteam"
  short_description: "Build with a team of agents using Superpowers"
  default_prompt: "Use $superteam to take this issue from design through review-ready execution."

policy:
  allow_implicit_invocation: true
```

- [ ] **Step 2: Sync the packaged skill copy**

Run: `pnpm sync:plugin`
Expected: the packaged copy under `plugins/superteam/skills/superteam/agents/openai.yaml` is refreshed from the source skill directory with no script errors.

- [ ] **Step 3: Verify both skill metadata files**

Run: `sed -n '1,20p' skills/superteam/agents/openai.yaml`
Expected: `short_description` is `Build with a team of agents using Superpowers`.

Run: `sed -n '1,20p' plugins/superteam/skills/superteam/agents/openai.yaml`
Expected: the packaged skill copy shows the same `short_description` value.

### Task 3: Prepare the repository for publish

**Files:**
- Modify: `docs/superpowers/specs/2026-04-22-12-plugin-card-is-missing-the-superteam-description-in-codex-design.md`
- Modify: `docs/superpowers/plans/2026-04-22-12-plugin-card-is-missing-the-superteam-description-in-codex-plan.md`
- Stage: `plugins/superteam/.codex-plugin/plugin.json`
- Stage: `skills/superteam/agents/openai.yaml`
- Stage: `plugins/superteam/skills/superteam/agents/openai.yaml`

- [ ] **Step 1: Confirm the working tree only contains intended issue-12 changes**

Run: `git diff -- plugins/superteam/.codex-plugin/plugin.json skills/superteam/agents/openai.yaml plugins/superteam/skills/superteam/agents/openai.yaml`
Expected: diff contains only the description-copy updates for issue `#12`.

- [ ] **Step 2: Stage the implementation changes**

Run:

```bash
git add plugins/superteam/.codex-plugin/plugin.json \
  skills/superteam/agents/openai.yaml \
  plugins/superteam/skills/superteam/agents/openai.yaml
```

Expected: `git status --short` shows those three files staged.

- [ ] **Step 3: Commit with the required issue-tagged message**

Run: `git commit -m "docs: #12 add Superteam plugin descriptions"`
Expected: commitlint and Husky accept the message and create a commit.

## Self-review

- AC-12-1 maps to Task 1 and Task 3 verification.
- AC-12-2 maps to Task 2 verification.
- AC-12-3 maps to Task 2 verification after `pnpm sync:plugin`.
- No placeholders remain; all edited files and commands are explicit.
