# Superteam Orchestration Contract Pressure Tests

Use these repo-local pressure tests to check whether the documented orchestration contract halts or reroutes at the right points. Keep the scenarios documentation-focused and portable across runtimes.

## Approval requested before the design artifact exists

- Starting condition: An approval request cites a design path, but the artifact exists nowhere at that reported location.
- Required halt or reroute behavior: Halt the approval request until the real artifact exists and can be reviewed at the cited path.
- Rule surface: The Team Lead approval request and brainstorm handoff should require an artifact exists check before plan-stage approval is requested.

## Approval packets missing artifact path, intent summary, or full requirement set

- Starting condition: The operator receives an approval packet without the exact artifact path, without a concise intent summary, or without the full requirement set under review.
- Required halt or reroute behavior: Halt approval and reissue the packet with all required fields present.
- Rule surface: The approval prompt or packet template should state path, intent summary, and full requirement set as mandatory fields.

## Oversized approval packets collapsed instead of split

- Starting condition: A large approval packet is condensed into a vague summary instead of being split into reviewable sections.
- Required halt or reroute behavior: Reroute to a split approval packet that preserves the full requirement set instead of allowing lossy collapse.
- Rule surface: The Team Lead approval guidance should instruct splitting oversized packets rather than collapsing them.

## Revised approval request repeats approved content instead of changed content only

- Starting condition: A revised approval request replays already approved content instead of only changed requirements and new deltas.
- Required halt or reroute behavior: Halt the revised approval request and resend it with only the changed content and changed requirements.
- Rule surface: The revision approval prompt should require delta-only resubmission after revisions.

## Approval request omits approval-relevant findings

- Starting condition: Brainstormer requests approval while real approval-relevant findings still exist, but the approval packet does not surface them in `adversarial_review_findings[]`.
- Required halt or reroute behavior: Halt approval and reissue the packet with the remaining approval-relevant findings included, unless the finding is severe enough to block approval entirely.
- Rule surface: The first-stage approval contract should require Brainstormer to surface real approval-relevant findings when present.

## Approval packet omits `adversarial_review_findings[]` entirely

- Starting condition: Brainstormer requests approval, but the packet omits `adversarial_review_findings[]` instead of explicitly reporting findings or an empty result.
- Required halt or reroute behavior: Halt approval and reissue the packet with `adversarial_review_findings[]` present under the contract before planning can continue.
- Rule surface: The approval-packet contract should require `adversarial_review_findings[]` on every Brainstormer approval request.

## Approval packet with no findings omits clean-pass rationale

- Starting condition: The approval packet reaches the operator with no blocker or material findings remaining, but the clean case is rendered as silence, an empty array, or some other wording without `clean_pass_rationale`.
- Required halt or reroute behavior: Halt approval presentation and reissue the operator-facing packet with `clean_pass_rationale` and the checked adversarial-review dimensions.
- Rule surface: The approval-packet rendering guidance should preserve the explicit empty `adversarial_review_findings[]` result under the contract while rendering the clean case with evidence.

## Gate 1 approval packet omits adversarial review evidence

- Starting condition: Brainstormer requests Gate 1 approval with a design artifact path, intent summary, requirements, and `adversarial_review_findings[]`, but the packet has no `adversarial_review_status`, no reviewer context, and no evidence that an adversarial-review pass occurred.
- Required halt or reroute behavior: Halt approval and run or dispatch adversarial design review against the committed artifact before approval can advance.
- Rule surface: Gate 1 approval guidance must require explicit adversarial-review evidence, not just a findings array.

## Brainstormer-only findings treated as adversarial review

- Starting condition: `adversarial_review_findings[]` contains only `source: brainstormer` entries, and no adversarial-review pass has run against the committed design artifact.
- Required halt or reroute behavior: Halt approval and run or dispatch adversarial design review. Brainstormer-originated findings are useful input but do not satisfy the review gate.
- Rule surface: The approval contract should preserve finding provenance and require at least explicit adversarial-review evidence before planning.

## Clean adversarial review omits checked dimensions or rationale

- Starting condition: Gate 1 approval says adversarial review is clean, but the packet does not name checked dimensions or provide `clean_pass_rationale`.
- Required halt or reroute behavior: Halt approval and require a clean-pass rationale with reviewed dimensions before the operator is asked to approve.
- Rule surface: Clean adversarial review needs evidence before claims.

