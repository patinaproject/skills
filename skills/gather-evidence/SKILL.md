---
name: gather-evidence
description: Capture proof that observed behavior matches a claim. Use before any fixed, done, or working claim, when recording video or screenshot evidence, and when handing evidence to the operator.
---

# Gather evidence

Evidence is an artifact a human can inspect that shows the claimed behavior on
an identified build. Gather it before any claim that behavior works, is fixed,
or is done. For matching evidence to a bug report and for the verified or
pending verdict, apply the
[reporter-fidelity reference](../ready-pr/references/reporter-fidelity.md).

## Capture contract

A capture is valid only when it satisfies every rule below. Recapture when one
fails.

1. **Identify the target.** Record the build, the head SHA it was built from,
   and the environment before you capture. Keep that identity beside the
   evidence through handoff. Evidence from an unidentified target proves
   nothing.
2. **Match the environment.** Capture on the environment the claim names. A
   development build answers a development claim only; a claim about a
   deployed pull request head requires a deployment built from that head.
3. **Reset to realistic conditions.** Capture the first encounter, not a
   warmed-up repeat. When the behavior involves loading, clear caches and use
   fresh, uncached assets, and state in the handoff how you reset.
4. **Capture in human-viewable form.** Record video for motion, timing, and
   interaction. Screenshot static layout. Paste command output for CLI
   behavior. View hierarchies, logs, and test output corroborate; the
   human-viewable artifact is the evidence.
5. **Inspect before claiming.** Play or read the artifact end to end. It must
   visibly show the expected behavior and no reported failure. When it is
   unclear, incomplete, or shows the failure, keep fixing or recapture.
   Report only what the artifact shows.

## Operator handoff

- Present each artifact with a playable or viewable preview and its target
  identity beside it.
- Include one clipboard action per video: a single ready-to-run command that
  puts the video file itself on the clipboard, never only its path. On macOS:

  ```sh
  osascript -e 'set the clipboard to (POSIX file "<absolute-path>")'
  ```

- Confirm the clipboard holds the file before reporting the copy as done. When
  the host cannot copy a file, name the exact path and say the clipboard
  action is unavailable.
- With multiple videos, pair each clipboard action with exactly one artifact.
- Keep every presented artifact on disk until the operator finishes the
  handoff.
- Change the clipboard only when the operator asks.
