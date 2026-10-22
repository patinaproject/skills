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
/plugin install team@patinaproject-skills
```

The `team` plugin carries the human-invoked skills: repository scaffolding,
GitHub, install, system-design, spec, triage, and review skills.

> **Migration:** the `patinaproject-skills` plugin is retired. Its skills now
> ship in `team`. Uninstall `patinaproject-skills` and install `team` instead.

Codex:

```text
/marketplace add patinaproject/skills
/install engineering
/install team
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

See [./plugins/team/skills/using-github/](./plugins/team/skills/using-github/) for the full README and
skill contract.

### update-branch

`update-branch` merges the current pull request target, or an explicit or
default target when no pull request exists. It keeps remote branch updates
opt-in, routes merge conflicts through the conflict workflow, and reports the
exact local and remote state.

See [./plugins/team/skills/update-branch/](./plugins/team/skills/update-branch/) for the skill contract.

### install-skills

Shared workflow skills should be added to a repository without mutating an
operator's global agent environment. `install-skills` gives agents a canonical
`npx skills@latest` workflow: read local guidance, inspect `skills-lock.json`,
install selected skills project-locally for all supported agent targets, and
verify the resulting lockfile and overlay changes.

See [./plugins/team/skills/install-skills/](./plugins/team/skills/install-skills/) for the skill contract.

### working-on-issues

Engineering uses `working-on-issues` for its stricter issue preflight. It
resolves one issue, discovers the live tracker contract, and enforces the
completed-issue, blocker, branch, and worktree gates before marking work
started.

See [./plugins/engineering/skills/working-on-issues/](./plugins/engineering/skills/working-on-issues/) for the skill contract.

### Writing specs and issues

The Team plugin exposes the upstream `/to-spec` workflow and
uses the adapter for claiming, labels, lifecycle, relationships, and closure.
Skills that need issue mechanics follow
[`docs/issue-tracker.md`](./docs/issue-tracker.md), the sole adapter that
defines them for every provider.

### move-branch-here

Git refuses to check out a branch another worktree already holds, and the
manual recovery strands work or drops review coverage. `move-branch-here`
describes how to release the branch from that worktree, attach it to the
current one, preserve its working state, and retain review coverage.

See [the Engineering copy](./plugins/engineering/skills/move-branch-here/) for
the skill contract.

### design-by-contract

`design-by-contract` selects consequential client-supplier contracts and states
what each contract requires, ensures, and maintains. It compares changes and
alternatives through precise clauses, with tables or Mermaid diagrams when a
visual explanation materially improves clarity.

See [./plugins/team/skills/design-by-contract/](./plugins/team/skills/design-by-contract/) for the skill
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
`grill-system-design` runs that interview with `grilling` and `domain-modeling`,
hands a settled design to `to-spec`, and limits questions to hard-to-reverse,
surprising trade-offs.

See [./plugins/team/skills/grill-system-design/](./plugins/team/skills/grill-system-design/) for the skill
contract.

### review-system-design

System design review needs an implementation-focused map of the contracts that
changed. `review-system-design` presents those contracts in dependency-ordered
rounds for a human reviewer.

See [./plugins/team/skills/review-system-design/](./plugins/team/skills/review-system-design/) for the
skill contract.

### writing-for-pstack

`writing-for-pstack` turns plain-language work or a draft into one short
operator prompt. It selects one current `patina-mode` playbook, keeps the facts
that only the operator can supply, and names the owner of each rule removed
from a draft.

See [./plugins/team/skills/writing-for-pstack/](./plugins/team/skills/writing-for-pstack/) for
the skill contract.

### email-inbox-triage

`email-inbox-triage` sorts every inbox thread into `Urgent`, `Action`,
`Waiting`, or `FYI`, tags it with that bucket, and archives `Waiting` and
`FYI`. It works with any mail tools that can list, tag, and archive, and any
storage tools that can read and append to a document in place. It reads
triage preferences from an `Agents/Email inbox triage` folder in the user's
cloud storage: a `Rules` document the user edits and a `Learned` document the
skill appends to. When the user pulls an archived thread back into the inbox,
or names a thread that should have had another bucket, it appends a learned
rule, so it can run on a schedule as a feedback loop. Its
only writes are the four bucket tags, archiving or un-archiving a thread to
match its bucket, and appends to `Learned`, and
a second run converges on the same state.

See [./plugins/team/skills/email-inbox-triage/](./plugins/team/skills/email-inbox-triage/) for the skill
contract.

### cloud-storage-organization

`cloud-storage-organization` files loose files in the storage root and in the
user's inbox folders by moving, renaming, and trashing them under rules it
learns from how the user already organizes files. It keeps its rules,
questions, and a record of its moves in editable documents in an
`Agents/Cloud storage organization` folder, edits them in place, and learns from
every file the user moves back, so it can run on a schedule as a feedback
loop. New rules act on a few files per run until three runs pass without a
correction, and a move that would change who can see a file waits for the
user's yes. It works with any storage tools that can list, move, rename,
trash, and edit a document in place.

See [./plugins/team/skills/cloud-storage-organization/](./plugins/team/skills/cloud-storage-organization/)
for the skill contract.

### draft-user-follow-ups

`draft-user-follow-ups` runs a support control loop after a production
release. It finds every customer owed a reply across the email inbox and a
feedback tool, proves the fix shipped, ran its data steps, and works for that
customer, then drafts the reply inside the customer's thread. Each owed reply
ends as ready to send or blocked on a named check. It writes email drafts only,
and reads repository-specific facts from a consumer config.

See [./plugins/team/skills/draft-user-follow-ups/](./plugins/team/skills/draft-user-follow-ups/)
for the skill contract.