## Material adversarial review finding has no disposition

- Starting condition: `adversarial_review_findings[]` contains a blocker or material finding with no disposition, or with `disposition: open`.
- Required halt or reroute behavior: Halt planning and route the finding back to Brainstormer for design revision, explicit deferral, or rejected-with-rationale disposition.
- Rule surface: Gate 1 must block on unresolved blocker or material findings.

## Workflow-contract design reviewed without writing-skills dimensions

- Starting condition: The design touches `skills/**/*.md` or a workflow-contract surface, but adversarial review does not check RED/GREEN baseline obligations, rationalization resistance, red flags, token-efficiency targets, role ownership, and stage-gate bypass paths.
- Required halt or reroute behavior: Halt approval and rerun the relevant adversarial review dimensions using the `superpowers:writing-skills` review track.
- Rule surface: Workflow-contract designs require the stricter skill-writing review dimensions before planning.

## Material design change after adversarial review does not rerun affected dimensions

- Starting condition: Adversarial review finds a material issue, Brainstormer changes requirements, ownership, pressure-test obligations, or gate order, and Gate 1 approval proceeds without rerunning the affected review dimensions or recording why rerun is unnecessary.
- Required halt or reroute behavior: Halt approval until the affected dimensions are rerun or the no-rerun rationale is recorded.
- Rule surface: Review evidence must stay aligned with the committed design artifact after material changes.

## Fresh-context review treated as a hard runtime dependency

- Starting condition: The host runtime cannot run fresh-context or parallel specialist review, but the workflow treats that missing capability as a blocker for every design, including small changes.
- Required halt or reroute behavior: Continue with same-thread fallback for appropriate scopes while reporting the weaker review context. Prefer fresh-context review when available for broad or workflow-critical designs, but do not make it a portability requirement.
- Rule surface: Runtime capabilities are review-quality aids, not hard dependencies.

## Delegated prompts missing expected `superpowers` recommendations

- Starting condition: A delegated teammate prompt omits the expected `superpowers` skill recommendations for that role.
- Required halt or reroute behavior: Reroute the delegation so the prompt explicitly recommends the expected skills before work continues.
- Rule surface: The teammate delegation prompt template should list the role-specific `superpowers` recommendations.

## Delegated prompts failing to warn when an expected skill is unavailable

- Starting condition: A delegated prompt silently skips an expected skill because it is unavailable in the current environment.
- Required halt or reroute behavior: Halt silent delegation and reissue the prompt with an explicit unavailable-skill warning to the operator and teammate.
- Rule surface: The delegation prompt should include a visible unavailable skill warning path.

## Delegated bounded teammate work ignores available background-agent execution

- Starting condition: The host runtime supports background-agent execution for delegated teammate work, the delegated task is bounded and independent enough not to need live clarification, but the workflow never recommends or prefers that capability when dispatching the teammate.
- Required halt or reroute behavior: Reissue the delegated guidance so runtime-capable hosts are explicitly nudged toward background-agent execution while keeping it optional rather than mandatory.
- Rule surface: The runtime-aware delegation guidance should prefer background-agent execution for bounded, independent work when available without turning it into a correctness dependency.

## Delegated teammate work forces background-agent execution on clarification-heavy work

- Starting condition: The host runtime supports background-agent execution, but the workflow treats it as a blanket default and pushes tightly coupled, ambiguity-heavy, or clarification-driven teammate work into the background anyway.
- Required halt or reroute behavior: Keep that work in the foreground and reserve background-agent execution for bounded, independent work that is unlikely to need live clarification.
- Rule surface: The runtime-aware delegation guidance should distinguish between independent work that benefits from background execution and interactive work that should stay in the foreground.

## Hard-coded repo rules drifting from canonical docs

- Starting condition: A stage prompt or checklist hard-codes repo rules, artifact paths, or contributor guidance that no longer match the current canonical repository docs.
- Required halt or reroute behavior: Halt the stale guidance and rediscover the governing rules from canonical repo docs before work continues.
- Rule surface: The orchestration contract should require canonical-rule discovery from `AGENTS.md` and file-local governing docs instead of embedding brittle repo literals.

