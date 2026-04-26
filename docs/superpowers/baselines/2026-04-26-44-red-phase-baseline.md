# RED-phase baseline: superteam should auto-switch from the default branch to the issue branch during pre-flight [#44](https://github.com/patinaproject/superteam/issues/44)

This file captures verbatim today's `Team Lead` pre-flight behavior under the trigger conditions in the design doc (`docs/superpowers/specs/2026-04-26-44-superteam-should-auto-switch-from-the-default-branch-to-the-issue-branch-during-pre-flight-design.md`), before the auto-switch rule lands in `skills/superteam/pre-flight.md`. It is the GREEN-phase entry gate per AC-44-8 and the design's `## RED-phase baseline obligation`.

The harness is a dry-run pre-flight walkthrough against the committed `skills/superteam/pre-flight.md` at HEAD prior to Workstream 2. Inputs and observed outputs are recorded verbatim.

## Scenario A: clean tree

Inputs:

- Operator prompt: `/superteam #44`
- Current branch: `main` (repository default branch)
- `git status --porcelain`: empty
- No design or plan doc on either branch at the canonical paths.

Observed pre-flight execution against today's `pre-flight.md` `## Detection sequence`:

1. Resolve the active issue. Source 1 (explicit `#44` in operator prompt) fires. `active_issue=44`.
2. Inspect committed artifacts on the active branch. Active branch is still `main`. No design doc at `docs/superpowers/specs/...` for issue 44. No plan doc.
3. Inspect branch state. Current branch `main`, tracking `origin/main`, no divergence, clean tree.
4. Inspect PR state. No PR exists for `main` for issue 44.
5. Derive detected phase. No design, no plan, no PR -> `phase=brainstorm`.
6-9. Continue to prompt classification, execution-mode probe, loopback recovery, routing.

Outcome: `Team Lead` proceeds to committed-artifact inspection on the default branch and derives `phase=brainstorm` without switching branches. There is no rule in the current `## Detection sequence` that compels a branch switch when source 1 fires on the default branch. Halt conditions 1-4 do not match. The run advances into `brainstorm` routing and would dispatch `Brainstormer` to author `docs/superpowers/specs/2026-04-26-44-...-design.md` on the default branch.

## Scenario B: dirty tree

Inputs:

- Operator prompt: `/superteam #44`
- Current branch: `main`
- `git status --porcelain`: non-empty (e.g. an unstaged edit to `README.md`)
- No design or plan doc on either branch.

Observed pre-flight execution against today's `pre-flight.md`:

1. Resolve the active issue. Source 1 fires. `active_issue=44`.
2. Inspect committed artifacts on the active branch. Same as Scenario A.
3. Inspect branch state. Records uncommitted state for completeness, but per the existing rule "do NOT use uncommitted state as the phase signal". Dirty tree is not a phase signal.
4-5. Same as Scenario A. `phase=brainstorm`.

Outcome: today's pre-flight neither halts nor switches. Halt conditions 1-4 do not include "dirty working tree". The run advances into `brainstorm` routing on the default branch with a dirty tree, which downstream will either be picked up by `Brainstormer`'s edits or stomped by a later checkout.

## Captured rationalizations

The following verbatim rationalizations are produced by today's pre-flight when asked why it did not switch from `main` to `44-<kebab-title>`:

1. "The operator is on `main` on purpose; they clearly meant to start work here."
2. "No rule in `## Detection sequence` says to switch branches; pre-flight only inspects state."
3. "Skipping the switch is faster; the operator (or `Finisher`) will branch later."
4. "There's no plan doc on this branch yet, so we're already in `phase=brainstorm`; nothing breaks if we keep going."
5. "If the working tree is dirty I can just stash and continue; the rule about dirty trees is in `github-flows`, not in `superteam`."
6. "Rebase conflicts are easy; auto-aborting and retrying is fine."
7. "I can write the auto-switch logic inline so we don't depend on `github-flows`."

## Targets the new rule must close

Each captured rationalization above maps to an acceptance criterion in the design doc and to a planned `## Rationalization table` row in `skills/superteam/SKILL.md` (Workstream 3):

| Rationalization | AC | Planned rationalization-table row |
|---|---|---|
| 1. "Operator is on `main` on purpose." | AC-44-1 | "The operator is on the default branch on purpose; they clearly meant to start work here." |
| 2. "No rule says to switch." | AC-44-1 | (closed by the new `## Auto-switch to issue branch` section in `pre-flight.md`) |
| 3. "Skipping is faster; branch later." | AC-44-1 | "Skipping the auto-switch saves a step; we can branch later." |
| 4. "Already in `brainstorm`; keep going." | AC-44-1 | "The operator is on the default branch on purpose..." (phase-derivation closure) |
| 5. "Stash and continue on dirty tree." | AC-44-2 | "Dirty working tree? I can stash and continue." |
| 6. "Rebase conflicts -- abort and retry." | AC-44-5 | "Rebase conflict on the existing issue branch is fine; I'll abort and try again." |
| 7. "Inline the kebab/checkout/rebase logic." | AC-44-6 | "We can re-implement the kebab + checkout + rebase logic inside `superteam` so we don't depend on `github-flows`." |

The GREEN-phase verification (Workstream 4) re-runs Scenarios A and B and the AC-44-3 / AC-44-4 / AC-44-5 scenarios against the updated `pre-flight.md`, and appends results below.

## GREEN-phase verification

