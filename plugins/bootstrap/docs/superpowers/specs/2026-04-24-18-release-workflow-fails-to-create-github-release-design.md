# Design: Release workflow fails to create GitHub release: "Resource not accessible by integration" [#18](https://github.com/patinaproject/bootstrap/issues/18)

## Context

Release PR [#9](https://github.com/patinaproject/bootstrap/pull/9) ("chore: release 1.0.0") merged cleanly on `main`, but the follow-up `Release` workflow run ([job 24884779851](https://github.com/patinaproject/bootstrap/actions/runs/24884779851/job/72861942422)) failed with:

```text
release-please failed: Resource not accessible by integration - https://docs.github.com/rest/releases/releases#create-a-release
```

No `v1.0.0` tag was cut, no GitHub Release was published, and the `notify-patinaproject-skills` job – which is gated on `release_created == 'true'` – never fired. On `patinaproject/bootstrap` today:

- `git tag -l` is empty.
- `gh release list` is empty.
- `gh api repos/patinaproject/bootstrap/actions/permissions/workflow` returns `{"default_workflow_permissions":"read","can_approve_pull_request_reviews":true}`.

This is the same observable end-state as issue [#16](https://github.com/patinaproject/bootstrap/issues/16) (closed by `fb1f7c1`, which restored the `push: branches: [main]` trigger). The prior fix got the second workflow run to fire; the failure has now moved one step later, to the `POST /repos/.../releases` call itself. The repo-level default `GITHUB_TOKEN` is read-only, and the workflow-level `permissions: contents: write` declaration is being capped by the org/repo default, so release-please is denied when it tries to create the release.

Beyond unblocking this specific release, the `bootstrap` skill is supposed to be the source of truth for every Patina Project repo's baseline config. Today its templates document only the "Allow Actions to create PRs" prerequisite and stop short of the full permissions + tag-protection story needed for the release-and-tag step to actually succeed. Any repo scaffolded from `bootstrap` today will hit the same 403 on its first release. And when we fix this here, the fix must land in `skills/bootstrap/templates/**` first and be mirrored into the repo root via the local skill's realignment mode – otherwise the next bootstrapped repo regresses.

## Goals

- Unblock the stuck `v1.0.0` release on `patinaproject/bootstrap` so the tag, GitHub Release, and `patinaproject/skills` dispatch all land from a single end-to-end run.
- Update the `bootstrap` skill templates so every future bootstrapped repo reaches a working first release without undocumented org/repo settings.
- Establish and document "templates are the source of truth; the local skill's realignment mode propagates into the repo root" as the expected loop for config changes to `patinaproject/bootstrap` itself.

## Non-goals

- Redesigning release-please configuration (`release-please-config.json`, manifest) or changelog conventions.
- Replacing release-please with an alternative releaser.
- Changing the marketplace bump protocol on `patinaproject/skills`.
- Adding signed-tag support to release-please. Tag signing is out of scope; the tag-ruleset guidance is limited to avoiding a ruleset that would block release-please's unsigned tag.
- Expanding the bootstrap skill's audit surface beyond the release-flow items named below.

## Requirement scopes

The issue names three requirement scopes; this design covers all three.

### Scope 1 – Unblock this repo's v1.0.0 release

Make the `POST /repos/.../releases` call succeed on the next `Release` run on `main`, publish `v1.0.0`, and let the downstream `notify-patinaproject-skills` job dispatch `bump-plugin-tags.yml`.

### Scope 2 – Bootstrap skill emits a complete working release flow

`skills/bootstrap/templates/**` must ship a release flow that works end-to-end on a freshly scaffolded repo, not just one that "looks correct on disk":

- `RELEASING.md` documents the full release prerequisites checklist (workflow permissions read + write, Allow Actions to create and approve PRs, org-level caps to watch for, PAT/App-token fallback for restrictive orgs, tag-ruleset caution).
- The emitted `release.yml` declares `permissions:` at both workflow and job level so a restrictive org default cannot silently strip write scope from the job.
- `audit-checklist.md` adds an end-to-end verification item – not merely "the workflow file is present", but "an initial `workflow_dispatch` of `Release` produces a tag + GitHub Release + (if `patinaproject`) a `skills` dispatch".

### Scope 3 – Repo-self-update guidance

Codify that `skills/bootstrap/templates/**` is the authoritative source of truth for this repo's own baseline config, and that the local `skills/bootstrap` skill must be usable in realignment mode against `patinaproject/bootstrap` itself:

- `AGENTS.md` (and `CLAUDE.md` via its `@AGENTS.md` import) name the full set of baseline files covered by templates and state the "templates first, then propagate to root" rule.
- The local skill treats `patinaproject/bootstrap` as a normal realignment target with no self-exclusion.
- The PR that closes #18 demonstrates the loop: update templates, run the local skill in realignment mode, commit both, reference the workflow in `AGENTS.md`/`CLAUDE.md`.

## Approach

### Permissions fix direction (Scope 1 + Scope 2)

Two layers together, in order of preference:

1. **Repo + job-level workflow permissions.** Set **Settings → Actions → General → Workflow permissions → Read and write permissions** on `patinaproject/bootstrap`, keep **Allow GitHub Actions to create and approve pull requests** on, and declare `permissions:` at the **job** level in `release.yml` (not only at the workflow level). Workflow-level `permissions:` are an upper bound; job-level `permissions:` are what the runner presents to GitHub. Some org policies cap the workflow-level value below the job-level declaration, and the job-level scope is what release-please actually runs under. Declaring it at both levels removes the ambiguity.
2. **PAT / GitHub App fallback when org policy caps repo defaults.** If org policy prevents raising repo-level workflow permissions to read + write, the fallback is a dedicated PAT or GitHub App installation token with `contents: write` and `pull-requests: write`, stored as an org-level secret, and passed to `release-please-action` via `with: token:` instead of the default `GITHUB_TOKEN`. This path is documented in `RELEASING.md` but is not the default code path – the default remains `secrets.GITHUB_TOKEN`, because forks in other orgs should not need to provision a Patina Project-specific secret to release.

The workflow file changes minimally: add `permissions:` at the job level and a code comment explaining why both levels are set. No behavior change for repos whose org policy already allows read + write.

### Tag ruleset caution (Scope 2)

The org branch ruleset on `main` currently includes `required_signatures` scoped to `~DEFAULT_BRANCH` and `refs/heads/production`. Tags are not covered today, so release-please's unsigned tag creation works once permissions are fixed. `RELEASING.md` must call out that **a tag ruleset requiring signatures would break release-please-action**, which cannot sign tags, so future ruleset edits should scope signature requirements to branches only (or to specific non-release tag refs).

### Audit coverage (Scope 2)

`skills/bootstrap/audit-checklist.md` adds a release-flow verification row to the existing "Area 2 – GitHub metadata" (or an adjacent section). The verification is outcome-based: after scaffolding, the operator runs `gh workflow run Release` on the freshly scaffolded repo (seeded with at least one `feat:`/`fix:` commit) and observes that a release PR appears, and on merge that a tag + GitHub Release are created. The bootstrap skill's realignment output flags a repo as non-compliant if it has never cut a release and its `actions/permissions/workflow` default is `read`.

AC-18-5 and AC-18-9 are complementary, not overlapping. AC-18-5 stays outcome-based – it asserts that an end-to-end release succeeds on a target repo, which is the only evidence that the full chain (permissions, workflow, ruleset, token scopes) is actually wired up. AC-18-9 is the proactive static check that runs before any release has been attempted: the realignment audit reads `gh api repos/<owner>/<repo>/actions/permissions/workflow` and the repo's tag-scoped rulesets and warns up front when `default_workflow_permissions` is `read` or when a tag ruleset requires signatures, so operators discover the gap before hitting a 403 on their first release. Keep both – the static check catches the problem early on any repo (including ones that have already released once and then regressed), and the end-to-end check catches any failure mode the static check missed.

### Repo-self-update guidance (Scope 3)

Add a "Source of truth" section to `AGENTS.md` that (a) names every baseline file currently covered by `skills/bootstrap/templates/**` and (b) states the invariant: changes to any of those files in this repo must land in the template first and be mirrored into the root via the local skill's realignment mode. `CLAUDE.md` already imports `@AGENTS.md`, so the Claude surface inherits the rule automatically. The list of covered files lives in `AGENTS.md` next to the existing "Project Structure" section so it is discoverable by reviewers without hunting.

The local skill's realignment batches must cover each named file. Specifically, the batch list should include: `.github/workflows/*`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `RELEASING.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `package.json`, `.husky/*`, `commitlint.config.js`, `.markdownlint.jsonc`, `release-please-config.json`, `.release-please-manifest.json`, `.claude-plugin/`, `.codex-plugin/`, `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`, `scripts/check-plugin-versions.mjs`, and `scripts/sync-plugin-versions.mjs`.

### Stuck-state recovery for v1.0.0 (Scope 1)

As in #16, recovery runs once and is not worth automating. Ship it as a manual runbook in the PR body under `Validation`. Steps: after permissions are fixed and the workflow change merges, re-run `Release` via `workflow_dispatch` (or push a trivial commit to `main`), confirm the `v1.0.0` tag and Release land, and confirm the `skills` dispatch completes. If release-please's state ("latest release in manifest") has drifted, the plan stage will document the `release-please-manifest.json` adjustment; do not pre-commit to a manifest change in this design.

## Acceptance criteria

- **AC-18-1:** Given `patinaproject/bootstrap` has repo workflow permissions set to read + write (or the workflow uses a PAT/App token fallback) and the updated `.github/workflows/release.yml` is on `main`, when a maintainer merges the standing release-please PR (or triggers `Release` via `workflow_dispatch`), then the workflow creates the `v1.0.0` tag, publishes a GitHub Release `v1.0.0` with release-please-generated notes, and relabels the release PR to `autorelease: tagged`.
- **AC-18-2:** Given the release for `v1.0.0` has been created on `patinaproject/bootstrap`, when the `Release` workflow finishes, then `notify-patinaproject-skills` dispatches `bump-plugin-tags.yml` on `patinaproject/skills` with inputs `{"plugin":"bootstrap","tag":"v1.0.0"}` and that dispatch opens or updates a marketplace bump PR on `patinaproject/skills`.
- **AC-18-3:** Given the updated `skills/bootstrap/templates/**` release files, when a contributor reads `skills/bootstrap/templates/core/RELEASING.md`, then the "Prerequisites" section documents repo workflow permissions (read + write), "Allow Actions to create and approve pull requests", how to recognize an org-policy cap on those settings, the PAT/GitHub-App token fallback (including what scopes it needs and how to wire it into `release.yml`), and a caution that a signature-requiring tag ruleset would break release-please-action.
- **AC-18-4:** Given the updated `skills/bootstrap/templates/**` release workflow, when an agent reads the emitted `release.yml` (both `core` and `patinaproject-supplement` variants, if both exist), then `permissions:` is declared at the job level for the `release-please` job with `contents: write` and `pull-requests: write`, in addition to any workflow-level `permissions:` block, and an inline comment explains why both levels are set.
- **AC-18-5:** Given the updated `skills/bootstrap/audit-checklist.md`, when the bootstrap skill runs in realignment mode against a target repo, then the checklist includes an outcome-based verification that the release flow can cut a release end-to-end (the target produces a tag, a GitHub Release, and – when the owner is `patinaproject` – a `skills` dispatch), and the skill reports a gap when the target has no prior release and its default workflow token is read-only.
- **AC-18-6:** Given the updated `AGENTS.md` on `patinaproject/bootstrap`, when a contributor or agent reads it, then a "Source of truth" section names `skills/bootstrap/templates/**` as authoritative for this repo's own baseline config, lists the covered files (workflows, issue/PR templates, `RELEASING.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `package.json`, `.husky/*`, `commitlint.config.js`, `.markdownlint.jsonc`, release-please config and manifest, `.claude-plugin/`, `.codex-plugin/`, `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`, plugin-version scripts), and states that changes must land in the template first, then be mirrored into the repo root via the local skill's realignment mode.
- **AC-18-7:** Given the local `skills/bootstrap` skill, when it is invoked in realignment mode against `patinaproject/bootstrap`, then it treats the repo as a normal target (no self-exclusion), and the realignment batches cover each file listed in AC-18-6.
- **AC-18-8:** Given the PR that closes #18, when a reviewer reads its description, then the PR body (using the canonical `.github/pull_request_template.md` structure) demonstrates the "templates first, then realignment into root" loop end-to-end, linking the template diff, the realignment output, and the mirrored root diff, and references that loop in `AGENTS.md`/`CLAUDE.md` as the expected workflow for future baseline-config changes.
- **AC-18-9:** Given the bootstrap skill invoked in realignment mode against any target repo, when it reads `gh api repos/<owner>/<repo>/actions/permissions/workflow` and the repo's tag-scoped rulesets, then the audit run emits a concrete realignment-gap warning entry whenever `default_workflow_permissions` is `read` (independent of whether the repo has ever released, and before the user would otherwise hit a 403 on their first release), and emits a separate warning entry whenever a tag-scoped ruleset requires signatures (which would break `release-please-action`'s unsigned tag creation).

## Open questions

- Should this repo use the `GITHUB_TOKEN` + elevated repo/org permissions path, or adopt a GitHub App token as the default? Default path stays `GITHUB_TOKEN` in the design, but if the `patinaproject` org policy is known to cap repo defaults, the plan stage may need to pick the App-token path as primary. Needs confirmation from the org admin.
- Does `patinaproject/skills` (and any other existing Patina Project plugin repo) already have repo workflow permissions set to read + write? If not, a companion task may be needed to realign them before their next release – noted as a potential follow-up, not this PR's scope.
- Does `release-please-action@v4.4.1` need any additional inputs (e.g. `release-type`, `target-branch`) to retry against PR #9's existing merged state, or will a fresh `workflow_dispatch` "just work" once permissions are fixed? Plan stage should validate against release-please docs before declaring the recovery runbook final.

## Out of scope

- Automating the one-shot v1.0.0 recovery. It ships as a manual runbook in the PR body, consistent with #16's approach.
- Retroactive realignment of other Patina Project plugin repos. Tracked as a follow-up.
- Adding tag signing to release-please or to the org ruleset. The design only ensures no ruleset change silently breaks unsigned-tag creation.
- Auditing non-release workflows for the same job-level `permissions:` pattern. If a follow-up shows other workflows hit the same cap, handle it separately.
