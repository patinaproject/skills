# Issue Branch Workflow

**Goal:** Prepare a local branch for issue-linked work without mixing unrelated
state, pushing empty branches, or triggering CI.

## Inputs

Accept a bare issue number, `#<number>`, or a same-repo issue URL. Operate only
against the current working directory's default `gh` repository.

## Steps

1. Resolve the issue:

   ```sh
   issue_json="$(gh issue view "$issue" --json number,title,state)"
   issue_number="$(printf '%s\n' "$issue_json" | jq -r .number)"
   issue_title="$(printf '%s\n' "$issue_json" | jq -r .title)"
   issue_state="$(printf '%s\n' "$issue_json" | jq -r .state)"
   ```

   Refuse if the issue cannot be resolved. Refuse closed issues unless the user
   explicitly allows closed issue work.

2. Check native dependency blockers:

   ```sh
   repo_full_name="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
   owner="${repo_full_name%%/*}"
   repo="${repo_full_name#*/}"
   after=null
   open_blockers_found=0
   while :; do
     if [ "$after" = null ]; then
       after_flag="-F"
       after_value="after=null"
     else
       after_flag="-f"
       after_value="after=$after"
     fi
     if ! page="$(gh api graphql \
       -F owner="$owner" -F repo="$repo" -F number="$issue_number" "$after_flag" "$after_value" \
       -f query='query($owner:String!,$repo:String!,$number:Int!,$after:String){repository(owner:$owner,name:$repo){issue(number:$number){blockedBy(first:100, after:$after){nodes{number title state url} pageInfo { hasNextPage endCursor }}}}}')"; then
       echo "Dependency query failed; refuse unless explicit override." >&2
       exit 1
     fi
     if printf '%s\n' "$page" | jq -e '.errors | length > 0' >/dev/null; then
       echo "Dependency query returned GraphQL errors; refuse unless explicit override." >&2
       exit 1
     fi
     open_blockers="$(printf '%s\n' "$page" |
       jq -r '.data.repository.issue.blockedBy.nodes[] | select(.state == "OPEN") | "#\(.number) \(.title) [\(.state)] \(.url)"')"
     if [ -n "$open_blockers" ]; then
       printf '%s\n' "$open_blockers"
       open_blockers_found=1
     fi
     has_next="$(printf '%s\n' "$page" | jq -r '.data.repository.issue.blockedBy.pageInfo.hasNextPage')"
     after="$(printf '%s\n' "$page" | jq -r '.data.repository.issue.blockedBy.pageInfo.endCursor')"
     [ "$has_next" = "true" ] || break
   done
   if [ "$open_blockers_found" -eq 1 ]; then
     echo "Open native blockedBy dependencies exist; refuse unless explicit override." >&2
     exit 1
   fi
   ```

   The first dependency query sends `after` as JSON `null`; later pages send
   the cursor as a string so GitHub does not type-coerce cursor text.

   Fetch every dependency page before deciding that no open blockers exist. If
   the dependency query fails, refuse unless the user gives an explicit
   current-turn override. This includes GraphQL errors, an unavailable
   `blockedBy` field, or any other result that prevents the workflow from
   checking native GitHub issue relationships as the source of truth.

   Treat blockers with `state: OPEN` as active blockers. If any open blockers
   exist, refuse before inspecting or changing local
   branch state. Report each blocker by number, title, state, and URL. Continue
   only when the user gives an explicit current-turn override such as "start
   anyway" or "start blocked work anyway".

   The following relationships do not halt:

   - Closed blockers do not halt.
   - Body-prose fallback relationships such as `Blocked by #N` do not halt.
   - Issues this target is blocking do not halt.
   - Parent or sub-issue relationships do not halt.

3. Compute the branch name:

   - Lowercase the title.
   - Replace each run of non-`[a-z0-9]` characters with `-`.
   - Trim leading and trailing `-`.
   - Prefix the issue number and `-`.
   - Limit the full branch name to 60 characters. Prefer the previous hyphen
     boundary and trim any trailing hyphen.

4. Inspect local branch state:

   ```sh
   git branch --show-current
   git status --porcelain
   ```

   If the worktree is dirty, refuse without stashing or committing. If already
   on the computed branch, report success and stop. If on a different
   issue-number-prefixed branch, ask before switching.

5. Resolve and fetch the default branch:

   ```sh
   gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
   git fetch origin "$default_branch"
   ```

6. Create or update the local branch:

   - If the branch does not exist locally, run:

     ```sh
     git checkout -b "$branch" "origin/$default_branch"
     ```

   - If the branch exists locally, switch to it and rebase onto
     `origin/$default_branch`.

7. Report:

   ```text
   Branch: <branch>
   Base:   <sha> (origin/<default-branch>)
   ```

## Refusals

- Issue cannot be resolved.
- Issue is closed without explicit allowance.
- Open native `blockedBy` dependencies exist without explicit override.
- The native `blockedBy` dependency query fails without explicit override.
- Worktree has uncommitted changes.
- Default branch cannot be resolved.
- User asks for a different repository from the current working directory.
- Rebase conflicts occur.

## Non-Goals

Do not install dependencies, push, commit, create a pull request, trigger CI, or
begin implementation work.
