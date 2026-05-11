# Plan: Superteam: define loopback-trailers behavior when one commit carries both originating and resolved trailers [#41](https://github.com/patinaproject/superteam/issues/41)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the loopback-trailers precedence rule explicit for combined commits (same-class evidence and different-class follow-on), document the corollary that follow-on loopbacks require a separate later commit, and add pressure-test coverage for the different-class follow-on case.

**Architecture:** Documentation-only change across three Markdown surfaces. The recovery algorithm stays pure `git log` with no new tooling, sidecar files, or parsers; only wording is expanded.

**Tech Stack:** Markdown (`markdownlint-cli2` via `pnpm lint:md`); Husky pre-commit hooks.

---

## Context

The approved design at `docs/superpowers/specs/2026-04-26-41-superteam-define-loopback-trailers-behavior-when-one-commit-carries-both-originating-and-resolved-trailers-design.md` is authoritative. This plan turns that design into ordered, reviewable edits across `skills/superteam/loopback-trailers.md`, `skills/superteam/pre-flight.md`, and `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`.

## File Structure

Files modified by this plan:

- `skills/superteam/loopback-trailers.md` — expand precedence paragraph, add corollary, add different-class worked example, restate recovery step 4 (no algorithmic change).
- `skills/superteam/pre-flight.md` — confirm the `## Loopback-class recovery` reference still resolves; tweak wording only if reference fidelity demands it (no behavioral change).
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md` — extend or sibling the existing `Resolving loopback commit uses unambiguous trailer semantics` scenario to cover the different-class follow-on case.

No other files are in scope.

## Workstreams

### Workstream A — Loopback-trailers skill (T1, T2, T3, T4)

Edits to `skills/superteam/loopback-trailers.md` cluster together because they all turn the implicit precedence rule into an explicit, reader-self-sufficient one. Group them in a single commit so reviewers see the new wording alongside the new worked example and the restated step 4.

#### T1 — Expand the precedence paragraph

**File:**

- Modify: `skills/superteam/loopback-trailers.md` (current precedence paragraph at lines 22-25, in `## When to emit`)

Replace the existing two-sentence precedence paragraph with an expanded version that:

1. States the unified rule explicitly: on any single commit, `Loopback: resolved` wins, and every other `Loopback:` trailer on the same commit — regardless of class, and regardless of whether it matches the class being resolved — is treated as evidence of what was resolved and MUST NOT open or reopen any loopback.
2. Names the two subcases the rule covers:
   - **Same-class evidence**: e.g. `Loopback: plan-level` + `Loopback: resolved` on one commit closes a plan-level loopback; the class trailer documents what was resolved.
   - **Different-class follow-on**: e.g. `Loopback: plan-level` + `Loopback: implementation-level` + `Loopback: resolved` on one commit closes the active plan-level loopback; the `implementation-level` trailer is evidence only and does NOT open a new implementation-level loopback.

The wording must let a reader correctly classify a class-A + class-B + `resolved` commit without consulting any other file (AC-41-1).

#### T2 — Add the corollary

**File:**

- Modify: `skills/superteam/loopback-trailers.md` (immediately after the expanded precedence paragraph)

Add a short corollary stating: opening a follow-on loopback after resolving one requires a separate later commit. Concretely, when an author wants to resolve loopback A and immediately open loopback B, the workflow MUST produce two commits — the resolving commit carrying `Loopback: resolved` (optionally with class-A evidence), then a later commit carrying `Loopback: <class-B>` as the originating trailer for B.

Frame the corollary as a direct consequence of the precedence rule, not a separate constraint, matching the design doc's framing.

#### T3 — Add a different-class follow-on worked example

**File:**

- Modify: `skills/superteam/loopback-trailers.md` (`## Worked examples` section, after the existing "Resolution commit with optional class evidence" example at lines 52-59)

Add a new worked example under `## Worked examples` titled to reflect the different-class follow-on case. The example MUST show two separate commits:

1. The resolving commit carrying `Loopback: plan-level` + `Loopback: resolved` (resolves the active plan-level loopback; the class trailer is evidence only).
2. A later commit carrying `Loopback: implementation-level` as the originating trailer that actually opens the follow-on implementation-level loopback.

Both commit blocks must use the same `text` fenced format as the existing examples and use realistic conventional-commit subjects with an issue tag (e.g. `#41`). The example MUST make clear that combining the two intents into a single commit would be silently swallowed by the precedence rule (AC-41-2).

#### T4 — Restate recovery step 4

**File:**

- Modify: `skills/superteam/loopback-trailers.md` (`## Recovery algorithm`, step 4 at line 74-75)

Reword step 4 so it explicitly covers the different-class follow-on case rather than appearing to apply only to same-class evidence. The algorithmic behavior is unchanged: for any commit containing `Loopback: resolved`, `resolved` wins for that commit regardless of how many other `Loopback:` trailers (of any class) are present on the same commit; no other trailer on that commit opens or reopens a loopback.

Constraints:

- Do NOT add a new step.
- Do NOT introduce a sidecar file, parser, or any tooling beyond `git log`'s built-in trailer extraction.
- Keep the surrounding `git log --pretty=format:...` invocation in step 3 unchanged.
- Preserve the closing line "The algorithm is intentionally pure `git log` ..." after the algorithm block.

This satisfies AC-41-3's first checkbox.

### Workstream B — Pre-flight cross-reference fidelity (T5)

#### T5 — Confirm the pre-flight reference still resolves

**File:**

