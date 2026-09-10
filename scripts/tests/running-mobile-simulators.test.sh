#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
checker="$repo_root/plugins/engineering/skills/running-mobile-simulators/scripts/check-readiness.sh"
adb_reader="$repo_root/plugins/engineering/skills/running-mobile-simulators/scripts/adb-readonly.py"
probe_runner="$repo_root/plugins/engineering/skills/running-mobile-simulators/scripts/probe-command.py"
tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/running-mobile-simulators-test.XXXXXX")"
trap 'test -n "${adb_server_pid:-}" && kill "$adb_server_pid" 2>/dev/null || true; rm -rf "$tmp_dir"' EXIT

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

assert_eq() {
  test "$1" = "$2" || fail "expected '$2', got '$1'${3:+ ($3)}"
}

assert_check() {
  local report="$1" check="$2" status="$3"
  jq -e --arg check "$check" --arg status "$status" \
    '[.checks[] | select(.check == $check and .status == $status)] | length == 1' \
    <<<"$report" >/dev/null || fail "$check did not report $status: $report"
}

snapshot_tree() {
  local root="$1"
  if ! test -e "$root"; then
    printf 'missing\n'
    return
  fi
  find "$root" -type f -print0 | sort -z | while IFS= read -r -d '' file; do
    printf '%s ' "${file#"$root"/}"
    shasum -a 256 "$file" | awk '{print $1}'
  done
}

lease_path() {
  local root="$1" device="$2" key
  key="$(printf '%s' "$device" | shasum -a 256 | awk '{print $1}')"
  printf '%s/%s.lease' "$root" "$key"
}

write_fingerprint() {
  local lease="$1" prefix="$2" command="$3"
  printf '4242\n' >"$lease/$prefix-pid"
  printf '%s\n' "$FAKE_STARTED_AT" >"$lease/$prefix-start-time"
  printf '%s\n' "$command" >"$lease/$prefix-command"
  printf '%s\n' "$workspace" >"$lease/$prefix-cwd"
  printf '%s\n' "$FAKE_UID" >"$lease/$prefix-uid"
}

make_lease() {
  local root="$1" device="$2" target="$3" disposition="${4:-persistent}" lease
  rm -rf "$root"
  mkdir -p "$root"
  lease="$(lease_path "$root" "$device")"
  mkdir "$lease"
  printf 'session-494\n' >"$lease/session-id"
  printf '%s\n' "$workspace" >"$lease/workspace"
  printf '%s\n' "$device" >"$lease/device"
  printf 'owned\n' >"$lease/ownership-mode"
  printf '%s\n' "$disposition" >"$lease/launcher-disposition"
  if [[ "$device" == android-avd:* ]]; then
    printf '%s\n' "$target" >"$lease/serial"
    write_fingerprint "$lease" launcher "$FAKE_LAUNCHER_COMMAND"
  fi
  printf '%s' "$lease"
}

invoke() {
  local stdout_file="$tmp_dir/check.out" stderr_file="$tmp_dir/check.err"
  set +e
  "$checker" "$@" >"$stdout_file" 2>"$stderr_file"
  invoke_status=$?
  set -e
  invoke_output="$(cat "$stdout_file")"
}

save_evidence() {
  local name="$1" before_snapshot="$2" after_snapshot="$3"
  if test -z "${EVIDENCE_OUTPUT_DIR:-}"; then
    return 0
  fi
  mkdir -p "$EVIDENCE_OUTPUT_DIR"
  printf '%s\n' "$invoke_output" >"$EVIDENCE_OUTPUT_DIR/$name.json"
  {
    printf '%s\n' 'before:' "$before_snapshot" 'after:' "$after_snapshot"
  } >"$EVIDENCE_OUTPUT_DIR/$name-lease-snapshot.txt"
  test ! -f "$FAKE_LOG" || cp "$FAKE_LOG" "$EVIDENCE_OUTPUT_DIR/$name-platform-requests.txt"
  if test "$name" = "android-ready" && test -f "${adb_request_log:-}"; then
    cp "$adb_request_log" "$EVIDENCE_OUTPUT_DIR/$name-adb-requests.txt"
  fi
}

