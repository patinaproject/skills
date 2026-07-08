---
name: review-branch
description: Run a read-only, fresh-context branch-diff review and report findings. Use when running /review-branch, before finishing issue work, or when a local review gate should inspect committed, staged, unstaged, and untracked changes.
---

# Review Branch

## Safety Boundary

Local code review is read-only and findings-only.

- Do not edit files, stage changes, commit, push, create pull requests, post GitHub comments, or mutate review threads.
- Do not run formatters, generators, fixers, installers, or other commands that
  write to the worktree.
- Do not read, require, print, or infer secrets.
- Do not fall back to same-thread review. If fresh reviewer dispatch is unavailable, halt.

## Scope

1. Resolve the repository default branch with `gh repo view --json
   defaultBranchRef --jq .defaultBranchRef.name` or `git rev-parse
   --abbrev-ref origin/HEAD`. Normalize the fallback by stripping the leading
   `origin/` so the branch name is `main`, not `origin/main`. If neither
   source can identify a default branch, halt with instructions to set
   `origin/HEAD` outside this skill, for example with
   `git remote set-head origin --auto`.
2. Use the current `origin/<default-branch>` ref. Do not update refs during
   review. Verify the local ref exists with
   `git rev-parse --verify origin/<default-branch>`. When `gh` is available,
   resolve `{owner}/{repo}` with `gh repo view --json nameWithOwner --jq
   .nameWithOwner`, then compare the local SHA to the remote default-branch SHA
   from `gh api repos/{owner}/{repo}/branches/{branch} --jq .commit.sha`; halt
   and report both SHAs when they differ. When remote freshness cannot be
   checked, continue only after recording that freshness is unverified in the
   report.
3. Compute the review base with `git merge-base origin/<default-branch> HEAD`
   after normalization.
4. Review the default-branch merge-base to the current branch, plus staged,
   unstaged, and untracked local changes. Include deleted files.
5. Load repository instructions before review: `AGENTS.md`, `CLAUDE.md` if
   present, and docs they explicitly import.
6. Treat generated files, lockfiles, vendored files, and dogfood overlay paths
   as low-signal unless repository instructions or the diff make them relevant.

## Fresh Reviewer Dispatch

The primary agent may compute scope and collect context, but the actual review
must run as a fresh-context reviewer in a fresh reviewer agent or equivalent
isolated dispatch surface with no inherited implementation conversation.
Prefer a host-provided read-only Explorer or reviewer background agent when one
is available, because branch-diff review is a codebase question with a bounded
scope.

In Codex, spawn a fresh Explorer background agent for the review without asking
for another user confirmation when the caller has already requested local
review, `/review-branch`, or an issue workflow that reaches the review gate. Run
one reviewer per pass — never a duplicate for the same unresolved pass.

The reviewer has a lifecycle: spawn, wait, capture and report its result, then
close. Never close before its final report, timeout notice, or requested partial
result has been captured; on a timeout or requested partial result, capture and
report the useful output, then close. Before spawning, close or mark inactive
any prior review-branch Explorer, reviewer, or worker agent whose output has
already been consumed, canceled, or superseded — if the host cannot close it,
label it inactive or superseded. The visible agent list must communicate only
the current review state, never leaving stale prior-run agents for the human to
mentally filter.

Pass only:

- Repository path
- Default branch, merge-base, head, and dirty/untracked scope
- Changed file list and relevant diff commands
- Repository instructions
- This read-only review contract

If the host runtime cannot create a fresh reviewer or equivalent isolated
review surface, halt and report that isolation is unavailable. Do not ask the
current implementation conversation to perform the review.

## Reviewer Model

Select the reviewer model explicitly at dispatch. Do not inherit whatever model
the host's fresh-context primitive happens to default to: a host whose default
is a small model would silently downgrade this gate, which is a primary quality
control. Require a capable model and prefer the session or main model over a
subagent's default. Keep the choice host-abstracted — set it through whatever
the dispatch surface exposes, such as a subagent or Agent `model` parameter, an
explorer model, or a CLI `--model` flag. Capture the model the reviewer actually
ran on so it can be reported, making any downgrade observable without inspecting
host UI.

## Reviewer Contract

The reviewer should inspect the scoped diff for merge-relevant risk:

- correctness, security, data loss, requirements fit, error handling, test
  quality, edge cases, production readiness, clarity, and maintainability
- missing or misleading tests for changed behavior
- inconsistencies with repository instructions or issue acceptance criteria

Group findings by severity: blocking, non-blocking, and low-severity. Each
finding must include a file and line reference, rationale, and suggested fix.
Keep praise-heavy commentary out of the report. If there are no findings, say
so and mention residual risk or test gaps.

### Bad-smell baseline

Alongside whatever the repository documents, the reviewer carries an always-on
baseline of high-signal code smells (Fowler, *Refactoring* — "Bad Smells in
Code") to anchor the clarity and maintainability pass: Mysterious Name,
Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated
Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message
Chains, Middle Man, Refused Bequest.

Two rules bind the baseline:

- A documented repository standard overrides it. When a repo instruction speaks
  to the same concern, the repo standard wins and the baseline stays silent.
- Every smell is a judgement call, never a hard violation. Report a smell as a
  non-blocking or low-severity observation with rationale, not as a blocking
  finding, unless it also breaks correctness or a documented standard.

## Distinction From Hosted Review

`review-branch` is a local isolated reviewer for branch-diff findings. It does
not emulate `code-review.yml`, does not require a PR number, and does not post
comments. Hosted review workflows own their own prompt, permissions, and
PR-commenting contract.

## Report

- Base, head, and default branch used
- Local default-branch ref freshness check, or why freshness is unverified
  (for example: `Freshness unverified: gh unavailable; reviewed current
  origin/main only`)
- Changed files, including staged, unstaged, and untracked files
- Fresh reviewer dispatch mechanism, or halt reason
- Reviewer model the review actually ran on
- Findings grouped by severity
- Low-signal paths skipped or reviewed with rationale
