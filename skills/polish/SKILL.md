---
name: polish
description: "Ready a completed branch with incremental architecture, Standards, and Spec review. Use when finishing issue work before publication, readying a branch on its own, or when a controller needs the local review loop."
---

# Polish Branch

## Quick Start

Invoke on the committed branch you want to review, with an optional scope: an
issue reference, free-form instructions, or both.

```text
/polish
/polish <issue-reference>
/polish "focus on the validation path"
/polish <issue-reference> focus on the parser
```

`polish` owns the complete local review loop. For each committed delta it runs:

1. delta-bounded architecture review;
2. repository verification; and
3. fresh, report-only Standards and Spec review.

A completed review advances disposable local coverage even when it requests
changes. `polish` fixes agent-ready findings, verifies and commits the fixes,
then reviews only that new committed delta. It returns successfully only when
the current head passes with no findings.

This skill does not push or open a pull request. `develop` sequences successful
`polish` before `ready-pr`; directly invoking `ready-pr` remains independent of
this review state.

## Scope Contract

The optional scope selects the issue and weights review attention. It never adds
build work.

- Free-form instructions weight each stage toward the named modules while
  findings stay limited to code caused or exposed by the selected delta.
- `working-on-issue` resolves the issue from the scope or current branch and
  aligns the branch best-effort. A missing issue skips the Spec axis while
  architecture and Standards review continue.
- Material divergence from the issue body belongs in the final report. This
  skill leaves issue editing to its caller.
- When a caller supplies behavioral observation context, carry its requested-
  change link, expected and actual behavior, reporter-perceived surface,
  gathered and unavailable evidence, and known test-to-symptom mismatches into
  both review axes. Missing context remains an ordinary absence and does not
  make this portable review require a simulator, device, or deployed build.

## Required Child Skills

- `working-on-issue`: resolve the issue and align its branch, best-effort.
- `code-review`: supply the separate Standards and Spec rubrics through fresh
  report-only subagents.
- `implement`: apply accepted deepenings and clear findings through its
  build/TDD portion.
- `diagnosing-bugs`: investigate unclear causes, missing reproductions, flaky
  behavior, or performance regressions.
- `codebase-design`: supply the architecture vocabulary and principles.

