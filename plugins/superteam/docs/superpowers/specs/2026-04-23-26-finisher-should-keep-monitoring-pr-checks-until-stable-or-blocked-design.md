# Design: Finisher should keep monitoring PR checks until stable or blocked [#26](https://github.com/patinaproject/superteam/issues/26)

## Summary

Strengthen the `Finisher` publish-state contract so required checks in a pending state after the latest push are treated as active work, not as a reason to stop with a completion-style handoff. `Finisher` should keep ownership of the PR after immediate branch-side fixes are complete, continue monitoring the latest pushed head while required checks or other publish-state signals remain in flight, re-enter triage automatically if those checks later fail, and only hand off the PR as ready when the latest head is actually stable.

The design stays narrow. It does not introduce a runtime-specific background scheduler or redesign the full workflow. Instead, it makes pending required checks a first-class `Finisher` state, clarifies what later status changes must do to the workflow, and adds pressure-test coverage so repeated review and publish loops keep rerunning the right checks instead of assuming earlier green or pending snapshots still apply.

## Goals

- Prevent `Finisher` from presenting the run as complete while required checks on the latest pushed head are still pending
- Make pending required checks a first-class `Finisher` monitoring state rather than an implicit idle state
- Require `Finisher` to re-enter triage automatically when later check results fail on the latest pushed head
- Allow `Finisher` to hand off the PR as ready only after required checks later pass and no unresolved publish-state blockers remain
- Require an explicit blocker report when pending external systems remain and the run cannot continue monitoring safely
- Place pressure testing in the appropriate stages and rerun it after later changes to workflow-contract surfaces before publish
- Add a repository-level production-readiness gate for `skills/**/*.md` and workflow-contract changes so the repo does not ship those changes on unsupported confidence claims

## Non-Goals

- Building a runtime-specific background scheduler or automation system for waiting on checks
- Redesigning the canonical teammate roster or replacing the existing publish-state model from `#18`
- Changing unrelated PR body or issue-linking behavior
- Solving every possible CI flake or external-system failure mode beyond the `Finisher` contract for handling them
- Expanding the fix beyond the workflow-contract and pressure-test surfaces that directly control this behavior
- Requiring a literal `100% confidence` promise as the release gate for skill or workflow-contract changes

## Approaches Considered

### Recommended: explicit Finisher monitoring loop for pending checks

Treat pending required checks on the latest pushed head as an active `Finisher` state. `Finisher` keeps ownership, rechecks status until the head becomes stable or an explicit blocker is reached, and re-enters triage automatically if later results fail. This matches the issue goal without requiring new runtime machinery.

### Alternative: stop immediately with a blocker whenever checks are pending

This is better than a false success summary, but it still pushes the operator back into the loop even when the only missing work is ordinary check completion. It does not satisfy the desired "keep monitoring until stable or blocked" behavior.

### Alternative: rely on user re-prompts or out-of-band automation

This preserves the current failure mode. It turns `Finisher` monitoring into an optional human follow-up instead of a workflow responsibility, so it does not meet the issue requirements.

## Design

### Pending required checks become a first-class Finisher state

`Finisher` should treat publish-state as four explicit outcomes on the latest pushed head:

1. `triage`: branch-side or publish-side corrective action is immediately required
2. `monitoring`: no immediate branch-side fix is available, but required checks or other external publish-state signals are still pending
3. `ready`: the latest pushed head is stable enough for a clean handoff
4. `blocked`: the workflow cannot continue safely or cannot reach `ready` without explicit external intervention

The key change for this issue is `monitoring`. After the latest push, if immediate branch-side fixes are complete but required checks are still pending, `Finisher` must stay active in the same ownership loop instead of presenting the run as complete. A pending required check is not a success signal and not a silent idle state.

This state remains head-relative. Any new push invalidates earlier assumptions and restarts evaluation on the new latest head.

### Monitoring stays with Finisher until the head becomes ready or blocked

While the latest pushed head is in `monitoring`, `Finisher` should keep the run in publish-state follow-through and continue rechecking the active PR rather than asking the user to prompt it back into the loop.

During monitoring, `Finisher` should:

