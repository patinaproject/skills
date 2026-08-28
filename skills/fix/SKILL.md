---
name: fix
description: Fix one operator-defined evidence case through diagnosis, correction, publication, and fixed-build verification.
disable-model-invocation: true
---

# Fix

## Quick Start

Invoke with exactly one **evidence case**: the report link plus any instructions
that narrow the expected behavior, environment, or required proof.

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

## Outcome Contract

A verified fix requires reporter-fidelity green evidence against the deployed
current pull-request head. Anything less is a blocker, not a fix claim.

- `verified`: the same evidence case was observed red, corrected, and observed
  green on a deployment identified with the current PR head SHA.
- `blocked`: the red baseline, required environment, deployment identity,
  reporter-fidelity retest, or another required input is unavailable or fails.

An operator may explicitly accept residual risk and continue publication or
merge work outside this workflow. Record that choice, but keep the `/fix`
outcome blocked; accepted missing evidence is not verified evidence.

## Scope Contract

One invocation owns one evidence case. The operator's scope is authoritative
and may combine a report link with additional instructions. If it contains
multiple independent reported behaviors, stop and ask the operator to select
one.

Read repository guidance for a human-bug-report contract. Follow it when one
exists. Otherwise use the report's expected behavior, actual behavior, steps,
and environment as the portable contract.

Build the complete context defined by the
[`ready-pr` reporter-fidelity reference](../ready-pr/references/reporter-fidelity.md)
and carry it unchanged through every stage. For `/fix`, the exact reproduction,
required environment, and red result are mandatory rather than optional.

Do not store workflow state in the worktree or an operating-system temporary
directory. The structured red checkpoint and later evidence live in the chat.

## Required Child Skills

Before starting, confirm these skills are installed:

- `diagnosing-bugs`: observe the exact report red and locate its cause;
- `implement` and `tdd`: build the correction at an agreed public seam;
- `polish`: run the shared local architecture, Standards, and Spec loop; and
- `ready-pr`: publish the branch and run the shared PR readiness loop.

If any are missing, stop and report the missing names with install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill polish ready-pr -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills --skill diagnosing-bugs implement tdd -y
```

## Workflow

1. **Establish the target.** Resolve the report, repository, branch or pull
   request, current head, reported environment, and required deployment path.
   Run in a local environment with every simulator, device, browser,
   credential, and deployment capability the evidence case needs. Missing
   capability is a blocker.

2. **Diagnose red.** Use `diagnosing-bugs` against the correct unfixed target
   and applicable environment. Follow the operator's exact steps and directly
   observe the reported property. Stop before implementation when the evidence
   case cannot be observed red; report the exact target, steps, observation,
   and non-reproduction blocker.

3. **Checkpoint red in the chat.** Before changing code, record the report
   reference, expected behavior, actual behavior, exact repro, required
   fidelity, target and environment, and red result. The step is complete only
   when every field is concrete enough to repeat unchanged after publication.

4. **Implement the correction.** Use the build/TDD portion of `implement`.
   Test at a stable public seam when one exists, and make its assertion observe
   the reported property rather than a proxy. Keep the observation context
   current as evidence or mismatches emerge. This step is complete when the
   accepted scope is implemented, every relevant stable seam is locally green,
   and any behavior without a stable automated seam is recorded as unavailable
   evidence for the deployed-head retest.

5. **Run the shared quality loop.** Pass the complete observation context to
   `polish`. Fix and re-review every agent-ready finding until `polish` passes
   the current committed head with no findings. A human-owned finding blocks
   the run.

6. **Publish the candidate.** Pass the observation context to `ready-pr` and
   run its existing commit, PR, checks, feedback, draft transition, and final
   readiness behavior unchanged. `ready-pr` reports reporter-fidelity QA as
   verified or pending; that status does not alter its readiness predicate.

7. **Verify the fixed build.** Resolve the current PR head SHA, prove the
   deployed target was built from that head, and repeat the checkpointed repro
   without weakening its steps or fidelity. Use evidence at the reporter's
   perceived surface: visual evidence or measured geometry for visual and
   layout reports, direct timing or ordering observations, the public
   interaction surface, and direct data behavior. Inspect the evidence itself.
   A green result is valid only when it shows the expected behavior and no
   reported failure on that deployed head.

8. **Restart on invalidation.** A red fixed-build retest restarts at diagnosis
   with that failed candidate as the unfixed target. Any later push invalidates
   earlier green evidence and restarts the complete loop at diagnosis. Repeat
   through a new red checkpoint, implementation, `polish`, `ready-pr`, and
   deployed-head retest.

Reviewer notification remains an operator action. Do not reply to or resolve a
human-authored conversation, request review, or signal a reviewer on the
operator's behalf.

## Final Report

Lead with `verified` or `blocked` and the requested-change link. For a verified
fix, name the PR, tested head SHA, deployed target, reporter-perceived surface,
and concise red-to-green evidence. For a blocker, name the exact missing or
failed observation and the human action that can unblock it. Include
publication readiness separately so passing checks are never presented as
reporter-fidelity proof.
