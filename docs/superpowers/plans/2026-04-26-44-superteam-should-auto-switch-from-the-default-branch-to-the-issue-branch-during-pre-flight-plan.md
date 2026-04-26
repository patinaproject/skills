# Plan: superteam should auto-switch from the default branch to the issue branch during pre-flight [#44](https://github.com/patinaproject/superteam/issues/44)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic pre-flight rule to `skills/superteam/pre-flight.md` that auto-switches from the repository default branch to `<n>-<kebab-title>` via `/github-flows:new-branch` before committed-artifact inspection runs, and reflect the discipline in `skills/superteam/SKILL.md`.

**Architecture:** `superteam` adds (a) a new step between active-issue resolution and committed-artifact inspection in `## Detection sequence`, (b) a new `## Auto-switch to issue branch` section that delegates the algorithm to `/github-flows:new-branch`, (c) four new halt strings under `## Halt conditions`, and (d) rationalization-table rows / red-flag bullets in `SKILL.md`. The auto-switch never restates the canonical algorithm inline; it cites `/github-flows:new-branch` (`patinaproject/github-flows`, `skills/new-branch/workflow.md`) as authoritative.

**Tech Stack:** Markdown only (`skills/superteam/pre-flight.md`, `skills/superteam/SKILL.md`); `markdownlint-cli2` via `pnpm lint:md`; commitlint via `pnpm exec commitlint --edit`.

**Authoritative references:**

- Design doc: `docs/superpowers/specs/2026-04-26-44-superteam-should-auto-switch-from-the-default-branch-to-the-issue-branch-during-pre-flight-design.md`
- Acceptance criteria: AC-44-1 … AC-44-8 in the design doc
- Canonical branch algorithm: `/github-flows:new-branch` (`patinaproject/github-flows`, `skills/new-branch/workflow.md`) — **OUT OF SCOPE for this plan; do NOT modify**

---

## File Structure

- Modify: `skills/superteam/pre-flight.md`
  - `## Detection sequence` — insert renumbered step 2.
  - `## Active-issue resolution` — add a one-line cross-reference to the new section.
  - `## Auto-switch to issue branch` — NEW section (the load-bearing rule).
  - `## Halt conditions` — append four new halt strings.
- Modify: `skills/superteam/SKILL.md`
  - `## Rationalization table` — append five new rows.
  - `## Red flags` — append six new bullets.
- Create: `docs/superpowers/baselines/2026-04-26-44-red-phase-baseline.md` (RED-phase baseline evidence; deleted at end of Workstream 4 once GREEN passes are recorded in the same file).

---

## Out of scope

