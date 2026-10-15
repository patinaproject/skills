---
name: pr-readiness
description: Evaluate pull-request evidence against the current candidate and publish the only ready transition.
---

# PR readiness

`pr-readiness` is the single owner of readiness evaluation and publication. An author may trigger a producer, but only a producer GitHub attributes may author its result. The evaluator reads that evidence from the forge itself. It never accepts an observation from a file, a flag, or the PR author.

```sh
pr-readiness open --repo OWNER/REPO --base BASE --head BRANCH --mode draft|ready
pr-readiness check --repo OWNER/REPO --pr NUMBER
pr-readiness publish --repo OWNER/REPO --pr NUMBER
pr-readiness gate --repo OWNER/REPO --pr NUMBER
```

`open` passes the caller's selected creation mode to the forge. `check` is read-only. It prints the JSON report and writes one line per unmet obligation to stderr, naming the command that produces the missing evidence. `publish` evaluates even when the PR is already ready, reads the remote candidate and body again, rejects a race, writes an immutable packet with put-if-absent semantics, and performs the forge ready transition with an expected head. Publishing a draft requires `--takeover=true` (or the trusted automation environment). `publish` never posts a status. `gate` posts the `PR readiness` status for the head and exits 0 whether the PR is ready or not. All four commands share one evaluation.

## Producers

| Producer | Evidence the evaluator reads | Who can author it |
| --- | --- | --- |
| `checks` | Check runs on the head from the `github-actions` app with the names the policy lists. The newest run in each check suite counts, so a successful re-run replaces a failure. | A GitHub Actions workflow job |
| `approval` | The latest review at the head from each reviewer who is a `User` with write or admin permission on the repository and not the PR author. A change request fails the obligation. | A `User` with write or admin permission who is not the PR author |

One approval satisfies every obligation that names `approval`. Observation IDs are `<obligation>@<head>`, so the PR body's `## Evidence` claims can name them.

## Policy

The policy is `.github/pr-readiness.json`, read through the forge at the PR's base SHA, so a PR cannot change the policy that judges it. It maps each obligation (`standards`, `spec`, `hygiene`, `tests`, `lint`, `behavior`) to a producer.

```json
{ "version": 1, "obligations": { "tests": { "producer": "checks", "checks": ["Unit tests"] }, "standards": { "producer": "approval" } } }
```

A repository without the file, and any obligation the file omits, requires `approval`. A malformed file, an unknown obligation, or an unknown producer fails the evaluation. `behavior` does not apply to a documentation-only change. Evidence for `behavior` from another head is never reused, so a new head always reruns it.

## Status

Only the `PR readiness` workflow posts the `PR readiness` status. It runs `gate` from the default branch on `pull_request_target` and `workflow_run` events only, so a PR branch's own workflow file never runs with status-write permission. The `PR readiness review relay` workflow has no permissions and turns each review event into a `workflow_run` the gate answers. The gate never checks out the PR head. The bootstrap requires the operator to make `PR readiness` a required check pinned to the GitHub Actions app, so a status any other identity posts cannot satisfy it.

The executable and pure evaluator live under `scripts/`. Forge and packet-store adapters are explicit seams. Production uses the `gh`/`origin` forge adapter and durable filesystem packet store, and tests inject a fake forge.
