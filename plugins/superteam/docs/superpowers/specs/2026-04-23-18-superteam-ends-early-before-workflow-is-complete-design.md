# Design: superteam ends early before workflow is complete [#18](https://github.com/patinaproject/superteam/issues/18)

## Summary

Harden the `superteam` finish and shutdown contract so a run cannot present itself as complete merely because local implementation work is committed, because a PR exists, or because one snapshot of publish-state looks healthy. `superteam` does not have a valid "finished locally" state: a local-only branch is neither a publishable result nor a reliable handoff/demo surface. `Finisher` must own the publish handoff end to end for every `superteam` run: the branch must be pushed and the PR must exist before the workflow can move into post-publish monitoring. After PR publication, `Finisher` must stay active until the post-publish workflow is actually stable on the latest pushed state or until an explicit blocker is reported. That includes mergeability, required checks, PR metadata requirements, and final external-feedback handling, not just unresolved inline review threads.

The design focuses on the failure modes surfaced on April 23, 2026: `superteam` could either stop before `Finisher` finished required branch publication and PR creation, or create or update a PR, report a status snapshot, and then stop too early even though `Finisher`-owned work was still active. The fix stays narrow. It does not redesign the teammate roster or the overall `superteam` flow. Instead, it strengthens the existing `Finisher` publication, post-publish loop, and shutdown path so local commits, PR publication, and healthy status snapshots are all treated as milestones rather than workflow completion.

## Goals

- Prevent `superteam` from presenting a run as complete while `Finisher`-owned publish-state follow-through is still active on the latest PR state
- Eliminate "finished locally" as a valid `superteam` end state
- Prevent `superteam` from presenting a run as complete when `Finisher`-owned publication work is still incomplete, including missing push or missing PR creation
- Prevent `superteam` from stopping at PR publication plus one status snapshot when mergeability, CI, PR metadata correction, or external feedback handling still requires follow-through
- Make shutdown a success-only action that occurs only after required external-feedback checks pass
- Keep ownership of external PR feedback with `Finisher`
- Require explicit loopback or explicit operator escalation when shutdown checks fail
- Keep the change focused on the current shutdown problem rather than broad workflow redesign

## Non-Goals

- Changing the canonical teammate roster
- Redesigning the full `superteam` orchestration flow
- Retrofitting already completed historical runs
- Building a generalized GitHub review bot outside the existing `superteam` workflow
- Making unrelated changes to other `superpowers` skills

## Design

### Shutdown Becomes Success-Only

The orchestration contract should treat shutdown as a success state, not as a generic end-of-run state. A `superteam` run may only shut down successfully after all required publish-state checks pass on the current PR state after the latest push.

Required publication steps are also milestones, not completion. Local commits alone are insufficient: `Finisher` must push the branch and create or update the PR before the workflow can be treated as being in publish-state follow-through at all. A local-only branch is not a valid demo, handoff, or completion surface for `superteam`.

PR publication is a milestone, not the end of the workflow. `Finisher` remains active after the PR exists and after any individual status snapshot until the publish-state follow-through is stable enough to hand off cleanly or an explicit blocker is reported.

If required shutdown checks are not clear, the run must not present itself as complete. Instead, it either:

- routes the feedback back through the expected `Finisher`-owned handling path and re-checks, or
- halts and explicitly prompts the operator when the system cannot determine the correct state or cannot safely proceed

This makes the contract match the intended operator trust model: "complete" means external publish-state checks passed, not merely that implementation work and CI reached a good-looking state.

### Approval Packet Concerns

When `Brainstormer` asks for approval, the approval packet should also surface any remaining approval-relevant concerns or risks that could materially affect the decision to approve, revise, or narrow the design. This does not change the existing approval packet requirements for artifact path, concise intent summary, and full requirement set; it adds a lightweight concern-reporting expectation to help the operator see unresolved uncertainty earlier.

