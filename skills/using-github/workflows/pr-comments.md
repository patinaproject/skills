# Handle pull request comments

Use GraphQL review threads to read complete thread state. Use the REST API only
to post an inline reply. Work in the current directory's default `gh`
repository.

## Resolve the pull request

Capture the repository, pull request, branch, latest commit, and URL:

```bash
repo_json="$(gh repo view --json nameWithOwner --jq '{nameWithOwner}')"
owner="$(printf '%s\n' "$repo_json" | jq -r '.nameWithOwner | split("/")[0]')"
repo="$(printf '%s\n' "$repo_json" | jq -r '.nameWithOwner | split("/")[1]')"

pr_json="$(gh pr view "$pr" \
  --json number,headRefName,headRefOid,url \
  --jq '{number, headRefName, headRefOid, url}')"
head_sha="$(printf '%s\n' "$pr_json" | jq -r '.headRefOid')"
```

Stop when any value is empty. Re-fetch `head_sha` before reporting when another
commit may have been pushed.

## Read every review thread

Paginate GraphQL results:

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
              author { login __typename }
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

Keep every thread's GraphQL ID, resolved and outdated state, path, line, and
original line. Keep every comment's database ID, GraphQL ID, URL, author type,
body, path, lines, and commit. Re-query any thread with more than 100 comments
or an apparently incomplete result.

`isResolved: false` means the thread remains open even when it has replies.
`isOutdated: true` means the line may no longer apply, but current code must
confirm that.

## Decide what to do

Before editing or replying:

1. Reconfirm the pull request commit when another commit may have landed.
2. Inspect the current file and nearby lines.
3. Compare the thread path, line, original line, and comment commit with the
   current file and pull request diff.
4. If local `HEAD` differs from the pull request commit, report the mismatch and
   stop.
5. Fix feedback that still applies and belongs to the accepted pull request.
6. Ask the user before changing requirements, acceptance criteria, requested
   behavior, implementation strategy, test strategy, or the work included in
   the pull request.
7. Mark an item outdated, duplicate, informational, or not applicable only with
   current evidence.

Useful commands:

```bash
gh pr view "$pr" --json headRefOid --jq .headRefOid
git rev-parse HEAD
git show --stat --oneline "$head_sha"
git blame -L "$start,$end" -- "$path"
sed -n "${start},${end}p" "$path"
```

Read the opening comment's `author.__typename`. `Bot` means a bot or GitHub App
started the thread. Treat every other or unclear author as human. Later replies
do not change who started it.

Fix valid feedback from both. Reply to and resolve only bot-started threads.
Leave human-started threads for their author or the user and report them in the
Codex task.

## Reply to a bot-started thread

Post the inline reply through REST with the numeric comment `databaseId`:

```bash
gh api -X POST \
  "repos/$owner/$repo/pulls/$pr/comments/$comment_database_id/replies" \
  -f body="$body"
```

For a code fix, include the fix commit and explain how the latest pull request
commit addresses the comment. For an outdated, duplicate, informational, or
inapplicable item, state the current evidence. If a user decision was needed,
report that decision before replying.

Do not say an item is handled based only on intent, elapsed time, pull request
creation, or green CI.

## Resolve a bot-started thread

After the fix or explanation is present on the latest commit and the evidence
reply has been posted, resolve through GraphQL:

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

Verify that the response returns `isResolved: true`. If the call fails or
permission is missing, leave the evidence reply and report the open thread.

When feedback names a repeated pattern, search for every other match before
resolving and explain any match that remains.

## Final report

For every handled or open thread, report the latest pull request commit, thread
or comment URL, resolution state, useful fix commit or evidence, and any user
decision still needed. Include the numeric comment database ID only when it
helps diagnose a reply failure.

Stop without replying or resolving when the pull request cannot be identified,
threads were not fully paginated, required IDs or line context are missing,
local files do not match the pull request commit, the comment still needs a fix
or user decision, or no evidence reply can be posted.
