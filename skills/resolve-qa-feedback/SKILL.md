---
name: resolve-qa-feedback
description: Fix a defect reported by QA or a tester, then repeat the reported steps and inspect visual evidence. Use when a QA report describes a bug to fix.
---

# Resolve QA feedback

1. Use `diagnosing-bugs` to reproduce the tester's report in the reported
   environment. Follow the same steps and record the visible failure. If the
   problem does not reproduce, stop and state exactly what prevented it.
2. Use `develop` to fix the reproduced problem. Add a regression test when the
   behavior can be tested reliably.
3. Repeat the tester's steps against the fixed pull request build. Confirm that
   the failure is gone and the expected behavior occurs.
4. Capture screenshots or one continuous video that shows the starting state,
   the tester's actions, the application's response, and the expected result.
5. Inspect the evidence yourself. Continue fixing or capture it again when it
   is incomplete, unclear, or shows the wrong behavior. Finish only when the
   evidence visibly proves that the reported defect is fixed.
