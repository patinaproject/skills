# Skills used by the Patina Project team

Installable agent skills for repository scaffolding, project-local skill
installation, GitHub workflows, issue preflight, grill-and-hand-off design
specs, contract-based system design, offensive-programming classification,
current-target evidence for human feedback, shared-host mobile simulator
sessions, system design review, and focused system design grilling.
The catalog also includes prompt authoring for `patina-mode` runs.
They are available across Claude Code, Codex, and any agent runtime that reads
`AGENTS.md`.

## Quickstart

```bash
npx skills@latest add patinaproject/skills
```

The CLI prompts you to pick which skills to install and auto-detects your agent.

### Install via the host marketplace (alternative)

Claude Code:

```text
/plugin marketplace add patinaproject/skills
/plugin install engineering@patinaproject-skills
```

Install the Patina Project Skills plugin separately for its repository
scaffolding, GitHub, install, and system-design skills:

```text
/plugin install patinaproject-skills@patinaproject-skills
```

Codex:

```text
/marketplace add patinaproject/skills
/install engineering
```

Install the Patina Project Skills plugin separately for its repository
scaffolding, GitHub, install, and system-design skills:

```text
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

### working-on-issues

Engineering uses `working-on-issues` for its stricter issue preflight. It
resolves one issue, discovers the live tracker contract, and enforces the
completed-issue, blocker, branch, and worktree gates before marking work
started.

See [./plugins/engineering/skills/working-on-issues/](./plugins/engineering/skills/working-on-issues/) for the skill contract.

### Filing and editing issues

This repository owns no issue-filing or issue-editing skill. Operators publish a
spec with the third-party `/to-spec`, and skills that need issue mechanics —
claiming, labels, lifecycle, relationships, closure — follow
[`docs/issue-tracker.md`](./docs/issue-tracker.md), the sole adapter that
defines them for every provider.

### move-branch-here

Git refuses to check out a branch another worktree already holds, and the
manual recovery strands work or drops review coverage. `move-branch-here`
releases the branch from that worktree, attaches it to the current one, and
restores the holder when attaching fails.

See [the Engineering copy](./plugins/engineering/skills/move-branch-here/) for
the skill contract.

### grill-to-spec

Grilling usually happens away from the branch that will implement the outcome,
in a separate chat, a scratch worktree, or before any branch exists. Writing the
resulting ADR and glossary edits into that tree strands them there.
`grill-to-spec` ends when the frontier is empty and the operator confirms a
shared understanding, then asks them to run `/to-spec`. The settled decisions
stay in the conversation. `/to-spec` turns them into complete file-ready ADR
and glossary proposals on the published spec for the implementing branch to
apply verbatim.

See [./skills/grill-to-spec/](./skills/grill-to-spec/) for the skill contract.

### design-by-contract

`design-by-contract` selects consequential client-supplier contracts and states
what each contract requires, ensures, and maintains. It compares changes and
alternatives through precise clauses, with tables or Mermaid diagrams when a
visual explanation materially improves clarity.

See [./skills/design-by-contract/](./skills/design-by-contract/) for the skill
contract.

### principle-offensive-programming

`principle-offensive-programming` classifies a proposed check, assertion,
fallback, or shortcut by its source and reachability. It validates untrusted
input, handles expected behavior at its owner, and makes internal defects fail
close to their cause.

See
[./plugins/engineering/skills/principle-offensive-programming/](./plugins/engineering/skills/principle-offensive-programming/)
for the skill contract.

### grill-system-design

System design grilling should focus on choices that deserve durable context.
`grill-system-design` routes that interview through `grill-to-spec` and limits
questions to hard-to-reverse, surprising trade-offs.

See [./skills/grill-system-design/](./skills/grill-system-design/) for the skill
contract.

### review-system-design

System design review needs an implementation-focused map of the contracts that
changed. `review-system-design` presents those contracts in dependency-ordered
rounds for a human reviewer.

See [./skills/review-system-design/](./skills/review-system-design/) for the
skill contract.

### writing-for-patina-mode

`writing-for-patina-mode` turns plain-language work or a draft into one short
operator prompt. It selects one current `patina-mode` playbook, keeps the facts
that only the operator can supply, and names the owner of each rule removed
from a draft.

See [./skills/writing-for-patina-mode/](./skills/writing-for-patina-mode/) for
the skill contract.

### gather-evidence

Human change requests and QA findings need direct evidence from the current
target before the agent edits code or prepares a response. `gather-evidence`
records a verdict for each claim and routes confirmed work back to patina-mode.
It does not own implementation, replies, thread resolution, or review state.

See [./plugins/engineering/skills/gather-evidence/](./plugins/engineering/skills/gather-evidence/)
for the skill contract.

### running-mobile-simulators

Concurrent workspaces can see the same Android emulators, iOS simulators, and
automation processes. `running-mobile-simulators` binds one session to an exact
device and limits readiness, recovery, evidence, and cleanup to that ownership
boundary.

See [the Engineering copy](./plugins/engineering/skills/running-mobile-simulators/)
for the skill contract.

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
| [working-on-issues](./plugins/engineering/skills/working-on-issues/) | Align one issue with its live tracker, canonical branch, and isolated worktree |
| [move-branch-here](./plugins/engineering/skills/move-branch-here/) | Move an issue branch into the current worktree |
| [install-skills](./skills/install-skills/) | Project-local skills CLI installation workflow |
| [grill-to-spec](./skills/grill-to-spec/) | Settle a design for `/to-spec` to publish with doc-change proposals |
| [design-by-contract](./skills/design-by-contract/) | Analyze and present consequential system design as client-supplier contracts |
| [principle-offensive-programming](./plugins/engineering/skills/principle-offensive-programming/) | Decide whether a check validates a boundary, handles expected behavior, or hides a defect |
| [grill-system-design](./skills/grill-system-design/) | Grill only durable system design trade-offs and hand them to a specification |
| [review-system-design](./skills/review-system-design/) | Present implementation contracts in dependency-ordered review rounds |
| [writing-for-patina-mode](./skills/writing-for-patina-mode/) | Write a short operator prompt for one `patina-mode` playbook |
| [gather-evidence](./plugins/engineering/skills/gather-evidence/) | Gather current-target evidence for a human change request or QA finding |
| [running-mobile-simulators](./plugins/engineering/skills/running-mobile-simulators/) | Bind one workspace to one owned or attached Android emulator or iOS simulator |
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
npx skills@latest add ./skills/grill-to-spec --list
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
  grill-to-spec/
  design-by-contract/
  grill-system-design/
  review-system-design/
  writing-for-patina-mode/
plugins/engineering/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  agents/
  hooks/
  skills/
    patina-mode/
    architect/
    arena/
    ...
    working-on-issues/
    move-branch-here/
    principle-offensive-programming/
    gather-evidence/
    running-mobile-simulators/
.agents/skills/<name>/               Committed overlay: symlinks to an owned skill or vendored dirs
.claude/skills/<name>/               Committed overlay: symlinks to an owned skill or .agents mirror
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
