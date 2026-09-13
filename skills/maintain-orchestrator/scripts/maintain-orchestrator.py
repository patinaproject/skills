#!/usr/bin/env python3
"""Reconcile one Orchestrate store without claiming, sending, or dispatching."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from typing import Any


FILES = (
    "preferences.md",
    "program-prompt.md",
    "overview.md",
    "units.tsv",
    "ledger.tsv",
    "gates.md",
    "frontier.json",
    "poll-state.json",
    "ownership-config.json",
    "slack-config.json",
    "HANDOFF.md",
)
DECISION_HEADER = "ts\tphase\tdecision\twhy\tevidence\tresult"
MARKER = "[maintain-orchestrator:"


class MaintenanceError(Exception):
    pass


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise MaintenanceError(f"cannot read {path}: {exc}") from exc


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(read_text(path))
    except json.JSONDecodeError as exc:
        raise MaintenanceError(f"malformed JSON in {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise MaintenanceError(f"{path} must contain a JSON object")
    return value


def write_atomic(path: Path, value: str) -> bool:
    if path.exists() and path.read_text(encoding="utf-8") == value:
        return False
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(value)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
    return True


def validate_tsv(path: Path, expected: str) -> None:
    text = read_text(path)
    first = text.splitlines()[0] if text.splitlines() else ""
    if first != expected:
        raise MaintenanceError(f"{path} has header {first!r}, expected {expected!r}")
    for number, line in enumerate(text.splitlines()[1:], 2):
        if line and len(line.split("\t")) != len(expected.split("\t")):
            raise MaintenanceError(f"{path}:{number} has the wrong number of TSV fields")


def standing_lines(prompt: str) -> list[str]:
    lines = prompt.splitlines()
    active = False
    found: list[str] = []
    for line in lines:
        if re.match(r"^#{1,3}\s+Standing orders\s*$", line, re.I):
            active = True
            continue
        if active and line.startswith("#"):
            break
        if active:
            match = re.match(r"^\s*(?:[-*]|\d+[.)])\s+(.+?)\s*$", line)
            if match:
                found.append(match.group(1))
    return found


def normalize_standing(line: str) -> str:
    return re.sub(r"\s+", " ", line.strip()).lower().rstrip(".")


def reconcile_preferences(existing: str, prompt: str) -> tuple[str, list[tuple[str, str]]]:
    current = standing_lines(prompt)
    if not current:
        return existing, []
    old = existing.splitlines()
    old_by_number: dict[int, str] = {}
    for line in old:
        match = re.match(r"^\s*(\d+)\.\s+(.+)$", line)
        if match:
            old_by_number[int(match.group(1))] = match.group(2).strip()
    decisions: list[tuple[str, str]] = []
    output = []
    for index, line in enumerate(current, 1):
        previous = old_by_number.get(index)
        if previous and normalize_standing(previous) != normalize_standing(line):
            decisions.append(("conflict", f"standing order {index}: {previous!r} -> {line!r}"))
        output.append(f"{index}. {line}")
    current_numbers = set(range(1, len(current) + 1))
    next_number = len(current) + 1
    for number, line in sorted(old_by_number.items()):
        if number not in current_numbers:
            output.append(f"{next_number}. {line}")
            next_number += 1
            decisions.append(("preserve", f"unrelated standing order {digest(normalize_standing(line))}"))
    if output:
        return "\n".join(output) + "\n", decisions
    return existing, decisions


def validate_registry(config: dict[str, Any], check_live: bool) -> tuple[bool, str]:
    required = ("repository", "ref", "client", "readCommand", "claimSubcommand")
    missing = [key for key in required if not config.get(key)]
    if missing:
        return False, f"ownership-config.json missing {', '.join(missing)}"
    client = Path(str(config["client"]))
    command = config["readCommand"]
    if not isinstance(command, list) or not all(isinstance(item, str) for item in command):
        return False, "registry readCommand must be an argv array"
    if not client.is_file():
        return False, f"registry client missing: {client}"
    if config["claimSubcommand"] != "claim":
        return False, "registry claimSubcommand must be claim"
    repository = str(config.get("repository", "")).replace("https://", "").replace("git@", "").replace("github.com:", "").replace("github.com/", "").removesuffix(".git").lower()
    if repository != "patinaproject/skills":
        return False, "registry repository must be github.com/patinaproject/skills"
    if config.get("ref") != "refs/heads/patinaproject-issue-ownership":
        return False, "registry ref must be refs/heads/patinaproject-issue-ownership"
    if "atomic" not in str(config.get("atomicOperation", "")).lower() or "fast-forward" not in str(config.get("atomicOperation", "")).lower():
        return False, "registry atomicOperation must describe atomic fast-forward publication"
    if check_live:
        try:
            result = subprocess.run(command, check=False, capture_output=True, text=True, timeout=30)
        except (OSError, subprocess.SubprocessError) as exc:
            return False, f"registry read command failed: {exc}"
        if result.returncode != 0:
            return False, f"registry read command exit {result.returncode}: {result.stderr.strip()}"
    return True, "registry endpoint, read command, and atomic claim contract are configured"


def validate_slack(config: dict[str, Any]) -> tuple[bool, str]:
    required = ("appId", "botUserId", "botId", "workspaceId", "recipientUserId", "credentialSource", "cliContract")
    missing = [key for key in required if not config.get(key)]
    if missing:
        return False, f"slack-config.json missing {', '.join(missing)}"
    source = config["credentialSource"]
    cli = config["cliContract"]
    if not isinstance(source, dict) or not source.get("provider") or not source.get("path"):
        return False, "Slack credential source is incomplete"
    for key in ("authTest", "send", "requiredAuthTest"):
        if not isinstance(cli, dict) or not isinstance(cli.get(key), str) or not cli[key].strip():
            return False, f"Slack CLI contract missing {key}"
    if "slack api auth.test" not in cli["authTest"] or "slack api chat.postMessage" not in cli["send"]:
        return False, "Slack CLI contract must use the official auth.test and chat.postMessage commands"
    auth = config.get("authTest")
    if auth is not None:
        if not isinstance(auth, dict) or auth.get("ok") is not True:
            return False, "Slack authTest must record ok=true"
        if auth.get("team_id") != config["workspaceId"] or auth.get("user_id") != config["botUserId"] or auth.get("bot_id") != config["botId"]:
            return False, "Slack authTest identity does not match configured workspace or bot"
    policy = str(config.get("notificationPolicy", "")).lower()
    if "checkpoint" not in policy or "deduplic" not in policy:
        return False, "Slack policy must restrict sends to deduplicated checkpoint notifications"
    if str(config["workspaceId"]).strip() == str(config["recipientUserId"]).strip():
        return False, "Slack workspace and recipient identities must differ"
    return True, "Slack credential source, identities, CLI, auth contract, and policy are configured"


def validate_wake(state: dict[str, Any]) -> tuple[bool, str]:
    required = ("interval_seconds", "runtime_mechanism", "restart_command", "stop_command", "state")
    missing = [key for key in required if not state.get(key)]
    if missing:
        return False, f"poll-state.json missing {', '.join(missing)}"
    if not isinstance(state["interval_seconds"], int) or state["interval_seconds"] <= 0:
        return False, "wake interval_seconds must be a positive integer"
    return True, "wake interval, runtime, restart, stop, and state are configured"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--store", required=True, type=Path)
    parser.add_argument("--playbook", required=True, type=Path)
    parser.add_argument("--operator-prompt", required=True, type=Path)
    parser.add_argument("--orch", type=Path, help="optional Orchestrate CLI entry point")
    parser.add_argument("--check-registry", action="store_true")
    args = parser.parse_args()
    store = args.store.resolve()
    playbook = args.playbook.resolve()
    prompt_path = args.operator_prompt.resolve()
    if not store.is_dir():
        raise MaintenanceError(f"store is not a directory: {store}")
    playbook_text = read_text(playbook)
    prompt_text = read_text(prompt_path)
    if not playbook_text.strip() or not prompt_text.strip():
        raise MaintenanceError("playbook and operator prompt must not be empty")
    for name in FILES:
        path = store / name
        if not path.is_file():
            raise MaintenanceError(f"required store file missing: {path}")
    if not (store / "inbox").is_dir():
        raise MaintenanceError(f"required store directory missing: {store / 'inbox'}")
    validate_tsv(store / "units.tsv", "id\ttrack\tstate\tbranch\tpr\tsha\tbrief")
    validate_tsv(store / "ledger.tsv", "pr\tsha\tverdict\tevidence\tverifier\tts")
    frontier = read_json(store / "frontier.json")
    poll_state = read_json(store / "poll-state.json")
    registry = read_json(store / "ownership-config.json")
    slack = read_json(store / "slack-config.json")
    registry_ok, registry_message = validate_registry(registry, args.check_registry)
    slack_ok, slack_message = validate_slack(slack)
    wake_ok, wake_message = validate_wake(poll_state)
    if not isinstance(frontier, dict):
        raise MaintenanceError("frontier.json must be an object")
    decisions_path = store / "decisions.tsv"
    decisions = read_text(decisions_path) if decisions_path.exists() else DECISION_HEADER + "\n"
    if decisions and not decisions.startswith("ts\tphase\tdecision\twhy\tevidence\tresult"):
        raise MaintenanceError(f"{decisions_path} has an unexpected header")
    old_prompt = read_text(store / "program-prompt.md")
    old_preferences = read_text(store / "preferences.md")
    new_preferences, preference_decisions = reconcile_preferences(old_preferences, prompt_text)
    input_fingerprint = digest(playbook_text + "\0" + prompt_text)
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    new_decisions = decisions
    events: list[tuple[str, str]] = [("replace", "program-prompt.md with the supplied operator prompt")]
    events.extend(preference_decisions)
    events.append(("preserve", "overview, units, ledger, gates, frontier, handoff, and inbox records"))
    events.append(("validate", f"registry: {registry_message}"))
    events.append(("validate", f"Slack: {slack_message}"))
    events.append(("validate", f"wake: {wake_message}"))
    if not registry_ok or not slack_ok:
        events.append(("gate", "new intake paused because registry or Slack validation failed"))
    for action, detail in events:
        marker = f"{MARKER}{input_fingerprint}:{action}:{digest(detail)}]"
        if marker in new_decisions:
            continue
        phase = "maintain-orchestrator"
        why = f"Current playbook {playbook} and operator prompt {prompt_path} were read before mutation. {marker}"
        result = "paused" if action == "gate" else "recorded"
        new_decisions += f"{now}\t{phase}\t{action} {detail}\t{why}\t{store}\t{result}\n"
    changed: list[str] = []
    if write_atomic(store / "program-prompt.md", prompt_text if prompt_text.endswith("\n") else prompt_text + "\n"):
        changed.append("program-prompt.md")
    if write_atomic(store / "preferences.md", new_preferences):
        changed.append("preferences.md")
    if not registry_ok or not slack_ok:
        updated = dict(poll_state)
        updated["intake_enabled"] = False
        updated["intake_gate"] = "maintain-orchestrator-contract-validation"
        updated["reason"] = f"Registry or Slack validation failed: {registry_message}; {slack_message}"
        poll_text = json.dumps(updated, indent=2) + "\n"
        if write_atomic(store / "poll-state.json", poll_text):
            changed.append("poll-state.json")
    if write_atomic(decisions_path, new_decisions):
        changed.append("decisions.tsv")
    orch_status = "not-run"
    if args.orch is not None:
        try:
            result = subprocess.run(
                ["bun", str(args.orch), "--store", str(store), "status"],
                check=False,
                capture_output=True,
                text=True,
                timeout=60,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            raise MaintenanceError(f"Orchestrate status failed: {exc}") from exc
        orch_status = result.stdout.strip() or result.stderr.strip()
        if result.returncode != 0:
            raise MaintenanceError(f"Orchestrate status exit {result.returncode}: {orch_status}")
    report = {
        "store": str(store),
        "changed": changed,
        "inputFingerprint": input_fingerprint,
        "registry": {"ok": registry_ok, "message": registry_message},
        "slack": {"ok": slack_ok, "message": slack_message},
        "wake": {"ok": wake_ok, "message": wake_message},
        "intakeEnabled": poll_state.get("intake_enabled") if registry_ok and slack_ok else False,
        "decisions": len(events),
        "orchStatus": orch_status,
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except MaintenanceError as exc:
        print(f"maintain-orchestrator: {exc}", file=sys.stderr)
        raise SystemExit(2)
