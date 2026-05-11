# Design: Superteam: define loopback-trailers behavior when one commit carries both originating and resolved trailers [#41](https://github.com/patinaproject/superteam/issues/41)

## Context

The loopback-trailers convention from #39 / #40 makes the active loopback class recoverable from `git log` across sessions using `Loopback: spec-level | plan-level | implementation-level | resolved` trailers. The recovery algorithm in `skills/superteam/loopback-trailers.md` already includes a precedence rule for the combined-commit case where the class trailer matches the loopback being resolved (lines 22-25 and recovery step 4):

> If one commit contains both a loopback class trailer and `Loopback: resolved`, `resolved` wins for that commit. The class trailer is evidence of what was resolved and MUST NOT reopen the loopback.

The existing pressure test `Resolving loopback commit uses unambiguous trailer semantics` exercises that case as same-class evidence.

The gap, as raised explicitly in the issue body, is the **different-class follow-on** scenario: a single commit that resolves a prior plan-level loopback while simultaneously trying to open a new implementation-level one as a follow-on. The current wording answers this case only by implication (`resolved` wins, the class trailer never reopens — therefore the new follow-on cannot be opened on the same commit). That implicit answer is correct but not explicit, and it is not exercised by any pressure-test walkthrough. Two `/superteam` invocations on different sessions could plausibly read the implicit rule differently.

The intended outcome is a one-pass documentation change that (a) makes the precedence rule explicit for both same-class evidence and different-class follow-on cases, (b) states the corollary that opening a follow-on loopback requires a separate later commit, and (c) closes the pressure-test coverage gap. No new tooling, no sidecar files, and no change to the pure-`git log` recovery algorithm.

## Decision

Adopt one explicit precedence rule that covers every combined-commit case:

**On any single commit, `Loopback: resolved` wins. Every other `Loopback:` trailer on the same commit — regardless of class, and regardless of whether it matches the class being resolved — is treated as evidence of what was resolved and MUST NOT open or reopen any loopback.**

This rule applies uniformly to both subcases the issue raised:

1. **Same-class evidence** (already covered): `Loopback: plan-level` + `Loopback: resolved` on one commit closes a plan-level loopback. The class trailer documents which class was resolved.
2. **Different-class follow-on** (newly explicit): `Loopback: plan-level` + `Loopback: implementation-level` + `Loopback: resolved` on one commit closes the active plan-level loopback. The `implementation-level` trailer is treated as evidence only and does NOT open a new implementation-level loopback. To open a follow-on implementation-level loopback, the originating trailer MUST appear on a separate later commit.

## Corollary

Opening a follow-on loopback after resolving one requires a separate later commit. Concretely: when an author wants to resolve loopback A and immediately open loopback B, the workflow MUST produce two commits — the resolving commit carrying `Loopback: resolved` (optionally with class-A evidence), then a later commit carrying `Loopback: <class-B>` as the originating trailer for B.

This corollary is a direct consequence of the precedence rule, not a separate constraint. It is called out explicitly because authors will otherwise be tempted to combine the two intents into one commit, which the precedence rule silently swallows.

## Surfaces to update

The implementation plan must change exactly the following surfaces. No other files are in scope.

1. **`skills/superteam/loopback-trailers.md`**
   - Expand the existing precedence paragraph (currently lines 22-25) so the rule explicitly names both subcases (same-class evidence and different-class follow-on) and states that any non-`resolved` `Loopback:` trailer on a resolving commit is evidence only.
   - Add the corollary: opening a follow-on loopback requires a separate later commit.
   - Add a worked example for the different-class follow-on case showing the two-commit shape (resolving commit carrying `resolved` + class-A evidence, then a later commit carrying class-B as the originating trailer).
   - Restate recovery step 4 so it explicitly covers the different-class case rather than only same-class evidence. The algorithm itself does not change — `resolved` still wins for any commit that contains it — but the wording must match the expanded rule above so a reader cannot conclude that a different-class trailer reopens or opens a loopback on a resolving commit.

2. **`skills/superteam/pre-flight.md`**
   - The `## Loopback-class recovery` section already references the recovery algorithm by location and does not restate it. Confirm the reference still resolves correctly; no behavioral change is required here unless the section heading or anchor in `loopback-trailers.md` changes. If reference fidelity requires a wording tweak, make it; otherwise leave the section alone.

3. **`docs/superpowers/pressure-tests/superteam-orchestration-contract.md`**
   - Either expand the existing `Resolving loopback commit uses unambiguous trailer semantics` scenario to cover the different-class follow-on case, or add a new sibling scenario (e.g. `Combined-commit follow-on loopback requires a separate commit`). The choice is a writing-clarity call for the implementer; both shapes satisfy the contract. Whichever shape is chosen, the scenario MUST exercise: (i) a commit carrying class-A + class-B + `resolved`, (ii) the assertion that recovery treats this as resolved with no active loopback (assuming no later originating trailers), and (iii) the assertion that to open a follow-on of class-B, a separate later commit carrying `Loopback: <class-B>` is required.

The recovery algorithm remains pure `git log` with no new tooling, no sidecar files, and no parser beyond `git log`'s built-in trailer extraction. The trailer grammar is unchanged.

## Acceptance criteria

### AC-41-1

`skills/superteam/loopback-trailers.md` states the precedence rule explicitly for both same-class evidence and different-class follow-on cases on a single commit, and documents that any non-`resolved` `Loopback:` trailer on a resolving commit is evidence only and never opens or reopens a loopback.

- [ ] Read the updated `skills/superteam/loopback-trailers.md` and confirm a reader could correctly classify a commit carrying class-A + class-B + `resolved` without consulting any other file.

### AC-41-2

`skills/superteam/loopback-trailers.md` states the corollary that opening a follow-on loopback after resolving one requires a separate later commit, and includes a worked example showing the two-commit shape for that case.

- [ ] Read the updated worked-examples section and confirm both the resolving commit and the follow-on originating commit are shown as separate commits, with their trailers exactly as the rule requires.

### AC-41-3

The recovery algorithm in `skills/superteam/loopback-trailers.md` (step 4 in particular) is worded so that the different-class follow-on case is unambiguously covered by the same precedence rule used for same-class evidence, without changing the algorithm's pure-`git log` shape.

- [ ] Confirm step 4 still says `resolved` wins for any commit containing it, and that no new step, sidecar, or parser is introduced.
- [ ] Confirm `skills/superteam/pre-flight.md`'s `## Loopback-class recovery` reference still resolves to the updated section.

### AC-41-4

`docs/superpowers/pressure-tests/superteam-orchestration-contract.md` exercises the different-class follow-on case — either by expanding the existing `Resolving loopback commit uses unambiguous trailer semantics` scenario or by adding a sibling scenario — covering: combined commit with class-A + class-B + `resolved` resolves the active loopback, no new loopback is opened from the same commit, and a later separate commit carrying `Loopback: <class-B>` is required to open a follow-on.

- [ ] Read the pressure-test surface and confirm the three required assertions above are present in one scenario.

## Open questions / concerns

None. The precedence rule and its corollary are forced by the current `resolved`-wins semantics; this design only makes them explicit and adds the missing pressure-test coverage. No new tooling, sidecar artifacts, or trailer-grammar changes are introduced, and the recovery algorithm remains pure `git log`.

Remaining concerns: None
