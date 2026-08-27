---
name: develop
description: "Drive one scope — an issue reference, free-form instructions, or both — to an evidence-backed production-ready PR outcome on its branch. Use when the user invokes `/develop`, or asks to develop one issue or one set of instructions end to end."
---

# Develop

## Quick Start

Invoke with a **scope** — an issue reference, free-form instructions, or both:

```text
/develop <issue-reference>
/develop "add null-checks to the login handler"
/develop <issue-reference> focus only on the validation path
```

This skill is a thin, goal-directed **controller**. It drives one scope to a
ready-for-review PR through a predictable pipeline of named, reusable skills:

```text
working-on-issue → build (implement) → polish → ready-pr
   (align)              (build the scope)      (make ready)     (publish)
```

The **scope** is what to build, and it is authoritative for the run. Any
associated issue is a *separate, best-effort* concern used for the branch,
repository-required commit reference, and PR association — resolved from a reference in the scope
or from the current branch by `working-on-issue`. When instructions and an
issue body disagree, the instructions win.

It coordinates those skills, preserves their contracts and repository
guardrails, and never merges a pull request.

`develop` builds with plain `implement`; it never triggers multi-agent
workflow fan-out on its own. Parallel slice builds are a separate, deliberate
opt-in: invoke `develop-with-workflow` directly when you want them.

## Terminal Goal

Production-ready implementation, all required PR checks passing, and all PR
review comments addressed.

Treat production-ready as an evidence-backed readiness case, not a guarantee of
zero risk. Do not make unsupported certainty claims such as absolute certainty
or similar wording.

## Terminal States

- `goal-met`: production-readiness evidence supports `goal-met`; all required
  exit gates are satisfied and all required PR checks pass.
- `human-blocked`: progress requires human judgment, external access, product
  or design decisions, permissions, secrets, conflicting direction, or valid
  work outside the run's scope.

Do not report `goal-met` while unresolved human-owned blockers remain.

## Required Child Skills

Before building, confirm these installed skills are available in the agent
environment:

- `working-on-issue`: resolve the issue from the scope or current branch, land on its adapter-provided branch, and mark it started; best-effort, returns cleanly when there is no issue.
- `implement`: build the change from acceptance criteria — reaches `tdd` at agreed seams.
- `polish`: incremental pre-publication architecture, Standards, and Spec review.
- `ready-pr`: commit, push, PR creation or update, checks, PR feedback loops, and ready-to-merge reporting.
- `update-branch`: target-merge verification vocabulary and exact-tree helper
  consumed by `ready-pr`.

`working-on-issue` reaches `new-branch`; `polish` reaches `code-review`,
`implement`, and `diagnosing-bugs`, and reviews against the `codebase-design`
vocabulary; `implement` reaches `tdd`. Confirm those are installed too.

If any are missing, halt before building. Report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill working-on-issue new-branch polish ready-pr update-branch -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@diagnosing-bugs -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@codebase-design -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@code-review -y
```

The `implement`, `tdd`, `diagnosing-bugs`, `writing-for-agents`, and
`prototype` install hints intentionally track their source catalog's default
branch. Consumers who need a frozen install can add `#<git-ref>` to those
sources.

## Conditional Routes

Conditional routes are not blanket prerequisites. Check that the named skill is
available only when the scope triggers that route; halt with the missing skill
name and install guidance only for a triggered missing route.

- Consult `writing-for-agents` when the scope changes an installable skill
  package surface: skill entry instructions, frontmatter or description,
  workflow contract text, examples, reference material, or bundled helper
  scripts. Apply its review before the build route builds the change.
- Use `prototype` only when the scope explicitly asks for throwaway exploration,
  state-model sanity checks, UI direction exploration, or equivalent prototype
  work. Delete or absorb prototype output before `polish` unless the scope
  explicitly asks to commit prototype artifacts.

