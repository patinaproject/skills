# using-github

One GitHub workflow skill for coding agents: file issues, edit issues, start
branches, write changelogs, and prepare pull requests from repository rules.

[![CI](https://github.com/patinaproject/using-github/actions/workflows/lint-md.yml/badge.svg)](https://github.com/patinaproject/using-github/actions/workflows/lint-md.yml)
[![Latest release](https://img.shields.io/github/v/release/patinaproject/using-github)](https://github.com/patinaproject/using-github/releases)
[![License](https://img.shields.io/github/license/patinaproject/using-github)](./LICENSE)

<!-- Hero asset: replace this comment with an <img src="docs/assets/hero.png" alt="using-github running in Claude Code" /> tag once docs/assets/hero.png lands. Tracked as a follow-up. -->

## What you get

- **`/using-github`** — The single supported entry point for GitHub work. It
  reads repository rules and applies the issue, branch, PR, and changelog
  workflows from one skill.

## Quick start

Get from zero to a real invocation in under a minute (assumes [Claude Code](https://docs.claude.com/claude-code)):

1. Add the Patina Project marketplace:

   ```text
   /plugin marketplace add patinaproject/skills
   ```

2. Install the plugin:

   ```text
   /plugin install using-github@patinaproject-skills
   ```

3. Invoke the GitHub behavior guide from a target repository:

   ```text
   /using-github

   New issue: the homepage CTA button is broken.

   Create a new branch then fix.
   ```

The guide applies the correct workflow for filing issues, starting branches,
editing issues, writing changelogs, and preparing public-safe PRs.

## Breaking change

`using-github` replaces the former `github-flows` plugin identity. Direct
invocations of the specialized `new-issue`, `edit-issue`, `new-branch`, and
`write-changelog` skills are removed. Invoke `using-github` instead; it now owns
those workflows from the single remaining skill.

GitHub redirects old `patinaproject/github-flows` repository URLs after the
rename, but existing local checkouts should update their remotes:

```bash
git remote set-url origin git@github.com:patinaproject/using-github.git
```

## Install in another editor

<details>
<summary>Show install steps for Cursor, Windsurf, Copilot, Codex, and others</summary>

`using-github` ships as a Claude Code + Codex plugin. Other supported editors read the repository-level files this plugin emits (`AGENTS.md`, `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`) directly — those tools require no additional plugin install. Pick the section for your tool.

### Claude Code

1. Register the Patina Project marketplace:

   ```text
   /plugin marketplace add patinaproject/skills
   ```

2. Install the plugin:

   ```text
   /plugin install using-github@patinaproject-skills
   ```

3. Open a target repository (or an issue in one) in Claude Code and invoke:

   ```text
   /using-github

   New issue: the homepage CTA button is broken.

   Create a new branch then fix.
   ```

### OpenAI Codex CLI

1. Register the Patina Project marketplace:

   ```bash
   codex plugin marketplace add patinaproject/skills
   ```

2. Install the plugin: run `codex` to start a session, type `/plugins` to open the plugin browser, find `using-github` under the `patinaproject/skills` marketplace, and select **Install plugin**.

3. Invoke from the target repository:

   ```text
   [$using-github:using-github]

   New issue: the homepage CTA button is broken.

   Create a new branch then fix.
   ```

### OpenAI Codex App

1. Install or enable the `using-github` plugin from your Codex plugin source.
2. Open the target repository in the app.
3. Invoke:

   ```text
   [$using-github:using-github]

   New issue: the homepage CTA button is broken.

   Create a new branch then fix.
   ```

### GitHub Copilot

No plugin install required. This repo ships `.github/copilot-instructions.md`, which Copilot Chat reads automatically when the repo is open in your editor.

1. Clone the repo and open it.
2. Invoke `using-github` from Copilot Chat:

   ```text
   @workspace Use the using-github skill for the workflow described above.
   ```

Personal Copilot preferences belong in your user-scoped Copilot settings, not in the emitted `.github/copilot-instructions.md`.

### Cursor

No plugin install required. This repo ships `.cursor/rules/using-github.mdc`, which Cursor loads as a project rule whenever the repo is open.

1. Clone the repo and open it in Cursor.
2. Ask the Cursor agent to apply `using-github`:

   ```text
   Use the using-github skill for the workflow described above.
   ```

Personal Cursor rules belong in your user-scoped Cursor settings, not in the emitted `.cursor/rules/`.

### Windsurf

No plugin install required. This repo ships `.windsurfrules`, which Windsurf reads natively when the repo is open.

1. Clone the repo and open it in Windsurf.
2. Ask Cascade to apply `using-github`:

   ```text
   Use the using-github skill for the workflow described above.
   ```

### Aider

No plugin install required. Aider reads `AGENTS.md` natively.

1. Clone the repo.
2. Run `aider` from inside the repo and ask it to apply the `using-github` workflow described in `AGENTS.md`.

### Zed

No plugin install required. Zed's assistant reads `AGENTS.md` natively.

1. Clone the repo and open it in Zed.
2. Ask the assistant to apply the `using-github` workflow described in `AGENTS.md`.

### Cline

No plugin install required. Cline reads `AGENTS.md` natively when the repo is open in VS Code.

1. Clone the repo and open it in VS Code with the Cline extension active.
2. Ask Cline to apply the `using-github` workflow described in `AGENTS.md`.

### Opencode

No plugin install required. Opencode reads `AGENTS.md` natively.

1. Clone the repo and open it in Opencode.
2. Ask Opencode to apply the `using-github` workflow described in `AGENTS.md`.

### Continue.dev

Continue.dev support is opt-in. Add the following entry to your `.continue/config.json` (project-scoped or user-scoped) so Continue picks up the `using-github` context:

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

Then ask Continue to apply the `using-github` workflow described in `AGENTS.md`.

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

- [Patina Project marketplace (`patinaproject/skills`)](https://github.com/patinaproject/skills)
- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Release process](./RELEASING.md)

## License

MIT — see [`LICENSE`](./LICENSE).
