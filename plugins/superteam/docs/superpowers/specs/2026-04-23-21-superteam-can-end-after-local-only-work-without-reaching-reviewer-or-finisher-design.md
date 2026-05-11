# Design: superteam can end after local-only work without reaching Reviewer or Finisher [#21](https://github.com/patinaproject/superteam/issues/21)

## Summary

Harden the `superteam` workflow so a run cannot end with a normal completion-style closeout immediately after local implementation work. Once `Executor` reports local implementation complete, the workflow must either continue into `Reviewer` and then `Finisher`, or halt explicitly with the contract-style failure message if a required gate cannot be satisfied.

This issue is narrower than the broader shutdown hardening from `#18`. The main gap here is the missing transition after local work: Codex can still stop after edits and a success-style summary without ever entering local review or publish-state follow-through. The fix should make that post-implementation transition mandatory and make the failure mode pressure-testable.

## Goals

- Prevent a `superteam` run from ending successfully after local-only work
- Make the handoff from `Executor` to `Reviewer` mandatory unless an explicit blocker is reported
- Make the handoff from `Reviewer` to `Finisher` mandatory unless an explicit blocker is reported
- Treat a normal assistant closeout after local edits, without local review and publish-state follow-through, as a workflow-contract failure
- Add repo-local pressure-test coverage for the exact Codex failure mode described in `#21`

## Non-Goals

- Redesigning the teammate roster
- Rewriting the broader publish-state shutdown model from `#18`
- Changing the requirement that every `superteam` run publishes a PR
- Adding new teammate roles or runtime-specific machinery

## Design

### Mandatory Post-Implementation Routing

The workflow should treat `Executor` completion as an intermediate milestone, not a valid stopping point. After local implementation work is complete, the next step is always one of two outcomes:

1. route to `Reviewer` for local pre-publish review, then to `Finisher` for publish-state follow-through, or
2. halt explicitly with `superteam halted at <teammate or gate>: <reason>`

There is no successful "local implementation finished" exit path inside `superteam`. A normal closeout message after local edits, when neither `Reviewer` nor `Finisher` has satisfied their contract, is itself a contract violation.

This should be stated directly in the canonical skill contract near the role guidance and shutdown language so the handoff is hard to miss.

### Reviewer And Finisher Are Required Stages

For this issue, `Reviewer` and `Finisher` should be described as required workflow stages after execution rather than best-effort follow-up work.

`Reviewer` remains the intake owner for local pre-publish findings. `Finisher` remains the owner of push, PR publication, CI, external feedback handling, and shutdown checks. The change is not about expanding their responsibilities. It is about making the transition into those responsibilities mandatory after `Executor` completes local work.

If `Reviewer` cannot run, or if `Finisher` cannot safely proceed, the workflow must halt explicitly. It should not silently degrade into a generic assistant finish message that implies the run completed successfully.

### Delegated Prompt Surfaces Must Match

The canonical contract alone is not enough if delegated teammate prompts remain softer than the source skill. The `agent-spawn-template.md` guidance should mirror the same rule in plain language:

- local implementation completion is not workflow completion
- `Reviewer` must run after `Executor` unless the run halts explicitly
- `Finisher` must run after `Reviewer` unless the run halts explicitly
- if the workflow cannot continue safely, the run must report `superteam halted at <teammate or gate>: <reason>` instead of producing a completion-style closeout

This keeps Codex-facing teammate prompts aligned with the source contract and closes the gap where the top-level skill is correct but delegated prompts still permit an early stop.

For this issue, that alignment should be treated as a direct requirement rather than a nice-to-have follow-up. If one surface says the post-implementation transition is mandatory and the other still allows a success-style closeout after local work, the issue is not fixed.

### Pressure-Test The Exact Failure Mode

The repo-local pressure tests should include the exact scenario from `#21`:

- `Executor` completes local edits and verification
- no proper `Reviewer` pass occurs
- no branch push occurs
- no PR is created or updated
- no `Finisher` shutdown checks run
- the run attempts to end with a normal completion-style summary

The expected result is failure, not success. The pressure test should require one of these acceptable outcomes:

1. the run continues into `Reviewer` and then `Finisher`, or
2. the run halts explicitly with the contract-style blocker message

This keeps the change grounded in observable behavior instead of only checking for stronger wording in isolation.

### Scope Of Repository Changes

The implementation should stay narrow and target only the surfaces that directly control or validate this behavior:

- `skills/superteam/SKILL.md`
  - strengthen the post-implementation routing contract
- `skills/superteam/agent-spawn-template.md`
  - mirror the routing requirement in delegated prompts
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - add a walkthrough for the local-only early-stop failure mode

Update other files only if they directly undermine this fix.

## Testing And Verification

- verify the canonical skill makes the transition from `Executor` to `Reviewer` mandatory unless the run halts explicitly
- verify the canonical skill makes the transition from `Reviewer` to `Finisher` mandatory unless the run halts explicitly
- verify the canonical skill forbids completion-style closeout after local-only work
- verify the agent spawn template mirrors the same post-implementation routing rule in Codex-facing prompts
- verify the canonical skill and the agent spawn template agree on the same two allowed post-implementation outcomes: continue into `Reviewer` and `Finisher`, or halt explicitly
- verify both files use the contract-style halt message when the workflow cannot continue safely
- verify the pressure tests include the exact `#21` failure mode: local implementation complete, no reviewer pass, no PR publication, no finisher shutdown checks, attempted completion-style closeout
- verify the pressure test treats that scenario as a failure unless the run continues correctly or halts explicitly

## Acceptance Criteria

- AC-21-1: Given a `superteam` run has completed local implementation work, when neither `Reviewer` nor `Finisher` has satisfied their required responsibilities, then the run cannot end successfully with a completion-style closeout
- AC-21-2: Given `Executor` has completed local implementation work, when the workflow advances normally, then it routes into `Reviewer` and then `Finisher` rather than stopping after local-only work
- AC-21-3: Given the workflow cannot continue safely into `Reviewer` or `Finisher`, when the run stops, then it reports `superteam halted at <teammate or gate>: <reason>` instead of implying success
- AC-21-4: Given delegated Codex-facing teammate prompts are used, when they describe post-implementation behavior, then they match the canonical rule that local implementation completion is not workflow completion
- AC-21-5: Given both the canonical skill and the delegated spawn template govern post-implementation behavior, when either surface is updated for this fix, then both surfaces preserve the same two allowed outcomes: continue into `Reviewer` and `Finisher`, or halt explicitly with the contract-style blocker message
- AC-21-6: Given the repo-local pressure tests are run, when the `#21` failure mode is exercised, then the tests fail any run that ends after local-only work without reviewer, PR publication, and finisher follow-through

## Implementation Notes

- Keep the fix centered on the post-implementation transition contract
- Reuse the existing halt format instead of inventing new failure messaging
- Avoid duplicating the full `#18` shutdown model unless a small reminder is needed for clarity