start_adb_server() {
  local mode="$1" state="${2:-device}" boot="${3:-1}" avd="${4:-Pixel_API_35}"
  adb_port_file="$tmp_dir/adb-port"
  adb_request_log="$tmp_dir/adb-requests"
  rm -f "$adb_port_file" "$adb_request_log"
  python3 "$tmp_dir/fake-adb-server.py" \
    "$mode" "$adb_port_file" "$adb_request_log" emulator-5554 "$state" "$boot" "$avd" &
  adb_server_pid=$!
  for _ in $(seq 1 100); do
    test -s "$adb_port_file" && break
    sleep 0.01
  done
  test -s "$adb_port_file" || fail "fake ADB server did not start"
  adb_port="$(cat "$adb_port_file")"
}

finish_adb_server() {
  wait "$adb_server_pid"
  adb_server_pid=""
}

workspace="$tmp_dir/workspace"
lease_root="$tmp_dir/leases"
fake_bin="$tmp_dir/bin"
mkdir -p "$workspace" "$fake_bin"
workspace="$(cd "$workspace" && pwd -P)"
export FAKE_LOG="$tmp_dir/platform.log"
FAKE_UID="$(id -u)"
export FAKE_UID
export FAKE_STARTED_AT="Wed Sep 10 10:00:00 2026"
export FAKE_LAUNCHER_COMMAND="/opt/android/emulator -avd Pixel_API_35"
export FAKE_PROCESS_COMMAND="$FAKE_LAUNCHER_COMMAND"
export FAKE_PROCESS_CWD="$workspace"
export FAKE_PROCESS_UID="$FAKE_UID"
export FAKE_PROCESS_STARTED_AT="$FAKE_STARTED_AT"
export FAKE_PROCESS_PPID="41"
export FAKE_IOS_UDID="AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE"
export FAKE_IOS_STATE="Booted"
export FAKE_IOS_AVAILABLE="true"
export FAKE_IOS_MODE="normal"
export FAKE_BOOTSTATUS_SLEEP="0"
export PATH="$fake_bin:$PATH"

cat >"$fake_bin/adb" <<'EOF'
#!/usr/bin/env bash
printf 'adb %s\n' "$*" >>"$FAKE_LOG"
exit 99
EOF

cat >"$fake_bin/ps" <<'EOF'
#!/usr/bin/env bash
field=""
while (($#)); do
  if test "$1" = "-o"; then
    field="$2"
    break
  fi
  shift
done
case "$field" in
  lstart=)
    if test "${FAKE_PS_REUSED:-0}" = "1"; then
      printf 'Thu Sep 11 11:00:00 2026\n'
    else
      printf '%s\n' "$FAKE_PROCESS_STARTED_AT"
    fi
    ;;
  command=) printf '%s\n' "$FAKE_PROCESS_COMMAND" ;;
  uid=) printf '%s\n' "$FAKE_PROCESS_UID" ;;
  ppid=) printf '%s\n' "$FAKE_PROCESS_PPID" ;;
  *) exit 2 ;;
esac
EOF

cat >"$fake_bin/lsof" <<'EOF'
#!/usr/bin/env bash
printf 'p4242\nfcwd\nn%s\n' "$FAKE_PROCESS_CWD"
EOF

cat >"$fake_bin/xcrun" <<'EOF'
#!/usr/bin/env bash
printf 'xcrun %s\n' "$*" >>"$FAKE_LOG"
case "$*" in
  'simctl list devices -j')
    if test "$FAKE_IOS_MODE" = "missing-tool"; then
      printf 'xcrun unavailable\n' >&2
      exit 127
    fi
    if test "$FAKE_IOS_MODE" = "malformed"; then
      printf '{bad json\n'
      exit 0
    fi
    if test "$FAKE_IOS_MODE" = "malformed-valid" || \
        { test "$FAKE_IOS_MODE" = "malformed-after" && test "$(grep -c '^xcrun simctl list devices -j$' "$FAKE_LOG")" -gt 1; }; then
      printf '{"devices":{"com.apple.CoreSimulator.SimRuntime.iOS-18-0":1}}\n'
      exit 0
    fi
    printf '{"devices":{"com.apple.CoreSimulator.SimRuntime.iOS-18-0":[{"udid":"%s","isAvailable":%s,"state":"%s"}]}}\n' \
      "$FAKE_IOS_UDID" "$FAKE_IOS_AVAILABLE" "$FAKE_IOS_STATE"
    ;;
  "simctl bootstatus $FAKE_IOS_UDID")
    if test -n "${FAKE_MUTATE_LEASE_FILE:-}"; then
      printf 'changed-by-fake-boundary\n' >"$FAKE_MUTATE_LEASE_FILE"
    fi
    if test "$FAKE_BOOTSTATUS_SLEEP" != "0"; then
      sleep "$FAKE_BOOTSTATUS_SLEEP"
    fi
    ;;
  *) exit 97 ;;
