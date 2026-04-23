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

## Approval request omits remaining approval-relevant concerns

- Starting condition: Brainstormer requests approval while real approval-relevant concerns still exist, but the approval packet does not surface them.
- Required halt or reroute behavior: Halt approval and reissue the packet with the remaining approval-relevant concerns included, unless the concern is severe enough to block approval entirely.
- Rule surface: The first-stage approval contract should require Brainstormer to surface real approval-relevant concerns when present.

## Delegated prompts missing expected `superpowers` recommendations

- Starting condition: A delegated teammate prompt omits the expected `superpowers` skill recommendations for that role.
- Required halt or reroute behavior: Reroute the delegation so the prompt explicitly recommends the expected skills before work continues.
- Rule surface: The teammate delegation prompt template should list the role-specific `superpowers` recommendations.

## Delegated prompts failing to warn when an expected skill is unavailable

- Starting condition: A delegated prompt silently skips an expected skill because it is unavailable in the current environment.
- Required halt or reroute behavior: Halt silent delegation and reissue the prompt with an explicit unavailable-skill warning to the operator and teammate.
- Rule surface: The delegation prompt should include a visible unavailable skill warning path.

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

## Finisher fails to distinguish branch-caused CI failures from likely baseline failures

- Starting condition: A required check is failing after the latest push, but the workflow reports the failure without attempting to distinguish whether it was introduced by the branch or appears unrelated baseline noise.
- Required halt or reroute behavior: Keep the issue in the Finisher loop, inspect enough evidence to make the best branch-caused vs baseline distinction available, and report the result explicitly. If the distinction still cannot be made safely, prompt the operator instead of guessing.
- Rule surface: The Finisher contract should require explicit blocker reporting and branch-aware CI triage before handoff or halt.
