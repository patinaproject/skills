# Plan: Upgrade semantic pull request action to v6.1.1

## Issue

- Issue: #78
- Design:
  `docs/superpowers/specs/2026-05-14-78-upgrade-semantic-pull-request-action-to-v6-1-1-design.md`

## Objective

Update the repository's PR-title workflow and the scaffold-owned template copy
to use `amannn/action-semantic-pull-request@v6.1.1` pinned to
`48f256284bd46cdaab1048c3721360e808335d50`, without changing the PR-title
policy configuration.

## Task 1: Update both workflow copies

- Edit `.github/workflows/pull-request.yml`.
- Edit `skills/scaffold-repository/templates/core/.github/workflows/pull-request.yml`.
- In both files, change only the adjacent action-version comment and the
  full-SHA `uses:` line for `amannn/action-semantic-pull-request`.
- Preserve all `with:` inputs and surrounding workflow behavior.

## Task 2: Verify local invariants

- Confirm the old v5.5.3 comment and SHA are absent from both active workflow
  copies.
- Confirm the v6.1.1 comment and SHA are present in both active workflow copies.
- Confirm the two workflow copies remain synchronized for the semantic action
  step.
- Run the scaffold repository check so the root workflow and template copy do
  not drift.
- Run repository verification commands appropriate for workflow/template edits.

## Task 3: Publish and capture PR evidence

- Open a pull request with a compliant title and no `dependencies` label.
- Record evidence that the upgraded `Validate conventional commits` step
  executes and passes for the compliant title.
- Temporarily retitle the PR to a non-compliant title, record evidence that the
  upgraded step executes and fails with the configured title guidance, then
  restore the compliant title.
- Record AC evidence in the PR body using the repository PR template.

## Verification Commands

- `rg -n 'amannn/action-semantic-pull-request@(v5\.5\.3|0723387faaf9b38adef4775cd42cfd5155ed6017|v6\.1\.1|48f256284bd46cdaab1048c3721360e808335d50)' .github/workflows/pull-request.yml skills/scaffold-repository/templates/core/.github/workflows/pull-request.yml`
- `git diff --check -- .github/workflows/pull-request.yml skills/scaffold-repository/templates/core/.github/workflows/pull-request.yml`
- `pnpm apply:scaffold-repository:check`
- `pnpm lint:md`
- `pnpm verify:dogfood`
- `pnpm verify:marketplace`
- `pnpm verify:superteam`

## Blockers

None.
