# Target-Merge Verification

This is the verification vocabulary for a pull-request target merge. Apply it
from `update-branch`, `ready-pr`, and any controller that consumes their
outcomes.

## Verification classes

- **Scoped verification** is the repository-documented, proportional evidence
  for the pull-request delta, resolved conflicts, and dependency effects that
  can change branch behavior. It is always required.
- **Broad verification** is an additional repository-health command whose
  coverage extends beyond those seams. It is required only when repository
  guidance explicitly makes it mandatory for this change.
- A **branch-caused failure** comes from an input changed by the branch, an
  interaction introduced by the target merge, or a failure that prevents
  scoped verification from completing.
- A **target-owned failure** is a broad, non-required failure whose cause is
  outside the pull-request delta. Classify it only when the failing source and
  every rule, configuration, or other input that explains the failure are
  unchanged from the exact fetched target, or when the same failure reproduces
  on that target.

An unclassified broad failure remains blocking. A filename alone is not
ownership evidence: account for dependency effects and other changed inputs
that could interact with the failing contract.

## Merge outcome

Scoped verification must pass before a target merge is committed. A
branch-caused failure, unavailable scoped evidence, or failed mandatory broad
command restores the pre-merge branch and stops. A target-owned broad failure
is a disposition: leave the unrelated defect unchanged, commit and push the
verified merge through normal hooks, then let required checks evaluate the new
head.

For the unchanged-input evidence path, run the bundled helper while the merge
is resolved, staged, and uncommitted:

```sh
<update-branch-directory>/scripts/update-verify.sh \
  --message '<repository-format merge commit message>' \
  --target <fetched-target-ref> \
  --scoped <proportional-verification-command> \
  --broad <additional-broad-command> \
  --contract '<failing contract>' \
  --evidence <failing-source> \
  --evidence <relevant-rule-or-config>
```

Repeat `--evidence` until every input supporting the ownership claim is named.
Add `--broad-required` when repository guidance makes the broad command
mandatory. Omit `--broad` and `--evidence` when no additional broad command
applies.

The helper verifies that its target is the in-progress merge target, runs
scoped verification first, checks that named evidence paths are unchanged in
the staged merge, and commits only an exact tracked tree that was verified. If
normal commit hooks change that tree, it reruns scoped and broad verification
on the committed head before allowing publication. A blocking pre-commit
outcome aborts the merge; a blocking post-commit outcome leaves the commit
local. A `target-owned` outcome records the failing contract, broad command,
and ownership evidence.

When ownership is proved by reproducing on the target instead, preserve the
same contract manually: record the exact target SHA and reproduction command,
restore the resolved merge, rerun scoped verification on its exact staged
tree, and commit through normal hooks. A reproduction that cannot run is not
evidence.

## Resume and readiness

Record a target-owned disposition with the broad command, failing contract,
exact target SHA, ownership evidence, and required-check outcome on the pushed
head. On a resumed run, reuse that disposition only when the target SHA,
failure, and evidence inputs are unchanged; continue from the committed or
pushed head instead of recreating and aborting the merge.

Local disposition never overrides a required current-head check. A failed
required check keeps the pull request non-ready and follows the readiness
workflow's normal triage.
