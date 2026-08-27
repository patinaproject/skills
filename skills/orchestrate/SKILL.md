---
name: orchestrate
description: Keep user-visible Codex tasks moving. Resume idle tasks, ask them to repair current pull request conflicts or failed checks, and report tasks that need the user. Ignore background workers.
---

# Orchestrate Codex tasks

Coordinate user-visible Codex tasks. Leave implementation inside each task.
Ignore subagents, command sessions, automations, test processes, and other
background workers except when their state explains a user-visible task.

## Check every task

1. List every incomplete user-visible Codex task.
2. Read each task's recent result and current run state.
3. Check every open pull request owned by a task for conflicts and current
   required checks.
4. Put each task in one state:
   - `Active`: a command, check, or agent turn is running.
   - `Ready for more work`: nothing is running and the next safe step is clear
     and already authorized.
   - `User needed`: progress needs a decision, approval, credential,
     clarification, or action outside the task's authority.
5. Account for every incomplete user-visible task.

Time alone does not make a task idle. Inspect its current state.

## Resume tasks that can continue

Send one instruction to each task that is ready for more work. State the next
action, keep it within the task's existing request and permissions, define a
visible completion condition, and tell the task to continue through later safe
steps. Do not repeat an unchanged instruction already sent to that task.

When one part needs the user but other work can continue independently, tell
the task to finish that other work first.

## Pull request conflicts

For an idle task whose pull request has conflicts, instruct it to:

1. merge the pull request's current target branch using the repository's branch
   update and conflict resolution instructions
2. resolve every conflict covered by the pull request and repository rules
3. run the checks required for the conflict changes
4. push the branch
5. confirm that the pull request no longer reports conflicts

The task is done when the updated branch is pushed, the pull request has no
conflicts, and its required checks pass. Ask the user only when repository rules
require it, a conflict exposes incompatible requirements, access is missing, or
safe attempts cannot resolve the conflict.

## Failed checks

For an idle task with a failed check on its latest pull request commit, instruct
it to:

1. read the current logs and reproduce the failure locally when the repository
   provides a reliable command
2. decide whether the branch caused it, it already exists on the target branch,
   infrastructure failed temporarily, or an external service failed
3. fix every cause introduced by the branch using the repository's diagnosis,
   implementation, and test instructions
4. run the smallest regression check first, then the required checks for the
   changed code
5. commit and push the fix to the existing branch
6. repeat until the latest pull request commit passes every required check

Retry temporary infrastructure failures a limited number of times. When the
same failure exists on the target branch, follow the repository's branch update
rules and record the comparison. Ask the user only when progress needs a new
decision or permission, unavailable credentials, destructive recovery,
incompatible requirements, a human review response, or an external service
that still fails after reasonable retries.

## Report tasks that need the user

After resuming tasks that can continue, report every task that needs the user.
Use each task's exact title. Link it with the app's task link when available.
Link the issue, review, check, or other source of the problem when available.

| Task | Why it stopped | Work completed | User action |
| --- | --- | --- | --- |
| Exact task title | Specific reason | Furthest safe result | One decision or action |

Keep reporting the same unresolved user actions on later runs. If none remain,
say so briefly. You may also list tasks resumed during this run and the
instruction sent to each.

## Recurring checks

When the user asks for recurring monitoring:

1. Run one complete check immediately.
2. Resume every idle task that can continue.
3. Report tasks that need the user.
4. Create or update one five-minute heartbeat that repeats these instructions.

Update the existing monitor instead of creating a duplicate.