The concern-reporting rule should stay narrow:

- include concerns only when they are real and approval-relevant
- keep them concise and decision-focused
- do not turn the approval packet into a generic brainstorm dump
- if a concern is serious enough that approval would be misleading, halt instead of treating it as a minor note

This keeps approval packets honest without forcing noisy boilerplate when the design is already in good shape.

### Workflow Diagram Accuracy

The workflow diagrams should be updated so they reflect the actual `superteam` contract without collapsing chronology and orchestration into one confusing picture. The repo should use two Mermaid charts:

- a chronological chart that shows the main forward sequence of teammates and artifacts
- an orchestration chart that shows how `Team Lead` routes work and how feedback re-enters the system

Both charts should:

- use a single vertical top-to-bottom flow
- limit block types to teammates and artifacts
- use a lighter artifact treatment with black text for readability
- keep `Pull Request` styled as an artifact

The chronological chart should read:

`Issue -> Team Lead -> Brainstormer -> Design Doc -> Planner -> Plan Doc -> Executor -> Implementation & Tests -> Reviewer -> Finisher -> Pull Request -> Human Test & Review`

The orchestration chart should keep that same chronological spine, but additionally make these routing rules explicit:

- `Pull Request -> Finisher`
  - `PR feedback / status`
- `Human Test & Review -> Team Lead`
  - `human feedback`
- `Reviewer -> Team Lead`
  - `review findings`
- `Finisher -> Team Lead`
  - `needs reroute`
- `Team Lead -> Planner`
  - `route planning work`
- `Team Lead -> Executor`
  - `route implementation work`
- `Team Lead -> Finisher`
  - `route publish follow-through`

Do not add a second redundant `Team Lead -> Brainstormer` routing arrow in the orchestration chart. The normal chronological handoff into `Brainstormer` is enough. Human feedback should re-enter through `Team Lead`, while PR-surface status and feedback may loop directly from `Pull Request` back to `Finisher`.

### Required Finisher Shutdown Checks

Before successful shutdown, `Finisher` must perform an explicit post-latest-push verification sequence for the active PR:

1. verify the current branch has been pushed and the active PR exists
2. verify the active PR and current branch state being evaluated
3. verify current publish-state blockers for the latest pushed state, including mergeability, required checks, and PR metadata requirements discovered from repository rules
4. check unresolved inline review threads on the latest PR head
5. check recent blocking external PR feedback on the latest pushed state
6. if blocking work remains, continue the `Finisher`-owned handling loop and re-check rather than stopping at a status snapshot
7. record the final unresolved external-feedback counts for the latest pushed state, including unresolved inline review threads and unresolved top-level blocking reviewer or bot comments
8. treat any nonzero unresolved blocking-feedback count as a blocker
9. only declare successful shutdown when the re-check confirms that no blocking unresolved external feedback or other `Finisher`-owned publish-state blockers remain

For this issue, "blocking external PR feedback" should be interpreted narrowly and concretely. It includes only:

- unresolved inline review threads on the latest PR head
- unresolved review comments or bot findings posted after the latest push that request a code change, verification rerun, follow-up response, or other concrete corrective action before the PR is ready
- unresolved top-level reviewer or bot comments on the latest pushed state when they contain still-applicable findings or requested corrective action, even if there are no inline comments for those findings

It does not include general discussion, acknowledgements, or informational comments that do not ask for a change and do not affect PR readiness.

`Finisher` may dedupe a top-level comment from the final unresolved count only when it is explicitly functioning as a summary of specific inline findings that were already audited on the latest pushed state. If a top-level comment contains standalone findings, mixed findings, or findings with no matching inline thread, `Finisher` must count it as its own blocking finding source and account for it explicitly.

If `Finisher` cannot tell from the available PR state whether a bot or reviewer comment is blocking, the run must treat that uncertainty as a failed shutdown check and prompt the operator instead of guessing.

