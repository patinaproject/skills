# Pull request comments Workflow

**Goal:** Handle inline PR review feedback in the current working directory's
default `gh` repository by enumerating review threads, verifying each comment
against the latest head, replying with evidence, and optionally resolving only
threads that are actually handled.

REST review comments alone are insufficient for this workflow because they do
not expose the full review-thread resolution model. Use GraphQL review threads
for thread state and REST only for threaded inline replies.

---

## Preconditions

Operate only in the current working directory's default `gh` repository.
Before replying to, resolving, or reporting feedback handled, capture:

- Repository owner and name.
- Pull request number.
- Pull request branch.
- Latest PR head SHA.
- The current working tree contents for the referenced files.

Resolve the target PR:

```bash
gh repo view --json nameWithOwner --jq .nameWithOwner
gh pr view "$pr" \
  --json number,headRefName,headRefOid,url \
  --jq '{number, headRefName, headRefOid, url}'
```

Store the latest head as `$head_sha`. Re-fetch it immediately before final
reporting if time has passed or new commits may have landed.

---

## Checklist (use TodoWrite)

Create todos for each step before starting:

- [ ] Step 1: Resolve repo, PR number, branch, and latest head SHA
- [ ] Step 2: Enumerate review threads with paginated GraphQL
- [ ] Step 3: Classify unresolved, resolved, outdated, and non-blocking items
- [ ] Step 4: Route requirement-bearing feedback through Superteam owners
- [ ] Step 5: Verify each handled item against the latest head
- [ ] Step 6: Post evidence-bearing threaded replies through REST
- [ ] Step 7: Optionally resolve eligible threads through GraphQL
- [ ] Step 8: Report handled, unresolved, routed, and non-blocking feedback

---

## Step 1: Resolve Current PR State

Capture the repository and PR metadata from the current working directory's
default `gh` repository:

```bash
repo_json="$(gh repo view --json nameWithOwner \
  --jq '{nameWithOwner}')"
owner="$(printf '%s\n' "$repo_json" | jq -r '.nameWithOwner | split("/")[0]')"
repo="$(printf '%s\n' "$repo_json" | jq -r '.nameWithOwner | split("/")[1]')"

pr_json="$(gh pr view "$pr" \
  --json number,headRefName,headRefOid,url \
  --jq '{number, headRefName, headRefOid, url}')"
head_sha="$(printf '%s\n' "$pr_json" | jq -r '.headRefOid')"
```

If any value is empty, halt:

> "Could not resolve repo, PR, branch, and latest head SHA from the current
> `gh` repository; refusing to handle PR comments."

---

## Step 2: Enumerate Review Threads

Use paginated GraphQL. Do not treat the first page as complete.

```bash
gh api graphql --paginate \
  -f owner="$owner" \
  -f repo="$repo" \
  -F number="$pr" \
  -f query='
query($owner: String!, $repo: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $endCursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          originalLine
          comments(first: 100) {
            nodes {
              id
              databaseId
              author { login }
              body
              url
              path
              line
              originalLine
              commit { oid }
              createdAt
            }
          }
        }
      }
    }
  }
}'
```

Retain this inventory for every relevant thread:

- Thread GraphQL `id`.
- Thread `isResolved`.
- Thread `isOutdated` where GitHub returns it.
- Thread path, line, and original-line fields.
- Each comment's numeric `databaseId`.
- Each comment's GraphQL `id`, URL, author, and body.
- Each comment path, line, original-line fields, and commit OID.

If a thread has more than 100 comments or the returned shape appears truncated,
re-query that thread before replying. Do not infer resolution from REST comment
lists.

---

## Step 3: Classify Thread State

Classify each thread before any mutation:

| State | Classification |
|---|---|
| `isResolved: true` | Already resolved; report only if relevant. |
| `isResolved: false` | Unresolved, even if it already has replies. |
| `isOutdated: true` | Potentially stale; verify before calling non-blocking. |
| Missing `isOutdated` | Unknown freshness; verify against latest head. |

Replies do not equal resolution. A thread with replies remains unresolved when
`isResolved: false`; reply count and elapsed time are not completion evidence.

---

## Step 4: Route Requirement-Bearing Feedback

Before fixing or replying, classify the substance of the feedback.

Route through `Brainstormer -> Planner -> Executor` when feedback changes any
of these:

- Requirements.
- Acceptance criteria.
- Scope.
- User-visible behavior.
- Workflow contracts.

Do not implement or reply as complete until that route has happened and PR
comment handling resumes with the approved outcome.

Implementation-detail feedback that preserves approved requirements and
acceptance intent may route directly to the implementation owner. Say that
classification out loud in the report or reply evidence.

---

## Step 5: Verify Against Latest Head