`working-on-issue` reaches `new-branch`; `implement` reaches `tdd`. Confirm all
seven skills are installed before the run. If one is missing, stop and report
the missing name with the install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill working-on-issue new-branch -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills --skill implement tdd code-review diagnosing-bugs codebase-design -y
```

## Step 0 — Align

Run `working-on-issue` with the supplied scope. Carry its resolved issue into
the Spec stage. Re-confirming an already aligned issue branch is an idempotent
success.

## Step 1 — Select the Review Scope

Read [`review-record.md`](review-record.md) in full before using the bundled
state command. Resolve the target branch from `origin/HEAD`, then run `scope`
from a clean committed worktree, passing the resolved bare branch name rather
than the full ref. Keep the returned base and head fixed for this iteration.

| Mode | Review subject |
| --- | --- |
| `full` | Branch merge-base through committed `HEAD` |
| `incremental` | Exact `reviewedHead..HEAD` delta |
| `recheck` | Outstanding authoritative and provisional findings at the same head |
| `skip` | Current head already passed with no findings |

Missing, corrupt, unavailable, foreign, or non-ancestral state produces `full`.
A passing record that no longer carries the endpoint which earned it produces
`recheck` rather than `skip`.
Provisional findings never narrow the selected delta. Both authoritative and
provisional findings are advisory inputs to revalidate at their current
locations.

In `skip` mode, report the visible no-op and stop without rewriting the passing
record.

## Step 2 — Architecture Review

Every non-empty `full` or `incremental` delta receives architecture review.
Review the exact returned range and read unchanged neighboring modules,
interfaces, contracts, and callers when context requires it. Findings remain
attributable to architecture caused or exposed by the selected delta. Revalidate
outstanding architecture findings in the same pass.

Use the **deep-module vocabulary** from `codebase-design`: **module**,
**interface**, **depth** (**deep**/**shallow**), **seam**, **adapter**,
**leverage**, **locality**, and the **deletion test**. Read `CONTEXT.md` and the
relevant ADRs before proposing a deepening.

Report an architecture finding only when the proposed deepening passes the
deletion test, increases depth, improves locality or the test surface, and fits
the selected change. Keep this pass report-only. Carry every accepted finding
into Step 5 so architecture, Standards, and Spec findings share one completed
outcome and one fix loop.

The pass is complete when every changed module and interface in the selected
delta has been assessed against those criteria, every outstanding architecture
finding has been revalidated, and the report names every accepted finding or
explicitly reports none.

In `recheck` mode, revalidate named architecture findings without inventing an
empty-delta architecture audit.

## Step 3 — Pin and Verify the Candidate

After architecture review, require a clean committed worktree and capture
`HEAD` as the candidate endpoint. Run repository-documented verification
against that candidate. Keep the Step 1 base and this endpoint fixed through
the remaining review stages.

A failed or interrupted verification leaves authoritative state unchanged.
Save useful located findings as provisional state, then fix locally or report
the blocker.

## Step 4 — Standards and Spec Review

Run the two `code-review` axes as fresh parallel subagents. Their prompts carry:

- the exact Step 1 base and Step 3 candidate endpoint;
- `git diff <base>..<candidate>` for `full` and `incremental` modes;
- unchanged neighbors as read-only context;
- the resolved issue or an explicit no-spec instruction;
- every authoritative and provisional finding to revalidate; and
- the `code-review` Standards rubric, smell baseline, and Spec rubric.

The reviewers report only: they do not edit, stage, commit, or fix their own
findings. In `recheck` mode, revalidate the named finding set despite the empty
diff. Keep the two axis reports separate.

For a reported behavioral defect, both reviewers compare the regression
evidence's observable assertion with the behavior the reporter perceived. The
test must be capable of going red for that reported property. Reject proxy-only
evidence, including:

- eventual state or a fixed delay for a timing report;
- request shape or counts for an ordering report;
- internal calls for a public-interaction report;
- element presence for a visibility or layout report; and
- indirect requests or counts for directly reported data behavior.

Prefer direct timing and sequence observations, the public interaction surface,
visual evidence or measured geometry, and direct data results as appropriate.
A proxy may supplement direct evidence, but passing automation or a convenient
assertion never substitutes for the reported property. Record unavailable
reporter-fidelity evidence as a limitation for fixed-build verification; it is
a `polish` finding only when the implementation, regression seam, or supplied
spec requires that evidence here.

Documented Standards violations and missing, partial, or incorrect Spec
requirements are blocking. Fowler smells remain judgment calls. Benign scope
notes are non-blocking unless they require a product or scope decision.

If either reviewer fails, times out, or stops early, the iteration is incomplete.
Save useful located findings as provisional data and retain the prior
authoritative record.

## Step 5 — Record, Route, and Repeat

Confirm `HEAD` still equals the Step 3 candidate after both reviewers finish.
Combine the architecture, Standards, and Spec reports. Build the minimal
finding array defined by the review-record reference: one stable ID, axis,
current location, and concise summary per outstanding blocking finding. Store
no source excerpts or reviewer transcript.

- No blocking findings: record `passed` at the candidate.
- Blocking findings: record `changes_requested` at the candidate before routing
  them.
- Any incomplete stage or moving head: preserve authoritative state and save
  only useful provisional findings.

Route completed findings through the Finding Router. Fix architecture,
Standards, and Spec findings only after the completed outcome is recorded. Use
`implement` or `diagnosing-bugs`, verify and commit the fixes, then restart at
Step 1. Restarting is not discretionary and no fix is too small to re-review:
`complete` accepts only an endpoint `scope` handed out, so recording an outcome
at a head reached by a later commit fails rather than silently skipping the
iteration that would have reviewed it. The next iteration reviews only that fix delta while rechecking the
outstanding concerns. A human-owned finding records `changes_requested` and
stops with a concrete blocker.

## Finding Router

Classify every architecture, Standards, and Spec finding into one outcome:

| Outcome | Use when | Next action |
| --- | --- | --- |
| `ready-for-agent` | The change is clear or evidence can be gathered locally | Route implementation to `implement`; route investigation to `diagnosing-bugs` |
| `ready-for-human` | It needs judgment, external access, manual testing, design input, changed scope, permissions, or conflicting direction | Stop with the evidence and needed decision |
| `wontfix` | It is stale, incorrect, non-blocking, or conflicts with repository rules | Explain the disposition; retain no outstanding blocking finding |

## Final Report

Lead with the final review outcome. Include the resolved issue, reviewed base
and endpoint, stages completed, outstanding and provisional findings, whether
`reviewedHead` advanced, architecture passes and deepenings, verification
failures or blockers, and any scope divergence. Keep successful verification
to one line.
