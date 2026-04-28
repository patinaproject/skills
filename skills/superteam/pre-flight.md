# Pre-flight

Heavy reference for the deterministic phase-detection and execution-mode capability detection that `Team Lead` runs at the top of every `/superteam` invocation. See `SKILL.md` `## Pre-flight` for the concise summary.

## Trigger

Run this pre-flight at the top of every `/superteam` invocation, before any teammate delegation.

## Detection sequence

1. **Resolve the active issue.** Order: explicit `#<n>` in the operator prompt, then branch name `<n>-<slug>` per the issue-branch convention, then operator. If multiple candidates conflict, halt per the halt conditions below.
2. **Auto-switch to issue branch** per `## Auto-switch to issue branch` when its trigger fires.
3. **Inspect committed artifacts on the active branch.** Look for the design doc at the canonical specs path (`docs/superpowers/specs/YYYY-MM-DD-<issue>-<title>-design.md`) and the plan doc at the canonical plans path (`docs/superpowers/plans/YYYY-MM-DD-<issue>-<title>-plan.md`). Treat only committed state as authoritative.
4. **Inspect branch state.** Resolve the current branch and its tracking remote; record divergence and uncommitted state for completeness, but do NOT use uncommitted state as the phase signal.
5. **Inspect implementation and local review state.** Determine whether committed implementation work is present beyond the committed plan and whether local pre-publish review resolution is visible from committed artifacts, review notes, implementation commits, or PR state.
6. **Inspect PR state.** Determine whether a PR exists for this branch on origin and, if so, whether it is open or merged, and the latest `Finisher` substate signals (CI, review state, mergeability).
7. **Derive the detected phase** per the phase derivation rules below.
8. **Classify the operator prompt** per `routing-table.md` `## Prompt-classification heuristic`.
9. **Probe execution-mode capability** per the `## Execution-mode capability detection` section below.
10. **Route** per `routing-table.md` using the `(detected_phase, prompt_classification)` pair as the key.

## Phase derivation rules

- no design doc, no plan, no PR -> `brainstorm`
- design doc present, no plan doc on branch, no PR -> `brainstorm` (Gate 1 still open per R15)
- plan doc present on branch, no PR -> `execute`, with route refined by `implementation_state` and `local_review_state`
- PR open or merged -> `finish`, with `Finisher` substate derived from PR / CI / review state
- artifacts and PR state cannot be reconciled -> halt per the halt conditions below

## Auto-switch to issue branch

Trigger (both MUST hold): issue came from source 1; current branch equals the default branch from `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`.

Algorithm:

1. Refuse a dirty working tree. If `git status --porcelain` is non-empty, halt with condition 5.
2. Resolve the default branch with `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. If it fails or returns empty, halt with condition 6.
3. Resolve the issue title with `gh issue view <n> --json number,title,state`. If it fails, halt with condition 8. If the issue is not open, ask the operator before continuing.
4. Compute the issue branch as `<issue-number>-<kebab-title>`:
   - lowercase the title
   - replace each run of non-`[a-z0-9]` characters with one hyphen
   - trim leading and trailing hyphens
   - prepend `<issue-number>-`
   - truncate the full string to 60 characters, preferring the previous hyphen boundary, then trim trailing hyphens
5. Fetch `origin/<defaultBranch>`.
6. If the branch does not exist locally, check out `-b <branch> origin/<defaultBranch>`.
7. If the branch exists locally, check it out and rebase onto `origin/<defaultBranch>`.
8. If rebase conflicts occur, halt with condition 7 and do not run `git rebase --abort`.
9. Skip dependency installation; pre-flight needs branch state only. Re-run committed-artifact inspection on the new branch.

No-op on `<n>-<slug>` matching the issue, or sources 2/3. Mismatched `<n>` fires halt 3.

Forbidden: auto-stash; `git rebase --abort`; silent fallback on `gh repo view` failure; external branch-workflow dependency.

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
2. Branch name `<n>-<slug>` per the issue-branch convention.
3. Operator (ask).

If multiple candidates conflict, halt per halt condition 3 above.

On default branch with source 1, run `## Auto-switch to issue branch` before step 3.

## Local-review resume safety

Pre-flight does not recover workflow state from commit trailers. When committed implementation work exists, no PR exists, and prior local review findings cannot be proven resolved from visible state, route through `Reviewer` before `Finisher` can publish. `Reviewer` reruns or reconstructs the local pre-publish review from visible artifacts instead of relying on hidden state.

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
  prompt_classification,
  open_gate?,
  current_branch,
  tracking_remote?,
  branch_divergence,
  implementation_state,
  local_review_state,
  pr_state,
  finisher_substate_signals?,
  execution_mode,
  operator_override?
}
```

Field value contracts:

- `implementation_state`: `none` | `in_progress` | `complete_unreviewed` | `reviewed`
- `local_review_state`: `not_applicable` | `not_visible` | `open_findings` | `resolved`
- `pr_state`: `absent` | `open` | `merged`
- `finisher_substate_signals`: `triage` | `monitoring` | `ready` | `blocked` | `merged`
