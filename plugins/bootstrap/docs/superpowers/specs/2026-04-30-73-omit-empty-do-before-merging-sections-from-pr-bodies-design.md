# Design: Omit empty Do before merging sections from PR bodies [#73](https://github.com/patinaproject/bootstrap/issues/73)

## Intent

Make the PR body contract omit `Do before merging` entirely when a PR has no work-specific operator action before merge. Keep the section available for real pre-merge work so reviewers see actionable checkboxes only when an operator must do something.

## Requirements

- R1: A rendered PR body with no work-specific pre-merge operator steps must omit the `Do before merging` heading and its placeholder text entirely.
- R2: A rendered PR body with one or more work-specific pre-merge operator steps must include `Do before merging` in the canonical position between `What changed` and `Test coverage`.
- R3: The `Do before merging` section, when present, must contain only concrete operator actions and must not be used for filler such as `No work-specific pre-merge operator steps.`
- R4: Root guidance and bootstrap template guidance must describe the conditional section rule consistently.
- R5: Template source changes must round-trip into mirrored root files according to this repository's baseline-config workflow.
- R6: The change must preserve the existing rule that unchecked visible checkboxes are reserved for required operator actions and are enforced by the required-template-checkboxes check.

## Acceptance Criteria

- AC-73-1: Given a PR has no work-specific pre-merge operator steps, when its PR body is rendered, then the `Do before merging` section is omitted entirely.
- AC-73-2: Given a PR has one or more work-specific pre-merge operator steps, when its PR body is rendered, then the `Do before merging` section is present and contains only those actionable steps.
- AC-73-3: Given the bootstrap repository mirrors baseline config from templates, when the PR body guidance changes, then the source template and root PR guidance remain aligned.

## Approach

Use a conditional-template convention rather than inventing a new section or replacing the heading with a visible "none" statement. Update the bootstrap template source first, then mirror the root PR template and root guidance. The template comment should tell authors to include the whole section only when needed, which prevents agents from preserving a visible empty section during PR creation.

`AGENTS.md` and its core template should change from "include a `Do before merging` section" to "include it only when work-specific operator steps exist." The working-with-templates guidance should still identify the canonical section order for cases where the section is present, while explicitly allowing the section to be absent when there are no steps.

## Workflow-Contract Pressure Tests

- RED baseline: Current generated PR bodies can include a visible empty/filler `Do before merging` section; an agent may rationalize that every template heading must appear even when it has no content.
- GREEN expectation: With the updated contract, an agent rendering a no-operator-step PR body omits the section and does not replace it with `None`, `N/A`, or "No work-specific pre-merge operator steps."
- Rationalization resistance: The guidance must close the loophole that "canonical section order" means "always include every possible heading." It means preserve order among sections that apply.
- Red flags: Any visible empty `Do before merging` heading, visible no-op filler, or unchecked checkbox that is not a real operator action is a failure.
- Token efficiency: Prefer one compact template comment and one compact AGENTS guidance change over duplicating detailed examples in multiple docs.
- Role ownership: Authors decide whether pre-merge operator steps exist; reviewers inspect that any visible checklist is actionable; operators only receive checklist items when actual work is required.
- Stage-gate bypass prevention: The PR-body rules remain in the template and root guidance, so Finisher-owned PR publication follows the same condition instead of relying on memory.

## Non-Goals

- Do not change the required-template-checkboxes enforcement behavior.
- Do not add a new PR-body section or rename existing sections.
- Do not change acceptance-criteria test reporting.
