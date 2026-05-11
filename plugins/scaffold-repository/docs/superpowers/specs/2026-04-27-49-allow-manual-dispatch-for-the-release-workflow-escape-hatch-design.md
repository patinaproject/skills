# Design: Allow manual dispatch for the release workflow escape hatch [#49](https://github.com/patinaproject/bootstrap/issues/49)

## Context

Issue [#42](https://github.com/patinaproject/bootstrap/issues/42) changed the
release flow from manual-dispatch-driven to `push`-driven. That removed the
normal maintainer ritual: merging any PR to `main` refreshes the standing
release PR, and merging the release PR cuts the tag and GitHub Release.

That remains the right default. The missing piece is a recovery path. If a
`Release` run is skipped, cancelled, transiently broken, or needs to be retried
after a settings fix, maintainers currently need a no-op commit or unrelated
merge just to make release-please evaluate the repository again.

## Approaches considered

1. **Recommended: add `workflow_dispatch` beside `push`.** Keep `push` to
   `main` as the normal path, and allow maintainers to start the same workflow
   manually when recovery requires it. This is the smallest change and relies on
   release-please's existing idempotence.
2. **Keep push-only and document no-op commits as recovery.** This preserves the
   current trigger shape but makes recovery noisy and trains maintainers to
   create commits with no product value.
3. **Add a separate recovery workflow.** This keeps the release workflow
   conceptually pure, but duplicates release-please configuration and increases
   the chance that normal and recovery behavior drift.

## Decision

Add `workflow_dispatch` to the existing `Release` workflow `on:` block while
leaving `push: branches: [main]` in place.

Target trigger shape:

```yaml
on:
  workflow_dispatch:
  push:
    branches: [main]
```

The release job should not branch on event type. Manual dispatch is an escape
hatch that runs the same release-please evaluation as the automatic path:

- On ordinary unreleased commits, release-please opens or refreshes the standing
  release PR.
- After the standing release PR has been merged, release-please can cut the tag
  and GitHub Release if the repository state calls for it.
- If there is nothing to release, the run no-ops.

This applies to all three release workflow surfaces:

- `.github/workflows/release.yml`
- `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml`
- `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml`

Because `.github/workflows/release.yml` and `RELEASING.md` are baseline-managed,
the implementation must edit the templates first and then mirror the repo-root
files through the local bootstrap realignment workflow.

## Documentation

`RELEASING.md` should continue to describe push-triggered release automation as
the normal path. It should no longer say that there is no manual dispatch or
that no `gh workflow run` step is ever required.

Add a short recovery section that frames manual dispatch as an escape hatch:

- Use it when the latest automatic `Release` run was skipped, cancelled, failed
  for transient reasons, or needs a retry after permissions/settings were fixed.
- Run the same `Release` workflow manually with `gh workflow run Release` or
  the GitHub Actions UI.
- Do not use it as the ordinary release path, and do not perform manual version
  bumps or local release commands.

The core and patinaproject supplement release docs should remain aligned except
for existing distribution-specific wording.

## Requirements

- R1: The release workflow keeps `push` to `main` as the normal automatic
  trigger.
- R2: The release workflow also exposes `workflow_dispatch` for maintainer
  retry/recovery.
- R3: Manual dispatch runs the same release-please job path as `push`; no
  event-specific release behavior or semver input is added.
- R4: Release documentation presents manual dispatch only as an escape hatch,
  not as a required release step.
- R5: Baseline round-trip is preserved: template changes are mirrored into the
  repo-root workflow and docs through the local bootstrap realignment loop.

## Acceptance criteria

- AC-49-1: Given the release workflow file is inspected, when the `on:` block is read, then it includes both `push` for `main` and `workflow_dispatch`.
- AC-49-2: Given a maintainer manually dispatches `Release`, when release-please runs, then it performs the same idempotent release evaluation used by the push-triggered path.
- AC-49-3: Given a maintainer reads `RELEASING.md`, when they look for manual release instructions, then manual dispatch is documented only as an escape hatch for retry/recovery, not as the normal release path.
- AC-49-4: Given this repository is realigned from the bootstrap templates, when the root workflow and docs are compared to their template sources, then the manual-dispatch escape hatch is present in both places.

## Non-goals

- Restoring a manual-first release ritual.
- Adding release type inputs, semver selection, or manual version bumps.
- Replacing release-please.
- Changing the `notify-patinaproject-skills` marketplace-dispatch job behavior.
- Changing release-please permissions, labels, changelog generation, or token
  fallback guidance beyond wording needed for the new escape hatch.

## Risks

- Maintainers may read `workflow_dispatch` as the preferred path again. Mitigate
  this by keeping the release docs centered on automatic `push` behavior and
  naming manual dispatch only in recovery language.
- Manual dispatch can be run repeatedly. This is acceptable because
  release-please is idempotent; repeated no-op runs are noisy but not
  state-changing.
