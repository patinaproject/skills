# github-flows

Slash-command skills that let coding agents file issues, start branches, edit issues, and write changelogs in any GitHub repo.

[![CI](https://github.com/patinaproject/github-flows/actions/workflows/lint-md.yml/badge.svg)](https://github.com/patinaproject/github-flows/actions/workflows/lint-md.yml)
[![Latest release](https://img.shields.io/github/v/release/patinaproject/github-flows)](https://github.com/patinaproject/github-flows/releases)
[![License](https://img.shields.io/github/license/patinaproject/github-flows)](./LICENSE)

<!-- Hero asset: replace this comment with an <img src="docs/assets/hero.png" alt="github-flows new-issue running in Claude Code" /> tag once docs/assets/hero.png lands. Tracked as a follow-up. -->

## What you get

- **`/github-flows:new-issue`** — File a new GitHub issue with smart label selection, duplicate detection, and a public-repo leak guard.
- **`/github-flows:edit-issue`** — Edit an existing issue's title, body, labels, assignees, milestone, state, close reason, or relationships, preferring GraphQL where REST falls short.
- **`/github-flows:new-branch`** — Start work on an issue: branch from the default branch as `<issue-number>-<kebab-title>`, rebase, and install dependencies via the highest-priority lockfile.
- **`/github-flows:write-changelog`** — Render a user-facing changelog from a GitHub milestone, sourced from closed issues and their merging PRs.

## Quick start

Get from zero to a real invocation in under a minute (assumes [Claude Code](https://docs.claude.com/claude-code)):

1. Add the Patina marketplace:

   ```text
   /plugin marketplace add patinaproject/skills
   ```

2. Install the plugin:

   ```text
   /plugin install github-flows@patinaproject-skills
   ```

3. File a real issue against this repo to confirm everything works:

   ```text
   /github-flows:new-issue patinaproject/github-flows "Tried github-flows quick start"
   ```

The skill drafts the issue, runs duplicate detection, and asks you to confirm before posting.

## Install in another editor

<details>
<summary>Show install steps for Cursor, Windsurf, Copilot, Codex, and others</summary>

`github-flows` ships as a Claude Code + Codex plugin. Other supported editors read the repository-level files this plugin emits (`AGENTS.md`, `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`) directly — those tools require no additional plugin install. Pick the section for your tool.

### Claude Code

1. Register the Patina marketplace:

   ```text
   /plugin marketplace add patinaproject/skills
   ```

2. Install the plugin:

   ```text
   /plugin install github-flows@patinaproject-skills
   ```

3. Open a target repository (or an issue in one) in Claude Code and invoke:

   ```text
   /github-flows:new-issue patinaproject/github-flows "Tried github-flows install steps"
   ```

### OpenAI Codex CLI

1. Register the Patina marketplace:

   ```bash
   codex plugin marketplace add patinaproject/skills
   ```

2. Install the plugin: run `codex` to start a session, type `/plugins` to open the plugin browser, find `github-flows` under the `patinaproject/skills` marketplace, and select **Install plugin**.

3. Invoke from the target repository:

   ```text
   Use $github-flows for the workflow described above.
   ```

### OpenAI Codex App

1. Install or enable the `github-flows` plugin from your Codex plugin source.
2. Open the target repository in the app.
3. Invoke:

   ```text
   Use $github-flows for the workflow described above.
   ```

### GitHub Copilot

No plugin install required. This repo ships `.github/copilot-instructions.md`, which Copilot Chat reads automatically when the repo is open in your editor.

1. Clone the repo and open it.
2. Invoke `github-flows` from Copilot Chat:

   ```text
   @workspace Use the github-flows skill for the workflow described above.
   ```

Personal Copilot preferences belong in your user-scoped Copilot settings, not in the emitted `.github/copilot-instructions.md`.

### Cursor

No plugin install required. This repo ships `.cursor/rules/github-flows.mdc`, which Cursor loads as a project rule whenever the repo is open.

1. Clone the repo and open it in Cursor.
2. Ask the Cursor agent to apply `github-flows`:

   ```text
   Use the github-flows skill for the workflow described above.
   ```

Personal Cursor rules belong in your user-scoped Cursor settings, not in the emitted `.cursor/rules/`.

### Windsurf

No plugin install required. This repo ships `.windsurfrules`, which Windsurf reads natively when the repo is open.

1. Clone the repo and open it in Windsurf.
2. Ask Cascade to apply `github-flows`:

   ```text
   Use the github-flows skill for the workflow described above.
   ```

### Aider

No plugin install required. Aider reads `AGENTS.md` natively.

1. Clone the repo.
2. Run `aider` from inside the repo and ask it to apply the `github-flows` workflow described in `AGENTS.md`.

### Zed

No plugin install required. Zed's assistant reads `AGENTS.md` natively.

1. Clone the repo and open it in Zed.
2. Ask the assistant to apply the `github-flows` workflow described in `AGENTS.md`.

### Cline

No plugin install required. Cline reads `AGENTS.md` natively when the repo is open in VS Code.

1. Clone the repo and open it in VS Code with the Cline extension active.
2. Ask Cline to apply the `github-flows` workflow described in `AGENTS.md`.

### Opencode

No plugin install required. Opencode reads `AGENTS.md` natively.

1. Clone the repo and open it in Opencode.
2. Ask Opencode to apply the `github-flows` workflow described in `AGENTS.md`.

### Continue.dev

Continue.dev support is opt-in. Add the following entry to your `.continue/config.json` (project-scoped or user-scoped) so Continue picks up the `github-flows` context:

```jsonc
{
  "context": [
    {
      "provider": "file",
      "params": {
        "files": ["AGENTS.md", ".github/copilot-instructions.md"]
      }
    }
  ]
}
```

Then ask Continue to apply the `github-flows` workflow described in `AGENTS.md`.

</details>

## Development

This repository is the source for the plugin. Local workflow:

```bash
pnpm install           # installs dev deps and wires husky
pnpm lint:md           # markdownlint-cli2
pnpm check:versions    # enforce package.json ↔ plugin manifests lockstep
pnpm commitlint        # one-off commit-message validation
```

Commits and PR titles follow `type: #<issue> short description`.

Releases are driven by [release-please](https://github.com/googleapis/release-please) — merge the standing release PR to cut a new `vX.Y.Z`. See [`RELEASING.md`](./RELEASING.md).

## Related

- [Patina marketplace (`patinaproject/skills`)](https://github.com/patinaproject/skills)
- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Release process](./RELEASING.md)

## License

MIT — see [`LICENSE`](./LICENSE).