## Executor done reports missing task IDs or verification evidence

- Starting condition: The Executor reports completion without explicit task IDs, without concrete completion evidence, or without verification evidence.
- Required halt or reroute behavior: Loop back to the Executor until the done report names task IDs and includes verification evidence.
- Rule surface: The Executor done-report contract should require task IDs and verification evidence.

## Executor attempts to publish or skip required verification

- Starting condition: The Executor tries to push, open a PR, or otherwise publish work directly, or claims completion without running the required verification gate first.
- Required halt or reroute behavior: Halt publish activity, route publish-state follow-through back to the Finisher, and loop incomplete verification back to the Executor before handoff.
- Rule surface: The teammate ownership contract should keep publishing with the Finisher and require Executor verification before completion claims.

## Run ends after local implementation without reaching Reviewer or Finisher

- Starting condition: `Executor` completes local edits and verification, but no proper `Reviewer` pass occurs, the branch is not pushed, no PR is created or updated, no `Finisher` shutdown checks run, and the run attempts to end with a polished completion-style summary.
- Required halt or reroute behavior: Do not allow a successful completion state. The workflow must either continue into `Reviewer` and then `Finisher`, or halt explicitly as `superteam halted at <teammate or gate>: <reason>`.
- Behavioral check: Judge the documented workflow by what it would do in this situation, not by whether it contains strong-sounding wording. A polished local-only closeout should still fail this scenario if the workflow does not reroute or halt explicitly.
- Rule surface: The canonical skill and delegated prompt surface should both require the post-implementation transition into `Reviewer` and `Finisher`, or an explicit halt, before any success-style closeout.

## Malformed done-report fields at stage handoff

- Starting condition: A teammate handoff includes a done report with missing required fields, malformed field names, or values too vague for the next stage to trust.
- Required halt or reroute behavior: Halt the handoff and return it to the owning teammate until the required done-report fields are present in the expected shape.
- Rule surface: Each teammate-specific done contract should define the minimum stable fields needed for downstream handoff.

## Brainstormer hands off an uncommitted design artifact

- Starting condition: `Brainstormer` writes or updates the design doc, but the artifact exists only as uncommitted workspace state when handoff to `Planner` is attempted.
- Required halt or reroute behavior: Treat the handoff as incomplete and loop it back to `Brainstormer` until the design artifact is committed, or halt explicitly with a blocker if the run cannot proceed safely.
- Rule surface: The canonical skill and delegated prompt should require `Brainstormer` to commit the design artifact before reporting done or handing off.

## Planner hands off an uncommitted plan artifact

- Starting condition: `Planner` writes or updates the implementation plan, but the artifact exists only as uncommitted workspace state when handoff to `Executor` is attempted.
- Required halt or reroute behavior: Treat the handoff as incomplete and loop it back to `Planner` until the implementation plan is committed, or halt explicitly with a blocker if the run cannot proceed safely.
- Rule surface: The canonical skill and delegated prompt should require `Planner` to commit the implementation plan before reporting done or handing off.

## Executor hands off uncommitted implementation artifacts

- Starting condition: `Executor` completes implementation or test changes, but those artifacts exist only as uncommitted workspace state when handoff to `Reviewer` is attempted.
- Required halt or reroute behavior: Treat the handoff as incomplete and loop it back to `Executor` until the implementation and test changes are committed, or halt explicitly with a blocker if the run cannot proceed safely.
- Rule surface: The canonical skill and delegated prompt should require `Executor` to commit the completed implementation and test state before reporting done or handing off.

## Non-artifact-producing stages are not forced into meaningless commits

- Starting condition: `Reviewer` or `Finisher` completes stage responsibilities without materially changing durable artifacts.
- Required halt or reroute behavior: Do not require a commit solely to satisfy the handoff-commit rule.
- Rule surface: The artifact-producing handoff rule should apply to artifact-producing roles and artifact-producing changes, not become a ritual for every stage.

## Reviewer findings missing loopback classification

- Starting condition: Reviewer findings identify problems but do not classify them as implementation-level, plan-level, or spec-level loopbacks.
- Required halt or reroute behavior: Halt handoff and send the findings back for explicit loopback classification before routing onward.
- Rule surface: The Reviewer findings template should require implementation-level, plan-level, or spec-level classification.

