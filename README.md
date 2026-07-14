# Skills used by the Patina Project team

Installable agent skills for repository scaffolding, project-local skill
installation, GitHub workflows, beginning issue work, issue branch setup, issue
or instruction development (serial and Workflow-parallel), pre-PR branch
polishing, isolated local branch-diff review, PR finishing, Codex
PR feedback polling, settled-design documentation capture, release changelog
ceremonies, and local branch updating. They are available across Claude Code,
Codex, and any agent runtime that reads `AGENTS.md`.

## Quickstart

```bash
npx skills@latest add patinaproject/skills
```

The CLI prompts you to pick which skills to install and auto-detects your agent.

### Install via the host marketplace (alternative)

Claude Code:

```text
/plugin marketplace add patinaproject/skills
/plugin install patinaproject-skills@patinaproject-skills
```

Codex:

```text
/marketplace add patinaproject/skills
/install patinaproject-skills
```

> **Security note:** For environments where you want to prevent install scripts
> from running during CLI execution, prefix the `npx` command above with
> `npm_config_ignore_scripts=true`. Not required for standard use.

### Related skills

For skill discovery and catalog navigation, install `find-skills` from the
[vercel-labs/skills](https://github.com/vercel-labs/skills) catalog:

```bash
npx skills@latest add vercel-labs/skills@find-skills
```

## Why these skills exist

### using-github

GitHub work - filing issues, editing issues, starting branches, writing
changelogs, preparing PRs - is repetitive and convention-sensitive. Without a
shared skill, every agent session re-derives the same rules from scratch and
produces inconsistent output. `using-github` reads repository rules and routes
to the correct workflow for each task.

See [./skills/using-github/](./skills/using-github/) for the full README and
skill contract.

### install-skills

Shared workflow skills should be added to a repository without mutating an
operator's global agent environment. `install-skills` gives agents a canonical
`npx skills@latest` workflow: read local guidance, inspect `skills-lock.json`,
install selected skills project-locally for all supported agent targets, and
verify the resulting lockfile and overlay changes.

See [./skills/install-skills/](./skills/install-skills/) for the skill contract.

### new-branch

Issue-linked implementation should start from the repository default branch on
a predictable local branch. `new-branch` resolves an issue, derives GitHub's
default issue-branch name, refuses dirty worktrees, and creates or switches to
the local branch without pushing, installing dependencies, committing, or
creating a PR.

See [./skills/new-branch/](./skills/new-branch/) for the skill contract.

### working-on-github-issue

Every controller needs the same begin-work step. `working-on-github-issue`
resolves the issue best-effort — from an explicit reference or the current
branch — then aligns GitHub state: marks it started (self-assign when
unassigned, move a compatible Project item to "In progress") and lands on the
issue-linked branch via `new-branch`. It returns cleanly when there is no issue
and never edits the issue body, so every entrypoint aligns work identically.

See [./skills/working-on-github-issue/](./skills/working-on-github-issue/) for the skill contract.

### develop

End-to-end work needs a single entrypoint without weakening the focused skills
that already own branch setup, test-driven implementation, diagnosis, local
review, and PR finishing. `develop` takes a **scope** — an issue reference,
free-form instructions, or both — coordinates `working-on-github-issue`,
`implement`, `polish`, and `finish-pr`, and stops for human-owned
ambiguity instead of inventing scope.

See [./skills/develop/](./skills/develop/) for the skill contract.

### develop-with-workflow

A large scope often decomposes into independent vertical slices that build
faster in parallel. `develop-with-workflow` is the explicit opt-in to the Claude
Workflow tool: it splits one scope into those slices, builds them concurrently in
isolated worktrees, and converges them onto one branch, so one scope still yields
one PR.

See [./skills/develop-with-workflow/](./skills/develop-with-workflow/)
for the skill contract.

### polish

A human should only ever see a structurally-settled, self-reviewed branch.
`polish` runs two ordered settle-phases — first deepen the branch's
architecture until a pass accepts nothing more, then review it to green via
`code-review` — so finished work and controller pipelines hit the same pre-PR
readiness bar.

See [./skills/polish/](./skills/polish/) for the skill contract.

### finish-pr

Finishing branch work is more than opening a pull request. `finish-pr` verifies
the local diff, commits with the repository convention, pushes when needed,
creates or updates a ready-for-review PR from the template, watches checks, and
stops at ready-to-merge.

See [./skills/finish-pr/](./skills/finish-pr/) for the skill contract.

### codex-pr-feedback-loop

PR review follow-up should preserve the Codex app chat context after the first
successful push. `codex-pr-feedback-loop` creates a thread automation that
polls the current PR, handles actionable review feedback and objective low-risk
cleanup, pushes verified fixes, replies with evidence, and stops when no
actionable work remains.

See [./skills/codex-pr-feedback-loop/](./skills/codex-pr-feedback-loop/) for
the skill contract.

### update-branch

Keeping a work branch current should be a local git operation unless an
operator chooses to publish it. `update-branch` fetches the selected base
branch, defaults to `origin/HEAD`, guards dirty work, merges with
`git merge --no-ff`, and reports the local-only result plus the push command to
run later.

See [./skills/update-branch/](./skills/update-branch/) for the skill contract.

### write-docs

Settled designs decay when they live only in chat. `write-docs` captures an
already-agreed understanding into CONTEXT.md glossary terms and, sparingly,
ADRs — recording decisions and terminology without re-litigating them.

See [./skills/write-docs/](./skills/write-docs/) for the skill contract.

### write-release-changelog

Shipping a release should close the loop with the people whose feedback it
resolved. `write-release-changelog` runs the release ceremony: it drafts a
community changelog and posts per-item replies, sets resolved feedback to
complete, and links every resolved item in a thank-you.

See [./skills/write-release-changelog/](./skills/write-release-changelog/) for
the skill contract.

### prompting-fable

Fable 5 rewards different prompting than earlier models. `prompting-fable`
carries the guidelines — prompt for distance, cap reasoning effort at high,
write run-until-done goals with permissions and gates, match orchestration to
checkpoints, and route models by a glossary of cost, intelligence, and taste.

See [./skills/prompting-fable/](./skills/prompting-fable/) for the skill
contract.

### scaffold-repository

Teams spend disproportionate time on repo plumbing - commit conventions,
markdown linting, PR templates, and Husky hooks. `scaffold-repository` emits the
full Patina Project baseline and keeps it aligned on rerun.

See [./skills/scaffold-repository/](./skills/scaffold-repository/) for the full
README and skill contract.

## Skills

| Skill | Description |
|---|---|
| [using-github](./skills/using-github/) | Patina Project GitHub workflow conventions |
| [new-branch](./skills/new-branch/) | Prepare local issue branches from the default branch |
| [working-on-github-issue](./skills/working-on-github-issue/) | Align an issue: resolve (from ref or branch), mark started, land on its branch |
| [develop](./skills/develop/) | Drive one scope (issue and/or instructions) end to end via working-on-github-issue, build, polish, and finish-pr |
| [develop-with-workflow](./skills/develop-with-workflow/) | Build one scope's independent slices in parallel onto one converged branch |
| [polish](./skills/polish/) | Ready a branch for review: deepen architecture, then review to green |
| [finish-pr](./skills/finish-pr/) | Finish completed branch work through ready-to-merge PRs |
| [codex-pr-feedback-loop](./skills/codex-pr-feedback-loop/) | Keep a pushed Codex PR iterating on actionable review feedback |
| [update-branch](./skills/update-branch/) | Update a local work branch from the base branch |
| [install-skills](./skills/install-skills/) | Project-local skills CLI installation workflow |
| [write-docs](./skills/write-docs/) | Capture a settled design into CONTEXT.md terms and ADRs |
| [write-release-changelog](./skills/write-release-changelog/) | Run the release ceremony: changelog plus feedback loop-closing |
| [prompting-fable](./skills/prompting-fable/) | Guidelines for prompting and configuring Claude Fable 5 |
| [scaffold-repository](./skills/scaffold-repository/) | Scaffold a new repository to the Patina Project baseline |

## Local iteration

The test suite proves the in-repo skills and workflow contracts are wired correctly. Run
it after any change to `skills/`, `scripts/`, `.agents/skills/`, or `.claude/skills/`.

For the full local verification suite, run:

```sh
pnpm test
```

### Check a - CLI resolves skills from local paths

```sh
npx skills@latest add ./skills/scaffold-repository --list
npx skills@latest add ./skills/install-skills --list
npx skills@latest add ./skills/update-branch --list
npx skills@latest add ./skills/develop --list
npx skills@latest add ./skills/codex-pr-feedback-loop --list
```

### Check b - scaffold-repository cleanup contract

```sh
bash scripts/tests/scaffold-cleanup.test.sh
```

### Check c - dogfood verification, all in-repo skills

```sh
bash scripts/tests/dogfood.test.sh
```

## Repository layout

```text
skills/
  scaffold-repository/
  install-skills/
  using-github/
  new-branch/
  working-on-github-issue/
  develop/
  develop-with-workflow/
  finish-pr/
  codex-pr-feedback-loop/
  polish/
  update-branch/
  write-docs/
  write-release-changelog/
  prompting-fable/
.agents/skills/<name>/               Committed overlay: symlinks to ../../skills/<name>/ (owned) or vendored dirs
.claude/skills/<name>/               Committed overlay: symlinks to ../../skills/<name>/ or ../../.agents/skills/<name>
.claude-plugin/
  marketplace.json                   Claude marketplace catalog
  plugin.json                        Claude plugin manifest
scripts/                             Maintenance and verification scripts
release-please-config.json           Release-please configuration
.release-please-manifest.json        Version manifest
```

See [docs/file-structure.md](docs/file-structure.md) for the full layout
reference.

## License

See [LICENSE](./LICENSE).

## Contributing

See [AGENTS.md](./AGENTS.md) for contributor guidelines and commit conventions.
