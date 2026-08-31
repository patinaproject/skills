# Automate pull request feedback

Create this Codex task automation before implementation when `develop` points
here. It resumes the durable controller through implementation, publication,
checks, and feedback. For standalone feedback work, create it after the branch
has been pushed and its pull request exists.

Before a standalone feedback automation, require an authenticated `gh` session
and run:

```sh
gh repo view --json nameWithOwner --jq .nameWithOwner
gh pr view --json number,headRefName,headRefOid,url
```

If no pull request exists, finish the normal pull request workflow first.

## Settings

- Name: `Develop controller` for `develop`, or `PR feedback loop` for standalone
  feedback
- Kind: heartbeat automation
- Destination: current task
- Interval: the user's positive whole number of minutes, or 10 minutes when
  they have no preference
- Status: `ACTIVE`

An explicit `develop` invocation uses ten minutes without asking. For standalone
feedback, ask for the interval before creating the automation. Use the prompt
below. Add repository details only when they help identify the current pull
request.

```text
Resume the current task's durable develop controller. Work in the current worktree. Run the installed develop skill's bundled controller-state script with `show`. If no controller file exists, this is standalone pull request feedback work. An invalid record or branch mismatch is a blocker, not a missing record. If the record is terminal, report its result and stop this automation.

For a nonterminal controller, perform its pending action and follow the phase recorded there. Keep every pending issue requirement in scope. Update the record before this turn ends whenever the phase, pull request, published head, check epoch, pending action, or terminal result changes. A normal turn boundary is progress, not a completed workflow result.

Check the current branch's GitHub pull request for new unresolved review feedback. Use the current working directory's default gh repository. Resolve the repository, pull request, branch, latest commit, and URL before changing anything.

List every review thread with paginated GraphQL. Keep the thread ID, resolution and outdated state, file and line details, comment URL, numeric review comment database ID, author, body, and comment commit. Read the opening comment's author type. Bot means a bot or GitHub App started the thread. Treat every other or unclear author as human. Later replies do not change who started the thread.

For every unresolved item, decide whether to fix it, ask the user, explain it, mark it outdated, or leave it because it repeats an item already handled. Fix clear bugs and objective small corrections such as typos, broken links, stale names or commands, facts that differ from a named source, and repeated machine-checkable settings that should link to their source. Report subjective comments about tone, wording, organization, or naming unless the user asked this task to handle them.

Ask the user before changing requirements, requested behavior, implementation or test strategy, dependency security decisions, or CI behavior. Also stop for missing secrets or permissions, policy restrictions, and conflicts that cannot be resolved safely.

Before editing, inspect the latest pull request commit and current file. Make the smallest fix that addresses the cause. Follow AGENTS.md, CLAUDE.md, and every document they require. Run the smallest documented check that covers the change. Do not use skip variables, broad bypass settings, --no-verify, or hidden exceptions. Report a blocked check instead of claiming it passed.

Commit verified changes with the repository's format. Run the repository's required local review on that exact commit. Fix and commit clear findings, then repeat checks and review until the current commit passes. Push only after that pass.

For a thread started by a bot, post a reply with the fix commit, check result, and explanation, then resolve it with GraphQL after confirming the fix is on the latest pull request commit. Fix code requested in a human-started thread, but do not reply, resolve, dismiss, or request another review. Report that thread to the user instead.

If a human says a previously fixed bug remains or returned, reproduce the latest report before making another fix, even when the pull request commit is unchanged. Finish with a new failing-then-passing reproduction or report what prevents it. Leave the human-started thread unchanged.

Before changing a draft to ready, apply the draft readiness checks in ../../ready-pr/references/readiness-predicate.md. Capture the check-epoch timestamp before the transition. When the checks pass, run gh pr ready, start the controller's new same-head check epoch, and continue until the new required checks finish and a fresh merge state is clean. Do not change issue status.

Stop the automation only when ready-pr reports ready to merge or the next action requires a person. Record `ready-to-merge`, or record `blocked` with the evidence and exact operator action, before stopping. Pending or failed checks, a draft pull request, agent-authored feedback, unpublished work, and an ordinary host turn end remain nonterminal. A human-started thread is complete for this automation after its code fix is on the latest commit and it has been reported to the user. Report the pull request URL, latest commit, handled thread URLs, useful check results, whether the draft became ready, every unresolved human-started thread, and any remaining item with the reason it was left open.
```

Create a heartbeat automation attached to the current task when the Codex app
automation tool is available. If it is unavailable, tell the user to create the
same task automation from the app's Automations menu with the selected interval
and prompt. Create a separate project automation only when the user explicitly
asks for independent runs without this conversation's context.
