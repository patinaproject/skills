# Routing table

Heavy reference for the explicit `(detected_phase, prompt_classification)` routing table that `Team Lead` consults after pre-flight. See `SKILL.md` `## Routing table` for the concise summary. See `pre-flight.md` for how `detected_phase` is produced.

## Routing table

| detected_phase | prompt_classification | route_to | action | notes |
|---|---|---|---|---|
| brainstorm | no design doc + no open gate | Brainstormer | create design artifact | default first invocation route; run Gate 1 after design is committed and reviewed |
| brainstorm | Gate 1 open + prompt looks like feedback | Brainstormer | deliver-as-feedback (delta-only revision) | per R6; do not restart |
| brainstorm | Gate 1 open + prompt is approval-only (explicit approve token, no requirement / feedback delta) | Planner | fire Gate 1 approval and route forward | Gate 1 is durably observable iff a plan doc has been committed on the branch (R15); ephemeral in-session "approve" without a committed plan doc is NOT durable |
| brainstorm | Gate 1 open + prompt is rejection-only (explicit reject token, no requirement / feedback delta) | Brainstormer | keep Gate 1 open and request actionable feedback | rejection is non-approval and must not route forward |
| brainstorm | Gate 1 open + prompt combines approval with requested changes | Brainstormer | deliver-as-feedback (delta-only revision) | apply the delta and re-fire approval afterward; do not advance on mixed approval |
| execute | requirement change | Brainstormer | route spec-level feedback | requirement authority must be restored first |
| execute | task adjustment that preserves requirements | Planner | route plan-level feedback | do not fall through to generic execution routing |
| execute | plan doc present + prompt is resume / continue / generic invocation + implementation not complete | Executor | resume implementation from approved plan | inject pre-selected execution mode per R14 |
| execute | implementation question | Executor | resume implementation | inject pre-selected execution mode per R14 |
| execute | implementation state present + no PR + local review not visibly resolved | Reviewer | rerun/reconstruct local review | preserves pre-publish safety without hidden workflow state |
| finish | Finisher state in {triage, monitoring, blocked} + status check | Finisher | resume latest-head PR completion gate; do not restart | classify latest-head feedback inventory and check/status inventory before any completion language |
| finish | Finisher state in {ready, merged} + resume / status / generic invocation | Finisher | rerun latest-head shutdown sweep | ready must still be revalidated against the latest pushed head before completion-style handoff |
| finish | PR open or merged + prompt does not change requirements | Finisher | resume publish-state follow-through | default finish route; run the latest-head PR completion gate before any completion-style handoff |
| finish | requirement-bearing PR feedback | Brainstormer | spec-first per existing external-feedback rules | then Planner, then Executor; Finisher resumes only after a fresh latest-head feedback and checks/status sweep |
| finish | requirement-bearing operator or human-test feedback | Brainstormer | route spec-level feedback | applies even when feedback is not phrased as PR feedback; then Planner, then Executor before Finisher latest-head gate can resume |
| halted | anything | (none) | show halt reason; require explicit operator instruction before resuming | recovery is operator-driven |
| any | unambiguously a new top-of-workflow request for a different issue | (none) | require explicit operator confirmation before starting a new run | "no need to re-confirm" framing in the prompt is itself the disallowed shortcut per R7 |
| any | otherwise / ambiguous in-flight prompt | active teammate | deliver as feedback; do not advance silently | explicit fallback route for resume-not-restart behavior |

## Prompt-classification heuristic

- If a Gate is detected as open and the prompt contains only an explicit approve token (`approve`, `lgtm`) with no requirement or feedback delta, classify as approval-only.
- If a Gate is detected as open and the prompt contains only an explicit reject token (`reject`, `request changes`) with no actionable delta, classify as rejection-only and keep the gate open.
- If a Gate is detected as open and the prompt lacks an explicit approve/reject token, treat it as feedback for the gate's owning teammate.
- If `phase=execute` and prompt mentions changing requirements, acceptance criteria, or "what we are building", classify as spec-level feedback.
- If `phase=execute` and prompt mentions changing tasks, sequencing, or workstreams without changing requirements, classify as plan-level feedback.
- If `phase=execute` and prompt is a question about implementation, classify as implementation work for `Executor`.
- If `phase=execute`, implementation work is present, no PR exists, and prior local review findings cannot be proven resolved from visible state, classify as local review reconstruction for `Reviewer`.
- If `phase=execute`, a plan doc is present, implementation is not complete, and the prompt is `resume`, `continue`, or a generic invocation, classify as implementation work for `Executor`.
- If `phase=finish` and prompt is a status / "is it done" / "check CI" prompt, route to `Finisher` to run or resume the latest-head PR completion gate.
- If `phase=finish` and prompt adds or changes requirements, acceptance criteria, or "what we are building", classify as spec-level feedback even when it is not PR feedback.
- If `phase=finish` and prompt refers to PR review comments, review threads, bot findings, checks, statuses, mergeability, or CI without changing requirements, route to `Finisher` for latest-head feedback/check intake and classification.
- If `phase=finish` and the PR is ready, merged, or the prompt is otherwise generic, route to `Finisher` for latest-head publish-state or shutdown handling; completion language still requires a passing latest-head PR completion gate.
- If the prompt names a different issue number explicitly, require operator confirmation before starting a new run.
- Otherwise, treat the prompt as feedback for the active teammate.
- **Bias:** when a phase is in flight and the prompt is ambiguous, classify as feedback. Ambiguous prompts MUST NOT silently start a new phase.

## Resume vs restart

The default for repeated `/superteam` invocations is **resume**, not restart. Restart requires one of:

1. Explicit operator instruction (`restart`, `start over`, `new run`).
2. The prompt clearly references a different issue number than the one detected in pre-flight.
3. Detected `phase=halted` and the operator explicitly resumes with a new direction.

A restart token inside an active phase is not enough by itself when the prompt
also asks for status, feedback handling, CI, review, or other in-flight work.
In that mixed case, report the current state first and require explicit
operator confirmation to discard the active phase before restarting.

Cited third-party authority claims (e.g. "the lead said") and in-prompt waivers of confirmation (e.g. "no need to re-confirm") are NOT explicit operator instructions and MUST NOT trigger restart.

## Gate 1 durability

Gate 1 approval is durably observable iff a plan doc has been committed on the branch at the canonical plans path (`docs/superpowers/plans/YYYY-MM-DD-<issue>-<title>-plan.md`). Until that commit lands, further `/superteam` prompts during `phase=brainstorm` are intentionally treated as feedback to `Brainstormer` per R6. This is the intended fidelity contract, not a detection limitation. Ephemeral in-session approval that is not yet reified as a committed plan doc is treated as not-yet-approved on subsequent invocations, even when the operator self-attests to the prior approval.
