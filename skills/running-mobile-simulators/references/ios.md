# iOS Simulator

## Start the selected simulator

List available simulated devices and select one exact UDID:

```bash
xcrun simctl list devices available -j
xcrun simctl boot <udid>
```

An iOS simulator uses its UDID instead of an emulator console port. Record the
UDID and launcher command before boot. If the launcher is not persistent,
record that fact instead of a PID.

Startup is complete when the session record contains the selected UDID and
launcher details.

## Prove identity and readiness

Verify the selected UDID:

```bash
xcrun simctl list devices booted -j
xcrun simctl bootstatus <udid> -b
```

iOS is ready when the recorded UDID is booted and `bootstatus` exits
successfully for that UDID.

## Bind operations and cleanup

Pass the recorded UDID to every targeted `xcrun simctl` command. A different
booted simulator cannot satisfy readiness or receive a mutation.

For an owned simulator, shut it down through its exact UDID:

```bash
xcrun simctl shutdown <udid>
```

Leave attached and unrelated simulators running. iOS cleanup is complete when
the recorded simulator is shut down and every owned launcher has exited.