## Reviewer findings taking PR comment handling away from Finisher

- Starting condition: Local Reviewer findings are treated as authority for replying to, resolving, or otherwise owning PR comments and bot feedback after publish.
- Required halt or reroute behavior: Halt the ownership drift and return external comment handling to the Finisher, with Reviewer findings remaining local pre-publish input only.
- Rule surface: The review and finish contracts should keep local findings with the Reviewer and PR comment follow-through with the Finisher.

## Local review findings routed through Finisher instead of Team Lead

- Starting condition: Reviewer finds a local pre-publish issue, but the workflow sends it to Finisher to interpret and route instead of classifying it locally and routing it through Team Lead.
- Required halt or reroute behavior: Halt the ownership drift and return the finding to the normal local-review loop: Reviewer classifies it, Team Lead routes it, and downstream teammates remediate it.
- Rule surface: The review-intake contract should keep local pre-publish finding interpretation with Reviewer and reserve Finisher for external post-publish review intake.

## Reviewer lacks a path to analyze existing findings before publish

- Starting condition: Reviewer is asked to assess existing or disputed pre-publish findings, but the workflow provides no review-reception discipline for that interpretation step.
- Required halt or reroute behavior: Reroute to a Reviewer pass that uses the appropriate review-reception discipline before classification and loopback.
- Rule surface: The Reviewer skill guidance should allow `superpowers:receiving-code-review` when analyzing existing or disputed findings before publish.

## Skill change reviewed without `writing-skills`

- Starting condition: The run changes `skills/**/*.md` or workflow-contract docs, but Reviewer performs only a normal prose review and never invokes `superpowers:writing-skills`.
- Required halt or reroute behavior: Halt merged-ready review and reroute to a skill-specific review pass that uses `superpowers:writing-skills`.
- Rule surface: The Reviewer contract and Reviewer prompt should require `superpowers:writing-skills` for skill and workflow-contract review.

## Skill change reviewed without a pressure-test walkthrough

- Starting condition: Reviewer invokes skill-review guidance in name only, but does not run the relevant pressure-test walkthrough for the changed skill or workflow contract.
- Required halt or reroute behavior: Halt review completion and require the pressure-test walkthrough results before publish.
- Rule surface: The Reviewer contract should require pressure-test pass/fail reporting for skill and workflow-contract changes.

## Workflow-contract changes after review do not rerun the pressure-test walkthrough

- Starting condition: Reviewer already completed a pressure-test walkthrough, then later fixes change `skills/**/*.md` or workflow-contract docs again before the next handoff.
- Required halt or reroute behavior: Halt the publish handoff and rerun the relevant pressure-test walkthrough before the run returns to `Finisher`.
- Rule surface: The Reviewer contract and delegated prompt should require reruns after later workflow-contract changes, not just the first review pass.

## Loophole found during skill review but ignored before publish

- Starting condition: A pressure-test walkthrough on a skill or workflow-contract change finds a loophole, but the run still treats review as complete and moves toward publish.
- Required halt or reroute behavior: Loop back before publish and do not allow merged-ready review until the loophole is addressed or reported as an explicit blocker.
- Rule surface: The Reviewer prompt should require loopback when the pressure-test walkthrough exposes a loophole.

## Finisher handling comments without current-branch verification

- Starting condition: The Finisher resolves or replies to comments tied to earlier state without checking the current branch state first.
- Required halt or reroute behavior: Halt comment handling until current branch state verification is recorded for the comment context.
- Rule surface: The Finisher comment-handling prompt should require current branch state verification before action.

## Finisher stops at PR publication plus one status snapshot

- Starting condition: The workflow creates or updates the PR, reports a single status snapshot, and then stops even though mergeability, CI, PR metadata correction, or external feedback handling still requires Finisher-owned follow-through.
- Required halt or reroute behavior: Do not present the run as complete. Continue the Finisher loop until publish-state follow-through is stable enough to hand off cleanly or an explicit blocker is reported.
- Rule surface: The Finisher contract should state that PR publication is a milestone rather than the end of the workflow.

## Finisher keeps monitoring while required checks on the latest pushed head are pending

