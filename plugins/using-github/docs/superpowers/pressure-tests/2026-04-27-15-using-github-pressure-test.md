# Pressure Test: /using-github Skill [#15](https://github.com/patinaproject/github-flows/issues/15)

## RED: Baseline Without /using-github

Run metadata:

- Agent: `019dcd76-3d05-7ab1-9958-befe174efb14` (`Noether`)
- Workspace: `/Users/tlmader/.codex/worktrees/9d37/github-flows`
- Commit under test: `c1ce4aa` (`docs: #15 plan using-github implementation`)
- Context: design and implementation plan existed; `skills/using-github/` did
  not exist.

Prompt:

> You are in patinaproject/github-flows. A user asks you to file a GitHub issue,
> start an issue branch, update PR guidance, and avoid leaking private repo
> details. Which repository guidance and skills do you use first?

Observed gap:

- No `skills/using-github/SKILL.md` exists.
- The available skill entry points are `new-issue`, `new-branch`,
  `edit-issue`, and `write-changelog`.
- Agents must discover `AGENTS.md`, `.github/pull_request_template.md`,
  `docs/issue-filing-style.md`, and the individual skill contracts piecemeal.
- There is no central skill that tells agents how to route mixed GitHub work.

Observed baseline response:

- The baseline agent found only `skills/new-issue/SKILL.md`,
  `skills/new-branch/SKILL.md`, `skills/edit-issue/SKILL.md`, and
  `skills/write-changelog/SKILL.md`.
- It said it would start with `AGENTS.md`, then separately inspect
  `new-issue`, `new-branch`, `docs/issue-filing-style.md`, and the PR template.
- It identified the gap as "the repo has the ingredients, but not the
  entrypoint."

Transcript excerpt:

- "There is no single umbrella skill currently available to invoke for the
  mixed prompt."
- "So from a fresh-agent perspective, I would have to assemble the answer
  piecemeal."
- "The repo has the ingredients, but not the entrypoint."

Expected fix:

- `/using-github` exists and routes mixed GitHub work through the current
  specialized skills and repository docs.

## GREEN: With /using-github

Run metadata:

- Agent: `019dcd7d-7e44-72b3-8665-f1defad4c26c` (`Bacon`)
- Workspace: `/Users/tlmader/.codex/worktrees/9d37/github-flows`
- Commit under test: working tree later committed as `0dc30e1`
  (`fix: #15 align using-github prompts`)
- Context: `skills/using-github/SKILL.md`, OpenAI skill metadata, repository
  guidance updates, and Codex `$using-github` prompt alignment were present.

Prompt:

> You are in patinaproject/github-flows. A user asks you to file a GitHub issue,
> start an issue branch, update PR guidance, and avoid leaking private repo
> details. Which repository guidance and skills do you use first?

Observed fresh-agent response:

- `/github-flows:using-github` is the first skill for mixed GitHub behavior.
- New issues route to `/github-flows:new-issue`.
- Issue branches route to `/github-flows:new-branch`.
- Existing issue edits route to `/github-flows:edit-issue`.
- Milestone changelogs route to `/github-flows:write-changelog`.
- PR work routes through `.github/pull_request_template.md`, commit and PR
  title rules, and acceptance-criteria verification.
- Public text is checked against public-repo leak-guard expectations from the
  repository docs.
- The umbrella skill does not duplicate the detailed specialized workflows.
- No conflicting duplicate mixed-GitHub procedure was found.

Non-blocking note:

- There is no dedicated PR skill. `/using-github` correctly routes PR work to
  repository guidance and the PR template instead of inventing another
  workflow.
- Codex-facing prompts use the `$using-github` shorthand while most repository
  docs use `/github-flows:using-github`; this is editor-specific invocation
  syntax, not a procedural conflict.

Transcript excerpt:

- "Yes: current repo guidance discovers `/github-flows:using-github` as the
  central entry point."
- "`skills/using-github/SKILL.md` routes: new issues to
  `/github-flows:new-issue`, existing issue edits to
  `/github-flows:edit-issue`, issue branches to `/github-flows:new-branch`,
  milestone changelogs to `/github-flows:write-changelog`."
- "I did not find a conflicting duplicate mixed-GitHub procedure."
