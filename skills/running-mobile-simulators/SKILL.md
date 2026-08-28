---
name: running-mobile-simulators
description: Manage Android emulators and iOS simulators on shared development hosts. Use when an agent needs a virtual mobile device for app execution, UI automation, evidence capture, recovery, cleanup, or Maestro.
---

# Running mobile simulators

A virtual mobile device exists outside the workspace that uses it. Bind one
session to one workspace, one exact device, and the processes that the session
starts.

## Establish the session boundary

Before a device state change, resolve the workspace's real path and inventory:

- connected Android emulator serials and iOS simulator UDIDs;
- active emulator, Simulator, Maestro, MCP, and Viewer processes; and
- active leases or other repository-specific device coordination.

Choose one ownership mode:

- **Attached device.** Use an existing device by its exact identifier. Its owner
  retains lifecycle responsibility.
- **Owned device.** Start one device for this session. Record its exact
  identifier, launcher command, and launcher PID. If the launcher exits, record
  that it is not persistent.

Record the workspace, platform, ownership mode, device identifier, launcher,
owned processes, and app build identity in one session record. For a new owned
device, record the intended named device before launch. Resolve and add its
exact serial or UDID before the next device operation.

When workspaces share a host, acquire a device lease or serialize device
creation and app runs. Include the workspace's real path in the lease.

This step is complete when the session record identifies one device and its
ownership boundary.

## Start or attach to one device

Use the requested launcher. Otherwise, use the platform launcher for a named
existing device:

```bash
emulator -list-avds
emulator -avd <avd-name>

xcrun simctl list devices available -j
xcrun simctl boot <udid>
```

Maestro can optionally create a standard local device:

```bash
maestro list-devices --platform <android-or-ios>
maestro start-device \
  --platform <android-or-ios> \
  --device-model <reported-model> \
  --device-os <reported-os>
```

Use models and operating-system versions reported by the current host. Reserve
Maestro's `--force-create` option for explicit device maintenance because it
can replace a canonical device.

For ordinary startup, let the Android Emulator select an available console and
ADB port pair. Add explicit port allocation only when parallel device creation
requires it. Identify each iOS simulator by UDID, not by a console port.

## Prove identity and readiness

For Android, verify the selected serial and AVD:

```bash
adb devices -l
adb -s <serial> emu avd name
adb -s <serial> get-state
adb -s <serial> shell getprop sys.boot_completed
```

Android is ready when the selected serial reports the intended AVD,
`get-state` returns `device`, and `sys.boot_completed` returns `1`.

For iOS, verify the selected UDID:

```bash
xcrun simctl list devices booted -j
xcrun simctl bootstatus <udid> -b
```

iOS is ready when the selected UDID is booted and `bootstatus` exits
successfully.

Complete this step only when the ready device matches the session record.

## Bind every operation

Use the recorded identifier for every targeted device command. Scope Android
mutations with `adb -s <serial>`. Pass the recorded UDID to every targeted
`xcrun simctl` command.

Select the device explicitly for Maestro CLI flows:

```bash
maestro --device <serial-or-udid> test <flow-or-directory>
```

For Maestro MCP, call `list_devices` first and verify the recorded identifier.
Pass that identifier as `device_id` to every device tool call.

When the session starts Maestro MCP directly, bind file operations to the
workspace:

```bash
maestro mcp --working-dir "$(git rev-parse --show-toplevel)"
```

Let Maestro select a free Viewer port by omitting `--viewer-port`. Connect the
Viewer to the recorded device through the first device tool call.

Before evidence capture, prove that the selected device runs the app build from
the required workspace or deployment target. Record the device identifier and
app build identity with the evidence.

This step is complete when automation and evidence name the recorded device
and current app build.

## Recover within the boundary

Use this bounded order:

1. Reconnect automation once.
2. Restart the app once if the failure remains.
3. Restart the device once only when the session owns it.

After each recovery action, repeat the identity and readiness checks. Also
recheck the app build after an app or device restart.

If an attached device needs a lifecycle restart, stop and report that its owner
must recover it. If owned-device recovery fails, stop and report the exact
failure.

## Release owned resources

Stop only the processes and device recorded as owned by the current session.
Release its lease after those resources exit. Preserve attached devices, shared
ADB, unrelated simulators, and other workspaces' processes.

For an owned Android emulator, target shutdown with its exact serial. For an
owned iOS simulator, target shutdown with its exact UDID. Use the recorded PIDs
for owned launchers, Maestro servers, and Viewers.

Cleanup is complete when every owned resource has exited and every attached or
unrelated resource remains available.