Walked AC-44-1 ... AC-44-8 against the updated `skills/superteam/pre-flight.md` (commit `c4a712b`) and `skills/superteam/SKILL.md` (commit `a175ea5`). Each AC below has a one-line evidence pointer to the file + line where the requirement is realized.

### AC-44-1: clean tree on default branch with `#44` -> auto-switch fires

- Re-walk of Scenario A: source 1 fires (active_issue=44). Step 2 (`Auto-switch to issue branch`) fires because trigger conditions hold (source 1 + current branch == default). `/github-flows:new-branch` runs against `44`, switching to `44-<kebab-title>`. Step 3 (committed-artifact inspection) then runs on the new branch.
- Evidence: `skills/superteam/pre-flight.md:12` (renumbered detection step 2) + `skills/superteam/pre-flight.md:30-38` (`## Auto-switch to issue branch` with trigger, algorithm, no-op, forbidden clauses).

### AC-44-2: dirty tree on default branch -> halt verbatim

- Re-walk of Scenario B: trigger fires; `/github-flows:new-branch` Step 3 refusal on dirty tree. `superteam` maps the refusal to halt 5.
- Evidence: `skills/superteam/pre-flight.md:48` -- verbatim `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch`.

### AC-44-3: already on `<n>-<slug>` matching the issue -> no switch

- Walk: source 2 (branch name `44-<slug>`) supplies the active issue. Source 1 did NOT fire (or even if `#44` is in prompt, current branch is not the default branch). The trigger requires source 1 AND default branch; both must hold, so this no-ops on either failure. The `## Auto-switch to issue branch` `No-op` clause covers both cases explicitly.
- Evidence: `skills/superteam/pre-flight.md:36` (`No-op on <n>-<slug> matching the issue, or sources 2/3.`).

### AC-44-4: `gh repo view` failure -> halt verbatim

- Walk: trigger evaluation requires `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`. Non-zero or empty maps to halt 6.
- Evidence: `skills/superteam/pre-flight.md:49` -- verbatim `superteam halted at Team Lead: default-branch lookup failed; cannot determine whether auto-switch is required`.

### AC-44-5: rebase conflict on existing issue branch -> halt verbatim

- Walk: `/github-flows:new-branch` Step 5 surfaces rebase conflict. `superteam` maps to halt 7. The `Forbidden:` clause prohibits `git rebase --abort`. Halt 7 itself reiterates `do NOT run git rebase --abort`.
- Evidence: `skills/superteam/pre-flight.md:38` (forbidden auto-abort) and `skills/superteam/pre-flight.md:50` -- verbatim `superteam halted at Team Lead: rebase conflict on existing issue branch; resolve manually before re-running superteam` plus the `(do NOT run git rebase --abort)` reminder.

### AC-44-6: design + plan + skill cite `/github-flows:new-branch` and do NOT inline algorithm

- Walked the new section: cites `/github-flows:new-branch` (`patinaproject/github-flows`, `skills/new-branch/workflow.md`) as authoritative; explicit `Do NOT inline kebab, default-branch, dirty-tree, fetch, checkout, or rebase logic.`; `Skip its Step 6 (lockfile install).` Confirmed grep: zero kebab-casing pseudocode, zero `git checkout`, zero `git rebase` invocation in the new section.
- Evidence: `skills/superteam/pre-flight.md:34` (algorithm reference) + `skills/superteam/SKILL.md` rationalization row "We can re-implement the kebab + checkout + rebase logic inside superteam..." + design `## Algorithm` and `## Out of scope`.

### AC-44-7: 180-word / 1,400-char budget

- Concatenated content measured: new step 2 (detection sequence), `## Auto-switch to issue branch` section, `## Active-issue resolution` cross-ref line, four new halt entries (5-8). Result: **175 words, 1,281 characters**. Both within the 180-word / 1,400-char budget.
- Evidence: `wc -w -m /tmp/budget-44.md` -> `175 1281`.

### AC-44-8: RED-phase baseline precedes `pre-flight.md` edit

- `git log --oneline`: `2950fd7 test: #44 capture RED-phase baseline...` precedes `c4a712b feat: #44 auto-switch to issue branch...` precedes `a175ea5 docs: #44 add auto-switch rationalizations and red flags`.
- Evidence: commit ordering above; ancestry `2950fd7 < c4a712b`.

## Halt-condition non-collision check (existing halts 1-4)

Re-walked the four pre-existing halt conditions against the updated `## Halt conditions`:

1. plan-implied phase without design doc on branch -> independent of auto-switch trigger; still fires on the active branch after auto-switch resolves.
2. `phase=finish` without PR on origin -> independent; PR-state inspection still runs in step 5.
3. multiple candidate issues unreconciled -> takes precedence over auto-switch (auto-switch's `Mismatched <n> fires halt 3` explicitly defers).
4. committed artifacts vs PR state mismatch -> independent; runs after auto-switch.

Halts 5-8 are scoped to the auto-switch step and do not shadow halts 1-4. No collision.

## Tooling smoke checks

- `pnpm lint:md`: exit 0 (output: `Summary: 0 error(s)`).
- `pnpm exec commitlint --edit /tmp/msg-44.txt` (`feat: #44 auto-switch to issue branch in superteam pre-flight`): exit 0.

## GREEN summary

All ACs (AC-44-1 ... AC-44-8) verified against committed state on this branch. Budget: 175/180 words, 1,281/1,400 chars. RED baseline preserved verbatim above for traceability.
