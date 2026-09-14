### Opening a PR

Invoked at the end of every other playbook.

**Worktree.** Work from a git worktree off main; subagents inherit it. Multiple `Agent` calls on the same branch each get their own worktree. To reuse one branch across worktrees, resolve and validate `<head-url>` through Shipping step 1, capture it as `head_url`, then run `git fetch -- "$head_url" "refs/heads/$branch" && git reset --hard FETCH_HEAD` between them. Dirty branch with unrelated work: patch out, fresh worktree, apply. Snarled worktree: reset from main, redo minimally.

**Commits.** Commit liberally; rebase into small, ordered commits before opening PRs. Each commit is a future PR: landable, ordered to tell the story. Amend when the fix belongs in a just-made commit; new commit when separable.

**PRs.** Run `/deslop` over the diff before commit. Run `/no-comments` before review. Write every PR title, PR description, and commit body with `/technical-writing`, then apply `/unslop`. Apply every technical-writing layer except Diátaxis. Use one word for each action, keep articles, and avoid `-ing` when a plain verb works.

**Titles.** Use Conventional Commits in the form `type(scope): subject`. Use `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, or `perf` as the type. Use the changed area, such as `pstack` or `patina-mode`, as the scope. Keep the subject short and imperative. Apply the same `/technical-writing` and `/unslop` pass as the body. Name a real symbol when one carries the change. For example, `fix(pstack): retarget opening-a-pr babysit trigger`. Do not add a trailing period.

**Descriptions.** Apply this contract whenever you create or update a PR
description. Write for a tester who does not know the code or the change.

Use the ticket, the current PR description or thread, and the diff or
changed-file list. When these inputs lack required evidence, retrieve the full
ticket discussion, current diff, relevant code, and development-branch
evidence. Retrieved material becomes source input. A changed-file list alone
does not establish behavior.

Use only facts that the sources establish. General knowledge about typical
behavior is not evidence. The source rule overrides any requirement for an
unsupported statement.

| Section | Ticket | PR | Code |
| --- | --- | --- | --- |
| What changed | Yes | Yes | Yes |
| Demo | No | Yes | Record media from the running build |
| Repro steps | Yes | Yes | Do not derive steps from code |
| Happy path | Yes | Yes | Yes |
| Edge cases | No | No | Yes |
| Still works | No | No | Yes |
| Technical notes | Yes | Yes | Yes |

Prefer the ticket for intended requirements and the PR for the delivered
change and its run instructions. Prefer code for actual behavior. When the
ticket and code disagree about visible behavior, What changed and Happy path
describe the code. Do not label checks with their sources.

Include only sections with applicable, useful content, in the order below. Put
every limitation in a GitHub warning callout in its affected section. When that
section is omitted, put the limitation in the most relevant retained section.
This includes known reproduction limits, known verification limits, and
missing evidence. Try to retrieve missing evidence before reporting the gap.
Never turn unavailable evidence into a negative finding or imply that you read
an unavailable source. Missing evidence permits publication only when the
repository's existing publication gates pass.

For a documentation-only diff with no executable behavior, omit Demo, Edge
cases, and Still works. When code is unavailable for an applicable behavior
change, omit unsupported sections. Put this warning in the most relevant
retained section. Unavailable code does not prove that no behavior exists.

> [!WARNING]
> No code supplied

Keep each sentence to 20 words or fewer. Use product nouns and visible
interface text. In What changed, Edge cases, and Still works, describe what a
person does and sees. Do not name internal files, functions, packages, fields,
values, conditions, or states there. Drop any check that lacks a user action
and an observable result.

#### `## What changed`

Write two or three plain sentences about what the person notices. Name the
product or interface. For a bug, take the broken behavior from the ticket and
the corrected behavior from code. Describe code behavior when sources
disagree. Use a warning callout when evidence does not establish the before or
after behavior.

#### `## Demo`

Include this section when a person can see or drive the change, including
through a command line. Omit it for a documentation-only or internal-only
diff, under the rule that a section appears only when it has applicable
content. A change that alters what a person can run or observe carries this
section, even when every changed file is Markdown. A change that only edits
prose omits it, so classify by what the change does and not by the file types
in the diff.

Put one video first, then the screenshots. Capture one still per state the
flow passes through. Use media only, apart from optional captions. Put a
limitation about the Demo itself in Technical notes, because this section
holds media.

The video runs the happy path end to end. It performs the actions that the
`## Happy path` section lists, in the order listed, and ends at that section's
`Result:` line. Demo shows the path and Happy path writes it.

The video carries no length cap. Its length follows the path it runs. Cut
application startup, loading, sign-in, and navigation the reviewer does not
need. For a change with no user interface, the happy path names the command
that exercises the change, and the video runs that command.

