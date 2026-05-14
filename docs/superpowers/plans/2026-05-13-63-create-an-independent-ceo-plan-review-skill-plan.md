# Create an Independent CEO Plan Review Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` if available, or the resolved `superteam` execute mode. Implement task-by-task. Do not treat this plan as approval to change `superteam` gates.

**Goal:** Add the fifth Patina-owned flat skill, `plan-ceo-review`, and make it discoverable across Claude, Codex, local dogfood overlays, and repository documentation.

**Approved design:** `docs/superpowers/specs/2026-05-13-63-create-an-independent-ceo-plan-review-skill-design.md`

**Architecture:** Add one concise, original Markdown skill at `skills/plan-ceo-review/SKILL.md`. Then update all manifest, marketplace, dogfood, and documentation surfaces that enumerate in-repo skills from four to five. Keep `plan-ceo-review` advisory: it reviews plans, but it does not replace `office-hours`, `Planner`, `Reviewer`, or any `superteam` gate.

**Out of scope:** Do not add scripts beyond updating existing verification. Do not add runtime state, telemetry, local sessions, generated preambles, or upstream-branded behavior. Do not copy, vendor, paraphrase section-by-section, or mechanically translate the upstream inspiration.

---

## Workstreams

### W1 — Author the `plan-ceo-review` Skill

**Goal:** Create the new flat skill with original Patina-native CEO/founder review behavior. Covers AC-63-1, AC-63-2, and AC-63-3.

**Files:**

- Create: `skills/plan-ceo-review/SKILL.md`

**Tasks:**

- [ ] Create `skills/plan-ceo-review/SKILL.md` with YAML frontmatter:
  - `name: plan-ceo-review`
  - `description:` includes the discoverability triggers `CEO review`, `founder-mode review`, `think bigger`, `strategy review`, `rethink this plan`, and `is this ambitious enough`.
- [ ] Use the approved section shape:
  - `# CEO Plan Review`
  - `## When to Use`
  - `## When Not to Use`
  - `## Inputs`
  - `## Review Modes`
  - `## Workflow`
  - `## Output`
  - `## Red Flags`
- [ ] Define the four review modes and make each mode behaviorally distinct:
  - `Expand`
  - `Selectively expand`
  - `Hold`
  - `Reduce`
- [ ] Cover the required review dimensions:
  - Ambition: meaningful outcome versus local improvement.
  - Scope: expand, selectively expand, hold, or reduce.
  - User value: beneficiary, changed workflow, and validating proof.
  - Sequencing: first move, later moves, and decision gates.
  - Risks: premise, product, execution, and opportunity cost.
  - Recommended next steps: decision, smallest next move, and evidence that would change the recommendation.
- [ ] Include an output template with these sections:
  - `Verdict`
  - `Premise check`
  - `Ambition check`
  - `Scope decision`
  - `User value`
  - `Sequencing`
  - `Risks`
  - `Recommendation`
- [ ] State the routing boundary:
  - If the user has only an idea and no plan, ask for a plan or route to `office-hours`.
  - Inside `superteam`, this skill is advisory and cannot approve Gate 1, replace Planner, replace Reviewer, or alter Finisher shutdown.
- [ ] Keep the skill concise, targeting 150-350 lines and avoiding long sample reports.
- [ ] Run the independence check before leaving W1:

```bash
rg -n "gstack|~/.gstack|gbrain|telemetry|analytics|update-check|session" skills/plan-ceo-review/SKILL.md
```

Expected: no matches. If the word `session` appears only as ordinary prose, remove or rephrase it to keep the forbidden-string check clean.

**Commit:** `feat: #63 add plan-ceo-review skill`

### W2 — Wire Claude and Codex Marketplace Surfaces

**Goal:** Make both host plugin manifests expose the same five skills in the same order, and update marketplace descriptions that enumerate included skills. Covers AC-63-4.

**Files:**

- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `.agents/plugins/marketplace.json` only if its description or metadata enumerates included skills at implementation time

**Tasks:**

- [ ] Add `./skills/plan-ceo-review` to `.claude-plugin/plugin.json`.
- [ ] Add `./skills/plan-ceo-review` to `.codex-plugin/plugin.json`.
- [ ] Keep Claude and Codex `skills[]` arrays byte-for-byte equal in order:
  - `./skills/scaffold-repository`
  - `./skills/superteam`
  - `./skills/using-github`
  - `./skills/office-hours`
  - `./skills/plan-ceo-review`
- [ ] Update `.claude-plugin/marketplace.json` because it currently enumerates the included skills in `plugins[0].description`; append `plan-ceo-review`.
- [ ] Inspect `.agents/plugins/marketplace.json`. If it still does not enumerate skill names, leave it unchanged. If another worker has added an enumerated description before Executor reaches this task, update it to include `plan-ceo-review`.
- [ ] Use JSON tooling or careful formatting so the files stay valid and minimally changed.

**Commit:** `feat: #63 expose plan-ceo-review in plugin manifests`

### W3 — Add Dogfood Overlay Symlinks and Verification Count

**Goal:** Make local dogfood discovery prove all five in-repo skills resolve to their flat canonical homes. Covers AC-63-4 and AC-63-5.

**Files:**

- Create symlink: `.agents/skills/plan-ceo-review` -> `../../skills/plan-ceo-review`
- Create symlink: `.claude/skills/plan-ceo-review` -> `../../skills/plan-ceo-review`
- Modify: `scripts/verify-dogfood.sh`

**Tasks:**

- [ ] Create both overlay symlinks with the same relative target used by the existing four in-repo skills:

```bash
ln -s ../../skills/plan-ceo-review .agents/skills/plan-ceo-review
ln -s ../../skills/plan-ceo-review .claude/skills/plan-ceo-review
```

