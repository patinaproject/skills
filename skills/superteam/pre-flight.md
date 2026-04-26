# Pre-flight

Heavy reference for the deterministic phase-detection and execution-mode capability detection that `Team Lead` runs at the top of every `/superteam` invocation. See `SKILL.md` `## Pre-flight` for the concise summary.

## Trigger

Run this pre-flight at the top of every `/superteam` invocation, before any teammate delegation.

## Detection sequence

1. **Resolve the active issue.** Order: explicit `#<n>` in the operator prompt, then branch name `<n>-<slug>` per the github-flows convention, then operator. If multiple candidates conflict, halt per the halt conditions below.
2. **Auto-switch to issue branch** per `## Auto-switch to issue branch` when its trigger fires.
3. **Inspect committed artifacts on the active branch.** Look for the design doc at the canonical specs path (`docs/superpowers/specs/YYYY-MM-DD-<issue>-<title>-design.md`) and the plan doc at the canonical plans path (`docs/superpowers/plans/YYYY-MM-DD-<issue>-<title>-plan.md`). Treat only committed state as authoritative.
4. **Inspect branch state.** Resolve the current branch and its tracking remote; record divergence and uncommitted state for completeness, but do NOT use uncommitted state as the phase signal.
5. **Inspect PR state.** Determine whether a PR exists for this branch on origin and, if so, whether it is open or merged, and the latest `Finisher` substate signals (CI, review state, mergeability).
6. **Derive the detected phase** per the phase derivation rules below.
7. **Classify the operator prompt** per `routing-table.md` `## Prompt-classification heuristic`.
8. **Probe execution-mode capability** per the `## Execution-mode capability detection` section below.
9. **Recover the active loopback class** from `git log` per `loopback-trailers.md` `## Recovery algorithm`. The recovered class is part of the pre-flight output.
10. **Route** per `routing-table.md` using the `(detected_phase, prompt_classification)` pair as the key.

## Phase derivation rules

- no design doc, no plan, no PR -> `brainstorm`
- design doc present, no plan doc on branch, no PR -> `brainstorm` (Gate 1 still open per R15)
- plan doc present on branch, no PR -> `execute`
- PR open or merged -> `finish`, with `Finisher` substate derived from PR / CI / review state
- artifacts and PR state cannot be reconciled -> halt per the halt conditions below

## Auto-switch to issue branch

Trigger (both MUST hold): issue came from source 1; current branch equals the default branch from `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`.

Algorithm: invoke `/github-flows:new-branch` (`patinaproject/github-flows`, `skills/new-branch/workflow.md`) as authoritative. Do NOT inline kebab, default-branch, dirty-tree, fetch, checkout, or rebase logic. Skip its Step 6 (lockfile install). Re-run step 3 on the new branch.

No-op on `<n>-<slug>` matching the issue, or sources 2/3. Mismatched `<n>` fires halt 3.

Forbidden: auto-stash; `git rebase --abort`; silent fallback on `gh repo view` failure; inline reimplementation.

## Halt conditions

Halt with the exact blocker string `superteam halted at Team Lead: <reason>` when any of the following hold:

1. The operator prompt or branch name implies `phase=plan` but no design doc exists on the branch at the canonical specs path.
2. The detected phase is `finish` but no PR exists for the branch on origin.
3. Multiple candidate active issues are detected and cannot be reconciled (e.g. an explicit `#<n>` in the prompt disagrees with the branch's `<n>-<slug>` and operator does not disambiguate).
4. Committed artifacts and PR state cannot be reconciled (e.g. a merged PR exists but the branch has no plan doc, or a plan doc references a different issue than the PR).
5. `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch`.
6. `superteam halted at Team Lead: default-branch lookup failed; cannot determine whether auto-switch is required`.
7. `superteam halted at Team Lead: rebase conflict on existing issue branch; resolve manually before re-running superteam` (do NOT run `git rebase --abort`).
8. `superteam halted at Team Lead: active issue could not be resolved against the current repo`.

When any halt fires, surface the blocker explicitly and stop. Do not "pick the most likely interpretation".

## Active-issue resolution

Order:

1. Explicit `#<n>` in the operator prompt.
2. Branch name `<n>-<slug>` per the github-flows convention.
3. Operator (ask).

If multiple candidates conflict, halt per halt condition 3 above.

On default branch with source 1, run `## Auto-switch to issue branch` before step 3.

## Loopback-class recovery

Use the `git log` algorithm in `loopback-trailers.md` `## Recovery algorithm` to recover the active loopback class (one of `spec-level`, `plan-level`, `implementation-level`, or none) from conventional-commit `Loopback:` trailers on the active branch. The recovered class is part of the pre-flight output and feeds into routing.

## Execution-mode capability detection

Run the deterministic probe in this order, top to bottom. Stop at the first match. This probe records execution capability for later routing; missing execution capability halts only when the selected route requires execute-phase delegation.

1. **Team mode.** Selected when the host runtime exposes an explicit documented team-mode capability name (e.g. `BackgroundAgent`, `Team`) OR a plugin-declared team-mode capability flag in the active host's plugin manifest. Generic `Task`, `Agent`, or one-off background dispatch surfaces do not count as team mode unless the host or manifest explicitly marks them that way. When the signal is absent or ambiguous, treat team mode as unavailable and continue.
2. **Subagent-driven.** Selected when team mode is unavailable AND a subagent-dispatch tool surface is detectable (e.g. a `Task` / `Agent` tool surface, one-off background dispatch, or the documented entry point for `superpowers:subagent-driven-development`).
3. **Unavailable.** Record `execution_mode=unavailable`.

Inline mode is NEVER auto-selected at any step. Only an explicit operator override (per R14, see `SKILL.md` `## Execution-mode injection`) reaches inline; that path is the only one that may route through `superpowers:executing-plans`.

If the selected route requires execute-phase delegation and `execution_mode=unavailable`, halt with `superteam halted at Pre-flight: no execution mode available`. Non-execute routes such as Gate 1 feedback, local review interpretation, and `Finisher` status checks continue through their owning teammate instead of halting solely because execution delegation is unavailable.

## Output of pre-flight

The pre-flight produces this record, which is the input to `routing-table.md`:

```text
{
  active_issue,
  detected_phase,
  open_gate?,
  active_loopback_class?,
  execution_mode,
  operator_override?
}
```