Write the video as a bare `https://github.com/user-attachments/assets/...` URL
in its own paragraph, with a blank line above and below. Without those blank
lines, GitHub renders a raw link instead of a player. Give each still its own
paragraph too. Write it as an `<img>` element carrying `width`, `height`,
`alt`, and `src`. Number the `alt` text and walk the flow in order, such as
`01-email-sent`. Add a caption only where the media does not explain itself.

Create the pull request before you supply the media. The pull request number
is required by the attachment command, and the command updates its body.

Use GitHub CLI version 2.99.0 or newer. Upgrade with your package manager
before continuing when `gh --version` reports an older release.

Use an OAuth, classic PAT, or fine-grained PAT with pull-request write access.
Actions `GITHUB_TOKEN` and GitHub App tokens cannot upload these attachments.
GitHub Enterprise Server is unsupported; use github.com.

Keep media outside the repository. Reference each uploaded file locally in
the body first, using `![descriptive alt text](./file)`. Then upload every
file with one command, replacing `<number>` and each path:

```sh
gh pr edit <number> --body-file <body> --attach <image> <video> ...
```

Attach at most 50 files per command. Images must be 10 MB or smaller, and
videos must be 100 MB or smaller on paid plans. Supported types are PNG, JPEG,
GIF, WebP, SVG, MP4, MOV, and WebM. A partial upload still updates the pull
request with successful files and returns non-zero; retry only failed files.

Use concise, meaningful alt text for images by adding `#alt text` to the path,
such as `./login.png#The login error state`. Video attachments have no alt-text
field; describe their visible action and outcome in the surrounding Demo text.
Preserve the PR-before-attach order, and commit no media files.

#### `## Repro steps`

For a bug, copy the ticket's numbered steps. Use the PR's numbered steps only
when the ticket has none. Never construct steps from prose or code. When neither
source has numbered steps, write:

> [!WARNING]
> No repro steps in the ticket or the pull request

For any other change, omit this section.

#### `## Happy path`

Write the shortest path through the new behavior. Take steps from the ticket or
PR. Code may supply omitted steps and decides the final result when sources
disagree.

Write one action per line. Start each action with a verb and use no more than 12
words. The first action names the phone app, website, content admin tool, or
other interface. Put required test data in the action that uses it. After the
last action, write one `Result:` line with only the observable check. Do not add
results after individual actions or repeat an action as the result.

For a change without a user interface, write `No user interface in this
change`. Name the command or other interface that exercises the change. List
the calls in their code-defined order. Use a warning callout if the sources do
not establish a usable path.

In Edge cases and Still works, format each check as one Markdown bullet. Put the
action on its first line and end it with `\` for a hard break. Indent the
`**Result:**` line two spaces directly below it. Leave a blank line between
bullets.

#### `## Edge cases`

Use code only. Inspect every branch, condition, guard, limit, and error that the
change adds or alters. Ignore edits that do not change behavior.

Keep only situations that a person can reach through a screen or command. For
each situation, describe the action and observable outcome in plain language.

Trace each check from the state left by the happy path and earlier checks. Use
only source-established reset steps or distinct test data. Drop a check when
the sources do not establish the required starting state.

Do not carry ticket or PR claims into this section.

#### `## Still works`

Use code only. Find old behavior that must survive both on the happy-path
screen and wherever else the changed code runs. Inspect it in all three ways:

- Search every changed, added, or deleted export name and read its callers.
- Read deleted and replaced lines to identify prior behavior.
- Read unchanged behavior along paths through the changed code.

Untouched callers can establish where the code runs and how a tester reaches
it. Keep only behavior within the changed code's scope. Ignore test files, lock
files, and generated files.

Exclude the happy path and checks that merely expand one of its actions. Drop
checks that the tester cannot cause. If no eligible check remains after all
three inspections, omit this section.

Name the screen in each action. When another interface uses the changed code,
repeat the happy path once through that interface. Deduplicate checks found by
multiple methods.

Rank checks by how many people encounter the behavior. Keep the ten highest. A
shared component, shared constant, or changed access rule outranks the ticket's
named feature. Rewrite or drop any check that requires code knowledge.

Do not carry ticket or PR claims into this section.

#### `## Technical notes`

Keep this section short. Use the ticket, the PR, and code. Use the following
labeled lines when they apply:

- `Setup:` Include only environment prerequisites. Examples include a required
  build, migration, account role, environment setting, browser version, or new
  dependency. Put actions that launch the app, website, tool, or command in
  Happy path.
  Keep test data in the action that uses it. Write `None` only when evidence
  establishes that setup is unnecessary.
- `Version change:` State whether the diff changes the app version, native
  fingerprint, release manifest, or a dependency. Write `No version change`
  only after checking the diff. If the diff is unavailable, warn that the
  version change could not be verified.
- `Demo build:` Name the build the Demo was recorded against. Use the commit
  that the media came from. Include this line whenever the body carries a Demo
  section.