- [ ] Update `scripts/verify-dogfood.sh` comments and final success message from four to five in-repo skills.
- [ ] Add `plan-ceo-review` to the `SKILLS` array after `office-hours`.
- [ ] Preserve the existing flat-layout and frontmatter-name assertions.
- [ ] Run:

```bash
pnpm verify:dogfood
```

Expected: exits 0 and reports all five in-repo skills discoverable.

**Commit:** `test: #63 verify five dogfood skills`

### W4 — Update Repository Documentation and Cross-References

**Goal:** Keep user-facing and contributor-facing skill lists coherent after the fifth skill lands. Covers AC-63-4's discoverability intent and resolves the design's README / `office-hours` open question.

**Decision:** Update the root README and contributor docs in this issue. Add only a small `office-hours` cross-reference if it can be done without expanding `office-hours` behavior.

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/release-flow.md`
- Modify: `scripts/install-third-party-skills.sh` comments only if they still say four in-repo skills
- Modify: `skills/office-hours/SKILL.md` only for a one-sentence `plan-ceo-review` cross-reference; skip if the edit would require reorganizing the skill

**Tasks:**

- [ ] Update `README.md`:
  - Opening count from four to five.
  - Add a `plan-ceo-review` section under "Why these skills exist".
  - Add a `plan-ceo-review` row to the skills table.
  - Change "dogfood verification, all four skills" to five.
  - Add `plan-ceo-review/` to the repository layout block.
- [ ] Update `AGENTS.md`:
  - Add `skills/plan-ceo-review/` to project structure.
  - Change all "four in-repo skills" and "all 4 skill paths" guidance to five where it refers to the current repository-owned skill set.
  - Add `skills/plan-ceo-review/` to the "Skill Releases" flat-path list.
  - Preserve the existing note that `find-skills` is third-party.
- [ ] Update `docs/release-flow.md` where it enumerates the released in-repo skill set.
- [ ] Inspect `scripts/install-third-party-skills.sh` comments. If they still describe four in-repo `patinaproject-skills`, update the comments to five. Do not change behavior.
- [ ] Add a one-sentence cross-reference in `skills/office-hours/SKILL.md` only if there is a natural "when not to use" or routing location: use `plan-ceo-review` when the user already has a plan to critique. Do not make `office-hours` call `plan-ceo-review` or change its output contract.
- [ ] Search for stale current-count text outside historical design and plan artifacts:

```bash
rg -n "four|4 skill|all four|five|5 skill|plan-ceo-review" AGENTS.md README.md docs scripts skills .claude-plugin .codex-plugin .agents/plugins
```

Expected: current docs and scripts describe five in-repo skills; historical artifacts may preserve prior issue context.

**Commit:** `docs: #63 document plan-ceo-review skill`

### W5 — Final Verification and Handoff

**Goal:** Prove all acceptance criteria before handing to Reviewer. Covers AC-63-1 through AC-63-5.

**Tasks:**

- [ ] Run required verification:

```bash
pnpm verify:dogfood
pnpm verify:marketplace
find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

- [ ] Confirm the `find` output is exactly:

```text
skills/office-hours/SKILL.md
skills/plan-ceo-review/SKILL.md
skills/scaffold-repository/SKILL.md
skills/superteam/SKILL.md
skills/using-github/SKILL.md
```

- [ ] Re-run the forbidden-coupling check:

```bash
rg -n "gstack|~/.gstack|gbrain|telemetry|analytics|update-check|session" skills/plan-ceo-review/SKILL.md
```

Expected: no matches.

- [ ] Confirm plugin manifest parity:

```bash
jq -c '.skills' .claude-plugin/plugin.json
jq -c '.skills' .codex-plugin/plugin.json
```

Expected: identical five-entry arrays in the W2 order.

- [ ] Check final status:

```bash
git status --short
git log --oneline --decorate -5
```

- [ ] Commit any verification-only documentation touch-ups if needed. Do not commit generated logs.
- [ ] Handoff to Reviewer with:
  - completed task IDs or workstreams,
  - verification command outcomes,
  - current HEAD SHA,
  - known residual risk, if any.

**Commit:** Only create a W5 commit if final verification requires a tracked fix.

---

## Acceptance Criteria Coverage

- `AC-63-1`: W1 creates `skills/plan-ceo-review/SKILL.md` with YAML metadata and discoverability triggers.
- `AC-63-2`: W1 and W5 enforce independence from upstream-branded commands, local state, telemetry, analytics, update checks, and forbidden strings.
- `AC-63-3`: W1 defines the CEO/founder review process, modes, required dimensions, risks, and next-step recommendation.
- `AC-63-4`: W2, W3, and W4 update plugin manifests, marketplace descriptions that enumerate skills, dogfood symlinks, `verify-dogfood`, and repository docs.
- `AC-63-5`: W3 and W5 run required verification and confirm exactly five flat `SKILL.md` entry points.

## Risks and Blockers

- No active blockers.
- Main risk: accidental upstream coupling in the new skill prose. Mitigation: W1 and W5 forbidden-string checks plus Reviewer independence review.
- Main discoverability risk: a stale "four skills" reference in docs or scripts. Mitigation: W4 repository-wide search and targeted updates outside historical artifacts.
- Main workflow risk: presenting CEO review as a `superteam` approval gate. Mitigation: W1 requires explicit advisory-only language and W4 keeps `office-hours` cross-reference narrow.

## Executor Notes

- Preserve unrelated edits if the worktree is dirty when execution starts.
- Use `apply_patch` or normal symlink commands for focused edits; do not reformat unrelated JSON or Markdown.
- Keep commits conventional and issue-tagged.
- Do not push or open a PR from the Executor role.
