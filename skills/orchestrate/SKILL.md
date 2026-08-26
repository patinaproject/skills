---
name: orchestrate
description: Orchestrates existing Codex tasks by acting on safe blockers before monitoring them and notifying the operator only when judgment or authority is required. Use when asked to coordinate, monitor, unblock, babysit, or keep multiple Codex tasks moving.
---

# patinaproject Orchestrate

Turn the current Codex task into the control task for existing Codex work.
Keep implementation in each target task. Use the control task to inspect, nudge,
verify, and escalate.

## Preconditions

Confirm that the environment can:

- list Codex tasks;
- read a task;
- wait for task progress;
- send a message to an existing task;
- create or update a thread heartbeat.

If a required capability is absent, report its name and stop. A standalone cron
job is not a substitute for a thread heartbeat.

The preconditions are complete when every capability is callable.

## Immediate sweep

Complete this sweep before you create or update a monitor.

1. List all visible, non-archived Codex tasks. Exclude the current control task.
   Retain each exact title, task ID, host ID, status, and recent update state.
2. Inspect every task that can contain unfinished work. Include active tasks,
   interrupted turns, and idle tasks whose latest turn did not finish its scope.
3. Read enough recent turns and command output to identify the exact current
   state. Do not classify from a title or summary alone.
4. Put each inspected task in one class: progressing, safe action,
   operator-required, or complete.
5. Act on every safe action. Record every operator-required condition. Leave
   progressing and complete tasks unchanged.

The sweep is complete only when every inspected task has one class and every
safe action has received its action.

### Prove the class

A task is **progressing** when a live command runs or recent output shows real
forward progress.

A task has a **safe action** when the next message preserves all accepted
requirements, scope, strategy, branch, and pull request. Typical safe actions
include:

- continue an interrupted turn from its latest confirmed state;
- inspect and diagnose a required check that failed;
- retry one proven transient timeout in isolation or with lower concurrency;
- continue the repository workflow from its documented next step;
- report the exact blocker when the task cannot proceed.

A task is **operator-required** when progress needs judgment or new authority.
This class includes:

- a product, requirement, scope, architecture, backfill, or test-strategy choice;
- a security or CI contract change;
- an approval, credential, permission, or destructive action;
- a merge conflict that needs semantic judgment;
- a conflict in human-authored review feedback;
- the same blocker after one automatic nudge produced no progress.

A task is **complete** when its latest requested scope has a final result and no
unfinished follow-up.

Elapsed time alone does not prove a stall. Confirm that the turn has unfinished
work, no live command, and no final result.

A failed tool marker alone does not prove a failed check. Inspect the command
and its output. A diagnostic command can use a nonzero exit status as data.

### Take one safe action

Send a concise message to the existing task. State the observed condition and
the next safe action. Tell the task to preserve completed work and inspect the
latest state before it retries.

Use the task ID, turn ID, and failure or blocker signature as the action key.
Send one nudge for one unchanged action key. A later state change permits a new
action.

Count retries and prior nudges in the task history. One orchestrator must not
restart a retry loop that the target task already exhausted.

Keep the message inside the task's existing authority. The control task does
not create a task, issue, branch, or pull request. It does not grant an approval
or answer an ambiguous question.

For human-authored review feedback, direct the task to fix verified code when
the repository permits it. Keep the human conversation for the operator.

The action is complete when the target task receives one specific, non-duplicate
message.

## Start the monitor

After the immediate sweep is complete, read
[the heartbeat workflow](workflows/heartbeat.md). Create or update the monitor
from that workflow.

Do not create the monitor before the immediate sweep is complete. The monitor
continues the same classification and safe-action contract on later runs.

## Report

Report:

- the number of tasks inspected in the immediate sweep;
- the exact task titles that received an automatic action;
- each condition that needs the operator and the required decision;
- whether the heartbeat was created or updated, with its interval.

Do not interrupt the operator for a safe action. Notify the operator when an
operator-required condition exists or one nudge did not restore progress.
