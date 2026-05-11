# Design: Recommend runtime monitors or heartbeats for Finisher follow-through when available [#28](https://github.com/patinaproject/superteam/issues/28)

## Summary

Refine the `superteam` workflow guidance so `Finisher` follow-through stays behaviorally portable while still taking advantage of runtime support when it exists. The canonical contract should continue to define only the required behavior: `Finisher` remains responsible for publish-state follow-through until the latest pushed PR head is stable enough to hand off cleanly or an explicit blocker is reported.

Within that portable contract, the workflow should recommend using durable runtime follow-up features such as thread heartbeats, monitors, or equivalent host-provided wakeups when they are available and the latest pushed head is waiting on external state such as CI checks or review activity. These runtime features are execution aids for maintaining the existing `Finisher` loop, not a replacement for the loop itself. If a runtime does not provide those features, the workflow must still keep the same ownership and shutdown rules rather than treating the missing feature as permission to stop early.

## Goals

- Preserve the canonical `Finisher` contract as behavioral and portable across runtimes
- Recommend durable runtime follow-up mechanisms when available to support `Finisher` publish-state monitoring
- Keep runtime-specific follow-up recommendations clearly subordinate to the portable contract
- Prevent missing runtime monitor features from being interpreted as a valid reason to stop the `Finisher` loop early
- Clarify where this recommendation belongs so future runtimes can adopt it without rewriting the core contract

## Non-Goals

- Replacing the existing `Finisher` state machine or shutdown rules added for issue `#26`
- Requiring one specific automation primitive, polling interval, or host product feature
- Expanding the workflow into a runtime-specific scheduler design
- Weakening the expectation that every `superteam` run publishes a PR and continues through publish-state follow-through
- Moving ownership of external feedback or pending checks away from `Finisher`

## Approaches Considered

### Recommended: add a portable recommendation layer above the existing Finisher contract

Keep the required workflow contract behavioral and runtime-agnostic, then add explicit guidance that `Finisher` should prefer durable runtime follow-up features when the host supports them. This preserves portability while still nudging implementations toward better follow-through in capable runtimes.

### Alternative: encode heartbeat or monitor usage directly into the Finisher contract

This would overfit the contract to runtimes that expose those features and would make the core workflow less portable. It would also turn an execution aid into a mandatory dependency.

### Alternative: leave runtime follow-through entirely implicit

This preserves portability, but it misses the issue goal. Runtimes that can keep following up automatically would receive no guidance to do so, and operators could continue to stop after a status snapshot even when the runtime could have kept the `Finisher` loop alive.

## Design

### The core Finisher contract remains behavioral

The canonical skill should continue to describe what `Finisher` must do, not which host mechanism it must use. The contract remains:

- publish the branch and ensure the PR exists
- keep ownership of publish-state follow-through on the latest pushed head
- remain in `triage`, `monitoring`, `ready`, or `blocked` based on current publish-state
- continue the `Finisher` loop until the latest head is stable enough for clean handoff or an explicit blocker is reported
- re-evaluate after every push and after new external feedback or status changes

This issue should not re-open the behavioral decisions already made for pending checks, shutdown readiness, or review ownership. The new change is guidance about how to maintain that loop more reliably when the runtime can wake the workflow back up on its own.

### Runtime monitors or heartbeats are an execution aid recommendation

The skill should add a recommendation in the runtime-aware guidance surfaces that says, in effect:

- when the host runtime supports background-agent execution for delegated teammate work, prefer running teammate work through that capability
- when the runtime offers durable follow-up features such as thread heartbeats, monitors, or equivalent wakeups, prefer using them for `Finisher` follow-through while required checks or external review state remain pending
- keep both recommendations as host-capability preferences rather than correctness dependencies
- use those features to resume the existing `Finisher` ownership loop on the latest pushed head rather than as a separate workflow with different shutdown rules
- keep the recommendation feature-agnostic so the wording remains portable across runtimes that use different names for similar capabilities

This recommendation belongs in a place that already discusses runtime-awareness, such as pre-flight guidance and `Finisher`-owned follow-through guidance, rather than inside acceptance criteria or shutdown logic alone. The contract should remain authoritative; runtime features simply help the runtime live up to it.

### Missing runtime support is never a success condition

The workflow must explicitly reject the rationalization that "this runtime cannot monitor in the background, so stopping now is acceptable." If durable follow-up features are unavailable, disabled, or unsuitable in the current environment, `Finisher` still owns the same pending publish-state work.

In that case the workflow should:

- continue allowing teammate work to run through the normal portable workflow even when background-agent execution is unavailable
- continue using the existing `monitoring` and `blocked` semantics from the portable contract
- avoid treating feature absence as a soft success or completion boundary
- surface an explicit blocker when the workflow cannot safely continue follow-through in the current run
- preserve the difference between "the runtime lacks a convenience feature" and "the publish-state is actually stable"

This keeps issue `#28` aligned with issue `#26`: runtime aids may improve follow-through, but they do not define readiness.

### Finisher should prefer durable follow-through when pending state is external

