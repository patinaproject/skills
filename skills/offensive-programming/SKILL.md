---
name: offensive-programming
description: Apply offensive programming when writing a try/catch or error handler, null or existence check, default or fallback, optional chaining over possibly invalid data, retry, assertion, guard branch, feature-flag or environment-variable skip, workaround, or shortcut.
---

# Offensive programming

Use this decision procedure before writing the proposed handling. The
[line of defense](https://en.wikipedia.org/wiki/Offensive_programming) separates
untrusted external input from trusted internal state.

1. Name the exact state. Identify who produces it, what value or control path
   represents it, and what the proposed handling would do. Write no check for a
   state you cannot describe.
2. Classify two axes. Decide whether the producer is outside or inside the
   program's line of defense, then whether the condition is expected behavior
   or an invariant violation. Users, files, networks, other processes, and
   systems outside the program's control are outside. State produced and
   maintained by the program is inside.
3. For an outside producer, validate its input once at the trust boundary. If
   the state is expected product behavior, such as an absent record, permission
   denial, or network failure, handle it at the boundary that owns that
   behavior. Keep this handling and return control to the caller.
4. For an inside producer, trace every path that can produce the state before
   deciding it is impossible. Include access filtering, lifecycle transitions,
   asynchronous work, and partial projections.
5. Route the traced internal state to one response:

   - Handle expected, reachable product behavior at its owning boundary.
   - For a reachable invariant violation, fix the root cause at the
     authoritative writer and fail fast with identifying context. One invariant
     has one enforcing layer, so remove any downstream guard that repeats it.
     Do not recover with a fallback, default, or swallowed error.
   - For an unreachable state, write no guard. Delete or restructure the branch
     so it does not exist, and make the authoritative writer refuse the invalid
     state. Do not add a test only to cover the removed branch.

After selecting one response, return control to the calling skill or user. The
caller owns the implementation, tests, and completion.

## Rules

- A catch on an unattended path ends in one of these outcomes: bounded retry,
  dead-letter storage with the full payload, or a report through an existing
  error-reporting seam with identifying context. Logging and continuing is not
  an outcome.
- Assert what must be true and crash with context when it is false. An assertion
  followed by handling of the same condition contradicts the invariant.
- Refuse a feature-flag skip, environment-variable skip, TODO workaround, or
  other shortcut over a defect. Fix the root cause. If that cause is outside the
  change's scope, surface the blocker to the operator without widening the
  change or hiding the defect.

Read the consumer repository's coding contract for repository-specific rules.
Treat `AGENTS.md` at the repository root and the repo-root-relative documents it
routes to as authoritative.