esac
EOF

cat >"$tmp_dir/fake-adb-server.py" <<'PY'
import socket
import struct
import sys

mode, port_file, log_file, serial, state, boot, avd = sys.argv[1:]


def exact(conn, size):
    result = bytearray()
    while len(result) < size:
        chunk = conn.recv(size - len(result))
        if not chunk:
            raise RuntimeError("truncated request")
        result.extend(chunk)
    return bytes(result)


def request(conn):
    size = int(exact(conn, 4), 16)
    value = exact(conn, size).decode()
    with open(log_file, "a", encoding="utf-8") as output:
        output.write(value + "\n")
    return value


def okay(conn):
    conn.sendall(b"OKAY")


def framed(conn, value):
    encoded = value.encode()
    conn.sendall(f"{len(encoded):04x}".encode() + encoded)


def shell(conn, value):
    encoded = (value + "\n").encode()
    conn.sendall(b"\x01" + struct.pack("<I", len(encoded)) + encoded)
    exit_payload = struct.pack("<I", 0) if mode == "wide-exit" else b"\x00"
    conn.sendall(b"\x03" + struct.pack("<I", len(exit_payload)) + exit_payload)


listener = socket.socket()
listener.bind(("127.0.0.1", 0))
listener.listen()
with open(port_file, "w", encoding="utf-8") as output:
    output.write(str(listener.getsockname()[1]))

for _ in range(3):
    conn, _ = listener.accept()
    with conn:
        first = request(conn)
        if mode == "lost" and first.startswith("host-serial:"):
            continue
        if first == f"host-serial:{serial}:get-state":
            okay(conn)
            framed(conn, state)
            continue
        if first != f"host:transport:{serial}":
            conn.sendall(b"FAIL000fwrong transport")
            continue
        okay(conn)
        second = request(conn)
        okay(conn)
        if mode == "truncated" and second.endswith("sys.boot_completed"):
            conn.sendall(b"\x01\x04\x00")
            continue
        if second == "shell,v2,raw:getprop sys.boot_completed":
            shell(conn, boot)
        elif second == "shell,v2,raw:getprop ro.boot.qemu.avd_name":
            shell(conn, avd)
        else:
            conn.sendall(b"\x03" + struct.pack("<I", 1) + b"\x01")
PY

chmod +x "$fake_bin/adb" "$fake_bin/ps" "$fake_bin/lsof" "$fake_bin/xcrun"

cat >"$tmp_dir/slow-probe.sh" <<'EOF'
#!/usr/bin/env bash
trap 'exit 0' TERM
(sleep 0.3; printf 'escaped\n' >"$PROBE_ESCAPE_MARKER") &
wait
EOF
chmod +x "$tmp_dir/slow-probe.sh"
export PROBE_ESCAPE_MARKER="$tmp_dir/probe-escaped"
set +e
python3 "$probe_runner" --timeout 0.05 -- "$tmp_dir/slow-probe.sh" >/dev/null 2>"$tmp_dir/probe-timeout.err"
probe_status=$?
set -e
assert_eq "$probe_status" "124" "probe timeout status"
sleep 0.4
test ! -e "$PROBE_ESCAPE_MARKER" || fail "timed-out probe left a child running"

cat >"$tmp_dir/fast-probe.sh" <<'EOF'
#!/usr/bin/env bash
trap 'printf signaled >"$PROBE_SIGNAL_MARKER"' TERM
exit 0
EOF
chmod +x "$tmp_dir/fast-probe.sh"
export PROBE_SIGNAL_MARKER="$tmp_dir/probe-signaled"
for _ in $(seq 1 20); do
  python3 "$probe_runner" --timeout 0.5 -- "$tmp_dir/fast-probe.sh" >/dev/null
