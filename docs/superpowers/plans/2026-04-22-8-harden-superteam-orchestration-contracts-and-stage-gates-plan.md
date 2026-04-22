# Plan: Harden superteam orchestration contracts and stage gates [#8](https://github.com/patinaproject/superteam/issues/8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the public `superteam` orchestration surface so it uses the approved teammate roster, hardened approval and handoff gates, explicit `superpowers` skill recommendations and warnings, finish-owned review handling, and repo-local pressure-test coverage.

**Architecture:** Treat `skills/superteam/` as the source of truth for the contract and prompt assets, update repository docs so contributor-facing and user-facing guidance match the new workflow, then regenerate the packaged Codex copy with `pnpm sync:plugin`. Keep enforcement in portable prompt, template, and documentation language rather than runtime-specific tooling.

**Tech Stack:** Markdown, YAML, `pnpm`, `rg`, `sed`, `find`, git

---

### Task 1: Rewrite the source `superteam` contract around the canonical teammate roster

**Files:**
- Modify: `skills/superteam/SKILL.md`
- Modify: `skills/superteam/agent-spawn-template.md`
- Modify: `skills/superteam/pr-body-template.md`
- Modify: `skills/superteam/agents/openai.yaml`
- Test: `skills/superteam/SKILL.md`, `skills/superteam/agent-spawn-template.md`, `skills/superteam/pr-body-template.md`, `skills/superteam/agents/openai.yaml`

- [ ] **Step 1: Re-read the approved design and current skill assets before editing**

Run:

```bash
sed -n '1,260p' docs/superpowers/specs/2026-04-22-8-harden-superteam-orchestration-contracts-and-stage-gates-design.md
sed -n '1,260p' skills/superteam/SKILL.md
sed -n '1,260p' skills/superteam/agent-spawn-template.md
sed -n '1,220p' skills/superteam/pr-body-template.md
sed -n '1,120p' skills/superteam/agents/openai.yaml
```

Expected:
- the approved design shows the canonical teammate roster and hardened gate rules
- the current skill still uses the older stage/action framing
- the current templates do not yet require artifact-existence approval checks, task-ID completion evidence, or unavailable-skill warnings

- [ ] **Step 2: Invoke `superpowers:writing-skills` before touching `skills/**/*.md`**

Add this exact pre-edit note to the executor handoff or working transcript before any skill-file edit:

```text
Using superpowers:writing-skills before editing skills/superteam contract files for issue #8.
```

Expected:
- the implementation work explicitly follows the repo rule for `skills/**/*.md`

- [ ] **Step 3: Rewrite `skills/superteam/SKILL.md` to reflect the approved orchestration contract**

Update `skills/superteam/SKILL.md` so it:

- makes `Team Lead`, `Brainstormer`, `Planner`, `Executor`, `Reviewer`, and `Finisher` the canonical roster
- hardens Gate 1 with design-artifact existence checks, approval packets that include artifact path plus concise intent summary plus full requirement set, split oversized approval requests, and delta-only re-fire after revisions
- requires canonical-rule discovery from repo guidance before touching governed files
- tightens teammate done contracts, including executor completion against explicit task IDs and reviewer classification of implementation-level, plan-level, and spec-level loopbacks
- keeps external review/comment handling owned by `Finisher`, including branch-state verification before resolving prior-state comments and spec-first routing for requirement-bearing feedback
- includes role-specific `superpowers` skill recommendations plus explicit warnings when expected skills are unavailable
- updates red flags, rationalization guidance, and shutdown rules to match the hardened contract

Keep the file portable: no runtime-specific enforcement logic, no downstream-private literals, and no AC-to-file mappings.

- [ ] **Step 4: Rewrite the agent spawn template to match the new teammate model**

Update `skills/superteam/agent-spawn-template.md` so it:

- uses teammate-role language instead of older stage labels where the role owns the work
- adds `Team Lead` guidance that recommends `superpowers:using-superpowers` and `superpowers:dispatching-parallel-agents` when relevant
- tells every delegated teammate prompt to warn explicitly if an expected `superpowers` skill is unavailable
- carries the hardened approval-packet, done-report, and finish/reporting expectations into the role-specific prompt blocks
- updates the finishing/comment-handling guidance so local reviewer findings and external PR feedback both route through `Finisher`

- [ ] **Step 5: Rewrite the PR/review-facing template and skill metadata copy**

