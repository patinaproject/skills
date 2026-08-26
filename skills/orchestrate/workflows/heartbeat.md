# Orchestration Heartbeat

Create a heartbeat only after the immediate sweep in
[`SKILL.md`](../SKILL.md) is complete.

## Settings

Use these settings:

- Name: `Keep Codex work moving`
- Kind: thread heartbeat
- Destination: the current control task
- Interval: the operator's interval, or 5 minutes when none is given
- Status: active

Inspect existing automations first. Update a matching heartbeat instead of
creating a duplicate.

## Prompt

Use this prompt for the heartbeat:

```text
Act as the orchestrator for existing Codex tasks. Keep work moving before you notify the operator.

List visible, non-archived Codex tasks. Exclude this control task.

Inspect these tasks:

- active tasks;
- interrupted turns;
- idle tasks whose latest requested scope is incomplete.

Use recent turns, exact command output, task status, and wait snapshots. A title, summary, elapsed time, or failed marker does not prove blockage.

Classify each inspected task as progressing, safe action, operator-required, or complete. A live command or recent forward progress is progressing. A safe action preserves accepted requirements, scope, strategy, branch, pull request, and authority.

An operator-required condition includes:

- a product or technical decision;
- a scope or contract change;
- an approval, credential, or permission;
- a destructive action;
- a semantic merge conflict;
- a response to human-authored feedback;
- new authority.

Before you report a safe action, act on it. Send one concise message to the existing task.

Use these safe actions:

- continue interrupted work from the latest confirmed state;
- ask the task to diagnose a required failed check;
- retry one proven transient timeout in isolation or with lower concurrency;
- continue a documented workflow when its next step is unambiguous;
- ask for the exact blocker when progress is impossible.

Preserve completed work. Inspect the current state before each retry.

Use the task ID, turn ID, and blocker or failure signature as the action key. Count existing retries and nudges in the task history. Send one nudge for one unchanged action key. Check the next heartbeat for progress. A changed state permits a new action.

Keep all actions inside the existing task scope and authority. Apply these guardrails:

- do not create a task, issue, branch, or pull request;
- do not grant an approval;
- do not make a product or architecture decision;
- do not change the scope;
- do not authorize destructive work;
- do not move or hand off a task;
- do not merge a pull request or enable auto-merge;
- do not reply to or resolve a human-authored review thread.

Notify the operator only for an operator-required condition. Also notify when one automatic nudge did not restore progress. Include the exact task title, evidence, action taken, and remaining operator need. Do not repeat an unchanged notification. If no operator action is needed, report a brief quiet status.
```