- keep reporting against the latest pushed head and active PR rather than older snapshots
- treat required checks still pending as active publish-state work, not as completion
- continue checking mergeability, unresolved review state, and other publish-state blockers that may resolve or appear while checks are running
- invalidate any earlier completion assumption when a new push lands
- avoid completion-style language until the head reaches `ready`

This should be documented as a portable workflow rule, not as a hard-coded polling interval. The contract should describe the behavior and completion boundary, while runtime-specific waiting mechanics remain an implementation detail.

### Later failing checks re-enter triage automatically

If required checks later fail while `Finisher` is monitoring the latest pushed head, the workflow should re-enter `triage` without requiring a user re-prompt.

That triage should:

- inspect enough evidence to identify the failing required checks on the latest head
- distinguish branch-caused failures from likely baseline or unrelated failures when possible
- keep clearly external, manual-approval, or indeterminate failures in `blocked`
- route corrective branch work back through the existing loopback path instead of letting `Finisher` absorb implementation ownership

When a failure requires a code or requirements change, the workflow should preserve the existing routing contract:

- requirement-bearing feedback returns to `Brainstormer`, then `Planner`, then `Executor`
- implementation-only corrections route through the normal implementation loop
- after a corrective push that changes skill or workflow-contract files, the appropriate pre-publish pressure tests must be rerun before `Finisher` resumes monitoring

This keeps later failures inside the workflow instead of turning them into a fresh human-started run.

### Passing checks allow ready handoff only after the whole latest head is clear

Required checks later passing is necessary but not sufficient for `ready`. `Finisher` may hand off the PR as ready only when the latest pushed head has all of the following:

- required checks in a terminal passing state
- no unresolved external review feedback that still blocks readiness on the latest head
- no mergeability or PR metadata blockers that still require `Finisher` action
- no newer push that made the evaluated state stale

This preserves the broader publish-state contract from `#18` while making the pending-check transition explicit for this issue. A check moving from pending to passing should move the workflow from `monitoring` to `ready` only if the rest of the latest-head sweep is also clean.

### Pending external systems must stop as an explicit blocker, not a completion summary

The workflow should not pretend that pending external systems are success. If the run stops while required checks, manual approvals, external CI services, or other publish-state signals remain pending on the latest pushed head, `Finisher` must report that pending state as an explicit blocker rather than using a completion-style summary.

For this issue, `blocked` should cover cases such as:

- required checks remain pending but the workflow cannot safely keep monitoring further in the current run
- a manual approval or external system action is still required
- the workflow cannot determine whether the latest head is truly ready
- an external service appears stuck or inaccessible

The blocker report should name the latest head context and the still-pending publish-state signal so the operator can see that the run stopped because the PR was not yet stable, not because the workflow finished successfully.

### AGENTS.md should add an evidence-based production-readiness gate

This issue can absorb a narrow repository-gate update in `AGENTS.md` because the new requirement is directly tied to the same failure pattern: the workflow should not let skill or workflow-contract changes move toward publish on vague assurances that they are "probably fine" or "confident enough" when the available evidence is still incomplete.

The added repository guidance should target `skills/**/*.md` and workflow-contract changes such as teammate contracts, prompt templates, pressure-test docs, and other behavior-steering docs. For those changes, the repo should require a production-readiness gate based on concrete evidence rather than unsupported confidence language.

That gate should be phrased as an evidence-based readiness rule, not as a literal `100% confidence` promise. A confidence promise is both weaker and less auditable:

- it invites performative certainty instead of verification evidence
- it is impossible to interpret consistently across operators and teammates
- it can be claimed even when required pressure tests, review loops, or publish-state checks are still missing

The repository rule should therefore require something closer to:

- no production-readiness claim for skill or workflow-contract changes unless the required pressure tests, review loops, and role-specific verification for the changed surface have actually run
- if evidence is incomplete, report the missing evidence or blocker explicitly instead of asserting readiness
- readiness claims for these changes must be tied to observed verification outcomes, not to an abstract confidence percentage

This keeps the issue coherent: `Finisher` should stay active until publish-state is stable or blocked, and the repository guidance should likewise prevent behavior-steering changes from shipping on unsupported certainty while the relevant verification state is still incomplete.