Before replying to or resolving a thread, verify whether the referenced state
still applies to the latest head.

Required checks:

1. Reconfirm the PR head SHA if new commits may have landed.
2. Inspect the referenced file and nearby lines in the working tree.
3. Compare the thread path and comment path to the current path.
4. Compare `line` and `originalLine` context to the current implementation.
5. Compare the comment commit OID to `$head_sha` and the current diff.
6. If stale or outdated, classify as non-blocking only with concrete evidence.
7. If still applicable, fix or route it before replying as handled.

Useful commands:

```bash
gh pr view "$pr" --json headRefOid --jq .headRefOid
git rev-parse HEAD
git show --stat --oneline "$head_sha"
git blame -L "$start,$end" -- "$path"
sed -n "${start},${end}p" "$path"
```

If the working tree does not reflect the PR head, state the mismatch and halt
instead of replying or resolving.

---

## Step 6: Reply Inline Through REST

Use the REST threaded replies endpoint for inline PR review comments:

```bash
gh api -X POST \
  "repos/$owner/$repo/pulls/$pr/comments/$comment_database_id/replies" \
  -f body="$body"
```

`$comment_database_id` is the numeric review comment `databaseId` from the
GraphQL inventory, not the GraphQL node ID. When documenting the endpoint, use
the shape `repos/<owner>/<repo>/pulls/<n>/comments/<id>/replies`.

Replies must include evidence:

- If a fix commit exists, include the relevant commit SHA or short SHA and a
  concise explanation of how the latest head addresses the comment.
- If no fix commit exists because the comment is stale, duplicate,
  informational, or not applicable, state the concrete evidence for that
  classification.
- If the item was routed through Superteam owners, state the routing result or
  that handling is still pending.

Do not post a reply that says the item is handled based only on local intent,
silence, elapsed time, PR creation, or green CI.

---

## Step 7: Optionally Resolve the Thread

Only after current-head verification and concrete handling evidence, optionally
resolve the thread through GraphQL:

```bash
gh api graphql \
  -f threadId="$thread_id" \
  -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread { id isResolved }
  }
}'
```

Eligible threads must be one of:

- Fixed in code, tests, docs, or workflow contracts and verified on latest head.
- Stale, duplicate, informational, or otherwise non-blocking with evidence.
- Routed through the required Superteam owner path and returned with a handled
  outcome.

If the mutation fails or permissions are unavailable, leave the
evidence-bearing threaded reply in place and report the thread as still
unresolved. Do not claim GraphQL resolution happened unless the mutation returns
the thread with `isResolved: true`.

---

## Step 8: Report Handling Status

A PR comment is "handled" only when it is one of:

- Addressed in code, tests, docs, or workflow contracts and verified on latest
  head.
- Replied to with evidence and optionally resolved through GraphQL.
- Routed through the proper Superteam owner path when requirement-bearing.
- Classified non-blocking with concrete evidence.

Final reports should include:

- Latest head SHA used for verification.
- Thread URL or comment URL.
- Thread ID and resolution state when available.
- Numeric review comment database ID used for replies.
- Fix SHA, routing outcome, or non-blocking evidence.
- Any threads that remain unresolved because resolution was unavailable.

Silence, elapsed time, local intent, reply without verification, PR creation,
and green CI are not proof that PR feedback was handled.

---

## Halt and Refusal Conditions

Stop and do not reply, resolve, or report feedback handled when:

1. The repo, PR number, branch, or latest head SHA cannot be resolved.
2. Review threads were not enumerated through paginated GraphQL.
3. The relevant thread lacks retained IDs, paths, line context, URLs, and commit
   OIDs needed for verification.
4. The working tree does not match the PR head being reported.
5. The comment still applies but has not been fixed or routed.
6. Requirement-bearing feedback has not gone through
   `Brainstormer -> Planner -> Executor`.
7. Resolution permissions are unavailable and no evidence-bearing threaded
   reply has been left.
8. The only evidence is silence, elapsed time, local intent, PR creation, or
   green CI.

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Listing REST review comments only | Use GraphQL review threads with `--paginate`. |
| Treating the first GraphQL page as complete | Keep paginating until `hasNextPage` is false. |
| Treating a reply as resolution | Check `isResolved`; replies alone do not close threads. |
| Replying to an old line without checking current code | Compare path, line context, and commit OID to latest head. |
| Using a GraphQL node ID in the REST reply URL | Use the numeric `databaseId` review comment ID. |
| Omitting fix evidence | Include a fix SHA or concrete non-blocking evidence. |
| Resolving before verification | Resolve only after latest-head handling evidence exists. |
| Implementing requirement changes directly | Route through `Brainstormer -> Planner -> Executor`. |
| Reporting green CI as handled feedback | Report latest-head verification and GitHub-visible evidence. |