The recommendation should be especially explicit for situations where `Finisher` is waiting on external systems rather than immediate branch-side fixes. Examples include:

- required checks still running on the latest pushed head
- external review threads or bot findings that may appear after publication
- manual approvals or other repository signals that are expected to change later

When a runtime can register a heartbeat, monitor, or equivalent wakeup, `Finisher` should prefer that durable follow-through path instead of relying only on the operator to remember to ask again later. The recommendation is strongest in these external-wait states because the workflow already knows the next meaningful step is to re-check publish-state after something outside the branch changes.

### The recommendation must not fork the ownership model

Runtime monitors or heartbeats should not create a second, competing workflow. They should wake the same thread or resume the same `Finisher` responsibility so that:

- the latest pushed head remains the evaluation target
- branch and PR state are re-checked using the same shutdown rules
- external feedback still stays with `Finisher`
- requirement-bearing deltas still route through `Brainstormer`, then `Planner`, then `Executor`

This matters because issue `#28` is about follow-through quality, not about inventing a new automation architecture. The durable wakeup should keep the workflow in the canonical loop rather than bypassing it.

### Brainstormer approval packets must always report `concerns[]`

This issue should also tighten the approval-packet reporting contract in a narrow way so the design and later workflow guidance stay consistent about approval visibility. When `Brainstormer` requests approval, the packet should always include `concerns[]` as a required field.

That requirement should be explicit in the design:

- if approval-relevant concerns remain, report them in `concerns[]`
- if no approval-relevant concerns remain, still report `concerns[]` with an explicit empty result
- when rendering the operator-facing approval packet for the no-concerns case, present it exactly as `Remaining concerns: None` instead of displaying an empty array
- do not omit the field based on the assumption that "no concerns" can be inferred from silence

This is a reporting-discipline refinement, not a broader change to approval gates or teammate ownership.

### Scope of repository changes

The implementation should stay narrow and update only the workflow-contract surfaces that directly guide this behavior:

- `skills/superteam/SKILL.md`
  - prefer background-agent execution for teammate work when the host runtime supports it, while keeping teammate contracts portable when it does not
  - add portable recommendation language for durable runtime follow-up features in the runtime-aware guidance and `Finisher` sections
  - explicitly state that missing runtime support does not permit early stop or completion-style handoff
- `skills/superteam/agent-spawn-template.md`
  - mirror the same background-agent and follow-through recommendations in delegated prompts so runtime-capable hosts are nudged to use them without making them mandatory
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - add scenarios that distinguish "background-agent or runtime follow-up recommended and available" from "those capabilities unavailable, but the workflow still must not stop early"

Other files should remain unchanged unless they already contain wording that would directly conflict with this recommendation.

## Testing And Verification

- verify the canonical skill keeps the `Finisher` contract behavioral and portable rather than making heartbeat support a required dependency
- verify the canonical skill recommends background-agent execution for delegated teammate work when the host supports it without making that capability a correctness dependency
- verify the canonical skill recommends runtime monitors, heartbeats, or equivalent wakeups when the host supports them and pending external publish-state remains
- verify the delegated prompts mirror the same background-agent preference for runtime-capable hosts
- verify the delegated `Finisher` prompt mirrors that recommendation instead of leaving runtime-capable hosts unguided
- verify the canonical skill explicitly states that missing runtime monitor support does not permit an early stop or completion-style handoff
- verify the canonical skill explicitly allows the normal portable teammate workflow when background-agent support is unavailable
- verify the approval-packet contract requires `concerns[]` on every `Brainstormer` approval request, including an explicit empty result when no approval-relevant concerns exist
- verify operator-facing approval packets render the no-concerns case exactly as `Remaining concerns: None` while preserving the underlying explicit empty `concerns[]` result
- verify the pressure-test doc covers both runtime-capable and runtime-incapable follow-through scenarios
- verify the recommendation keeps the wakeup path inside the existing `Finisher` ownership loop rather than creating a separate ownership model

## Acceptance Criteria

- AC-28-1: Given the runtime supports durable follow-up features such as thread heartbeats, monitors, or equivalent wakeups, when `Finisher` is waiting on pending external publish-state, then the workflow recommends using those features for `Finisher` follow-through
- AC-28-2: Given the host runtime supports background-agent execution for teammate work, when the workflow delegates teammate responsibilities, then it recommends using that capability without making it a correctness dependency
- AC-28-3: Given the runtime does not support background-agent execution or durable follow-up features, when pending publish-state still exists, then the workflow keeps the same portable teammate and `Finisher` ownership rules and does not treat feature absence as permission to stop early
- AC-28-4: Given runtime follow-up features are used, when `Finisher` wakes back up, then it resumes the existing latest-head publish-state loop rather than a separate workflow with different routing or shutdown rules
- AC-28-5: Given `Brainstormer` requests approval, when approval-relevant concerns are present or absent, then the approval packet always reports `concerns[]`, uses an explicit empty result when none exist, and renders that no-concerns case to the operator exactly as `Remaining concerns: None`