done
test ! -e "$PROBE_SIGNAL_MARKER" || fail "completed probe was signaled by timeout cleanup"

start_adb_server ready
adb_report="$(python3 "$adb_reader" --serial emulator-5554 --port "$adb_port" --timeout 1)"
finish_adb_server
jq -e '.queries.state.value == "device" and .queries.bootCompleted.value == "1" and .queries.avdName.value == "Pixel_API_35"' <<<"$adb_report" >/dev/null || fail "fixed ADB queries did not return ready values"
expected_adb_requests="$(cat <<'EOF'
host-serial:emulator-5554:get-state
host:transport:emulator-5554
shell,v2,raw:getprop sys.boot_completed
host:transport:emulator-5554
shell,v2,raw:getprop ro.boot.qemu.avd_name
EOF
)"
assert_eq "$(cat "$adb_request_log")" "$expected_adb_requests" "fixed ADB request set"

start_adb_server wide-exit
adb_report="$(python3 "$adb_reader" --serial emulator-5554 --port "$adb_port" --timeout 1 2>"$tmp_dir/adb-wide-exit.err")"
finish_adb_server
jq -e '.queries.state.status == "pass" and .queries.bootCompleted.status == "unmet" and .queries.avdName.status == "unmet"' <<<"$adb_report" >/dev/null || fail "nonconforming ADB exit frames were accepted"

start_adb_server truncated
adb_report="$(python3 "$adb_reader" --serial emulator-5554 --port "$adb_port" --timeout 1 2>"$tmp_dir/adb-truncated.err")"
finish_adb_server
jq -e '.queries.state.status == "pass" and .queries.bootCompleted.status == "unmet" and .queries.avdName.status == "pass"' <<<"$adb_report" >/dev/null || fail "truncated ADB frame did not stay unmet"

android_device="android-avd:Pixel_API_35"
android_lease="$(make_lease "$lease_root" "$android_device" emulator-5554)"
before="$(snapshot_tree "$lease_root")"
start_adb_server ready
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$adb_port" --timeout 1
finish_adb_server
assert_eq "$invoke_status" "0" "ready Android exit"
jq -e '.ok == true' <<<"$invoke_output" >/dev/null || fail "ready Android report was not ok"
assert_check "$invoke_output" platform.android.avdName pass
assert_check "$invoke_output" process.launcher pass
after="$(snapshot_tree "$lease_root")"
assert_eq "$after" "$before" "ready Android lease mutation"
save_evidence android-ready "$before" "$after"
test ! -s "$FAKE_LOG" || fail "production Android check invoked adb"

unused_port="65534"
before="$(snapshot_tree "$lease_root")"
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$unused_port" --timeout 0.1
assert_eq "$invoke_status" "1" "missing ADB server exit"
assert_check "$invoke_output" platform.android.state unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "missing-server lease mutation"

before="$(snapshot_tree "$lease_root")"
start_adb_server truncated
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$adb_port" --timeout 1
finish_adb_server
assert_check "$invoke_output" platform.android.bootCompleted unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "truncated-frame lease mutation"

before="$(snapshot_tree "$lease_root")"
start_adb_server lost
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$adb_port" --timeout 1
finish_adb_server
assert_check "$invoke_output" platform.android.state unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "lost-frame lease mutation"

before="$(snapshot_tree "$lease_root")"
start_adb_server ready offline 0 Wrong_AVD
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$adb_port" --timeout 1
finish_adb_server
assert_check "$invoke_output" platform.android.state fail
assert_check "$invoke_output" platform.android.bootCompleted fail
assert_check "$invoke_output" platform.android.avdName fail
assert_eq "$(snapshot_tree "$lease_root")" "$before" "unready Android lease mutation"

printf 'other-session\n' >"$android_lease/session-id"
before="$(snapshot_tree "$lease_root")"
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$unused_port" --timeout 0.1
assert_check "$invoke_output" lease.session-id fail
assert_check "$invoke_output" platform.readiness unmet
after="$(snapshot_tree "$lease_root")"
assert_eq "$after" "$before" "conflicting lease mutation"
save_evidence conflicting-lease "$before" "$after"
printf 'session-494\n' >"$android_lease/session-id"

