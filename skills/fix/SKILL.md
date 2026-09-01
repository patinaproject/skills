---
name: fix
description: Fix one reported behavior from a red reproduction through a deployed retest of the current pull request head.
disable-model-invocation: true
---

# Fix

## Quick start

Invoke with exactly one **evidence case**. Provide the report link plus any
instructions that narrow the expected behavior, environment, or required proof.

```text
/fix <report-link>
/fix <report-link> reproduce on the reported iPhone model
```

`fix` is an operator-invoked controller. It runs this sequence:

```text
diagnose red → implement → polish → ready-pr → verify deployed current head
```

It is a peer of `develop`. It invokes `implement`, never `develop`, and no
other controller silently routes into it.

## Outcome contract

A verified fix requires reporter-fidelity green evidence from a deployment
built from the current pull request head. Anything less is a blocker, not a fix
claim.

- `verified`. The same evidence case was observed red, corrected, and observed
  green on a deployment identified with the current PR head SHA.
- `blocked`. The red baseline, required environment, deployment identity,
  reporter-fidelity retest, or another required input is unavailable or fails.

An operator may accept residual risk and continue publication or merge work
outside this workflow. Record that choice, but keep the `/fix` outcome blocked.
Accepted missing evidence is not verified evidence.

## Scope contract

One invocation handles one evidence case. The operator's scope is authoritative
and may combine a report link with additional instructions. If it contains
multiple independent reported behaviors, stop and ask the operator to select
one.

Read repository guidance for a human bug report contract. Follow it when one
exists. Otherwise use the report's expected behavior, actual behavior, steps,
and environment as the contract.

Collect every field defined by the
[reporter-fidelity observation fields](../ready-pr/references/reporter-fidelity.md#observation-context)
and carry it unchanged through every stage. `/fix` requires the exact
reproduction, required environment, and red result.

Record the structured red checkpoint and later evidence in the chat, never in
the worktree or an operating-system temporary directory.

## Required child skills

Before starting, confirm these skills are installed:

- `diagnosing-bugs` observes the exact report red and locates its cause.
- `implement` and `tdd` build the correction at an agreed public seam.
- `polish` runs the shared local architecture, Standards, and Spec loop.
- `ready-pr` publishes the branch and runs the shared PR readiness loop.

For an evidence case that needs an Android emulator or iOS simulator, also
confirm that `running-mobile-simulators` is installed. It owns device selection,
readiness, binding, recovery, and cleanup.

If any are missing, stop and report the missing names with install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill polish ready-pr running-mobile-simulators -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills --skill diagnosing-bugs implement tdd -y
```

## Workflow

1. **Establish the target.** Resolve the report, repository, branch or pull
   request, current head, reported environment, and required deployment path.
   Run in a local environment with every simulator, device, browser,
   credential, and deployment capability the evidence case needs. Missing
   capability is a blocker. When the evidence case needs an Android emulator or
   iOS simulator, invoke `running-mobile-simulators` before any device state
   change or mobile automation. Keep `fix` responsible for the evidence case
   and the runtime skill responsible for device ownership and lifecycle.

2. **Diagnose red.** Use `diagnosing-bugs` against the correct unfixed target
   and applicable environment. Follow the operator's exact steps and directly
   observe the reported property. Stop before implementation when the evidence
   case cannot be observed red. Report the exact target, steps, observation,
   and reason it did not reproduce.

3. **Checkpoint red in the chat.** Before changing code, record the report
   reference, expected behavior, actual behavior, exact repro, required
   fidelity, target and environment, and red result. The step is complete only
   when every field is concrete enough to repeat unchanged after publication.

4. **Implement the correction.** Use the build/TDD portion of `implement`.
   Test at a stable public seam when one exists, and make its assertion observe
   the reported property rather than a proxy. Update the observation context
   when new evidence exposes a mismatch. This step is complete when the
   accepted scope is implemented, every relevant stable seam is locally green,
   and any behavior without a stable automated seam is recorded as unavailable
   evidence for the deployed-head retest.

5. **Run the shared quality loop.** Pass the complete observation context to
   `polish`. Fix and re-review every finding the agent can address until
   `polish` passes the current committed head with no findings. Stop when a
   finding needs a person.

6. **Publish the candidate.** Pass the observation context to `ready-pr`. Let
   it commit, publish, process feedback, handle draft state, and check readiness
   without changing its rules. `ready-pr` reports reporter-fidelity QA as
   verified or pending. That verdict does not alter pull request readiness.

7. **Verify the fixed build.** Resolve the current PR head SHA, prove the
   deployed target was built from that head, and repeat the checkpointed repro
   without weakening its steps or fidelity. Apply the
   [reporter-fidelity evidence rules](../ready-pr/references/reporter-fidelity.md#matching-evidence-to-the-report).
   Inspect the evidence itself. A green result is valid only when it shows the
   expected behavior and no reported failure on that deployed head.

8. **Restart on invalidation.** A red fixed-build retest restarts at diagnosis
   with that failed candidate as the unfixed target. Any later push invalidates
   earlier green evidence and restarts the complete loop at diagnosis. Repeat
   every stage through a new deployed-head retest.

The operator owns reviewer contact and conversation state. Leave human-authored
conversations open. Do not request review or contact a reviewer.

## Final report

Lead with `verified` or `blocked` and the requested-change link. For a verified
fix, name the PR, tested head SHA, deployed target, reported property, and
concise red-to-green evidence. For a blocker, name the exact missing or failed
observation and the human action that can unblock it. Include
publication readiness separately so passing checks are never presented as
reporter-fidelity proof.