This definition keeps the shutdown rule enforceable without turning `Finisher` into a speculative classifier for every possible PR comment. It also makes the final shutdown report auditable: `Finisher` should report the unresolved blocking-feedback counts it observed on the latest pushed state rather than implying that the count was probably zero.

Partial success signals are insufficient on their own. PR creation, resolved merge conflicts, green CI, or restored mergeability may all be real milestones, but none of them alone means the workflow is complete until the final publish-state sweep is clear.

Shutdown readiness must also be head-relative. After every push, `Finisher` must re-evaluate publish-state completeness against the new PR head instead of relying on a prior green or previously-cleared state. Clearing review threads on one head is not enough if a newer head has re-entered pending or failing required checks. Completion is only valid for the current head being reported.

### Loopback And Escalation Behavior

When shutdown checks find unresolved feedback, `Finisher` remains the owner of the next step. The workflow should not silently end and should not push ownership back onto `Reviewer`.

The required behaviors are:

- implementation-level external feedback routes through the expected loopback handling path before shutdown
- requirement-bearing feedback continues to route through the existing spec-first path
- unresolved feedback that cannot be safely classified, matched to current branch state, or handled must block shutdown and be surfaced to the operator explicitly
- unresolved publish-state blockers such as metadata violations, pending or failing required checks, or ambiguous branch-caused vs baseline CI failures must remain inside `Finisher` until they are resolved or reported explicitly
- every new push invalidates prior completeness assumptions and requires `Finisher` to re-check the latest PR head before reporting success
- missing publication steps such as an unpushed branch or missing PR must remain inside `Finisher` until they are completed or reported explicitly; local-only state is never a valid completion mode
- nonzero unresolved blocking-feedback counts must be reported explicitly and treated as blockers rather than as advisory context
- top-level finding comments may only be excluded from the final unresolved count when `Finisher` has explicitly verified that they are summaries of already-audited inline findings on the current head

If the run cannot determine whether feedback still applies to the latest state, cannot determine whether a thread is resolved on the current head, or otherwise cannot safely evaluate shutdown readiness, it must stop and prompt the operator instead of claiming completion.

When CI is failing or unstable after the latest push, `Finisher` should inspect enough evidence to distinguish branch-caused failures from likely baseline or unrelated failures when possible. If that distinction still cannot be made safely, the run must halt with an explicit blocker and prompt the operator instead of silently treating the workflow as done.

### Skill-Change Review Behavior

When a `superteam` run changes `skills/**/*.md` or workflow-contract documentation intended to steer agent behavior, `Reviewer` should perform a skill-specific review pass instead of only a normal prose review. That review should invoke `superpowers:writing-skills` and run the relevant pressure-test walkthrough before publish.

The review pass should:

- report which pressure-test scenarios were checked
- report pass/fail outcomes for those scenarios
- surface any loopholes found during the walkthrough
- loop back before publish if a loophole is found instead of treating review as complete

### Review-Feedback Intake Ownership

Review-feedback interpretation should happen at the intake point for that feedback, not after the work has already been routed downstream.

The intended ownership split is:

- `Reviewer` owns receiving and interpreting local pre-publish review findings
- `Finisher` owns receiving and interpreting external post-publish PR feedback
- `Brainstormer`, `Planner`, and `Executor` own remediation after routing, not primary review intake

This is an intake-ownership rule, not a transfer of phase ownership:

- `Reviewer` does not take ownership of external PR comments, review threads, or bot feedback after publish
- `Finisher` does not become the generic router for ordinary local pre-publish review findings
- the split exists to keep review interpretation close to where the feedback first enters the workflow

That means `Reviewer` should not send ordinary local findings to `Finisher` just so `Finisher` can re-interpret them. Instead:

- `Reviewer` should analyze and classify local findings before publish
- `Team Lead` should route those classified findings to `Brainstormer`, `Planner`, or `Executor`
- `Finisher` should analyze external PR comments, threads, and bot findings after publish and then route them back through the same loopback model