Install guidance for these triggered routes:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@writing-for-agents -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@prototype -y
```

Do not add normal `/develop` routes for upstream planning, triage,
architecture review, handoff, or conversation-mode skills unless the scope
explicitly asks for them.

## Scope Contract

The parameter is a **scope** — a free-form string that may be an issue reference,
instructions, or both. There are no modes: treat the parameter uniformly as
scope, and treat any issue as best-effort association, not a separate path.

- **Scope is authoritative.** Build to the scope. When it references or associates
  an issue and the instructions diverge from the issue body, the instructions
  win; the issue body is context, not a competing spec.
- **Issue association is best-effort.** `working-on-issue` resolves the
  issue from a reference in the scope, else the current branch, and aligns the
  branch, assignment, and started state. When it resolves no issue, **warn and
  continue** — do not halt. In a repository that requires issue-tagged commits
  (as this one does), a no-issue run still builds and polishes but stops before
  the PR (see the Workflow's finish step); where no such rule applies, it
  finishes normally.
- **Actionability judgment, relaxed for instructions.** Treat the scope as prior
  approval for implementation only when it is actionable. Pause for a human when
  the scope — issue or instructions — is genuinely ambiguous, conflicts with
  repository rules, requires a product or design decision, or depends on external
  access. Explicit instructions are strong approval: do not demand a formal
  acceptance-criteria structure for them; pause only when the scope is too vague
  to build without inventing scope.
- **Divergence is surfaced, not silently absorbed.** When the built scope
  materially diverges from the resolved issue body, keep the repository-required
  closing reference and
  **offer** in the final report to update the issue body to match. Never edit the
  issue body without the human's go-ahead, and never block on it.

## Required Exit Gates

- The run's scope is covered — the issue's acceptance criteria, the
  instructions, or both.
- Repository-documented verification has run and results are recorded.
- Relevant tests are added or updated when the change has executable behavior.
- `polish` reviewed the current committed head, applied or dispositioned every
  accepted deepening and finding, and recorded a passing outcome with no
  findings.
- GitHub PR review comments and hosted review comments surfaced by `ready-pr`
  are fixed or dispositioned.
- After `ready-pr`, its
  [canonical readiness predicate](../ready-pr/references/readiness-predicate.md)
  and final ready-to-merge gate are satisfied for `goal-met`.
- Required PR check failures outside branch scope have a concrete disposition
  in a `human-blocked` final report; do not report `goal-met` while a required
  PR check is still failing.
- A target-owned, non-required local verification failure under the
  [target-merge verification contract](../update-branch/references/verification.md)
  is a continuing disposition, not `human-blocked`. It becomes blocking only
  when valid work outside the issue scope is necessary to satisfy a required
  exit gate.
- When an issue is resolved, either the PR is on its issue-linked branch, or the
  final report explicitly names the retained non-issue-linked branch and why the
  caller declared it immutable. Do not report `goal-met` on such a branch
  without that explicit, reasoned callout. A no-issue run that finished on the
  current branch per the no-issue path has no issue-linked branch to require.
- Residual risks and test gaps are reported only when they are concrete,
  relevant to the scope, and useful for a human decision.

## Workflow

1. Read `AGENTS.md` and `CLAUDE.md` if present, plus any docs they import.
2. Confirm the required child skills are available. Issue resolution belongs to
   `working-on-issue` (see Scope Contract); the controller does not
   re-resolve it here.
3. Run `working-on-issue` to align: it resolves the issue from the scope
   or the current branch and aligns the branch, assignment, and started state,
   all best-effort. If it resolves **no issue**, warn that commits and a PR
   cannot be issue-tagged, then continue on the current branch (see step 8).
4. Judge actionability against the Scope Contract. Pause for a human when the
   scope is not actionable; do not invent scope.
5. Apply triggered conditional routes.
6. Build the scope with the build/TDD portion of `implement` — instructions
   authoritative over any issue body — then run repository-documented
   proportional verification. When a target merge adds a broad local failure,
   apply the
   [target-merge verification contract](../update-branch/references/verification.md)
   and carry a proved target-owned outcome forward as a disposition. `polish`
   owns review, so skip `implement`'s standalone `code-review` tail here.
7. Run `polish`, forwarding the resolved issue and instructions. Its
   idempotent alignment re-confirms the branch, then it reviews the selected
   committed delta through delta-bounded architecture, verification, and fresh
   Standards and Spec stages. It records every completed outcome, fixes and
   commits agent-ready findings, and repeats incrementally until the current
   head passes with no findings. Invoking `develop` approves this review loop;
   a `ready-for-human` finding stops the run as `human-blocked`.
8. Run `ready-pr` for commit, push, PR creation or update, visible check
   observation, PR feedback loops, and ready-to-merge reporting. Invoke
   `ready-pr` only after `polish` records a passing current head with no
   findings.
   **When step 3 resolved no issue**, consult the
   repository guidance read in step 1: if it requires an issue reference on commits or
   PRs, stop before `ready-pr` — that
   convention cannot be satisfied without an issue — and report `human-blocked`
   (finishing needs an issue): the built-and-polished branch, and that a human
   must supply or create an issue to finish, rather than committing. If the
   repository imposes no such requirement, finish normally with a conventional
   commit. When an issue is present and the built scope
   diverged from its body, include the reconciliation offer (Scope Contract) in
   the final report.
9. Loop until the terminal goal is met or a human-owned blocker prevents further
   progress.

During long-running or resumable execution, keep compact checkpoint state using
the final-report vocabulary: the scope, the resolved issue reference and URL (if
any), branch name, terminal state, meaningful changes, readiness, blockers, and
next action. Resume from that state and continue until a terminal workflow state
is reached: production-readiness evidence supports `goal-met` or there is a
documented `human-blocked` stop.

## Terminal-state routing

`polish` classifies architecture candidates through its Finding Router
(`ready-for-agent` → `implement`/`diagnosing-bugs`; `ready-for-human` → stop;
`wontfix` → explain). At the controller level, any `ready-for-human` blocker —
from `working-on-issue`, the actionability judgment, the build, `polish`,
or `ready-pr` — stops the pipeline in the `human-blocked` terminal state. There
is no `needs-info` state; insufficient information maps to `ready-for-human`.
A proved target-owned, non-required local failure does not enter this route;
continue until current-head required checks and the other exit gates are known.

## Final Report

### Reporting Guidance

Progress updates, resumable checkpoints, and final handoffs should report what
changed, whether the work is ready or blocked, and what the human should do
next. Keep verification evidence internally for decisions. Report verification
details when they failed, skipped, interrupted, changed readiness, explain a
blocker, identify residual risk, or create a human next action.

Translate child-skill output into outcome, readiness, blocker, and next-action
language. Progress updates name the current checkpoint and next action without
repeating check lists.

When the workflow stops, write for a human first, not as a process log. Lead with
the outcome, and surface only details that change what the reader needs to
understand or do.

Include:

- What changed, in 1-3 meaningful bullets.
- Where the work ended up: include the issue, PR, and branch links. Link them
  when URLs are available; name them plainly when not.
- Branch identity, called out only when it deviates: when the PR is on a
  retained non-issue-linked branch, name that branch and why the caller declared
  it immutable. When it is the normal issue-linked branch, a plain link is
  enough — do not editorialize.
- Issue-start update result only when it changed readiness, failed, skipped,
  explains a blocker, or creates a human next action.
- Issue self-assignment result only when it failed, changed readiness, or
  created a human next action. Stay silent on successful assignment.
- Terminal state: `goal-met` or `human-blocked`.
- Production-readiness case.
- Verification commands and results, summarized at the highest useful level.
  Collapse routine verification into one concise line when everything passed.
- Any target-owned local failure: name the broad command, failing contract,
  exact target SHA, ownership evidence, and current-head required-check result.
- Relevant tests added or updated.
- Child skill halt reasons, only when a halt changes what the human should do
  next.
- `polish` result: iterations run, architecture findings fixed, and candidate
  dispositions.
- PR review and check feedback status.
- Human-owned blockers, if any.
- `wontfix` explanations, if any.
- Residual risks or test gaps, only when they are concrete and relevant.
- PR URL and readiness status, when `ready-pr` runs.

Keep visible and specific:

- Failed checks, skipped checks, unresolved risks, or human action still needed.
- The exact command and blocker for any verification that did not run or did not
  pass.
- The scope of every passing-checks statement — local verification, the required
  PR contexts, or all visible check runs — plus any check history and non-`CLEAN`
  merge state `ready-pr` reported.
- Runtime-required token or budget reporting, but place token or budget
  reporting after the result so it does not dominate the message.

Remove or minimize:

- Long lists of every command run when all passed.
- Repeated statements that lint, typecheck, tests, hooks, and PR checks were
  each verified.
- Generic process narration such as "I inspected status, reviewed diffs, ran
  checks."
- Full PR check inventories when they are all green.
- Mergeability, review, or unrelated dirty-file status unless it changes what
  the human should do next.
- `ready-pr` readiness gates such as clean worktree, head SHA equality, merge
  state, check inventory, or review-thread count when they all passed; collapse
  them into the verification line unless a failed gate changes the human next
  action.

### Good final output

Example for one issue:

```md
Done: the issue is implemented on
[PR 197](https://github.com/patinaproject/skills/pull/197) on its issue-linked
branch.

Changed:
- `develop` final reports now lead with outcome and meaningful changes.
- Routine verification is collapsed unless something failed, skipped, or needs
  human attention.

Verified: routine checks passed.

Needs human attention: none before review.
```

### Bad final output

Avoid final output shaped like a process transcript:

```md
Implemented the issue.

Verification:
- develop workflow test passed.
- markdownlint passed.
- type-check passed.
- commit hook passed.
- PR check Test Gate passed.
- PR check code-review passed.
- PR is MERGEABLE and CLEAN.

Child skills invoked: working-on-issue, implement, polish, ready-pr.
No unrelated dirty files except local config. Goal marked complete.
```

Use the bad shape only as an anti-example; do not mirror its structure.