- `Development:` For a bug, state whether the evidence establishes the fault on
  the development branch. Include a source-provided commit. If the fault is
  absent there, put the absence status and the Repro steps limitation in one
  warning callout.
  If retrieval does not establish status, put `Not stated` in a warning
  callout.
- `Intermittent:` Include this line only when the ticket calls the fault
  intermittent. Use the sourced count for repetitions of the Happy path.
  Retrieve a missing count. If no source supplies one, warn that the repeat
  count is not stated.

Put one closing line per completed issue in Technical notes, including both
GitHub and corresponding Linear references. Give each reference its own
`Closes`, `Fixes`, or `Resolves` keyword, chosen independently. For example:
`Closes #123, closes https://linear.app/WORKSPACE/issue/TEAM-123/title`.
Retrieve counterpart IDs through the repository's tracker adapter and linked
issue data. Mark the line incomplete until both IDs are retrieved and each has
its own keyword. Use reference forms accepted by the repository's integration
and closing-reference check.
Do not add a Scope section.

Put an edge case or still works screenshot within the section it proves.
Headline proof lives in Demo.
Put verification reports and reviewer evidence in PR comments or task-local
records. Link them from Technical notes when useful. Treat the QA steps as
proposed until execution evidence proves that they ran. The Demo section is
that evidence. A commit body does not restate its subject.

**Forge.** Resolve the forge before the first PR operation and keep that choice for create, edit, view, watch, and merge. GitHub CLI (`gh`) is the default. If `command -v origin` succeeds and Origin can resolve the repository, prefer `origin pr ...`; if Origin is absent or cannot resolve the repository, stay on `gh` and record the fallback. Record the intended PR base repository as canonical `<base-repo>` and validate it through the active forge. Do not infer it from the checkout's default remote. Capture it as a shell variable and pass `--repo "$base_repo"` to every `gh pr` command. When the head repository is a fork, validate its identity and record its owner and repository name as `<fork-owner>` and `<head-name>`. Do not require Graphite (`gt`).

**Size and stacks.** Prefer five narrow PRs to one large PR. Rebase each child branch onto its parent's exact tip and freeze the bottom-to-top order. When the head and base repositories are the same, make a base-branch chain. The root PR targets trunk and each child PR targets the parent branch. Create a same-repository child with `origin pr create --status open --base "$parent_branch"` or `gh pr create --base "$parent_branch" --repo "$base_repo"` according to the resolved forge. When the head repository is a fork, every PR targets trunk in the base repository while stacked local branches retain parent ancestry. Create every fork PR with the resolved Origin command. With GitHub, capture the approved PR title and body as `<title>` and `<body>`, then run `gh api --method POST "repos/$base_repo/pulls" -f "title=$title" -f "body=$body" -f "head=$fork_owner:$branch" -f "head_repo=$head_name" -f "base=$trunk" --jq .html_url`; add `-F draft=true` only when the readiness rule requires a draft. A fork-only parent branch cannot be a PR base. Before rebasing, force-pushing, or retargeting an existing child, apply Shipping step 4's disarm-and-confirm rule to that child and every descendant. Retarget a same-repository child with `origin pr edit "$pr" --base "$parent_branch"` or `gh pr edit "$pr" --base "$parent_branch" --repo "$base_repo"`. Retarget a fork child with the resolved Origin command or `gh pr edit "$pr" --base "$trunk" --repo "$base_repo"`. Branch from trunk only for independent work. Rebase on trunk before substantial stack work.

**Readiness.** Open each PR ready by default. With Origin, pass `--status open`. With the GitHub CLI create command, omit `--draft` and pass `--repo "$base_repo"`. With the GitHub fork API above, omit the `draft` field. If repository instructions require a draft until named evidence exists, keep the early PR draft and mark it ready only after recording that evidence. On GitHub, pass `--draft` to the CLI create command or `-F draft=true` to the fork API, then later run `gh pr ready "$pr" --repo "$base_repo"`. Use Origin's documented draft and ready operations when Origin is active. If no draft rule applies and a tool still opens the PR as a draft, run `origin pr ready "$pr"` or `gh pr ready "$pr" --repo "$base_repo"` according to the resolved forge. Run `origin pr view "$pr"` or `gh pr view "$pr" --repo "$base_repo"` before you refer to PR status.

**Babysit.** Opening a PR does not start a babysit. Post the URL and keep building. Finish the phase or stack first. Run a separate babysit pass only when the user asks for one after the whole stack exists, per `babysit.md`. A babysit for each new PR stalls the build and spends checks on commits that later waves restart. Push back when feedback drifts from intent.

A subagent that opens a PR runs `interrogate`, `/deslop`, and `/no-comments`. It returns the URL and does not babysit. Return to the parent.