- Any change to `/github-flows:new-branch` (`patinaproject/github-flows`).
- Lockfile-driven dependency installation inside `superteam` pre-flight (Step 6 of the canonical algorithm).
- Cross-repo branching (`-R other/repo`).
- Behavior on non-default, non-`<n>-<slug>` branches (today's "operator (ask)" fallback continues unchanged).

---

## Workstream 1 — RED-phase baseline (AC-44-8)

**Goal:** Commit verbatim evidence that today's pre-flight does NOT switch branches under the trigger conditions and DOES rationalize away the omission. This MUST land before any edit to `pre-flight.md`.

**Files:**

- Create: `docs/superpowers/baselines/2026-04-26-44-red-phase-baseline.md`

- [ ] **Step 1: Capture clean-tree default-branch scenario.** Drive a `Team Lead` pre-flight subagent (or equivalent dry-run harness) with: operator prompt containing explicit `#44`, current branch == repository default branch (`main`), `git status --porcelain` empty, no design or plan doc on either branch. Record verbatim that the subagent proceeds to committed-artifact inspection on the default branch and derives `phase=brainstorm` without switching branches.

- [ ] **Step 2: Capture rationalizations.** Record verbatim every rationalization the subagent emits for not switching (e.g. "the operator is on `main` on purpose", "no rule says to switch", "the issue says to brainstorm so let's brainstorm"). Tag each one against the matching rationalization-table row added in Workstream 3.

- [ ] **Step 3: Capture dirty-tree scenario.** Re-run the harness with `git status --porcelain` non-empty. Record verbatim that today's pre-flight neither halts nor switches.

- [ ] **Step 4: Write `docs/superpowers/baselines/2026-04-26-44-red-phase-baseline.md`** with sections: `## Scenario A: clean tree`, `## Scenario B: dirty tree`, `## Captured rationalizations`, `## Targets the new rule must close` (mapping each rationalization to AC-44-1 … AC-44-5 and to the planned `## Rationalization table` rows).

- [ ] **Step 5: Lint.**

```bash
pnpm lint:md
```

Expected: pass.

- [ ] **Step 6: Commit (RED baseline).**

```bash
git add docs/superpowers/baselines/2026-04-26-44-red-phase-baseline.md
git commit -m "test: #44 capture RED-phase baseline for pre-flight auto-switch"
```

Expected: commitlint passes.

---

## Workstream 2 — Add the rule to `pre-flight.md` (AC-44-1, AC-44-2, AC-44-3, AC-44-4, AC-44-5, AC-44-6, AC-44-7)

**Goal:** Land the deterministic rule by editing `skills/superteam/pre-flight.md` only. The rule MUST cite `/github-flows:new-branch` and MUST stay within 180 words / 1,400 characters across the new section plus its cross-references in `## Detection sequence`, `## Halt conditions`, and `## Active-issue resolution`.

**Files:**

- Modify: `skills/superteam/pre-flight.md`

- [ ] **Step 1: Renumber `## Detection sequence`.** Insert a new step 2 between the current step 1 (`Resolve the active issue`) and the current step 2 (`Inspect committed artifacts on the active branch`). The renumbered list runs 1 … 10.

  New step 2 text (target ≤ 35 words):

  > **Auto-switch to issue branch.** When the active issue was resolved from an explicit `#<n>` in the operator prompt AND the current branch equals the repository default branch, run the `/github-flows:new-branch` algorithm against `<n>` before committed-artifact inspection. See `## Auto-switch to issue branch` below.

  Renumber subsequent steps so committed-artifact inspection becomes step 3, branch-state inspection step 4, PR-state inspection step 5, phase derivation step 6, prompt classification step 7, execution-mode probing step 8, loopback-class recovery step 9, routing step 10. Keep existing prose untouched apart from the renumber.

- [ ] **Step 2: Add `## Auto-switch to issue branch` section.** Insert it directly after `## Phase derivation rules` and before `## Halt conditions`. Target ≤ 130 words for this section so the combined new content stays under the 180-word / 1,400-char budget required by AC-44-7.

  Section MUST cover, in this order:

  1. Trigger conditions (both MUST hold): active issue resolved from operator prompt source 1 (explicit `#<n>`), AND current branch equals the repository default branch from `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`.
  2. Algorithm: invoke `/github-flows:new-branch` (`patinaproject/github-flows`, `skills/new-branch/workflow.md`) as the authoritative procedure; do NOT restate kebab-casing, default-branch resolution, dirty-tree detection, fetch, checkout, or rebase logic inline. Step 6 (lockfile-driven install) is out of scope for `superteam` pre-flight and MUST be skipped.
  3. After the switch, re-run committed-artifact inspection (step 3) on the new branch before phase derivation.
  4. No-op cases: already on `<n>-<slug>` matching the active issue; active issue resolved from branch name (source 2) or operator (source 3); branch name carries a different `<n>` (existing halt 3 fires).
  5. Loophole closure: explicitly forbid auto-stash, `git rebase --abort`, silent fallback to the default branch on `gh repo view` failure, and inline re-implementation of the canonical algorithm.

  The section MUST NOT inline kebab/fetch/checkout/rebase pseudocode. References-only.

- [ ] **Step 3: Add cross-reference in `## Active-issue resolution`.** Append one short line beneath the existing list:

  > When source 1 fires while the current branch equals the repository default branch, the auto-switch rule in `## Auto-switch to issue branch` MUST run before committed-artifact inspection.

- [ ] **Step 4: Append four new halt strings to `## Halt conditions`.** After existing halt 4, add:

  - Halt 5: auto-switch refused because `git status --porcelain` was non-empty — halt with `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch`.
  - Halt 6: auto-switch refused because `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` exited non-zero or returned an empty string — halt with `superteam halted at Team Lead: default-branch lookup failed; cannot determine whether auto-switch is required`.
  - Halt 7: auto-switch refused because `git rebase` reported conflicts on an already-existing local issue branch — halt with `superteam halted at Team Lead: rebase conflict on existing issue branch; resolve manually before re-running superteam`. `superteam` MUST NOT run `git rebase --abort` on the operator's behalf.
  - Halt 8: auto-switch refused because `gh issue view <N>` exited non-zero — halt with `superteam halted at Team Lead: active issue could not be resolved against the current repo`.

  Halt strings MUST appear verbatim because AC-44-2, AC-44-4, and AC-44-5 assert verbatim matches.

- [ ] **Step 5: Verify the 180-word / 1,400-char budget (AC-44-7).** Concatenate the new step 2 in `## Detection sequence`, the new `## Auto-switch to issue branch` section, the new line under `## Active-issue resolution`, and the four new halt entries. Run:

```bash
wc -w -m <concatenated content>
```

Expected: words ≤ 180 AND characters ≤ 1,400. If either threshold is exceeded, tighten the prose; do NOT inline algorithm steps to absorb the overage.

- [ ] **Step 6: Lint.**

```bash
pnpm lint:md
```

Expected: pass. Fix any markdownlint violations in place.

- [ ] **Step 7: Commit.**

```bash
git add skills/superteam/pre-flight.md
git commit -m "feat: #44 auto-switch to issue branch in superteam pre-flight"
```

Expected: commitlint passes.

---

## Workstream 3 — Reflect the discipline in `SKILL.md` (AC-44-1, AC-44-6)

**Goal:** Surface the new rule in the rationalization and red-flag tables so `Team Lead` cannot rationalize the rule away. These edits MUST land after Workstream 2 so the cross-references resolve.

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Append five rationalization-table rows** to `## Rationalization table` (verbatim from the design doc `## Rationalization-table additions`). The rows cover: "operator is on the default branch on purpose", "skipping saves a step / branch later", "dirty tree — stash and continue", "rebase conflict — abort and try again", and "re-implement kebab + checkout + rebase inside `superteam`".

- [ ] **Step 2: Append six red-flag bullets** to `## Red flags` (verbatim from the design doc `## Red flags`): proceeding to committed-artifact inspection on the default branch with prompt-resolved issue; auto-stash on the auto-switch path; `git rebase --abort` after a rebase conflict; documenting kebab/default-branch/fetch/checkout/rebase steps inline in `pre-flight.md`; silently continuing on the default branch after `gh repo view` fails; authoring `docs/superpowers/specs/...` on the default branch.

- [ ] **Step 3: Lint.**

```bash
pnpm lint:md
```

Expected: pass.

- [ ] **Step 4: Commit.**

```bash
git add skills/superteam/SKILL.md
git commit -m "docs: #44 add auto-switch rationalizations and red flags"
```

Expected: commitlint passes.

---

## Workstream 4 — GREEN-phase verification (AC-44-1, AC-44-2, AC-44-3, AC-44-4, AC-44-5, AC-44-7, AC-44-8)

**Goal:** Re-run the RED-phase scenarios and prove the new rule fires correctly. Append GREEN-phase evidence to the same baseline file. No code changes in this workstream.

**Files:**

- Modify: `docs/superpowers/baselines/2026-04-26-44-red-phase-baseline.md` (append `## GREEN-phase verification`).

- [ ] **Step 1: Manual walkthrough against AC-44-1 … AC-44-8.** For each AC, walk through the scenario against the updated `pre-flight.md` and record observed behavior verbatim:

  - AC-44-1: clean tree on default branch with `#44` in prompt → auto-switch fires; committed-artifact inspection then runs on `44-<kebab>`.
  - AC-44-2: dirty tree on default branch → halt with `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch`; no checkout/fetch/stash.
  - AC-44-3: already on `<n>-<slug>` matching the active issue → no switch, no extra fetch, active-issue resolution unchanged.
  - AC-44-4: `gh repo view` fails → halt with `superteam halted at Team Lead: default-branch lookup failed; cannot determine whether auto-switch is required`; no checkout.
  - AC-44-5: existing local branch + rebase conflict → halt with `superteam halted at Team Lead: rebase conflict on existing issue branch; resolve manually before re-running superteam`; conflict surfaced verbatim from `git rebase`; no `git rebase --abort`.
  - AC-44-6: confirm the new section in `pre-flight.md` cites `/github-flows:new-branch` and contains zero inline kebab/fetch/checkout/rebase pseudocode.
  - AC-44-7: re-run the word/character count from Workstream 2 step 5 against the committed file; record result.
  - AC-44-8: confirm Workstream 1's RED-phase commit precedes Workstream 2's `pre-flight.md` edit in `git log`.

- [ ] **Step 2: Walk through existing halt conditions 1–4** against the updated `## Halt conditions` to confirm new entries 5–8 do not collide with or shadow existing halts. Record results.

- [ ] **Step 3: Commitlint smoke-check.** Author a representative commit message file and validate:

```bash
echo "feat: #44 auto-switch to issue branch in superteam pre-flight" > /tmp/msg-44.txt
pnpm exec commitlint --edit /tmp/msg-44.txt
```

Expected: exit 0.

- [ ] **Step 4: `pnpm lint:md` smoke-check.**

```bash
pnpm lint:md
```

Expected: pass.

- [ ] **Step 5: Append `## GREEN-phase verification`** to `docs/superpowers/baselines/2026-04-26-44-red-phase-baseline.md` with all observed behavior, the AC-44-7 word/char counts, and the commit/lint smoke-check outcomes.

- [ ] **Step 6: Commit GREEN evidence.**

```bash
git add docs/superpowers/baselines/2026-04-26-44-red-phase-baseline.md
git commit -m "test: #44 record GREEN-phase verification for auto-switch rule"
```

Expected: commitlint passes.

---

## Verification summary (consumed by `Reviewer`)

- AC-44-1 … AC-44-5: behavioral walkthroughs in Workstream 4 step 1.
- AC-44-6: Workstream 4 step 1 line for AC-44-6.
- AC-44-7: word/char measurement in Workstream 2 step 5 and re-measured in Workstream 4 step 1.
- AC-44-8: `git log` ordering check in Workstream 4 step 1; RED-phase commit lands in Workstream 1 before any `pre-flight.md` edit in Workstream 2.
- Tooling smoke checks: `pnpm lint:md` (Workstreams 1, 2, 3, 4) and `pnpm exec commitlint --edit` (Workstream 4).

---

## Self-review

- **Spec coverage:** AC-44-1 (W2 + W4), AC-44-2 (W2 step 4 + W4), AC-44-3 (W2 step 2 + W4), AC-44-4 (W2 step 4 + W4), AC-44-5 (W2 step 4 + W4), AC-44-6 (W2 step 2 prohibition + W3 + W4), AC-44-7 (W2 step 5 + W4), AC-44-8 (W1 ordered before W2). Design `## RED-phase baseline obligation` covered by W1 and W4.
- **Placeholder scan:** halt strings are verbatim from the design; word/char threshold is concrete (180 / 1,400); no "TBD" / "implement later" / "add appropriate error handling".
- **Type consistency:** halt-string format `superteam halted at Team Lead: <reason>` matches the design table verbatim across all four new halts; `/github-flows:new-branch` cited identically across `pre-flight.md`, `SKILL.md`, and the design doc.