- Inspect (and modify only if needed): `skills/superteam/pre-flight.md` (`## Loopback-class recovery` at lines 67-69)

After the Workstream A edits land in the working tree, re-read `skills/superteam/pre-flight.md`'s `## Loopback-class recovery` section and confirm the reference `loopback-trailers.md` `## Recovery algorithm` still resolves to a real heading in the updated `skills/superteam/loopback-trailers.md`. If T4's rewording leaves the `## Recovery algorithm` heading unchanged (expected outcome), no edit is required and this task is a no-op confirmation. If the heading text has shifted, update the reference in `pre-flight.md` to match exactly.

This satisfies AC-41-3's second checkbox. Per the canonical pressure-test scenario "Non-artifact-producing stages are not forced into meaningless commits", do not create a commit if no edits are needed; record the no-op outcome in the verification notes instead.

### Workstream C — Pressure-test coverage (T6)

#### T6 — Cover the different-class follow-on in the pressure-test contract

**File:**

- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md` (existing scenario `## Resolving loopback commit uses unambiguous trailer semantics` at lines 355-359)

The implementer chooses one of two equally valid shapes (writing-clarity call):

- **Option A — extend in place**: expand the existing `Resolving loopback commit uses unambiguous trailer semantics` scenario so its starting condition, required behavior, and rule-surface bullets cover both the same-class evidence case and the different-class follow-on case.
- **Option B — add a sibling scenario**: keep the existing scenario as-is and add a new sibling scenario immediately after it (e.g. titled `## Combined-commit follow-on loopback requires a separate commit`).

Whichever shape is chosen, the scenario MUST exercise all three of the following in one place:

1. A combined commit carrying `Loopback: <class-A>` + `Loopback: <class-B>` + `Loopback: resolved` resolves the active loopback (no class-B loopback is opened from the same commit).
2. Recovery treats the combined commit as resolved, with no active loopback assuming no later originating trailers exist.
3. To open a follow-on loopback of class-B, a separate later commit carrying `Loopback: <class-B>` as the originating trailer is required.

Use the existing scenario blocks' three-bullet shape (`Starting condition`, `Required halt or reroute behavior`, `Rule surface`) so it matches the file's prevailing voice. This satisfies AC-41-4.

### Workstream D — Verification and commit (T7, T8)

#### T7 — Run repo lint

**File:** N/A (verification only).

Run `pnpm lint:md` from the worktree root. Expected: clean exit. If markdownlint flags any rule (e.g. line length, fenced block language, heading spacing) on the touched files, fix in place and re-run until clean. Do not bypass the husky pre-commit hook.

#### T8 — Manual recovery walkthrough on the updated skill

**File:** N/A (verification only — reading the updated skill).

Fabricate a combined-commit scenario and confirm the updated `skills/superteam/loopback-trailers.md` answers it correctly without consulting any other file. Use this exact fabricated case:

- The branch range contains, oldest to newest:
  1. A commit `feat: #41 begin work` with no `Loopback:` trailer.
  2. A commit `docs: #41 spin out plan-level loopback` carrying `Loopback: plan-level`.
  3. A commit `docs: #41 close plan-level loopback and note follow-on`carrying both `Loopback: plan-level` and `Loopback: implementation-level` and `Loopback: resolved`.
- Apply the recovery algorithm in `## Recovery algorithm` to this fabricated range.

Expected outcome from a fresh reader applying only the updated skill text:

- Step 4 treats commit 3 as `resolved`. The `implementation-level` trailer on commit 3 is evidence only and does NOT open an implementation-level loopback.
- Step 5 sets R to the index of commit 3.
- Steps 6-7 find no commits with index > R, so no active loopback is in flight.
- A reader who wants to open a follow-on implementation-level loopback after this state must add a separate later commit carrying `Loopback: implementation-level`, per the corollary.

Record this walkthrough's pass/fail outcome in the Planner done report. If any step is ambiguous when read against the updated text alone, loop back to the relevant Workstream A task before commit.

#### T9 — Commit the documentation changes

**File:** N/A (git commit step).

Stage the touched files explicitly (avoid `git add -A` per AGENTS.md guidance):

```bash
git add skills/superteam/loopback-trailers.md \
        docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Stage `skills/superteam/pre-flight.md` only if T5 produced an edit. Do not stage the plan artifact in this commit (the plan is committed separately as the Planner handoff artifact).

Commit with conventional-commit format (no scope, ≤72 chars, required `#41` tag), for example:

```bash
git commit -m "docs: #41 make loopback combined-commit precedence explicit"
```

The husky `commit-msg` hook validates the message; the `pre-commit` hook runs `lint-staged` (markdownlint). If either fails, fix the issue and create a NEW commit (do not amend, do not use `--no-verify`).

## Verification

- **Lint**: `pnpm lint:md` exits clean against the worktree after the edits land. Husky's `pre-commit` runs the same lint on staged files.
- **Manual recovery walkthrough**: T8 above. A reader applying only the updated `skills/superteam/loopback-trailers.md` to the fabricated combined-commit scenario must arrive at "no active loopback; opening a follow-on requires a separate later commit." Document the walkthrough outcome explicitly.
- **AC self-check** (for the Reviewer's later pressure-test pass, not for the Planner): AC-41-1 and AC-41-2 verify by reading the updated worked-examples and precedence section; AC-41-3 verifies that recovery step 4 is reworded but the algorithm shape is unchanged and the `pre-flight.md` reference still resolves; AC-41-4 verifies the pressure-test scenario contains the three required assertions.

## Blockers

None.
