---
name: resolve-qa-feedback
description: Resolves tester-reported QA feedback through exact reproduction, development, fixed-build retest, and inspected visual evidence. Use when a tester or QA report describes a defect to fix.
---

1. Reproduce the tester’s exact report with `/diagnosing-bugs`. Use the reported environment, steps, and observable behavior. Record a human-readable red baseline. If it does not reproduce, stop and report the exact blocker.
2. Fix the reproduced problem with `/develop`. Use TDD where the behavior has a stable test seam.
3. Repeat the tester’s exact steps on the fixed pull-request build. Confirm the reported failure is absent and the expected behavior occurs.
4. Capture human-readable evidence, such as screenshots or a continuous video. The evidence must show:
    - the relevant initial state;
    - the tester’s actions;
    - the application’s response;
    - the expected final state.
5. Inspect the evidence before reporting success. If it is unclear, incomplete, or shows incorrect behavior, continue fixing or recapture it. Finish only when the evidence visibly proves the exact QA report is resolved.