- Starting condition: The latest pushed head has no immediate branch-side fix left, but required checks are still pending.
- Required halt or reroute behavior: Remain in `Finisher`-owned `monitoring` instead of presenting the run as complete.
- Behavioral check: Judge the workflow by what it would do next on the latest pushed head, not by whether it uses stern wording about follow-through.
- Rule surface: The canonical skill and delegated prompt should both treat pending required checks as active publish-state follow-through.

## Finisher ignores available durable runtime follow-up while external publish-state is pending

- Starting condition: The runtime offers durable follow-up features such as thread heartbeats, monitors, or equivalent wakeups, required checks or external review state remain pending, and the workflow provides no recommendation to use those capabilities for `Finisher` follow-through.
- Required halt or reroute behavior: Reroute to guidance that prefers those durable runtime aids for the same latest-head `Finisher` loop while the external publish-state remains pending.
- Rule surface: The canonical skill and delegated Finisher prompt should explicitly recommend durable runtime follow-up features when available and relevant.

## Codex follow-through uses a fresh run when same-thread automation is the better fit

- Starting condition: The workflow is running in the Codex app, `Finisher` is waiting on external publish-state, preserving the current thread context matters, and the guidance never recommends a thread automation attached to the current thread.
- Required halt or reroute behavior: Reissue the Codex-specific guidance so same-thread automation is recommended as the native follow-through aid in that situation, while keeping the underlying `Finisher` contract portable.
- Rule surface: The runtime-aware `Finisher` guidance should mention Codex thread automations as a same-thread aid without making them a correctness dependency.

## Runtime follow-up resumes the existing Finisher loop instead of creating a new workflow

- Starting condition: The workflow recommends runtime wakeups for `Finisher`, but the documented behavior treats the wakeup as a separate workflow with different routing, shutdown rules, or ownership.
- Required halt or reroute behavior: Halt the forked workflow and restore the wakeup path to the same latest-head `Finisher` loop, preserving the normal routing and shutdown rules.
- Rule surface: Runtime monitors or heartbeats should be documented as execution aids for the portable `Finisher` contract rather than as a replacement workflow.

## Finisher follow-up wakeup lacks durable resume payload

- Starting condition: `Finisher` schedules a thread heartbeat, monitor, automation, or equivalent wakeup while external publish-state remains pending, but the wakeup payload does not include the active branch, PR, latest pushed SHA, current publish-state, pending signals, and latest-head shutdown obligations.
- Required halt or reroute behavior: Halt the follow-up setup and require a durable resume payload that re-enters the same `Finisher` loop on the latest pushed head instead of creating a vague new status run.
- Rule surface: Runtime follow-up guidance should define the minimum payload needed to resume the existing `Finisher` state machine safely.

## Finisher stops with only local commits and no PR

- Starting condition: The run reaches Finisher-owned work with local commits present, but the branch is not pushed and the PR does not exist.
- Required halt or reroute behavior: Do not present the run as complete, demoable, or handoffable. Keep publication work with Finisher until the branch is pushed and the PR exists, or report an explicit blocker.
- Rule surface: The Finisher contract should make PR publication mandatory for every superteam run and eliminate local-only completion as a valid end state.

## Top-level finding comment has no inline companion

- Starting condition: A top-level reviewer or bot comment contains still-applicable findings on the latest pushed state, but there are no inline threads for those findings.
- Required halt or reroute behavior: Count the top-level finding comment as its own blocking finding source and do not allow shutdown while it remains unresolved.
- Rule surface: The Finisher shutdown contract should account for blocking top-level finding comments, not just inline threads.

## Top-level summary comment is deduped incorrectly

- Starting condition: The workflow drops a top-level comment from the final unresolved count without verifying that it is explicitly a summary of already-audited inline findings on the latest pushed state.
- Required halt or reroute behavior: Halt the shutdown report and require explicit audit evidence for the dedupe decision. If the comment includes standalone or mixed findings, count it separately.
- Rule surface: The Finisher shutdown contract should allow dedupe only for explicit summary comments of already-audited inline findings.

## Requirement-bearing review feedback routed straight to execution

- Starting condition: Review feedback adds or changes requirements and is sent directly to execution.
- Required halt or reroute behavior: Reroute through spec-level review with Brainstormer ownership, then plan-level planning, and only then execution.
- Rule surface: The review-feedback routing contract should direct requirement-bearing changes to spec-level, then plan-level, before Executor work resumes.

