# Design: superteam should auto-switch from the default branch to the issue branch during pre-flight [#44](https://github.com/patinaproject/superteam/issues/44)

## Problem framing

`Team Lead` pre-flight (`skills/superteam/pre-flight.md` `## Active-issue resolution` and `## Halt conditions`) resolves the active issue from one of three sources, in order: explicit `#<n>` in the operator prompt, branch name `<n>-<slug>`, then operator. It then immediately drops into committed-artifact inspection on whatever branch happens to be checked out.

The contract has no rule for the most common starting state: the operator is on the repository's default branch (e.g. `main`) and supplies the issue via the prompt. In that state, pre-flight currently:

- Inspects design / plan artifacts on the default branch instead of the per-issue branch.
- Treats absence of the per-issue artifacts as `phase=brainstorm` even when the operator just rebased a branch they intended to work on.
- Lets `Brainstormer` author the design doc directly on the default branch, which then forces `Finisher` to either rewrite history or push the design from the wrong base.

`patinaproject/github-flows` already encodes the canonical issue-branch procedure as `/github-flows:new-branch` (`skills/new-branch/workflow.md`): kebab the title to `<n>-<kebab-title>` (60-char cap, hyphen-boundary trim), refuse on a dirty working tree using a verbatim refusal string, resolve the default branch via `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, fetch it, then `git checkout -b "$branch" "origin/$defaultBranch"` (or `checkout` + `rebase` when the branch already exists), and surface rebase conflicts without auto-aborting.

This design adds a deterministic pre-flight rule that detects "operator is still on the default branch and supplied the issue via prompt" and performs the equivalent of `/github-flows:new-branch <issue>` before committed-artifact inspection runs. The new rule is an addition to the detection sequence, not a replacement for active-issue resolution or for the existing halt conditions.

## Where the rule inserts in the detection sequence

Insert a new step between current step 1 (active-issue resolution) and current step 2 (committed-artifact inspection) in `skills/superteam/pre-flight.md` `## Detection sequence`. The renumbered sequence is:

1. Resolve the active issue.
2. **(NEW) Auto-switch from default branch to issue branch when the trigger conditions hold.**
3. Inspect committed artifacts on the (possibly new) active branch.
4. Inspect branch state.
5. Inspect PR state.
6. Derive the detected phase.
7. Classify the operator prompt.
8. Probe execution-mode capability.
9. Recover the active loopback class.
10. Route.

The rule MUST run before committed-artifact inspection so phase derivation operates on the correct branch state. It MUST run after active-issue resolution so the issue identity is fixed before any branch is created or switched.

## Trigger conditions

All of the following MUST hold for the auto-switch to fire. If any one is false, the rule is a no-op and pre-flight continues with the next detection step.

- The active issue was resolved from the operator prompt (source 1: explicit `#<n>`), NOT from the branch name (source 2) and NOT from the operator (source 3).
- The current branch equals the repository default branch as resolved by `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`.

When the active issue was resolved from the branch name, the operator is already on a per-issue branch and no switch is needed. When the active issue was resolved by asking the operator, the operator has already been prompted and may legitimately be intending to author on the current branch; in that case the rule does not fire and pre-flight continues unchanged.

## Algorithm

`superteam` does NOT duplicate the `/github-flows:new-branch` algorithm inline. The canonical, authoritative algorithm is `/github-flows:new-branch` in `patinaproject/github-flows`. `superteam` is responsible only for:

