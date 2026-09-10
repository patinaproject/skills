# Select the project verification procedure

Apply this contract before behavior reproduction, owner proof, or independent
verification in every Patina-mode route. Complete selection before resolving
Claude Code or Codex drivers. A project procedure owns the recipe. Built-in
`run` and `verify`, shell, browser, HTTP, PTY, UI automation, and simulator tools
provide its underlying controls.

## Select the affected procedures

1. Identify every affected execution surface and behavior from the task and
   target diff. Read the repository's verification instructions.
2. Discover registered project skills through the runtime's skill catalog and
   supported project skill locations. Use their standard `name` and
   `description` metadata to find likely candidates, including repository-defined
   names. `verify-*` is a convention, not a discovery filter. Resolve symlinks
   so multiple registration paths to one procedure count once.
3. Load each likely candidate in full and inspect its feature map. Recognize
   project procedures by their launch and drive instructions, prerequisites,
   evidence, cleanup, and mapped features. Registration metadata alone does not
   establish coverage. If a candidate or its map cannot be read, report that
   selection is blocked for the affected scope.
4. Select all procedures needed by the affected surfaces and mapped features.
   Use repository instructions to resolve overlapping coverage. Ask only when
   a genuine overlap remains unresolved. Record exact feature files and IDs,
   plus every affected behavior the maps do not cover. Selection is complete
   when each affected surface has a selected procedure or an explicit coverage
   gap.

When no procedure applies, record that outcome, the discovery scope, and the
reason. Use the routed playbook's generic drivers and report the resulting
coverage limitation. When selected procedures leave behavior uncovered, keep
that behavior explicitly unverified and name the missing coverage. A successful
mapped feature does not establish proof for an uncovered one.

## Carry the selection into every brief

Before dispatch, retain one selection record with the task evidence and include
it in every owner and independent-verifier brief. A file pointer is sufficient
when the recipient can read the complete record. Include these execution facts:

- Each selected skill's registered name and exact loadable location, including
  its resolved `SKILL.md` path when filesystem-backed.
- Affected surfaces, feature-map files and IDs, and uncovered behavior. For a
  no-procedure result, include the explicit fallback reason and limitations.
- Target repository and exact revision, comparison revision when required, and
  the runtime, build, deployment, app, or device identity needed to prove which
  target is running. Before an implementation creates its candidate revision,
  name the starting revision and require the owner to record the exact candidate
  before verification.
- Launch and Doctor prerequisites, authentication, fixtures, environment, and
  their known status. Name missing prerequisites rather than assuming readiness.
- Required evidence, retention paths, observable assertions, and pass predicates
  for each selected feature.
- Underlying drivers required by the procedure and their availability in the
  recipient's runtime. External lanes may lack the parent's control tools.

Require recipients to load the selected procedures and feature instructions,
confirm coverage against their assigned target, and carry this record into
further delegation. Refresh selection when scope, target, repository
instructions, or registered procedures change. Report any resulting coverage
change in the evidence record.

## Execute and report the result

The owner and each independent verifier load and follow the selected procedure
for their own execution. Follow its launch, prerequisite checks, affected
feature recipes, evidence capture, and cleanup. Resolve platform drivers only
after selection. Keep required same-surface reproduction and comparison checks.

If a selected prerequisite or required driver is missing or fails, report the
affected scope as blocked with the failed check and the condition for resuming.
Generic driving cannot replace that selected procedure. Other independent
surfaces may proceed, but their success does not clear the blocked scope.

Each independent verifier produces fresh evidence for the required current
revision and runtime identity. Owner or coordinator evidence supplies context
only. Apply existing current-head gates and refresh evidence when its target or
inputs change. Retain the selection, actual prerequisite results, covered and
unverified behavior, artifacts, and pass, fail, or blocked verdicts together.

Preserve the routed workflow's independence and review requirements. Apply
`running-mobile-simulators` before device state changes and retain its exact
device ownership through cleanup. Release owned resources after evidence is
saved. Follow the repository's merge authority and operator checkpoints.