## Generic requirement delta routed past Brainstormer

- Starting condition: A requirement changes outside the review-comment path and the workflow tries to continue with planning or execution without refreshing spec authority first.
- Required halt or reroute behavior: Halt the in-flight work, route the change back to Brainstormer so the design becomes authoritative again, then re-plan before execution resumes.
- Rule surface: The requirements-delta routing contract should require generic requirement changes to return to Brainstormer before downstream stages continue.

## Finish-phase operator requirement delta routed past Brainstormer

- Starting condition: Pre-flight detects `finish` because an open PR exists, but the operator gives a normal requirement delta such as "add an acceptance criterion for durable wakeup payloads" that is not phrased as PR feedback.
- Required halt or reroute behavior: Route the delta to `Brainstormer` as a spec-level loopback, require planning and execution to follow, and block `Finisher` ready/shutdown reporting until the loopback is resolved and latest-head publish-state is rechecked.
- Rule surface: The finish-phase routing table should treat any requirement-bearing delta as spec-first, regardless of whether it arrived as PR feedback, human test feedback, or a direct operator prompt.

## Requirement-bearing PR feedback returns to spec authority before publish resumes

- Starting condition: Pre-flight detects `finish` because an open PR exists, and latest PR feedback adds or changes acceptance criteria.
- Required halt or reroute behavior: Routing must send the feedback to `Brainstormer` as a spec-level loopback, require the resulting commit to carry `Loopback: spec-level`, continue through `Planner` and `Executor`, and block `Finisher` shutdown or publish-ready reporting until the loopback is resolved and latest-head publish-state is rechecked.
- Rule surface: Finish detection, requirement-bearing feedback routing, loopback trailer persistence, and Finisher latest-head shutdown rules must work as one chain.

## Shutdown attempted with unresolved threads or blocking external PR feedback

- Starting condition: The workflow tries to shut down after publishing a PR, but unresolved inline review threads still exist on the latest PR head, or unresolved post-latest-push reviewer or bot feedback still requests concrete corrective action.
- Required halt or reroute behavior: Do not shut down or present the run as complete. Dispatch finish-owned follow-through, re-check the blocking items, and only allow shutdown after the blocking items are cleared.
- Rule surface: The Finisher shutdown checklist should treat unresolved inline threads and blocking external PR feedback as shutdown blockers.

## Shutdown report omits final unresolved blocking-feedback counts

- Starting condition: The workflow reaches shutdown readiness evaluation but does not report the final unresolved counts for inline threads and top-level blocking finding comments on the latest pushed state.
- Required halt or reroute behavior: Halt the shutdown report and require explicit final unresolved counts before completion or blocker handoff.
- Rule surface: The Finisher shutdown contract should make final unresolved blocking-feedback counts mandatory and auditable.

## Shutdown attempted while publish-state blockers are still active

- Starting condition: The workflow reaches a state that looks healthy from partial signals such as PR published, merge conflict resolved, or CI green, but mergeability, required checks, PR metadata requirements, or final external-feedback handling still needs Finisher-owned follow-through.
- Required halt or reroute behavior: Do not shut down based on partial success signals. Continue the Finisher loop, report the remaining blockers explicitly, and only allow shutdown after the full publish-state follow-through is stable.
- Rule surface: The shutdown contract should make clear that PR creation, mergeability restoration, or green CI alone are insufficient completion signals.

## Finisher re-enters triage when later required checks fail on the latest pushed head

- Starting condition: `Finisher` is monitoring the latest pushed head, and a required check later transitions from pending to failing.
- Required halt or reroute behavior: Re-enter `triage` automatically on the latest pushed head and route any needed corrective work through the normal workflow instead of waiting for a user re-prompt.
- Rule surface: The Finisher contract should make later required-check failures an automatic triage transition while monitoring.

## Finisher allows ready handoff only after later passing checks leave the whole latest-head sweep clear

- Starting condition: `Finisher` is monitoring the latest pushed head, and required checks later transition from pending to passing.
- Required halt or reroute behavior: Allow `ready` only if the rest of the latest-head sweep is also clear, including mergeability, PR metadata, and unresolved external review state.
- Rule surface: The Finisher contract should require a full latest-head sweep, not just passing required checks, before a ready handoff.

