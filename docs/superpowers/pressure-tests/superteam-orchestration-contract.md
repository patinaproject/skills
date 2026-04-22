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

## Finisher handling comments without current-branch verification

- Starting condition: The Finisher resolves or replies to comments tied to earlier state without checking the current branch state first.
- Required halt or reroute behavior: Halt comment handling until current branch state verification is recorded for the comment context.
- Rule surface: The Finisher comment-handling prompt should require current branch state verification before action.

## Requirement-bearing review feedback routed straight to execution

- Starting condition: Review feedback adds or changes requirements and is sent directly to execution.
- Required halt or reroute behavior: Reroute through spec-level review with Brainstormer ownership, then plan-level planning, and only then execution.
- Rule surface: The review-feedback routing contract should direct requirement-bearing changes to spec-level, then plan-level, before Executor work resumes.

## Generic requirement delta routed past Brainstormer

- Starting condition: A requirement changes outside the review-comment path and the workflow tries to continue with planning or execution without refreshing spec authority first.
- Required halt or reroute behavior: Halt the in-flight work, route the change back to Brainstormer so the design becomes authoritative again, then re-plan before execution resumes.
- Rule surface: The requirements-delta routing contract should require generic requirement changes to return to Brainstormer before downstream stages continue.

## Shutdown attempted with unresolved threads or bot findings

- Starting condition: The workflow tries to shut down while unresolved review threads or PR bot findings still exist.
- Required halt or reroute behavior: Halt shutdown, dispatch finish-owned follow-through, and re-check unresolved items before completion.
- Rule surface: The Finisher shutdown checklist should treat unresolved threads and bot findings as blocking conditions.
