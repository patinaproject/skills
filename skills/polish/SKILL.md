---
name: polish
description: Review a completed branch for design, repository standards, and issue requirements, then fix clear findings and repeat until the current commit passes. Use before publishing completed work.
---

# Polish a branch

Run this skill on a committed branch. An optional issue or written instruction
can focus the review, but it does not add implementation work.

For each set of commits not yet reviewed, `polish` checks the design, runs the
repository's verification, and asks fresh reviewers to check repository
standards and issue requirements. It records the result before fixing clear
findings. Each fix is committed and reviewed in a new pass.

`polish` stops only when the current commit passes with no findings or the next
step needs a person. It does not push or open a pull request.

## Input

Examples:

```text
/polish
/polish <issue-reference>
/polish "focus on the validation path"
/polish <issue-reference> focus on the parser
```

Written instructions tell reviewers where to pay extra attention. Findings
must still come from code changed or affected by the commits under review.
`working-on-issue` finds the issue and branch when possible. Without an issue,
skip the issue-requirements review but continue the design and standards
reviews. Report any meaningful difference between the finished work and the
issue body. Do not edit the issue.

Pass any behavioral observation context from the caller unchanged to both
reviewers. Continue normally when it is missing. This local review never
requires a simulator, device, or deployed build.

## Required skills

Confirm these skills are installed:

- `working-on-issue`
- `new-branch`
- `code-review`
- `implement`
- `tdd`
- `diagnosing-bugs`
- `codebase-design`

If one is missing, stop, name it, and provide a project-local install command
for its current source.

## Steps

1. Run `working-on-issue` with the full input. Keep the issue for the later
   requirements review.
2. Read [`review-record.md`](review-record.md) in full. Resolve the target branch
   from `origin/HEAD`, then follow its start-of-invocation capture and scope
   procedure from a clean committed worktree. Run that opening decision once,
   then reuse its captured inputs for every internal fix loop. Keep the returned
   base and current commit unchanged for this pass.

   | Mode | Work to review |
   | --- | --- |
   | `full` | Merge base through the current commit |
   | `incremental` | Commits after `reviewedHead` through the current commit |
   | `recheck` | Previously reported findings at the same commit |
   | `skip` | The current commit already passed with no findings |

   A passing record that no longer includes the commit that earned it produces
   `recheck`. In `skip`, report that the current commit already passed and stop.
3. Review the design for every changed module and interface in the selected
   non-empty `full` or `incremental` range. Read unchanged callers and
   neighboring code when needed. Recheck any earlier design findings. Use this
   opening scope for Architecture; Architecture does not choose another full or
   incremental range.

   Follow the complete review rules in `codebase-design`. Read relevant
   `CONTEXT.md` and ADR files first. Report only design improvements that belong
   with the reviewed change and satisfy those rules. Do not edit code during
   this review. In `recheck`, review only the named findings.
4. Require a clean committed worktree and record `HEAD`. Run the repository's
   documented verification against that exact commit. If verification fails or
   stops early, keep the last completed review result unchanged. Save useful
   findings from the unfinished review, then fix the problem or report what
   prevents progress.
5. Run the Standards and Spec reviews from `code-review` as fresh parallel
   subagents. Give both reviewers the fixed base and commit, the exact diff for
   `full` or `incremental`, any needed unchanged context, the issue or a clear
   no-issue instruction, earlier findings to recheck, and the matching
   `code-review` rules.

   Reviewers only report findings. They do not edit, stage, commit, or fix code.
   A documented standards violation or a missing, partial, or incorrect issue
   requirement blocks the pass. Code smells require judgment. If a reviewer
   fails, times out, or stops early, keep the last completed result and save any
   useful finding from the unfinished review.

   For a reported defect, both reviewers must apply the
   [reporter-fidelity evidence rules](../ready-pr/references/reporter-fidelity.md#matching-evidence-to-the-report).
   Record missing reporter-matched evidence for later fixed-build testing.
   Treat it as a `polish` finding only when the implementation, regression seam,
   or supplied requirements require that evidence here.
6. Confirm that `HEAD` still matches the commit from step 4. Combine the design,
   Standards, and Spec results. Store only one stable ID, review type, current
   location, and short summary for each blocking finding.

   - With no blocking findings, record `passed` for the current commit.
   - With blocking findings, record `changes_requested` before fixing them.
   - If a review did not finish or `HEAD` changed, preserve the last completed
     result and save only useful findings from that unfinished review.
7. Decide what to do with every completed finding:

   - Fix clear local problems with `implement`. Use `diagnosing-bugs` when local
     investigation can answer the question.
   - Ask the user when the finding needs judgment, access, manual testing,
     design input, permission, changed requirements, or conflicting
     instructions.
   - Dismiss a finding when it is outdated, incorrect, non-blocking, or
     conflicts with repository rules. Explain why and remove it from the
     blocking list.

   Verify and commit every agent fix, then restart at step 2. Review even small
   fix commits. Finish only when the current commit itself has a passing record
   with no findings.

## Final report

Lead with `Passed` or `Blocked`. Include the issue, reviewed commit range,
completed reviews, remaining findings, whether the review record advanced,
design changes made, failed or skipped verification, and any difference from
the issue body. Summarize successful verification in one sentence.
