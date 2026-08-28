---
name: orchestrate
description: Coordinate user-visible Codex chats when work must keep moving. Resume idle chats, automatically repair failing checks and merge-conflicted pull requests, and report chats that require operator attention. Exclude background sessions.
---

# Orchestrate

Keep every user-visible Codex chat moving as far as its current authority permits. Work as the coordinator; leave implementation inside each chat.

## Chat boundary

The inventory contains only user-visible Codex chats from the Codex task list.

Background implementation is outside this skill's inventory. This includes subagents, CLI `exec` sessions, automation runs, approval guardians, shell processes, test runners, and other worker sessions. Do not instruct, classify, or report these sessions. Read their state only when it explains the status of a user-visible chat.

## Sweep

1. List every incomplete user-visible Codex chat.
2. Read each chat's recent status and current run state. Separately inspect its
   attached delegated work with the available session-state tools.
3. Inspect the current mergeability of each open pull request owned by a chat.
4. Record the policy inputs for each chat:
   - `parentState`: `active`, `idle`, `interrupted`, or the observed state.
   - `delegatedWorkState`: `active`, `inactive`, or `unknown`. Use `inactive`
     only when the session-state tools explicitly verify that no attached
     delegated work is running. Missing delegated sessions from the
     user-visible chat inventory is not verification.
   - `nextActionState`: `unblocked`, `operator-required`, or `none`. A current
     failing check or pull request with merge conflicts is `unblocked` when its
     repair remains within the chat's authority.
5. Account for every incomplete user-visible chat before proceeding.

Elapsed time and a top-level `idle` or `interrupted` state do not prove that a
chat is safe to resume.

## Decision policy

Keep discovery separate from the decision. Change to this skill's directory,
then pass each chat's three recorded inputs as JSON to the bundled policy:

```sh
node scripts/orchestration-policy.mjs '{"parentState":"idle","delegatedWorkState":"inactive","nextActionState":"unblocked"}'
```

Use the returned action exactly:

- `send-instruction` permits one message through **Advance actionable chats**.
- `report-operator` adds the chat to the operator report without messaging it.
- `leave-unchanged` sends no message. Include an `unknown` delegated-work state
  in the report as an unverifiable chat; active work needs no report unless it
  also creates an operator dependency.

If the policy helper cannot run, leave the chat unchanged and report the
failure. No other observation authorizes a message.

## Advance actionable chats

Send one instruction only to a chat whose policy action is `send-instruction`.
The instruction must:

- State the next concrete action.
- Preserve the chat's existing scope and authority.
- Define an observable completion criterion.
- Tell the chat to continue through subsequent safe steps.
- Tell the chat to stop only at completion or a genuine operator dependency.

Do not repeat an unchanged instruction that the chat already received.

When one branch needs the operator but independent work remains, instruct the chat to complete the independent work first. Escalate only after the chat has exhausted safe progress.

## Merge-conflicted pull requests

Treat a merge conflict as routine branch maintenance. When the owning chat is idle, immediately instruct it to:

1. Update its branch from the pull request's current target branch with the repository's canonical branch-update and merge-conflict workflows.
2. Resolve every conflict within the pull request's accepted scope and repository policy.
3. Run the verification required for the changed conflict resolutions.
4. Push the updated branch.
5. Confirm that the pull request no longer reports merge conflicts.

The observable completion criterion is a pushed branch whose pull request reports no merge conflicts and whose required verification passes.

Escalate only when repository policy requires a halt, the conflict exposes incompatible accepted requirements, required access is unavailable, or safe conflict-resolution attempts fail.

## Failing checks

Treat a failing check on the chat's current pull-request head as actionable work. Ignore superseded failures from older heads. When the owning chat is idle, immediately instruct it to:

1. Inspect the failing check's current logs and reproduce the failure locally when the repository provides a stable local seam.
2. Classify the cause as branch-local, base-owned, transient infrastructure, or an external dependency.
3. Fix every branch-local cause within the chat's accepted scope. Use the repository's existing diagnosis, development, and test workflows when they apply.
4. Run the narrow regression first, then the required verification for the changed code.
5. Commit and push the repair to the existing branch without expanding scope or creating a new pull request.
6. Recheck the current pull-request head and continue until its required checks pass.

For a transient infrastructure failure, use bounded safe retries and scoped recovery before escalating. For a base-owned failure, update from the current target branch when repository policy permits, verify the merged result, and push it. The observable completion criterion is a current pull-request head with the repaired check and all required checks passing.

Escalate only when the failure needs an operator decision, new authority, unavailable credentials, destructive recovery, an incompatible accepted requirement, a human-owned review action, or an external service that still fails after bounded safe recovery. Report the exact check, current-head evidence, attempted recovery, and one operator action.

## Operator boundary

Operator attention is required when progress depends on:

- A material product, design, or scope decision.
- New authority or an approval the chat does not already have.
- Credentials or access that the chat cannot obtain safely.
- A destructive or difficult-to-recover action.
- Conflicting accepted requirements.
- A human-owned review response or resolution.
- A blocker that remains after the chat exhausts its safe recovery paths.

Do not make these decisions for the operator.

## Report

After advancing actionable chats, report every user-visible chat that currently requires operator attention.

Use the chat's exact title. When the current client supports Codex deep links and the inventory provides the chat ID, render that title as `[Exact chat title](codex://threads/<thread-id>)`. Otherwise, render the exact title as plain text. Link the relevant issue, requested change, review, check, or other source when available.

| Chat | Blocker | Work completed | Operator action required |
| --- | --- | --- | --- |
| [Exact chat title](codex://threads/<thread-id>) | Concrete reason progress stopped | Furthest safe state reached | One specific decision or action |

Include unchanged operator dependencies until they are resolved. If none require attention, report that briefly.

Optionally summarize newly resumed chats separately:

| Chat | Instruction sent |
| --- | --- |
| [Exact chat title](codex://threads/<thread-id>) | Concrete next action and completion criterion |

## Recurring orchestration

When recurring monitoring is requested:

1. Complete one full sweep immediately.
2. Advance every presently actionable idle chat.
3. Report current operator dependencies from user-visible chats.
4. Create or update one five-minute heartbeat that repeats this skill's sweep.

Keep one monitor for this purpose. Update it instead of creating a duplicate.
