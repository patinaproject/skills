# Android Emulator

## Start the selected AVD

List named Android Virtual Devices before selecting one:

```bash
emulator -list-avds
```

For ordinary startup, let the Android Emulator select an available console and
ADB port pair:

```bash
emulator -avd <avd-name>
```

Add explicit port allocation only when parallel device creation requires it.
Record the launcher PID and resolve the exact serial before another device
operation.

Startup is complete when the session record contains the selected AVD name,
exact serial, launcher command, and launcher PID.

## Prove identity and readiness

Verify the selected serial and AVD:

```bash
adb devices -l
adb -s <serial> emu avd name
adb -s <serial> get-state
adb -s <serial> shell getprop sys.boot_completed
```

Android is ready when the selected serial reports the intended AVD,
`get-state` returns `device`, and `sys.boot_completed` returns `1`.

Complete this check only when every result came from the recorded serial.

## Bind operations and cleanup

Scope every targeted ADB command with `adb -s <serial>`. Inventory can list all
devices, but a different serial cannot satisfy readiness or receive a mutation.

For an owned emulator, shut it down through its exact serial:

```bash
adb -s <serial> emu kill
```

Leave shared ADB and every attached or unrelated device running. Android
cleanup is complete when the recorded emulator and launcher exit.