Update `skills/superteam/pr-body-template.md` so it:

- reflects the new teammate language where appropriate
- keeps acceptance criteria and verification anchored to the latest pushed branch state
- makes it easy for `Finisher` to report review state, CI state, and branch-state-aware follow-up

Update `skills/superteam/agents/openai.yaml` so the short description and default prompt describe the teammate-based orchestration flow without the stale "review-ready execution" phrasing.

- [ ] **Step 6: Verify the source skill surface reflects the new contract**

Run:

```bash
rg -n "Team Lead|Brainstormer|Planner|Executor|Reviewer|Finisher|artifact.*exists|full requirement set|split|delta|task IDs|implementation-level|plan-level|spec-level|current branch state|unavailable|using-superpowers|dispatching-parallel-agents|receiving-code-review" skills/superteam
```

Expected:
- matches in `skills/superteam/SKILL.md` for the canonical roster and hardened gate language
- matches in `skills/superteam/agent-spawn-template.md` for expected skill recommendations and unavailable-skill warnings
- matches in `skills/superteam/pr-body-template.md` or `skills/superteam/agents/openai.yaml` for updated finisher/reporting language

- [ ] **Step 7: Commit the source contract/template rewrite**

Run:

```bash
git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md skills/superteam/pr-body-template.md skills/superteam/agents/openai.yaml
git commit -m "docs: #8 harden superteam skill contracts"
```

### Task 2: Add repo-local pressure-test coverage for the hardened workflow

