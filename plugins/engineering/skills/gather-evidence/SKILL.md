---
name: gather-evidence
description: Gather direct evidence from the current target before responding to a human change request or QA finding. Use when human feedback needs confirmation or proof of resolution.
---

# Gather evidence

Treat human feedback as a claim or requested outcome to investigate. Do not edit
code, reply to the person, resolve their thread, or change their review state.

## Define the evidence cases

Read the complete feedback and its nearby context. Split independent claims
into separate evidence cases. Record each case using
[the evidence fields](references/evidence.md#evidence-case):

- the exact feedback source
- the requested behavior or result
- the expected and reported behavior
- the exact check and required environment
- the current target, pull request, commit, build, or deployment

Do not translate a concrete observation into a proxy. Ask for missing context
only when no direct check can resolve it.

## Inspect the current target

Resolve the current target before gathering evidence. For pull request
feedback, record the current head SHA and confirm that the local checkout or
deployed build matches it. A later push invalidates the evidence.

Gather direct evidence from the interface named by the feedback. Inspect the code
and diff for source claims. Run the exact interaction for behavioral claims.
Use the applicable driver for a UI, CLI, or runtime. Before changing a mobile
simulator or running mobile automation, invoke `running-mobile-simulators`.

Follow [the direct-evidence rules](references/evidence.md#direct-evidence).
Record the command or interaction, target identity, environment, observation,
and artifact location. Do not use a passing check, internal call, element
presence, or agent report as proof of a different property.

## Return a verdict

Return one verdict for each evidence case:

- `confirmed`. Direct evidence reproduces the reported failure or shows that the
  requested outcome is absent from the current target.
- `resolved`. Direct evidence shows the requested outcome on the current target
  and does not reproduce the reported failure.
- `blocked`. The required target, environment, capability, or observation is
  unavailable.
- `decision-needed`. The feedback requires a product or preference decision
  that evidence cannot answer.

For `confirmed`, pass the evidence case to patina-mode's matching playbook. Use
Bug fix for a defect and Feature or Refactoring for a requested change. After
the target changes, run `gather-evidence` again before preparing a response.

## Report

Return the feedback source, verdict, target identity, direct observation, and
artifact or command for each case. State exactly what blocks a `blocked` case.
Leave every human-authored conversation open for the operator.
