# Base-Update Recovery Contract

This reference is the single source of truth for verifying a clean,
uncommitted base merge before it is committed. `ready-pr` owns the contract
and applies it directly; `merge-pr` consumes it through delegated `ready-pr`
remediation.

## Scope

Apply this contract when a base-branch merge applied cleanly — no conflicted
paths — and sits uncommitted in the working tree. Conflicted merges stay on
the conflict path in [triage.md](../workflows/triage.md).

## Contract

Run the repository's documented verification through the bundled helper,
passing the repository's normal issue-tagged commit message:

```sh
<skill-directory>/scripts/base-update-verify.sh \
  --message '<repository-format commit message>' \
  -- <documented verification command>
```

The helper enforces the contract mechanics:

1. **Bounded retry.** Verification runs at most twice: one attempt, then one
   identical re-run when the first attempt fails. Classification is
   empirical: a failure that clears on the identical re-run was
   **retryable**; a failure that repeats is **reproducible**. A failure that
   cannot be classified as retryable — the command is missing, the
   environment is broken — repeats and lands on the reproducible path.
2. **Exactly verified head.** The helper commits the merge only when the
   passing run's tree is identical in tracked content to the tree being
   committed. When verification mutated tracked files after the passing run,
   it aborts the merge instead of committing an unverified head.
3. **Reproducible failure aborts.** When both bounded attempts fail, the
   helper runs `git merge --abort`, leaving the branch unchanged at its
   pre-merge head.

## Outcomes

Each run prints one machine-readable outcome line:

| Outcome line | Exit | Meaning | Caller action |
| --- | --- | --- | --- |
| `outcome=verified attempts=1` | 0 | First attempt passed; the exactly verified merged head is committed. | Return to the pre-publish evidence loop, then restart the readiness loop on the new head. |
| `outcome=recovered attempts=2` | 0 | The first failure was retryable; the bounded retry passed and the exactly verified merged head is committed. | Same as `verified`. |
| `outcome=reproducible attempts=2 merge-state=aborted` | 1 | The failure repeated on the bounded retry; the merge is aborted and the branch is unchanged. | Stop under the verification stop condition. The report names the failing verification command and the final merge state: merge aborted, branch unchanged at its pre-merge head. |
| `outcome=drifted merge-state=aborted` | 1 | A passing run mutated tracked files, so the merged head is no longer exactly verified; the merge is aborted. | Stop for operator input: the verification command is not commit-safe. |

## Consumers

- `ready-pr` applies the contract in its mergeability gate
  ([ready-for-merge.md](../workflows/ready-for-merge.md) step 8). Exit 0
  continues the readiness loop; exit 1 is a stop with the outcome line's
  report.
- `merge-pr` never runs the helper directly. Delegated `ready-pr`
  remediation applies it; a `recovered` head changes the PR head SHA, so
  `merge-pr`'s post-delegation state refresh sees progress and continues
  toward repository-managed auto-merge. A `reproducible` stop becomes
  `merge-pr`'s `human-blocked` report, carrying the same failing
  verification and final merge state.