1. Detecting that the trigger conditions hold.
2. Invoking the `/github-flows:new-branch` algorithm (either by direct slash-command invocation when the host runtime supports it, or by re-stating the algorithm's steps verbatim when it does not). Either path MUST produce the same observable result the canonical workflow specifies.
3. Mapping the algorithm's refusal conditions onto `superteam halted at Team Lead: <reason>` per `## Failure modes` below.
4. Re-running committed-artifact inspection on the new branch before phase derivation.

Specifically, `superteam` does NOT re-implement kebab-casing, default-branch resolution, dirty-tree detection, fetch, checkout, or rebase logic. Those belong to `/github-flows:new-branch`. Changes to that algorithm are out of scope for this issue.

The dependency-install step (Step 6 in `/github-flows:new-branch`) is OUT OF SCOPE for `superteam` pre-flight; pre-flight does not need installed dependencies to derive a phase. The rule MUST NOT run lockfile-driven install as part of `superteam` pre-flight even though the canonical algorithm does, because install is not load-bearing for phase detection and adding it widens `superteam`'s blast radius beyond what the rule needs.

## Failure modes

The following failures during the auto-switch step MUST halt with `superteam halted at Team Lead: <reason>`:

| Underlying failure (per `/github-flows:new-branch`) | Halt reason |
|---|---|
| `git status --porcelain` is non-empty (Step 3 refusal) | `dirty working tree blocks auto-switch to issue branch` |
| `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` exits non-zero or returns empty (Step 4 refusal) | `default-branch lookup failed; cannot determine whether auto-switch is required` |
| `git rebase` reports conflicts on an already-existing local branch (Step 5) | `rebase conflict on existing issue branch; resolve manually before re-running superteam` |
| `gh issue view <N>` exits non-zero (Step 1 refusal) | `active issue could not be resolved against the current repo` |

The auto-abort prohibition from the canonical algorithm carries over: `superteam` MUST NOT run `git rebase --abort` on the operator's behalf and MUST NOT silently fall back to working on the default branch when any of the above fail.

## No-op cases

- Already on a `<n>-<slug>` branch where `<n>` matches the active issue: no switch; continue with committed-artifact inspection on the current branch.
- Already on a `<n>-<slug>` branch where `<n>` does NOT match the active issue: this is halt condition 3 in `pre-flight.md` (multiple candidate active issues that cannot be reconciled). The auto-switch rule does NOT fire; the existing halt fires instead.
- On a non-default, non-`<n>-<slug>` branch: today's "operator (ask)" fallback in active-issue resolution applies; the auto-switch rule does NOT fire because the active issue was not resolved from source 1 (explicit `#<n>` in the prompt) AND/OR because the current branch is not the default branch.
- Active issue was resolved from the branch name: rule does not fire (operator is already on the issue branch by definition).

## Out of scope

- Changes to `/github-flows:new-branch` itself.
- Lockfile-driven dependency installation inside `superteam` pre-flight.
- Cross-repo branching (`-R other/repo`); `superteam` inherits the same-repo constraint from the canonical algorithm.
- Behavior changes when the operator is already on a non-default branch that is not `<n>-<slug>`-shaped (today's "operator (ask)" fallback continues to apply).
- Coupling `superteam` to the `github-flows` plugin at runtime such that `superteam` cannot run when the plugin is absent. The design permits either direct slash-command invocation or in-skill re-statement of the algorithm; both paths preserve `/github-flows:new-branch` as authoritative.

## Loophole-closure language

The rule MUST be stated in `pre-flight.md` with explicit closure of the following rationalizations. Each closure ties to a `## Rationalization table` row in `SKILL.md` (see below).

- "The operator is on the default branch on purpose; they clearly meant to start work here."
  Closure: the rule fires unconditionally on the trigger. Operator intent is captured by the issue reference in the prompt, not by the branch they happened to start on. Author intent is not a waiver.
- "Skipping the switch is faster; the operator will branch later."
  Closure: skipping leaves Gate 1 artifacts authored on the wrong base, which forces history rewrite or wrong-base push downstream. The cost of "later" is paid by `Finisher`, not by the rule's caller.
- "There's no plan doc on this branch yet, so we're already in `brainstorm`; nothing breaks if we keep going."
  Closure: phase derivation MUST run on the per-issue branch, not on the default branch, so that committed-artifact inspection sees the right state. A `brainstorm` derived from default-branch state is meaningless.
- "If the working tree is dirty I can just stash and continue."
  Closure: the canonical algorithm refuses on a dirty working tree. `superteam` halts with `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch` and does not stash on the operator's behalf.
- "Rebase conflicts are easy; auto-aborting is fine."
  Closure: the canonical algorithm forbids `git rebase --abort` on the user's behalf. `superteam` halts and surfaces the conflict so the operator does not lose work.
- "I can write the auto-switch logic inline so we don't depend on `github-flows`."
  Closure: `/github-flows:new-branch` is the authoritative algorithm. Re-statement is permitted as a portability fallback only; divergence is a contract bug. The design and the plan MUST cite `/github-flows:new-branch` rather than encoding a competing algorithm.

## Rationalization-table additions (for `skills/superteam/SKILL.md` `## Rationalization table`)

| Excuse | Reality |
|--------|---------|
| "The operator is on the default branch on purpose; they clearly meant to start work here." | When the active issue resolves from the operator prompt and the current branch is the repository default branch, pre-flight MUST auto-switch to the per-issue branch before committed-artifact inspection. Operator intent is captured by the `#<n>` reference, not by the branch they happened to be on. Not even when the operator is the maintainer. Not even under deadline pressure. |
| "Skipping the auto-switch saves a step; we can branch later." | Skipping authors Gate 1 artifacts on the wrong base and forces `Finisher` to rewrite history or push from the default branch. The rule is not optional. |
| "Dirty working tree? I can stash and continue." | The canonical `/github-flows:new-branch` algorithm refuses on a dirty working tree. `superteam` halts with `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch`. Pre-flight does NOT stash on the operator's behalf. |
| "Rebase conflict on the existing issue branch is fine; I'll abort and try again." | The canonical algorithm forbids `git rebase --abort` on the operator's behalf. `superteam` halts and surfaces the conflict. |
| "We can re-implement the kebab + checkout + rebase logic inside `superteam` so we don't depend on `github-flows`." | `/github-flows:new-branch` is the authoritative algorithm. `superteam` references it; it does not fork it. Divergence between the two is a contract bug. |

## Red flags (for `skills/superteam/SKILL.md` `## Red flags`)

- `Team Lead` proceeding to committed-artifact inspection while the current branch is the repository default branch and the active issue was resolved from an explicit `#<n>` in the prompt.
- `Team Lead` performing `git stash` or any auto-stash variant as part of the auto-switch path.
- `Team Lead` running `git rebase --abort` after a rebase conflict on the existing issue branch.
- `pre-flight.md` documenting kebab-casing, default-branch resolution, fetch, checkout, or rebase steps inline instead of referencing `/github-flows:new-branch`.
- `Team Lead` silently continuing on the default branch after `gh repo view` fails to resolve the default branch.
- A `superteam` run authoring `docs/superpowers/specs/...` on the default branch.

## Token-efficiency target for the new pre-flight rule

The new rule, when it lands in `skills/superteam/pre-flight.md`, MUST fit within **180 words / 1,400 characters total** across the new `## Auto-switch to issue branch` section AND the corresponding additions to `## Detection sequence`, `## Halt conditions`, and `## Active-issue resolution` cross-references combined. The rule references `/github-flows:new-branch` rather than restating its algorithm; restating the algorithm would blow this budget and is forbidden by the loophole-closure language above.

The corresponding additions to `skills/superteam/SKILL.md` (`## Rationalization table` rows and `## Red flags` bullets above) are NOT counted against this budget because they live in a different file and are part of the existing rationalization / red-flag surfaces.

## RED-phase baseline obligation

Before adding the rule to `pre-flight.md`, the `Executor` MUST establish a failing-state baseline that demonstrates today's behavior on the trigger conditions. The baseline MUST:

1. Drive a `Team Lead` pre-flight subagent (or equivalent harness) with: operator prompt containing an explicit `#44`, current branch == repository default branch, clean working tree, no design doc on either branch.
2. Capture verbatim that the subagent proceeds to committed-artifact inspection on the default branch and derives `phase=brainstorm` without switching branches.
3. Capture verbatim the subagent's rationalizations for not switching (e.g. "the operator is on `main` on purpose", "no rule says to switch", "the issue says to brainstorm so let's brainstorm").
4. Repeat with a dirty working tree and capture that today's pre-flight neither halts nor switches.
5. Record the captured rationalizations in the plan doc as the targets the new rule MUST close, and cite each captured rationalization against a corresponding rationalization-table row above.

The baseline is the GREEN-phase entry gate: until the baseline shows the rule failing today on these scenarios, the rule MUST NOT be added to `pre-flight.md`. After the rule lands, the same scenarios MUST be re-run to confirm GREEN (auto-switch fires; halts on dirty tree; halts on rebase conflict; no-op on already-on-issue-branch; no-op when issue resolved from branch name). Any new rationalization observed in REFACTOR adds a row to `## Rationalization table` and re-runs the baseline.

## Acceptance Criteria

### AC-44-1

**Given** the operator runs `/superteam #<n>` while on the repository default branch with a clean working tree,
**When** pre-flight runs,
**Then** `Team Lead` switches to (or creates) `<n>-<kebab-title>` based on the issue title via the `/github-flows:new-branch` algorithm before committed-artifact inspection runs, and committed-artifact inspection then runs on the new branch.

### AC-44-2

**Given** the operator runs `/superteam #<n>` while on the repository default branch with a non-empty `git status --porcelain`,
**When** pre-flight runs,
**Then** the run halts with `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch`, and no checkout, fetch, or stash side effect occurs.

### AC-44-3

**Given** the operator runs `/superteam` while already on a `<n>-<slug>` branch whose `<n>` matches the active issue,
**When** pre-flight runs,
**Then** no branch switch occurs, no fetch is performed beyond what existing pre-flight steps already perform, and active-issue resolution behaves exactly as it does today.

### AC-44-4

**Given** the operator runs `/superteam #<n>` while on the repository default branch and `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` exits non-zero or returns an empty string,
**When** pre-flight runs,
**Then** the run halts with `superteam halted at Team Lead: default-branch lookup failed; cannot determine whether auto-switch is required`, and no checkout side effect occurs.

### AC-44-5

**Given** the operator runs `/superteam #<n>` while on the repository default branch, the local branch `<n>-<kebab-title>` already exists, and rebasing it onto the freshly fetched default branch produces conflicts,
**When** pre-flight runs,
**Then** the run halts with `superteam halted at Team Lead: rebase conflict on existing issue branch; resolve manually before re-running superteam`, the conflict is surfaced verbatim from `git rebase`, and `superteam` does NOT run `git rebase --abort`.

### AC-44-6

**Given** the design and plan documents for this issue,
**When** they describe the auto-switch behavior,
**Then** they reference `patinaproject/github-flows` `/github-flows:new-branch` (`skills/new-branch/workflow.md`) as the authoritative algorithm and do NOT duplicate kebab-casing, default-branch resolution, fetch, checkout, rebase, or install logic inline.

### AC-44-7

**Given** the new rule is being added to `skills/superteam/pre-flight.md`,
**When** the file is updated,
**Then** the new `## Auto-switch to issue branch` section plus its cross-references in `## Detection sequence`, `## Halt conditions`, and `## Active-issue resolution` together total no more than 180 words / 1,400 characters, and the budget overage MUST cause the change to be rejected at review.

### AC-44-8

**Given** the `Executor` is implementing the rule,
**When** they begin implementation,
**Then** they first commit a RED-phase baseline that demonstrates today's pre-flight behavior on the trigger scenarios (default branch + prompt-resolved issue, with both clean and dirty working trees) and records the rationalizations the new rule MUST close, before adding the rule to `pre-flight.md`.