**Files:**
- Create: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
- Modify: `docs/file-structure.md`
- Test: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`, `docs/file-structure.md`

- [ ] **Step 1: Create a dedicated pressure-test scenario document**

Create `docs/superpowers/pressure-tests/superteam-orchestration-contract.md` with compact scenario sections for:

- approval requested before the design artifact exists
- approval packets missing artifact path, intent summary, or full requirement set
- oversized approval packets collapsed instead of split
- re-fire after revisions replaying approved content instead of deltas only
- delegated prompts missing expected `superpowers` recommendations
- delegated prompts failing to warn when an expected skill is unavailable
- executor done reports missing task IDs or verification evidence
- reviewer findings missing loopback classification
- finisher handling comments without current-branch verification
- requirement-bearing review feedback routed straight to execution
- shutdown attempted with unresolved threads or bot findings

For each scenario, include:

- the starting condition
- the required halt or reroute behavior
- the artifact or prompt surface that should express the rule

- [ ] **Step 2: Add the new pressure-test area to the contributor file-structure doc**

Update `docs/file-structure.md` so the `docs/` section and examples mention `docs/superpowers/pressure-tests/` as the home for repo-local orchestration pressure tests.

- [ ] **Step 3: Verify pressure-test coverage is explicit and discoverable**

Run:

```bash
rg -n "pressure-tests|artifact exists|full requirement set|task IDs|implementation-level|plan-level|spec-level|current branch state|unavailable|shutdown" docs/superpowers/pressure-tests/superteam-orchestration-contract.md docs/file-structure.md
```

Expected:
- the new pressure-test doc contains all major failure-path scenarios from the design
- `docs/file-structure.md` points contributors at the new pressure-test location

- [ ] **Step 4: Commit the pressure-test documentation**

Run:

```bash
git add docs/superpowers/pressure-tests/superteam-orchestration-contract.md docs/file-structure.md
git commit -m "docs: #8 add superteam pressure test coverage"
```

### Task 3: Update user-facing and contributor-facing docs to match the teammate workflow

**Files:**
- Modify: `README.md`
- Modify: `docs/file-structure.md`
- Test: `README.md`, `docs/file-structure.md`, `skills/superteam/SKILL.md`

- [ ] **Step 1: Capture the current workflow language in the README before editing**

Run:

```bash
sed -n '1,220p' README.md
```

Expected:
- the README still centers the older stage diagram and agent roster
- it does not mention `Team Lead`
- it does not mention unavailable-skill warnings or finisher-owned receipt of review feedback after local review

- [ ] **Step 2: Rewrite the README workflow overview and roster**

Update `README.md` so the user-facing workflow section:

- uses the canonical teammate roster with `Team Lead`
- keeps the workflow portable across agent teams and subagents
- explains that the workflow discovers repo rules before edits
- distinguishes `Reviewer` from `Finisher`, with `Finisher` owning review feedback follow-through after findings exist
- updates the roster table so the recommended `superpowers` skills align with the approved design

Keep installation guidance intact unless wording must shift to avoid contradicting the new workflow contract.

- [ ] **Step 3: Align the contributor doc with the new skill support files and docs**

Update `docs/file-structure.md` so it:

- still presents `skills/superteam/` as the authoring source and `plugins/superteam/` as the packaged Codex surface
- mentions the new pressure-test doc location
- describes the updated responsibilities of `agent-spawn-template.md` and `pr-body-template.md` in terms of teammate-based orchestration and finish-owned reporting

- [ ] **Step 4: Verify docs match the source-of-truth skill contract**

Run:

```bash
rg -n "Team Lead|Brainstormer|Planner|Executor|Reviewer|Finisher|using-superpowers|dispatching-parallel-agents|requesting-code-review|finishing-a-development-branch|receiving-code-review|current branch state|pressure-tests" README.md docs/file-structure.md skills/superteam/SKILL.md
```

Expected:
- the README and contributor doc use the canonical teammate names
- the documented skill recommendations are consistent with `skills/superteam/SKILL.md`
- pressure-test docs are discoverable from contributor guidance

- [ ] **Step 5: Commit the doc alignment changes**

Run:

```bash
git add README.md docs/file-structure.md
git commit -m "docs: #8 align superteam docs with teammate workflow"
```

### Task 4: Regenerate the packaged Codex plugin copy and verify parity

**Files:**
- Modify: `plugins/superteam/skills/superteam/SKILL.md`
- Modify: `plugins/superteam/skills/superteam/agent-spawn-template.md`
- Modify: `plugins/superteam/skills/superteam/pr-body-template.md`
- Modify: `plugins/superteam/skills/superteam/agents/openai.yaml`
- Test: `plugins/superteam/skills/superteam/SKILL.md`, `plugins/superteam/skills/superteam/agent-spawn-template.md`, `plugins/superteam/skills/superteam/pr-body-template.md`, `plugins/superteam/skills/superteam/agents/openai.yaml`

- [ ] **Step 1: Sync the packaged plugin from the source skill**

Run:

```bash
pnpm sync:plugin
```

Expected:
- the packaged copy under `plugins/superteam/skills/superteam/` refreshes from `skills/superteam/`

- [ ] **Step 2: Verify packaged files reflect the rewritten source contract**

Run:

```bash
sed -n '1,260p' plugins/superteam/skills/superteam/SKILL.md
sed -n '1,220p' plugins/superteam/skills/superteam/agent-spawn-template.md
sed -n '1,220p' plugins/superteam/skills/superteam/pr-body-template.md
sed -n '1,120p' plugins/superteam/skills/superteam/agents/openai.yaml
rg -n "Team Lead|Brainstormer|Planner|Executor|Reviewer|Finisher|artifact.*exists|task IDs|current branch state|unavailable|receiving-code-review" plugins/superteam/skills/superteam
```

Expected:
- the packaged copies mirror the source contract and template changes
- no stale action-first roster or outdated prompt phrasing remains in the packaged skill surface

- [ ] **Step 3: Inspect the final changed-file set for issue scope**

Run:

```bash
git status --short
find skills/superteam -maxdepth 3 -type f | sort
find plugins/superteam -maxdepth 6 -type f | sort
find docs/superpowers -maxdepth 3 -type f | sort
```

Expected:
- only the skill source files, packaged plugin mirrors, README/docs, and the new pressure-test doc changed for this issue
- the new plan file remains untouched during execution

- [ ] **Step 4: Commit the packaged plugin sync**

Run:

```bash
git add plugins/superteam/skills/superteam/SKILL.md plugins/superteam/skills/superteam/agent-spawn-template.md plugins/superteam/skills/superteam/pr-body-template.md plugins/superteam/skills/superteam/agents/openai.yaml
git commit -m "chore: #8 sync packaged superteam plugin"
```

## Execution Notes

- Keep `docs/superpowers/specs/2026-04-22-8-harden-superteam-orchestration-contracts-and-stage-gates-design.md` open during implementation; it is the sole planning authority for issue `#8`.
- Do not edit the plan artifact during execution unless the operator explicitly reopens planning.
- Treat every edit to `skills/**/*.md` as `superpowers:writing-skills` work before changing content.
- If implementation reveals a requirement change rather than a plan/detail change, halt and route back to `Brainstormer` instead of inventing a planner-side override.