### linear-inbox-cleanup

`linear-inbox-cleanup` clears a Linear inbox of notifications that need no
action. It marks as read the ones for completed or canceled issues and merged
pull requests, status changes, Triage Rule assignments, and comment threads the
user never joined and was never @-mentioned in. Every other notification stays
unread. It uses only the Linear MCP tools and changes nothing but read state.

See [./plugins/team/skills/linear-inbox-cleanup/](./plugins/team/skills/linear-inbox-cleanup/)
for the skill contract.

### gather-evidence

Human change requests and QA findings need direct evidence from the current
target before the agent edits code or prepares a response. `gather-evidence`
records a verdict for each claim and routes confirmed work back to patina-mode.
It does not own implementation, replies, thread resolution, or review state.

See [./plugins/engineering/skills/gather-evidence/](./plugins/engineering/skills/gather-evidence/)
for the skill contract.

### pr-review-assistant

`pr-review-assistant` pair-reviews someone else's pull request. It presents the
PR as an artifact (intent, hard-to-reverse changes, changed names and flows,
blast radius) plus a to-do list of comments for the reviewer, who stays the
judge. It writes nothing to GitHub or Linear until the reviewer asks.

See [./plugins/team/skills/pr-review-assistant/](./plugins/team/skills/pr-review-assistant/)
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

See [./plugins/team/skills/scaffold-repository/](./plugins/team/skills/scaffold-repository/) for the full
README and skill contract.

## Skills

| Skill | Description |
|---|---|
| [using-github](./plugins/team/skills/using-github/) | patinaproject GitHub forge and pull-request conventions |
| [update-branch](./plugins/team/skills/update-branch/) | Merge a branch target locally with explicit remote-update opt-in |
| [working-on-issues](./plugins/engineering/skills/working-on-issues/) | Align one issue with its live tracker, canonical branch, and isolated worktree |
| [move-branch-here](./plugins/engineering/skills/move-branch-here/) | Move an issue branch into the current worktree |
| [install-skills](./plugins/team/skills/install-skills/) | Project-local skills CLI installation workflow |
| [design-by-contract](./plugins/team/skills/design-by-contract/) | Analyze and present consequential system design as client-supplier contracts |
| [principle-offensive-programming](./plugins/engineering/skills/principle-offensive-programming/) | Decide whether a check validates a boundary, handles expected behavior, or hides a defect |
| [grill-system-design](./plugins/team/skills/grill-system-design/) | Grill only durable system design trade-offs and hand them to an issue |
| [grill-to-spec](./plugins/team/skills/grill-to-spec/) | Grill a design in a planning worktree and hand doc changes to `to-spec` as proposals |
| [review-system-design](./plugins/team/skills/review-system-design/) | Present implementation contracts in dependency-ordered review rounds |
| [writing-for-pstack](./plugins/team/skills/writing-for-pstack/) | Write a short operator prompt for one `patina-mode` playbook |
| [email-inbox-triage](./plugins/team/skills/email-inbox-triage/) | Tag and archive inbox threads into four triage buckets in any mail provider |
| [cloud-storage-organization](./plugins/team/skills/cloud-storage-organization/) | File loose files in any cloud storage by rules learned from your corrections |
| [draft-user-follow-ups](./plugins/team/skills/draft-user-follow-ups/) | Draft proven replies to every customer owed one after a production release |
| [linear-inbox-cleanup](./plugins/team/skills/linear-inbox-cleanup/) | Mark Linear inbox notifications read when they need no action |
| [gather-evidence](./plugins/engineering/skills/gather-evidence/) | Gather current-target evidence for a human change request or QA finding |
| [pr-review-assistant](./plugins/team/skills/pr-review-assistant/) | Pair-review someone else's pull request as an artifact and a to-do list |
| [running-mobile-simulators](./plugins/engineering/skills/running-mobile-simulators/) | Bind one workspace to one owned or attached Android emulator or iOS simulator |
| [scaffold-repository](./plugins/team/skills/scaffold-repository/) | Scaffold a new repository to the Patina Project baseline |

## Local iteration

The test suite proves the in-repo skills and workflow contracts are wired correctly. Run
it after any change to `plugins/`, `scripts/`, `.agents/skills/`, or `.claude/skills/`.

For the full local verification suite, run:

```sh
pnpm test
```

### Check a - CLI resolves skills from local paths

```sh
npx skills@latest add ./plugins/team/skills/scaffold-repository --list
npx skills@latest add ./plugins/team/skills/install-skills --list
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
plugins/team/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  skills/
    scaffold-repository/
    install-skills/
    using-github/
    update-branch/
    design-by-contract/
    grill-system-design/
    grill-to-spec/
    review-system-design/
    writing-for-pstack/
    email-inbox-triage/
    cloud-storage-organization/
    draft-user-follow-ups/
    linear-inbox-cleanup/
    to-spec/
    to-tickets/
    triage/
    retro/
    pr-review-assistant/
    show-me/
    design-control-loop/
    ask-matt/
    codebase-design/
    domain-modeling/
    grill-me/
    grilling/
    handoff/
    improve-codebase-architecture/
    setup-team-skills/
    teach/
    to-questionnaire/
    wait-what/
    code-review/
    diagnosing-bugs/
    implement/
    implement-spec/
    prototype/
    research/
    tdd/
    wayfinder/
    wizard/
    writing-for-agents/
.agents/skills/<name>/               Committed overlay: symlinks to an owned skill or vendored dirs
.claude/skills/<name>/               Committed overlay: symlinks to an owned skill or .agents mirror
.claude-plugin/
  marketplace.json                   Claude marketplace catalog
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
