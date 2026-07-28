---
name: ready-pr
description: Ready completed branch work into a ready-to-merge pull request. Use when the caller wants to publish or ready a PR, or another skill needs the explicit PR-readiness workflow.
---

# Ready PR

## Quick Start

When local work is complete, follow
[workflows/ready-for-merge.md](workflows/ready-for-merge.md) — the authoritative
procedure for every step below.

When review feedback appears, apply
[workflows/triage.md](workflows/triage.md), especially its authorship and
renewed-human-report routing, before taking a generic feedback disposition.

Example: on an adapter-provided issue branch, resolve its issue, verify the
diff, commit with the repository's required issue-reference format, push, and
open the PR as a draft.

The skill verifies, commits, pushes, and creates or reuses a **draft** PR, then
runs the readiness loop until the PR is ready-to-merge or every problematic
check is triaged and reported. A failing check is evidence to triage, not a
halt. It never merges the PR or enables auto-merge.

Agent-authored PRs open as drafts and stay drafts while the code-review loop
runs, so draft means "agent loop still churning, not yet for humans." The skill
flips a draft when the **review loop is clean**: the code-review run on the
latest head has completed, has actually reviewed it, and no unresolved
agent-authored review threads remain. A human's thread never gates the flip;
getting the PR in front of humans is what the flip is for. That predicate is the
whole gate, and it applies the same way whether this run opened the PR or
inherited one that another run or a human opened.
The flip is one-way. A human's work-in-progress draft does not satisfy the
predicate, because no completed code-review run has reviewed its head. The
convention presumes the repository runs code review on draft PRs; a PR that
**runs no code-review loop on its draft** opens non-draft instead, because its
predicate can never hold. That covers a repo with no code-review automation, a
repo whose code review skips drafts, and a per-PR skip a repo defines (for
example a `skip-code-review` label).

End on a strict final ready-to-merge gate. The gate enumerates every
uncommitted path and requires a provable per-path disposition — in-scope paths
must be committed, out-of-scope paths must name the issue or branch they belong
to — so an ambiguous or plausibly-in-scope change can never pass as a "clean"
worktree. If any gate fails, report the PR as not ready-to-merge, name the
blocker in human-friendly language, and do not imply success or call it
finished. If every gate passes, compress the ready-to-merge evidence into one
human line.

## Workflow

1. Read repository guidance, commit rules, and the PR template.
2. Infer the issue from the current branch or existing PR metadata; ask if
   ambiguous.
3. Inspect uncommitted changes and stage only relevant paths.
4. Run the repository's documented verification commands.
5. Commit using the repository's required commit format.
6. Push the branch when there is work to publish.
7. Create or update the PR using the repository template. Open it as a draft by
   default. Open it non-draft only when the PR runs no code-review loop on its
   draft (see the overview and `ready-for-merge.md` step 6).
8. Enter the readiness loop: detect merge conflicts, triage currently
   available PR feedback, resolve eligible conversations (the agent-authored
   threads), hand every human-authored one to the operator in the session, and
   restart reproduction when a human reports that a previously handled bug
   persists or has returned. Watch all checks in fail-fast bounded observation
   windows, triage every problematic check, re-query PR feedback after checks
   and after every watch exit or timeout, fix branch-local issues, push, and
   repeat. A check the agent cannot fix gets a concrete disposition and
   continues to reporting, not a halt.
9. Flip the draft to ready for review the moment the review loop is clean, with
   every agent-authored thread resolved. The flip is one-way, and the readiness
   predicate is its only precondition. The PR transition is the complete review
   signal and does not write issue state.
10. Report ready-to-merge status or concrete non-ready check dispositions
    without merging.

## Guardrails

- Reply on, resolve, dismiss, and re-request review only on agent-authored
  threads. A human reviewer's thread is answered and closed by that human or
  the operator; use
  [triage's human-thread handoff](workflows/triage.md#human-thread-handoff).
- Treat a human report that a previously handled bug persists or has returned
  as a restarted bug-fix loop even when the PR head is unchanged. Follow the
  repository's human-bug-report contract before more fix work, or report a
  blocker.
- Do not resolve a review thread without an evidence-bearing reply, including
  code-fix dispositions; verify pattern-based feedback with a direct search or
  check before resolving when feasible.
- Do not rewrite branch history or force-push by default.
- Do not use browser conflict resolution or merge the pull request itself.
- Do not enable auto-merge.
- Do not create follow-up issues from PR feedback.
- Do not wait indefinitely for new human review comments.
- Watch all checks, including optional ones; optional checks remain in scope.
- Stop after the documented no-progress threshold instead of watching
  indefinitely.
- Do not stop solely because a check failed, was canceled, or is out of scope;
  triage it, fix branch-local causes when possible, and otherwise report the
  check disposition.
- Do not add AI or agent attribution unless the repository requires it.
- Stop for non-check blockers involving secrets, permissions, product
  decisions, or ambiguous scope.