printf '%s\n' "$tmp_dir/wrong-workspace" >"$android_lease/workspace"
before="$(snapshot_tree "$lease_root")"
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$unused_port" --timeout 0.1
assert_check "$invoke_output" lease.workspace fail
assert_eq "$(snapshot_tree "$lease_root")" "$before" "wrong workspace lease mutation"
printf '%s\n' "$workspace" >"$android_lease/workspace"

printf 'emulator-5599\n' >"$android_lease/serial"
before="$(snapshot_tree "$lease_root")"
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$unused_port" --timeout 0.1
assert_check "$invoke_output" lease.serial fail
assert_eq "$(snapshot_tree "$lease_root")" "$before" "wrong serial lease mutation"
printf 'emulator-5554\n' >"$android_lease/serial"

rm -f "$android_lease/workspace"
before="$(snapshot_tree "$lease_root")"
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$unused_port" --timeout 0.1
assert_check "$invoke_output" lease.workspace unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "partial lease mutation"

android_lease="$(make_lease "$lease_root" "$android_device" emulator-5554)"
export FAKE_PS_REUSED=1
before="$(snapshot_tree "$lease_root")"
start_adb_server ready
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$adb_port" --timeout 1
finish_adb_server
assert_check "$invoke_output" process.launcher fail
after="$(snapshot_tree "$lease_root")"
assert_eq "$after" "$before" "PID reuse lease mutation"
save_evidence pid-reuse "$before" "$after"
unset FAKE_PS_REUSED

printf '/opt/android/emulator -avd Wrong_AVD\n' >"$android_lease/launcher-command"
export FAKE_PROCESS_COMMAND="/opt/android/emulator -avd Wrong_AVD"
before="$(snapshot_tree "$lease_root")"
start_adb_server ready
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$adb_port" --timeout 1
finish_adb_server
assert_check "$invoke_output" process.launcher fail
assert_eq "$(snapshot_tree "$lease_root")" "$before" "wrong launcher target lease mutation"
export FAKE_PROCESS_COMMAND="$FAKE_LAUNCHER_COMMAND"

missing_root="$tmp_dir/missing-leases"
before="$(snapshot_tree "$missing_root")"
invoke --device "$android_device" --target emulator-5554 --workspace "$workspace" --session-id session-494 --lease-root "$missing_root" --adb-port "$unused_port" --timeout 0.1
assert_check "$invoke_output" lease.exists fail
assert_eq "$(snapshot_tree "$missing_root")" "$before" "missing lease creation"

ios_device="ios-simulator:$FAKE_IOS_UDID"
ios_lease="$(make_lease "$lease_root" "$ios_device" "$FAKE_IOS_UDID" completed)"
: >"$FAKE_LOG"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_eq "$invoke_status" "0" "ready iOS exit"
assert_check "$invoke_output" platform.ios.device pass
assert_check "$invoke_output" platform.ios.bootstatus pass
assert_check "$invoke_output" platform.ios.recheck pass
test "$(grep -c '^xcrun simctl list devices -j$' "$FAKE_LOG")" = "2" || fail "iOS check did not list twice"
grep -Fx "xcrun simctl bootstatus $FAKE_IOS_UDID" "$FAKE_LOG" >/dev/null || fail "iOS bootstatus did not target the UDID"
! grep -F -- '-b' "$FAKE_LOG" >/dev/null || fail "iOS check used bootstatus -b"
after="$(snapshot_tree "$lease_root")"
assert_eq "$after" "$before" "ready iOS lease mutation"
save_evidence ios-ready "$before" "$after"

export FAKE_IOS_STATE="Shutdown"
: >"$FAKE_LOG"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_check "$invoke_output" platform.ios.device fail
! grep -F 'bootstatus' "$FAKE_LOG" >/dev/null || fail "stopped iOS device was passed to bootstatus"
assert_eq "$(snapshot_tree "$lease_root")" "$before" "stopped iOS lease mutation"

export FAKE_IOS_STATE="Booted"
export FAKE_IOS_AVAILABLE="false"
: >"$FAKE_LOG"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_check "$invoke_output" platform.ios.device fail
assert_eq "$(snapshot_tree "$lease_root")" "$before" "unavailable iOS lease mutation"

