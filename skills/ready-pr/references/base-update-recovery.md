# Verify a clean target branch merge

Use these instructions when the pull request target branch merged cleanly and
the merge is still uncommitted. Conflicted merges follow
[the conflict instructions](../workflows/triage.md#merge-conflicts).

Choose the repository check that covers the changed code, target branch merge,
and affected dependencies. Follow `update-branch`'s
[verification rules](../../update-branch/SKILL.md#workflow). Run only that check
through the helper:

```sh
<skill-directory>/scripts/base-update-verify.sh \
  --message '<repository-format commit message>' \
  -- <documented verification command>
```

Keep an extra full-repository command outside the helper unless repository
instructions require it for this change. If that extra command fails, follow
`update-branch` and continue only after proving the same problem exists on the
exact target commit.

The helper:

1. Runs the check once. If it fails, it runs the identical command one more
   time. A passing second attempt counts as a recovered temporary failure.
2. Commits only when the tracked tree still matches the tree that passed. If a
   check changes a tracked file, the helper aborts the merge.
3. Aborts the merge when both attempts fail, leaving the branch at its commit
   from before the merge.

## Helper results

The helper prints one exact result line:

| Result | Exit | Meaning | Next action |
| --- | --- | --- | --- |
| `outcome=verified attempts=1 head=<sha>` | 0 | The first check passed and the checked tree was committed. | Run local checks and review on the new commit, then continue pull request work. |
| `outcome=recovered attempts=2 head=<sha>` | 0 | The second identical check passed and the checked tree was committed. | Continue as above. |
| `outcome=reproducible attempts=2 merge-state=aborted head=<sha>` | 1 | Both checks failed and the merge was aborted. | Stop and report the command and unchanged branch commit. |
| `outcome=drifted attempts=<n> merge-state=aborted head=<sha>` | 1 | A check changed tracked files and the merge was aborted. | Stop and ask the user how that generated change should be handled. |

`ready-pr` runs this helper directly. `merge-pr` calls `ready-pr` instead of
running the helper itself. After a successful recovery, `merge-pr` must refresh
the pull request because its head commit changed.
