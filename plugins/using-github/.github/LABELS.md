# Labels

This file is the canonical inventory of GitHub issue and PR labels for
`patinaproject/using-github`. The `using-github` skill reads this file at
runtime and never hardcodes label names.

## Labels

| Name | Description | Color |
|------|-------------|-------|
| `autorelease: pending` | Reserved for Release Please. Applied automatically to the open release PR. Do not apply or remove manually. | `c5def5` |
| `autorelease: tagged` | Reserved for Release Please. Applied automatically after a release tag is cut. Do not apply or remove manually. | `c5def5` |
| `bug` | Something isn't working. | `d73a4a` |
| `documentation` | Improvements or additions to documentation. | `0075ca` |
| `duplicate` | This issue or pull request already exists. | `cfd3d7` |
| `enhancement` | New feature or request. | `a2eeef` |
| `good first issue` | Good for newcomers. | `7057ff` |
| `help wanted` | Extra attention is needed. | `008672` |
| `invalid` | This doesn't seem right. | `e4e669` |
| `question` | Further information is requested. | `d876e3` |
| `wontfix` | This will not be worked on. | `ffffff` |

## Adding or changing labels

1. Open a PR that edits this file (add the row or change the description/color).
2. After merge, sync the change to the GitHub remote with `gh label create` / `gh label edit` (or via the Settings UI). A future follow-up will automate this from CI; until then it is manual.
3. Names are sorted alphabetically (case-insensitive). Keep the table sorted on every change.

## Reserved labels

The `autorelease: pending` and `autorelease: tagged` labels are owned by Release Please:

- `autorelease: pending` is applied to the open release PR; PR-title lint is intentionally skipped while this label is present so the release PR's `chore: release v<x.y.z>` title can pass.
- `autorelease: tagged` is applied after the release tag is cut.

Never apply or remove these labels manually. The label inventory in this file
describes them so the skill knows they exist; `using-github` refuses to attach
them during issue or PR work.

## Dependabot-reserved labels

`javascript` and `github_actions` are reserved by Dependabot when it opens dependency PRs. They are not present in this file because this repo does not currently use Dependabot. If Dependabot is enabled later, those labels appear automatically on the remote and should not be added to this file (they are special-cased and skipped by the skills).