export FAKE_IOS_AVAILABLE="true"
export FAKE_IOS_MODE="malformed"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_check "$invoke_output" platform.ios.device unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "malformed iOS result lease mutation"

export FAKE_IOS_MODE="normal"
export FAKE_BOOTSTATUS_SLEEP="5"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 0.05
assert_check "$invoke_output" platform.ios.bootstatus unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "timed-out iOS lease mutation"
export FAKE_BOOTSTATUS_SLEEP="0"

export FAKE_IOS_MODE="malformed-valid"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_eq "$invoke_status" "1" "valid JSON malformed iOS exit"
assert_check "$invoke_output" platform.ios.device unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "valid JSON malformed iOS lease mutation"

export FAKE_IOS_MODE="malformed-after"
: >"$FAKE_LOG"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_eq "$invoke_status" "1" "malformed second iOS observation exit"
assert_check "$invoke_output" platform.ios.device pass
assert_check "$invoke_output" platform.ios.bootstatus pass
assert_check "$invoke_output" platform.ios.recheck unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "malformed second iOS observation lease mutation"

export FAKE_IOS_MODE="normal"
export FAKE_IOS_UDID="FFFFFFFF-1111-2222-3333-444444444444"
: >"$FAKE_LOG"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_check "$invoke_output" platform.ios.device fail
! grep -F 'bootstatus' "$FAKE_LOG" >/dev/null || fail "missing iOS target was passed to bootstatus"
assert_eq "$(snapshot_tree "$lease_root")" "$before" "missing iOS target lease mutation"
export FAKE_IOS_UDID="AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE"

export FAKE_IOS_MODE="missing-tool"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_check "$invoke_output" platform.ios.device unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "missing xcrun lease mutation"
export FAKE_IOS_MODE="normal"

export FAKE_MUTATE_LEASE_FILE="$ios_lease/session-id"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1
assert_check "$invoke_output" lease.unchanged fail
unset FAKE_MUTATE_LEASE_FILE
printf 'session-494\n' >"$ios_lease/session-id"

maestro_ready="$tmp_dir/maestro-ready.json"
printf '[{"device_id":"%s","platform":"ios","type":"simulator","connected":true}]\n' "$FAKE_IOS_UDID" >"$maestro_ready"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$maestro_ready"
assert_check "$invoke_output" automation.maestro-mcp pass

maestro_envelope="$tmp_dir/maestro-envelope.json"
jq -cn --arg id "$FAKE_IOS_UDID" \
  '{content:[{type:"text",text:({devices:[{device_id:$id,platform:"ios",type:"simulator",connected:true}]}|tojson)}],isError:false}' \
  >"$maestro_envelope"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$maestro_envelope"
assert_check "$invoke_output" automation.maestro-mcp pass

maestro_error="$tmp_dir/maestro-error.json"
jq -cn --arg id "$FAKE_IOS_UDID" \
  '{structuredContent:{devices:[{device_id:$id,platform:"ios",type:"simulator",connected:true}]},isError:true}' \
  >"$maestro_error"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$maestro_error"
assert_eq "$invoke_status" "1" "explicit Maestro error exit"
assert_check "$invoke_output" automation.maestro-mcp unmet

maestro_bad_entry="$tmp_dir/maestro-bad-entry.json"
printf '{"devices":[1]}\n' >"$maestro_bad_entry"
before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$maestro_bad_entry"
assert_eq "$invoke_status" "1" "malformed Maestro device entry exit"
assert_check "$invoke_output" automation.maestro-mcp unmet
assert_eq "$(snapshot_tree "$lease_root")" "$before" "malformed Maestro device entry lease mutation"

maestro_wrong="$tmp_dir/maestro-wrong.json"
printf '[{"device_id":"WRONG","platform":"ios","type":"simulator","connected":true}]\n' >"$maestro_wrong"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$maestro_wrong"
assert_check "$invoke_output" automation.maestro-mcp fail

maestro_disconnected="$tmp_dir/maestro-disconnected.json"
printf '[{"device_id":"%s","platform":"ios","type":"simulator","connected":false}]\n' "$FAKE_IOS_UDID" >"$maestro_disconnected"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$maestro_disconnected"
assert_check "$invoke_output" automation.maestro-mcp fail