### Pressure tests belong in the workflow loops, not only at the end

This issue should be designed for repeated review and pressure-test loops rather than a single final walkthrough. The workflow-contract surfaces changed for this issue should be pressure-tested in the stages that own them:

- `Brainstormer` defines the required behavior and the scenarios that must be covered
- `Planner` turns those scenarios into explicit implementation and verification work, rather than deferring all pressure testing to the end
- `Reviewer` invokes `superpowers:writing-skills` when the changed scope includes `skills/**/*.md` or workflow-contract docs and runs the relevant pressure-test walkthrough before publish
- if later fixes change those same workflow-contract surfaces again, `Reviewer` reruns the relevant pressure tests before the next handoff back to `Finisher`
- `Finisher` reruns publish-state evaluation after every push and after later external status changes on the latest head
- when the changed scope includes skill or workflow-contract behavior, production-readiness claims must be backed by the rerun evidence rather than by unsupported confidence language

This issue therefore needs repo-local pressure tests that cover at least:

- required checks pending after the latest push with no immediate branch-side fix left
- a later required check failure while `Finisher` is monitoring
- a later required check pass that clears the latest head for ready handoff
- a run stopping while pending external systems still block readiness

### Scope of repository changes

The implementation should stay narrow and update only the surfaces that directly govern or validate this behavior:

- `skills/superteam/SKILL.md`
  - make pending required checks an explicit `Finisher` monitoring state
  - require automatic re-entry to triage on later failures
  - require explicit blocker reporting when pending external systems keep the run from reaching `ready`
- `skills/superteam/agent-spawn-template.md`
  - mirror the same monitoring, re-entry, and blocker rules in delegated prompts
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - add or refine scenarios for pending checks, later failure, later success, and pending external blockers
- `AGENTS.md`
  - add a repository production-readiness gate for `skills/**/*.md` and workflow-contract changes
  - require evidence-backed readiness language rather than unsupported confidence claims

Inspect other docs only if they currently say something that would materially undermine this behavior. Avoid broad wording cleanup outside the directly relevant workflow-contract surfaces.

## Testing And Verification

- inspect the canonical `Finisher` contract and confirm that required checks still pending on the latest pushed head keep the run in an active monitoring state rather than allowing completion
- verify the canonical skill forbids completion-style handoff while required checks are still pending
- verify the delegated `Finisher` prompt mirrors the same monitoring-state behavior
- verify the contract requires re-evaluation against the latest pushed head after every push
- verify later failing required checks route the workflow back into `Finisher` triage without requiring user re-prompting
- verify later passing required checks allow ready handoff only after the rest of the latest-head publish-state sweep is clear
- verify stopping with pending external systems produces an explicit blocker report instead of a completion-style summary
- verify the pressure-test doc covers pending checks, later failure, later success, and pending external blocker scenarios
- verify review guidance reruns the relevant pressure tests after later workflow-contract changes before publish
- verify `AGENTS.md` requires an evidence-based production-readiness gate for `skills/**/*.md` and workflow-contract changes
- verify the repo guidance forbids unsupported readiness claims based only on confidence language and instead requires concrete verification evidence or an explicit blocker

## Acceptance Criteria

- AC-26-1: Given a PR has been updated and all immediately actionable branch-side fixes are complete, when required checks are still pending, then `Finisher` stays active instead of presenting the run as complete
- AC-26-2: Given checks later fail on the latest pushed head, when `Finisher` is monitoring, then it re-enters triage instead of requiring the user to prompt it back into the loop
- AC-26-3: Given checks later pass and no unresolved review feedback remains, when `Finisher` is monitoring, then it may hand off the PR as ready
- AC-26-4: Given pending external systems remain after the latest push, when the run stops, then it reports that pending publish-state as an explicit blocker rather than a completion-style summary
- AC-26-5: Given a change touches `skills/**/*.md` or workflow-contract guidance, when the repo guidance describes production readiness, then it requires evidence-backed readiness criteria and explicit blocker reporting instead of unsupported confidence-only claims
