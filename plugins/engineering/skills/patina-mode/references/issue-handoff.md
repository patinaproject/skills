# Gate issue-linked routing

Use the issue handoff gate when direct work names an issue or Session pickup
resolves one issue. The gate controls the transition from
**working-on-issues** to another Patina playbook. It does not intercept host
tools used outside Patina routing.

## Run the preflight

Set `entry` to `direct` for a request that names an issue. Set it to
`session-pickup` when a recovered session resolves one issue.

Run **working-on-issues** for that issue. Keep its normal report and its
machine result. The machine result has one of these shapes:

```json
{
  "kind": "passed",
  "issue": {
    "id": "#123",
    "provider": "github",
    "url": "https://github.com/example/project/issues/123"
  },
  "endingBranch": "123-provider-owned-branch",
  "worktreePath": "/absolute/physical/worktree/path"
}
```

```json
{ "kind": "failed", "issue": "#123", "gate": "blocker" }
```

```json
{ "kind": "no-issue" }
```

Use `failed` for every preflight stop or failed supported mutation. Name the
specific gate or operation in `gate`. Preserve `no-issue` as an explicit
result.

## Authorize the transition

Before another playbook changes a branch, edits a file, creates a commit,
changes a pull request, or starts an operational run, send one route request
as JSON on standard input:

```sh
bun <patina-mode-directory>/scripts/issue-handoff.ts route
```

The request names the entry, the next protected operation, and the exact
machine result from **working-on-issues**:

```json
{
  "entry": "direct",
  "operation": "edit",
  "preflight": {
    "kind": "passed",
    "issue": {
      "id": "#123",
      "provider": "github",
      "url": "https://github.com/example/project/issues/123"
    },
    "endingBranch": "123-provider-owned-branch",
    "worktreePath": "/absolute/physical/worktree/path"
  }
}
```

Continue only when the command exits `0` and returns `kind: "continue"`.
Keep the returned `receiptPath` with the task evidence. Exit `2` records and
refuses a missing, failed, `no-issue`, or stale-checkout handoff. Exit `1`
means that the request or runtime boundary is invalid.

The gate compares a passed result with the live physical worktree and branch.
Let **working-on-issues** finish canonical branch handling before calling the
gate. A `no-issue` receipt ends the issue-linked route. The caller can then
classify and start a separate nonissue workflow.
