# Maestro

Maestro is an optional launcher and controller. The session still gets its
ownership, device identity, readiness, recovery, and cleanup rules from the
main skill and the selected platform reference.

## Start a standard device

Use device specifications that the current host reports:

```bash
maestro list-devices --platform <android-or-ios>
maestro start-device \
  --platform <android-or-ios> \
  --device-model <reported-model> \
  --device-os <reported-os>
```

Reserve `--force-create` for explicit device maintenance because it can replace
a canonical device. After startup, follow the platform reference to resolve
the exact serial or UDID and prove readiness.

## Bind CLI and MCP

Select the recorded device for each CLI flow:

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

Record the MCP process and its working directory in the session record.

## Keep the Viewer connected

Let Maestro select a free Viewer port by omitting `--viewer-port`. Capture the
Viewer URL from MCP startup and surface it to the operator before the run. Open
the URL when the host supports an embedded browser.

Use the recorded `device_id` in the first device tool call. Confirm that the
Viewer connects to that device before starting the flow. Keep the same Viewer
and device connection throughout the run.

This step is complete when the operator has the Viewer URL and the Viewer shows
the recorded device before the run. When the host has an embedded browser, that
browser must also show the Viewer before the run.

## Cleanup

Stop only the Maestro MCP and Viewer processes that this session started. Use
their recorded PIDs. Maestro cleanup is complete when those owned processes
exit and unrelated Maestro sessions remain available.