before="$(snapshot_tree "$lease_root")"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe - </dev/null
assert_check "$invoke_output" automation.maestro-mcp unmet
after="$(snapshot_tree "$lease_root")"
assert_eq "$after" "$before" "unavailable MCP lease mutation"
save_evidence mcp-unavailable "$before" "$after"

invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$tmp_dir/not-present.json"
assert_check "$invoke_output" automation.maestro-mcp unmet

printf '{bad\n' >"$tmp_dir/maestro-malformed.json"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$tmp_dir/maestro-malformed.json"
assert_check "$invoke_output" automation.maestro-mcp unmet

invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --require-maestro-process
assert_check "$invoke_output" process.maestro-mcp unmet

maestro_command="/opt/java/bin/java -classpath /opt/maestro/lib/* maestro.cli.AppKt mcp --working-dir $workspace"
write_fingerprint "$ios_lease" maestro-mcp "$maestro_command"
export FAKE_PROCESS_COMMAND="$maestro_command"
invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --require-maestro-process
assert_check "$invoke_output" process.maestro-mcp pass
export FAKE_PROCESS_COMMAND="$FAKE_LAUNCHER_COMMAND"

missing_ppid_mismatch_failures=""
check_missing_ppid_mismatch() {
  local name="$1" device="$2" target="$3" lease="$4" probe="$5" before_snapshot after_snapshot
  printf '%s\n' "$maestro_command" >"$lease/maestro-mcp-command"
  printf '%s\n' "$workspace" >"$lease/maestro-mcp-cwd"
  printf '%s\n' "$FAKE_UID" >"$lease/maestro-mcp-uid"
  export FAKE_PROCESS_COMMAND="$maestro_command"
  export FAKE_PROCESS_CWD="$workspace"
  export FAKE_PROCESS_UID="99999"
  export FAKE_PROCESS_PPID=""

  before_snapshot="$(snapshot_tree "$lease_root")"
  if [[ "$device" == android-avd:* ]]; then
    start_adb_server ready
    invoke --device "$device" --target "$target" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --adb-port "$adb_port" --timeout 1 --maestro-probe "$probe" --require-maestro-process
    finish_adb_server
  else
    invoke --device "$device" --target "$target" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$probe" --require-maestro-process
  fi
  after_snapshot="$(snapshot_tree "$lease_root")"

  if test "$invoke_status" != "1"; then
    missing_ppid_mismatch_failures="${missing_ppid_mismatch_failures}${missing_ppid_mismatch_failures:+; }$name exited $invoke_status instead of 1"
  fi
  if test -z "$invoke_output"; then
    missing_ppid_mismatch_failures="${missing_ppid_mismatch_failures}${missing_ppid_mismatch_failures:+; }$name emitted empty stdout"
  elif ! jq -e --arg uid "$FAKE_UID" --arg workspace "$workspace" '
      .ok == false and
      .owner.sessionId == "session-494" and
      .owner.workspace == $workspace and
      ([.checks[] | select(
        .check == "process.maestro-mcp" and
        .status == "fail" and
        .expected.uid == ($uid | tonumber) and
        .observed.uid == 99999 and
        .observed.ppid == null and
        (.expected | has("pid")) and
        (.observed | has("pid")) and
        (.expected | has("startedAt")) and
        (.observed | has("startedAt")) and
        (.expected | has("command")) and
        (.observed | has("command")) and
        (.expected | has("cwd")) and
        (.observed | has("cwd"))
      )] | length) == 1
    ' <<<"$invoke_output" >/dev/null; then
    missing_ppid_mismatch_failures="${missing_ppid_mismatch_failures}${missing_ppid_mismatch_failures:+; }$name did not preserve process mismatch report: $invoke_output"
  fi
  if test "$after_snapshot" != "$before_snapshot"; then
    missing_ppid_mismatch_failures="${missing_ppid_mismatch_failures}${missing_ppid_mismatch_failures:+; }$name mutated lease evidence"
  fi
}

