# Skills used by the Patina Project team

Installable agent skills for repository scaffolding, project-local skill
installation, GitHub workflows, beginning issue work, issue branch setup, issue
or instruction development (serial and Workflow-parallel), pre-PR branch
polishing, isolated local branch-diff review, PR readiness and merging, Codex
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

GitHub forge work — repository and pull-request operations — is repetitive and
convention-sensitive. `using-github` keeps those forge mechanics consistent;
tracker operations are deliberately delegated to `docs/issue-tracker.md`.

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
the tracker's canonical local branch. `new-branch` resolves an issue, uses the
adapter-provided branch name verbatim, refuses dirty worktrees, and creates or
switches to the local branch without pushing, installing dependencies,
committing, or creating a PR.

See [./skills/new-branch/](./skills/new-branch/) for the skill contract.

### working-on-issue

Every controller needs the same begin-work step. `working-on-issue`
resolves the issue best-effort — from an explicit reference or the current
branch — then uses the tracker adapter to mark it started and lands on its
canonical branch via `new-branch`. It returns cleanly when there is no issue and
never edits the issue body, so every entrypoint aligns work identically.

See [./skills/working-on-issue/](./skills/working-on-issue/) for the skill contract.

### Filing and editing issues

This repository owns no issue-filing or issue-editing skill. Operators publish a
spec with the third-party `/to-spec`, and skills that need issue mechanics —
claiming, labels, lifecycle, relationships, closure — follow
[`docs/issue-tracker.md`](./docs/issue-tracker.md), the sole adapter that
defines them for every provider.

### develop

End-to-end work needs a single entrypoint without weakening the focused skills
that already own branch setup, test-driven implementation, diagnosis,
architecture polish, and PR readiness. `develop` takes a **scope** — an issue
reference, free-form instructions, or both — coordinates `working-on-issue`,
`implement`, `polish`, and `ready-pr`, and stops for human-owned ambiguity
instead of inventing scope.

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

`polish` reviews each committed delta for architecture and Standards/Spec,
records disposable local coverage, and fixes, verifies, commits, and rereviews
incrementally until the current head passes. CodeRabbit can then supply an
independent GitHub second opinion.

See [./skills/polish/](./skills/polish/) for the skill contract.

### ready-pr

Readying branch work is more than opening a pull request. `ready-pr` verifies
the local diff, commits with the repository convention, pushes when needed,
creates or updates a ready-for-review PR from the template, watches checks, and
stops at ready-to-merge.

See [./skills/ready-pr/](./skills/ready-pr/) for the skill contract.

### merge-pr

Merge intent stays separate from readiness work. `merge-pr` enables the
repository-supported auto-merge mode, delegates branch remediation to
`ready-pr`, and reports whether GitHub merged the PR immediately or queued it
behind repository protections.

See [./skills/merge-pr/](./skills/merge-pr/) for the skill contract.

`finish-pr` remains as a deprecated, user-invoked compatibility alias that
routes directly to `ready-pr` and owns no independent workflow.

### codex-pr-feedback-loop

PR review follow-up should preserve the Codex app chat context after the first
successful push. `codex-pr-feedback-loop` creates a thread automation that
polls the current PR, handles actionable review feedback and objective low-risk
cleanup, pushes verified fixes, replies with evidence, and stops when no
actionable work remains.

See [./skills/codex-pr-feedback-loop/](./skills/codex-pr-feedback-loop/) for
the skill contract.

### update-branch

`update-branch` fetches and merges with pure Git, using an open pull request's
target branch ahead of an explicit or default base. After dependency refresh
and verification, an open-PR update is pushed to its configured remote branch;
a branch without an open PR remains local until the operator publishes it.

See [./skills/update-branch/](./skills/update-branch/) for the skill contract.

### grill-to-spec

Grilling usually happens away from the branch that will implement the outcome —
a separate chat, a scratch worktree, or before any branch exists. Writing the
resulting ADR and glossary edits into that tree strands them there.
`grill-to-spec` grills the design to settled and hands it to `/to-spec` with its
doc changes as file-ready proposals, so the worktree can be thrown away and
the implementing branch can apply them verbatim.

See [./skills/grill-to-spec/](./skills/grill-to-spec/) for the skill contract.

### write-changelog

Milestone and Release summaries should come from the canonical tracker rather
than forge event reconstruction. `write-changelog` renders user-facing copy
from the provider selected by the tracker adapter and resolves public `#N`
references to GitHub issues.

See [./skills/write-changelog/](./skills/write-changelog/) for
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
| [using-github](./skills/using-github/) | patinaproject GitHub forge and pull-request conventions |
| [new-branch](./skills/new-branch/) | Prepare local issue branches from the default branch |
| [working-on-issue](./skills/working-on-issue/) | Align an issue: resolve (from ref or branch), mark started, land on its branch |
| [develop](./skills/develop/) | Drive one scope (issue and/or instructions) end to end via working-on-issue, build, polish, and ready-pr |
| [develop-with-workflow](./skills/develop-with-workflow/) | Build one scope's independent slices in parallel onto one converged branch |
| [polish](./skills/polish/) | Run incremental local architecture and code review |
| [ready-pr](./skills/ready-pr/) | Publish completed branch work and prove its PR ready to merge |
| [merge-pr](./skills/merge-pr/) | Enable repository-managed auto-merge for a PR |
| [finish-pr](./skills/finish-pr/) | Deprecated compatibility alias for ready-pr |
| [codex-pr-feedback-loop](./skills/codex-pr-feedback-loop/) | Keep a pushed Codex PR iterating on actionable review feedback |
| [update-branch](./skills/update-branch/) | Update a local work branch from the base branch |
| [install-skills](./skills/install-skills/) | Project-local skills CLI installation workflow |
| [grill-to-spec](./skills/grill-to-spec/) | Grill a design and hand it to `/to-spec` with doc-change proposals |
| [write-changelog](./skills/write-changelog/) | Render milestone or shipped Release notes from tracker issues |
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
  working-on-issue/
  develop/
  develop-with-workflow/
  ready-pr/
  merge-pr/
  finish-pr/
  codex-pr-feedback-loop/
  polish/
  update-branch/
  grill-to-spec/
  write-changelog/
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