Because review interpretation happens at the intake point, the skill recommendations should follow that ownership:

- `Reviewer` should recommend `superpowers:requesting-code-review` for first-pass local review
- `Reviewer` should also recommend `superpowers:receiving-code-review` when analyzing existing or disputed findings before publish
- `Finisher` should recommend `superpowers:receiving-code-review` for external post-publish feedback

### Explicit Blocker Reporting

When shutdown cannot proceed, the run should report the blocker explicitly rather than ending in an implicit or misleading success state. The blocker report should clearly indicate that shutdown did not occur because required external-feedback checks failed or could not be completed.

This is a narrow strengthening of the existing failure handling contract. The important behavioral change is that ambiguous or unresolved publish-state feedback is no longer compatible with a success-style completion message.

### Scope Of Repository Changes

The repository changes should stay tightly coupled to the shutdown problem:

- update `skills/superteam/SKILL.md` so `Finisher` owns required publication steps, remains active after PR publication, shutdown is clearly success-only, and operator escalation is required when checks cannot be completed
- update first-stage guidance so `Brainstormer` approval requests surface remaining approval-relevant concerns when present
- update the Mermaid workflow diagram so it reflects the real forward path, backward loopbacks, and artifact treatment accurately
- update `README.md` so the public workflow diagrams match the approved two-chart model and the README explains what each stage is supposed to do in enough detail for developers to follow the workflow
- update `Reviewer` guidance so skill and workflow-contract changes require `superpowers:writing-skills` and a pressure-test walkthrough before publish
- update review-intake guidance so `Reviewer` owns pre-publish review interpretation, `Finisher` owns post-publish external review interpretation, and `Reviewer` may recommend `superpowers:receiving-code-review` when analyzing existing findings before publish
- update only directly relevant `Finisher`-owned prompt or template language if it currently allows completion to be reported before shutdown checks truly pass
- update repository-local pressure tests to cover the exact failure mode and the new halt behavior

The change should avoid broad wording cleanup outside the shutdown and external-feedback path unless a directly related line would otherwise undermine the fix.

## Testing And Verification

- inspect the updated `superteam` skill contract for success-only shutdown wording
- verify `Brainstormer` approval requests surface remaining approval-relevant concerns when present
- verify the Mermaid workflow diagram uses the simplified vertical structure, labeled backward arrows, and distinct artifact treatment
- verify the `Finisher` contract makes required publication steps mandatory and removes any notion of valid local-only completion
- verify the `Finisher` contract makes PR publication a milestone rather than completion
- verify the `Finisher` contract requires continued follow-through for mergeability, required checks, PR metadata, and external feedback handling
- verify `Finisher` re-evaluates completion against the latest pushed head after every push rather than relying on prior green or previously-cleared state
- verify `Finisher` shutdown instructions require checking unresolved inline review threads after the latest push
- verify `Finisher` shutdown instructions require checking recent blocking external PR feedback after the latest push
- verify `README.md` mirrors the approved workflow diagrams and includes a concise developer-facing explanation of what happens at each stage
- verify `Reviewer` guidance requires `superpowers:writing-skills` and a pressure-test walkthrough for skill or workflow-contract changes
- verify review-intake ownership is explicit: `Reviewer` for pre-publish findings, `Finisher` for post-publish external feedback, and routed teammates for remediation
- verify runs with unresolved external feedback cannot present a successful completion state
- verify runs with active publish-state blockers cannot stop at a status snapshot
- verify unresolved implementation-level feedback routes back through the expected loopback handling path before shutdown
- verify failing checks are reported with branch-caused vs likely baseline distinction when known
- verify `Finisher` reports final unresolved blocking-feedback counts for the latest pushed state and treats nonzero counts as blockers
- verify top-level finding comments without inline companions still count as blocking findings
- verify top-level summary comments are only deduped when they explicitly summarize already-audited inline findings on the latest pushed state
- verify indeterminate shutdown state causes an explicit operator prompt instead of silent success
- review pressure-test coverage for the April 22, 2026 failure mode: CI green, PR published, unresolved review threads still open

