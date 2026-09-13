---
name: maintain-orchestrator
description: Reconcile one durable Orchestrate program store with the current patina-mode Orchestrate playbook and operator requirements. Use when maintaining, repairing, or auditing a program store before dispatch, after a prompt change, or after a coordinator handoff.
---

# Maintain an Orchestrate store

Use this skill when the target is one existing Orchestrate store. The skill
maintains durable records. It does not implement issue work, publish a pull
request, claim or transfer an issue, send Slack, or change another store.

## Inputs

Require these inputs before changing anything:

- the current `plugins/engineering/skills/patina-mode/playbooks/orchestrate.md`;
- the operator's current prompt or standing requirements;
- the store directory;
- the store's `ownership-config.json`, `slack-config.json`, `poll-state.json`,
  and `HANDOFF.md`.

Read the playbook and operator requirements first. Treat the operator prompt as
the active rule when it conflicts with older active text. Treat historical
entries in `overview.md`, `gates.md`, `decisions.tsv`, `units.tsv`,
`ledger.tsv`, and `HANDOFF.md` as evidence to preserve.

## Procedure

1. **Inventory.** Confirm that the store contains exactly these maintained
   records: `preferences.md`, `program-prompt.md`, `overview.md`, `units.tsv`,
   `ledger.tsv`, `gates.md`, `frontier.json`, `poll-state.json`,
   `ownership-config.json`, `slack-config.json`, and `HANDOFF.md`. Confirm that
   `inbox/` exists and that the Orchestrate CLI can open the store. A missing,
   unreadable, malformed, or unexpectedly replaced file stops the run before a
   write.
2. **Compare.** Parse the current prompt and the playbook. Compare active
   standing orders, intake rules, verification rules, gate policy, and wake
   policy with the store. Report every stale or contradictory instruction with
   its source path.
3. **Validate contracts.** Validate the registry endpoint, configured client,
   read command, and atomic `claim` operation without claiming anything.
   Validate the Slack credential source, bot and recipient identities, official
   CLI commands, authentication contract, and checkpoint-only deduplicated
   notification policy without sending. Validate idle wake state, restart
   command, stop command, interval, and runtime identity without arming or
   stopping a wake.
4. **Reconcile.** Replace the active program prompt with the supplied current
   prompt. Replace or merge only the active standing-order lines that the
   current prompt supersedes. Preserve unrelated lines, issue history,
   evidence paths, claims, gates, worker rows, ledger rows, and handoff facts.
   Keep `status.md` derived from the Orchestrate CLI rather than hand-editing
   it. Leave new intake paused whenever registry or Slack validation fails.
5. **Record.** Append one deterministic decision for each replacement,
   preservation, conflict, and contract result to `decisions.tsv`. A decision
   marker is keyed by the input digests and action, so an unchanged rerun adds
   no duplicate decision, claim, or notification history.
6. **Verify.** Run the focused tests, the Orchestrate status command, and the
   repository checks named by the task. Report the exact commands, outputs,
   changed paths, preserved records, conflicts, gates, and unresolved inputs.

## Failure states

The maintainer fails closed. Malformed store data produces no store writes.
An invalid registry or missing Slack contract records a gate and sets
`poll-state.json` to `intake_enabled: false` only when that file is valid and
the change is safe. A failed wake validation leaves the existing wake state
untouched and records the restart and stop paths as unresolved. A conflict is
never silently discarded. The report names both source paths and the selected
active rule.

## Implementation

Run `scripts/maintain-orchestrator.py` with `--store`, `--playbook`, and
`--operator-prompt`. Pass `--orch` with the current `orch.ts` entry point to
render and validate `status.md` after reconciliation. Add `--check-registry`
only when the operator has authorized a live read-only registry check. Slack
validation remains structural so the maintainer never sends or authenticates
on behalf of the coordinator. The script never invokes the registry claim
operation and never invokes a Slack send command.
