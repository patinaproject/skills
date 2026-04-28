# Pressure-test walkthrough: loopback trailer removal [#57](https://github.com/patinaproject/superteam/issues/57)

This Reviewer walkthrough records the pressure-test pass/fail results for the
workflow-contract change that removes durable `Loopback:` trailer state.

Reviewed head: `737f28969e94b7ea3b23b99409c82aae3e132514`

## Scope

The walkthrough covers the issue #57 replacement scenarios in
`docs/superpowers/pressure-tests/superteam-orchestration-contract.md`:

1. `Spec feedback routes through Brainstormer before execution resumes`
2. `Implementation work without PR reruns local review before publish`
3. `Obsolete Loopback text is ignored during resume`
4. `Resume from visible artifact and PR state without trailer scan`

## Results

### Spec feedback routes through Brainstormer before execution resumes

Result: pass.

Walkthrough:

1. Starting condition: a branch has a committed plan doc and no PR, and
   `Reviewer` classifies a current requirement-level finding during the same
   run.
2. `skills/superteam/SKILL.md` requires feedback classifications to be explicit
   and routes `spec-level` findings to `Brainstormer`.
3. `skills/superteam/routing-table.md` routes `execute` + requirement change to
   `Brainstormer` as spec-level feedback.
4. No commit trailer is required for that route.

Observed behavior: requirement authority is restored through `Brainstormer`
before execution resumes, without durable trailer state.

### Implementation work without PR reruns local review before publish

Result: pass.

Walkthrough:

1. Starting condition: a later `/superteam` invocation resumes after
   implementation commits exist, no PR exists, and prior local review findings
   cannot be proven resolved from visible state.
2. `skills/superteam/pre-flight.md` states that pre-flight does not recover
   workflow state from commit trailers and routes through `Reviewer` before
   `Finisher` can publish in this case.
3. `skills/superteam/routing-table.md` has an execute-phase row for
   implementation state present + no PR + local review not visibly resolved,
   routing to `Reviewer` to rerun or reconstruct local review.
4. `skills/superteam/SKILL.md` mirrors the same safety rule in `Review and
   feedback routing`.

Observed behavior: publication is blocked until `Reviewer` reruns or
reconstructs local review from visible state.

### Obsolete Loopback text is ignored during resume

Result: pass.

Walkthrough:

1. Starting condition: a branch can reach old commit body text or trailers
   containing `Loopback: spec-level`.
2. `skills/superteam/pre-flight.md` removed loopback-class recovery and no
   longer includes `active_loopback_class` in the pre-flight output record.
3. `skills/superteam/routing-table.md` has no active-loopback precedence table.
4. Remaining `Loopback:` mentions in current workflow surfaces are limited to
   deprecation, RED baseline, obsolete-text pressure-test coverage, and
   anti-reintroduction guardrails.

Observed behavior: old `Loopback:` text is not used to derive routing state.

### Resume from visible artifact and PR state without trailer scan

Result: pass.

Walkthrough:

1. Starting condition: a later `/superteam` invocation resumes on a branch with
   committed design and plan artifacts, and either no PR or an existing PR.
2. `skills/superteam/pre-flight.md` detection now resolves issue, branch,
   committed artifacts, PR state, detected phase, prompt class, and execution
   mode; it does not scan branch-only commits for trailer state.
3. `skills/superteam/routing-table.md` routes from detected phase, prompt
   classification, visible review state, and PR state.

Observed behavior: resume uses visible artifacts and PR/review state without
trailer recovery.

## Verification Commands

```bash
pnpm lint:md
rg -n "loop back|loopback_classification|active_loopback_class" skills/superteam docs/superpowers/pressure-tests/superteam-orchestration-contract.md
rg -n "Loopback|loopback-trailers" skills/superteam docs/superpowers/pressure-tests/superteam-orchestration-contract.md docs/superpowers/baselines/2026-04-28-57-loopback-trailer-removal-red-phase-baseline.md
```

Outcomes:

- `pnpm lint:md`: pass.
- `loop back|loopback_classification|active_loopback_class` search: no matches.
- `Loopback|loopback-trailers` search: matches only deprecation, RED baseline,
  obsolete-text pressure-test coverage, and anti-reintroduction guardrails.

## Reviewer Conclusion

Pass. The pressure-test walkthrough found no remaining loophole for active
trailer-backed workflow state, and the local-review-before-publication safety
case remains covered without reintroducing hidden state.