android_lease="$(make_lease "$lease_root" "$android_device" emulator-5554 completed)"
android_maestro="$tmp_dir/android-maestro-ready.json"
printf '[{"device_id":"emulator-5554","platform":"android","type":"emulator","connected":true}]\n' >"$android_maestro"
write_fingerprint "$android_lease" maestro-mcp "$maestro_command"
check_missing_ppid_mismatch android "$android_device" emulator-5554 "$android_lease" "$android_maestro"

ios_lease="$(make_lease "$lease_root" "$ios_device" "$FAKE_IOS_UDID" completed)"
write_fingerprint "$ios_lease" maestro-mcp "$maestro_command"
check_missing_ppid_mismatch ios "$ios_device" "$FAKE_IOS_UDID" "$ios_lease" "$maestro_ready"

test -z "$missing_ppid_mismatch_failures" || fail "$missing_ppid_mismatch_failures"
export FAKE_PROCESS_COMMAND="$FAKE_LAUNCHER_COMMAND"
export FAKE_PROCESS_UID="$FAKE_UID"
export FAKE_PROCESS_PPID="41"

workspace_binding_failures=""
launch_cwd="$tmp_dir/launch-cwd"
mkdir -p "$launch_cwd" "$workspace other"
launch_cwd="$(cd "$launch_cwd" && pwd -P)"
for argument_form in separate equals; do
  for binding_case in exact longer-path other-cwd cwd-mismatch later-override; do
    workspace_argument="--working-dir $workspace"
    if test "$argument_form" = equals; then
      workspace_argument="--working-dir=$workspace"
    fi
    expected_status=0
    expected_check=pass
    export FAKE_PROCESS_CWD="$workspace"
    case "$binding_case" in
      longer-path) workspace_argument="$workspace_argument other" ;;
      other-cwd|cwd-mismatch) export FAKE_PROCESS_CWD="$launch_cwd" ;;
      later-override) workspace_argument="$workspace_argument --working-dir $launch_cwd" ;;
    esac
    case "$binding_case" in
      longer-path|cwd-mismatch|later-override) expected_status=1; expected_check=fail ;;
    esac
    export FAKE_PROCESS_COMMAND="/opt/java/bin/java -classpath /opt/maestro/lib/* maestro.cli.AppKt mcp $workspace_argument"
    write_fingerprint "$ios_lease" maestro-mcp "$FAKE_PROCESS_COMMAND"
    if test "$binding_case" = other-cwd; then
      printf '%s\n' "$launch_cwd" >"$ios_lease/maestro-mcp-cwd"
    fi
    before="$(snapshot_tree "$lease_root")"
    : >"$FAKE_LOG"
    invoke --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 1 --maestro-probe "$maestro_ready" --require-maestro-process
    after="$(snapshot_tree "$lease_root")"
    evidence_name="workspace-$argument_form-$binding_case"
    save_evidence "$evidence_name" "$before" "$after"
    if ! (
      assert_eq "$invoke_status" "$expected_status" "$evidence_name exit"
      assert_check "$invoke_output" process.maestro-mcp "$expected_check"
      assert_check "$invoke_output" automation.maestro-mcp pass
      assert_eq "$after" "$before" "$evidence_name lease mutation"
      if test "$binding_case" = cwd-mismatch; then
        jq -e --arg expected "$workspace" --arg observed "$launch_cwd" \
          'any(.checks[]; .check == "process.maestro-mcp" and .expected.cwd == $expected and .observed.cwd == $observed)' \
          <<<"$invoke_output" >/dev/null || fail "cwd mismatch identity was not preserved"
      fi
    ); then
      workspace_binding_failures="$workspace_binding_failures $evidence_name"
    fi
  done
done
test -z "$workspace_binding_failures" || fail "workspace binding regressions:$workspace_binding_failures"
export FAKE_PROCESS_COMMAND="$FAKE_LAUNCHER_COMMAND"
export FAKE_PROCESS_CWD="$workspace"

set +e
"$checker" --device "$ios_device" --target "$FAKE_IOS_UDID" --workspace "$workspace" --session-id session-494 --lease-root "$lease_root" --timeout 0 >/dev/null 2>"$tmp_dir/invalid-timeout.err"
invalid_status=$?
set -e
assert_eq "$invalid_status" "2" "zero observation budget"

printf 'running-mobile-simulators tests passed\n'
