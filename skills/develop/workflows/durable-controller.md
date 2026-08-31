# Keep develop active across turns

Use one controller for the full `develop` run. The controller records where to
resume. It does not redefine the readiness rules owned by `ready-pr`.

## Build the requirement ledger

Before implementation, list every explicit requirement from the user's
instructions and the selected issue. Give each one a stable short ID. Keep the
user's wording when changing it would narrow the requirement.

Initialize the bundled `scripts/controller-state.mjs` from the repository
checkout. Pass the issue, current branch, initial pending action, and every
requirement as `--requirement ID=text`. The script writes the record beneath the
current worktree's Git directory and prints its path.

When initialization reports an existing nonterminal record, run `show` and
resume that record. Starting over would discard the pending action.

Reconcile the ledger after implementation. Mark one item complete with
`complete-requirement --id ID --evidence TEXT --pending-action TEXT` only when
the current work proves it. The controller refuses `polish`, publication, and
readiness while an item remains pending.

## Check prerequisites

Complete these checks before advancing from `prerequisites`:

- the current branch is the tracker branch when the issue supplies one;
- the repository has the expected authenticated `origin`;
- the checkout can create the repository's required commit identity and
  signature;
- standard Git can publish the branch;
- the GitHub CLI can read and create or update the pull request; and
- the execution host can resume this same task after a turn ends.

Use a repository-provided capability check when one exists. Do not test write
access by creating an unrelated remote object. If a check fails, run
`block --pending-action TEXT` with the exact operator repair, stop the
controller automation, and report `Blocked`. Implementation has not started.

## Start continuation

Codex tasks use the attached heartbeat in
[the controller automation](../../codex-pr-feedback-loop/workflows/thread-automation.md).
Create it before implementation. Use the host's same-task event or heartbeat
mechanism elsewhere. Independent scheduled tasks do not preserve this
controller's conversation and worktree.

The continuation prompt reads the controller record and performs its
`pendingAction`. It updates the record before its turn ends. A nonterminal turn
reports progress only. It does not emit the final `Ready to merge` or `Blocked`
report.

If the host has no same-task continuation mechanism, record a terminal blocker
before implementation. Name the mechanism the operator must enable.

## Move through phases

Use `advance --phase PHASE --pending-action TEXT` before implementation,
verification, `polish`, or publication. Valid phases are `prerequisites`,
`implementation`, `verification`, `polish`, `publication`, and `readiness`.

After a push, record the pull request and full published commit with `publish`.
Capture an ISO-8601 timestamp immediately before the push and pass it as
`--check-epoch-started-at`. A new published head starts a new check epoch.

Immediately before changing a draft to ready, capture another timestamp. After
the transition, run `start-check-epoch` with that timestamp and the next action.
This creates a new epoch even when the commit did not change.

When a branch-caused failure needs a fix, advance to `implementation`. The new
commit returns through verification, `polish`, publication, and readiness.

## End only at a terminal result

Run `ready` only after `ready-pr` passes its fresh final predicate. Run `block`
only when the next action belongs to a person. Then stop the controller's event
or heartbeat.

Pending checks, draft state, unpublished work, agent feedback, and a host-ended
turn remain nonterminal. Leave their exact next action in the record and keep
the continuation active.
