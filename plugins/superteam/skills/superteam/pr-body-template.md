# PR body template

Finisher renders this when opening or updating a PR so acceptance criteria and verification state stay visible.

````markdown
## Summary
- <1-3 bullets>

## Acceptance checklist

- [ ] AC-1: Given <precondition>, when <action>, then <observable result>. [E2E verified]
  - Evidence: `path/to/test.spec.ts > should ...` — ✅ verified
- [ ] AC-2: Given <precondition>, when <action>, then <observable result>. [manual]
  - Evidence: manual verification — <reason>

## Test plan
- [ ] All required ACs above verified on the latest branch state

## Known CI state

Only include this section when CI is still red and the operator has explicitly chosen to proceed.
````

## Status rules

- Use `[E2E verified]` when the corresponding tagged test passed on the latest CI run.
- Use `[manual]` only when the design or plan explicitly marks that AC as manual verification.
- Keep the checklist synchronized with the latest pushed branch state.