## Shutdown attempted using stale completeness from an earlier PR head

- Starting condition: Feedback or checks were cleared on one PR head, a newer commit is pushed, and the workflow still treats the earlier green or previously-cleared state as sufficient for completion.
- Required halt or reroute behavior: Invalidate the earlier completion assumption, re-check review state, required checks, mergeability, and PR metadata on the latest pushed head, and only allow shutdown if that latest head is complete or its remaining blockers are reported explicitly.
- Rule surface: The Finisher shutdown contract should make completion head-relative and require re-evaluation after every push.

## Shutdown attempted when the external-feedback state cannot be determined safely

- Starting condition: The workflow cannot tell whether review threads or recent reviewer/bot findings still block the latest pushed state.
- Required halt or reroute behavior: Do not guess and do not present success. Halt with an explicit blocker and prompt the operator.
- Rule surface: The shutdown contract should require operator escalation when shutdown readiness cannot be determined safely.

## Pending external systems stop the run as an explicit blocker, not a completion summary

- Starting condition: Required checks, manual approvals, or other external publish-state signals remain pending on the latest pushed head, and the workflow cannot safely continue monitoring.
- Required halt or reroute behavior: Report an explicit blocker tied to the latest pushed head and pending external dependency instead of using completion-style language.
- Rule surface: The Finisher contract should turn unsafe-to-continue monitoring into a `blocked` state rather than a soft success summary.

## Missing background-agent support does not permit early stop

- Starting condition: The host runtime does not support background-agent execution for delegated teammate work, and the workflow treats that missing capability as sufficient reason to stop or soften the teammate handoff rules.
- Required halt or reroute behavior: Continue with the normal portable teammate workflow and do not allow the missing runtime capability to become an early-stop excuse.
- Rule surface: The runtime-aware delegation guidance should make background-agent execution a preference for bounded, independent work when available and preserve the portable teammate workflow when it is not.

## Non-execute invocation does not halt on missing execution mode

- Starting condition: Pre-flight detects `brainstorm`, `review`, or `finish` work that does not require execute-phase delegation, and the host runtime exposes no team-mode or subagent-driven execution capability.
- Required halt or reroute behavior: Continue routing the non-execute work through the appropriate teammate. Halt with `superteam halted at Pre-flight: no execution mode available` only when the selected route requires execute-phase delegation.
- Rule surface: Execution-mode capability detection should be route-scoped: missing execution mode blocks execution delegations, not approval packets, review interpretation, or Finisher status checks.

## Ambiguous team-mode signal does not select team mode

- Starting condition: The host exposes generic `Task`, `Agent`, or one-off background dispatch, but no explicit team-mode capability name and no plugin-declared team-mode flag.
- Required halt or reroute behavior: Treat team mode as unavailable and continue the deterministic probe to subagent-driven mode, or halt only if no subagent-driven capability exists.
- Rule surface: Execution-mode capability detection should reserve team mode for explicit team-mode signals and treat generic dispatch as subagent-driven.

## Execute delegation does not ask the two-options prompt

- Starting condition: `Team Lead` has resolved execution mode during pre-flight and delegates execute-phase work, but the delegated prompt routes through `superpowers:executing-plans` or asks the operator to choose between subagent-driven and inline execution.
- Required halt or reroute behavior: Rewrite the delegation to bind directly to the pre-selected execution mode. Default paths use `superpowers:subagent-driven-development` or native team mode; `superpowers:executing-plans` is valid only for explicit operator `inline` override.
- Rule surface: Execution-mode injection should suppress the downstream two-options prompt and name the resolved mode in the delegation.

## Brainstormer skips writing-skills when workflow surface is uncertain

- Starting condition: The issue plausibly targets `skills/**/*.md` or a workflow-contract surface, but the exact files are not known yet, and Brainstormer starts drafting requirements before loading `superpowers:writing-skills`.
- Required halt or reroute behavior: Load `superpowers:writing-skills` before authoring requirements, or halt for clarification if the intended surface cannot be determined safely.
- Rule surface: Brainstormer skill-change guidance should trigger on plausible skill/workflow-contract scope, not only on already-known file paths.