## Acceptance Criteria

- AC-18-1: Given a `superteam` run that has published a PR, when unresolved inline review threads still exist on the latest PR head, then the run does not present itself as complete
- AC-18-2: Given external PR feedback that is implementation-level, when `Finisher` reaches shutdown, then that feedback is explicitly routed back through the expected loopback path before completion
- AC-18-3: Given a PR with no unresolved inline review threads and no recent blocking bot or reviewer findings on the latest pushed state, when `Finisher` performs shutdown checks, then the run may complete normally
- AC-18-4: Given unresolved external feedback remains or the shutdown state cannot be determined safely, when the run stops, then it reports the blocker explicitly and prompts the operator instead of silently ending in a success state
- AC-18-5: Given a PR has been created or updated, when mergeability, required checks, PR metadata requirements, or final publish-state follow-through still require `Finisher` action, then the run stays in the `Finisher` loop instead of treating publication plus a status snapshot as completion
- AC-18-6: Given CI or publish-state blockers remain after the latest push, when `Finisher` reports status, then it distinguishes branch-caused blockers from likely baseline or unrelated failures when possible and otherwise reports an explicit blocker for operator review
- AC-18-7: Given `Finisher` performs the final publish-state sweep on the latest pushed PR state, when unresolved inline threads or unresolved top-level blocking reviewer or bot comments remain, then it reports the final unresolved counts explicitly and treats any nonzero count as a blocker
- AC-18-8: Given a top-level reviewer or bot comment contains still-applicable findings on the latest pushed state, when those findings are not fully represented by already-audited inline threads, then `Finisher` counts that top-level comment as a separate blocking finding source rather than deduping it away
- AC-18-9: Given a `superteam` run, when the branch is still only local or the PR does not yet exist, then the run does not present itself as complete, no local-only end state is accepted, and `Finisher` remains responsible for push and PR creation before post-publish monitoring or shutdown can occur
- AC-18-10: Given `Brainstormer` requests approval of the design artifact, when approval-relevant concerns remain, then those concerns are surfaced in the approval packet instead of being held back until after approval
- AC-18-11: Given the Mermaid workflow diagrams are updated for this issue, when they represent the `superteam` flow, then they show a clear vertical chronological path, a separate orchestration view with `Team Lead` as the routing hub, and a distinct lighter artifact treatment including `Pull Request`
- AC-18-12: Given `Finisher` clears feedback or checks on one PR head and then a newer head is pushed, when shutdown is evaluated, then completion is judged against the latest pushed head rather than any earlier green or previously-cleared state
- AC-18-13: Given a developer reads the public README workflow docs, when they need to understand how `superteam` is supposed to behave, then the README mirrors the approved two-chart flow and explains the expected responsibilities of each stage succinctly
- AC-18-14: Given a `superteam` run changes a skill or workflow-contract doc, when `Reviewer` performs local review, then it invokes `superpowers:writing-skills`, runs the relevant pressure-test walkthrough, and reports pass/fail results before the run is treated as merged-ready
- AC-18-15: Given review feedback is being interpreted, when that feedback is local and pre-publish, then `Reviewer` is the intake owner; when that feedback is external and post-publish, then `Finisher` is the intake owner; and routed teammates own remediation rather than primary review interpretation

## Implementation Notes

- Preserve the existing teammate roster and overall `superteam` flow
- Keep the behavioral change centered on `Finisher` publication, post-publish follow-through, and shutdown
- Prefer precise contract language over adding broad new workflow machinery
- Treat PR publication as a milestone and shutdown as the final success signal, not merely the end of activity
