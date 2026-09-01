# Device leases

Use one host-visible lease namespace shared by every agent running as the
current user:

```bash
lease_root="/tmp/running-mobile-simulators-$(id -u)"
mkdir -p "$lease_root"
```

Do not place leases inside a worktree. A worktree-local lock cannot coordinate
an external device or separate agents that share the worktree.

## Name the canonical device

Use one canonical identity regardless of the tool that will control it:

- Android: `android-avd:<avd-name>`. For a running emulator, resolve the AVD
  name with read-only `adb -s <serial> emu avd name` before claiming it.
- iOS: `ios-simulator:<udid>`.

Hash the complete identity for the lease directory name so shell-sensitive
device names never become paths:

```bash
lease_key="$(printf '%s' "$device_identity" | shasum -a 256 | awk '{print $1}')"
lease_dir="$lease_root/$lease_key.lease"
```

The selected AVD name or UDID must be known before any normal launcher changes
device state. If a launcher cannot reveal which canonical device it will use
before startup, do not use that launcher on a shared host.

Identity selection is complete when the session record names the canonical
identity and its lease path, with no device mutation performed.

## Claim atomically

Generate the agent session ID once. Reuse it for retries and recovery. Use
`mkdir` as the atomic claim:

```bash
session_id="<agent-session-uuid>"
if mkdir "$lease_dir"; then
  printf '%s\n' "$session_id" >"$lease_dir/session-id"
  printf '%s\n' "$workspace_real_path" >"$lease_dir/workspace"
  printf '%s\n' "$device_identity" >"$lease_dir/device"
elif test -f "$lease_dir/session-id" &&
    test "$(sed -n '1p' "$lease_dir/session-id")" = "$session_id"; then
  :
else
  printf 'device already leased: %s\n' "$device_identity" >&2
  exit 1
fi
```

Directory creation succeeds for only one contender. A retry by the owning agent
adopts its existing lease. A missing or partially written lease record is still
held. Another agent must not repair or take it while the holder may be starting.

Use the lease directory as the host-visible session record. Add the platform,
ownership mode, launcher details, owned process IDs, required app build, and
exact serial or UDID as those values become known. After claiming an Android
AVD, add its exact serial as soon as startup resolves it. All later tools bind
to the recorded serial or UDID. The lease remains keyed by the canonical
identity.

Claiming is complete when the lease directory contains the agent session ID,
workspace real path, and canonical identity. Do not proceed from an incomplete
record.

## Handle conflicts and stale leases

On conflict, inspect the lease record and current device and process inventory
without changing them. Select another unleased device or stop and report the
holding agent session, workspace, and canonical identity.

Do not steal a lease because it is old, its workspace is absent, or a recorded
PID is dead. PID reuse and delayed launch make those checks insufficient. A
lease may be reclaimed only after a human confirms that its session is
abandoned and no recorded device, launcher, app run, Maestro, MCP, or Viewer
process remains active. Preserve the abandoned record before removing it.

Conflict handling is complete only when the session has claimed a different
canonical device or has stopped without mutating the contested device.

## Release exactly one claim

After owned-resource cleanup, compare the lease's `session-id` with the agent
session ID. If they differ or either value is missing, stop without removing
the lease. When they match, remove only that lease's files and directory. Never
remove the lease root or another session's directory.

Release is complete when the matching lease directory no longer exists. An
attached device remains running; releasing its lease only makes it available
to another workspace.