## Pre-flight recovered spec loopback routes through Brainstormer before execution resumes

- Starting condition: The branch has a committed plan doc and no PR, so artifact phase would normally derive as `execute`, but `git log` contains a later unresolved `Loopback: spec-level` trailer. The operator prompt is ambiguous, such as "continue".
- Required halt or reroute behavior: Pre-flight must recover `active_loopback_class=spec-level`, routing must send the work to `Brainstormer`, and the teammate handoff must preserve the spec-level loopback until a resolving commit includes `Loopback: resolved`. Do not route directly to `Executor` from the artifact-derived execute phase.
- Rule surface: Loopback recovery, active-loopback routing precedence, and unresolved/resolved trailer semantics must override normal artifact-derived phase routing.

## Unresolved implementation loopback blocks publish-state handoff

- Starting condition: A PR exists, but `git log` on the branch contains an unresolved `Loopback: implementation-level` trailer after the latest `Loopback: resolved`. The operator asks "is it ready to publish/check CI?"
- Required halt or reroute behavior: Pre-flight must recover the active implementation loopback, routing must send the work back to `Executor` instead of treating the PR state as normal `Finisher` monitoring, and publish-state follow-through must remain halted until the implementation loopback is committed and resolved with `Loopback: resolved`.
- Rule surface: PR/loopback detection ordering, active-loopback precedence over normal phase routing, trailer recovery, and Finisher publish ownership must work as one chain.

## Loopback recovery ignores stale trailers outside the active issue range

- Starting condition: A branch can reach an older unresolved `Loopback:` trailer from another issue or inherited history, but the current active issue's branch-only commits have no active loopback after their latest `Loopback: resolved`.
- Required halt or reroute behavior: Do not recover the stale trailer as the active loopback. Scope recovery to commits unique to the active branch and matching the active issue, then route from the resulting active loopback class or normal phase.
- Rule surface: The loopback recovery algorithm should prevent unrelated historical trailers from overriding the current issue's route.

## Resolving loopback commit uses unambiguous trailer semantics

- Starting condition: A terminating loopback commit completes work that originated from `Loopback: plan-level`. Two shapes are exercised: (a) a same-class resolving commit carrying `Loopback: plan-level` + `Loopback: resolved`, and (b) a different-class follow-on resolving commit carrying `Loopback: plan-level` + `Loopback: implementation-level` + `Loopback: resolved`.
- Required halt or reroute behavior: In both shapes, the resolving commit must include `Loopback: resolved`, and `resolved` wins for that commit. Any other `Loopback:` trailer on the same commit — matching the resolved class or not — is evidence only and must not open or reopen a loopback. For shape (b), recovery must report the active loopback as resolved (no class-B loopback opened from the same commit, assuming no later originating trailers); to actually open a follow-on implementation-level loopback, a separate later commit carrying `Loopback: implementation-level` as the originating trailer is required. The contract must not require both class and resolved trailers in a way that conflicts with the recovery algorithm.
- Rule surface: `SKILL.md` and `loopback-trailers.md` should agree on resolving-commit trailer semantics, including that follow-on loopbacks of any class require a separate later originating commit.

## Missing runtime follow-up support does not permit Finisher to stop early

- Starting condition: The runtime does not support durable follow-up features such as thread heartbeats or monitors, pending external publish-state still exists, and the workflow tries to stop with a completion-style handoff anyway.
- Required halt or reroute behavior: Keep the issue in the portable `Finisher` loop or report an explicit blocker when safe follow-through cannot continue, but do not treat missing runtime support as permission to stop early.
- Rule surface: The `Finisher` contract should preserve the same ownership and shutdown rules even when runtime follow-up features are unavailable.

## Finisher fails to distinguish branch-caused CI failures from likely baseline failures

- Starting condition: A required check is failing after the latest push, but the workflow reports the failure without attempting to distinguish whether it was introduced by the branch or appears unrelated baseline noise.
- Required halt or reroute behavior: Keep the issue in the Finisher loop, inspect enough evidence to make the best branch-caused vs baseline distinction available, and report the result explicitly. If the distinction still cannot be made safely, prompt the operator instead of guessing.
- Rule surface: The Finisher contract should require explicit blocker reporting and branch-aware CI triage before handoff or halt.
