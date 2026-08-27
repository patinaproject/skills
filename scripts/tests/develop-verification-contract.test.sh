#!/usr/bin/env bash
set -euo pipefail

# Behavior contract consumed by develop: a target-owned, non-required local
# failure is a continuing disposition, while a non-pass required check on the
# same current head remains a blocking exit gate. This exercises scripts and
# Git state rather than documentation prose (ADR-224).

REPO_ROOT="$(git rev-parse --show-toplevel)"
UPDATE_VERIFY="$REPO_ROOT/skills/update-branch/scripts/update-verify.sh"
REQUIRED_CHECKS="$REPO_ROOT/skills/ready-pr/scripts/current-head-required-checks.sh"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

repo="$WORKDIR/repo"
git init -q -b main "$repo"
git -C "$repo" config user.name Test
git -C "$repo" config user.email test@example.com
printf 'target-owned violation\n' >"$repo/failing-source.txt"
printf 'unchanged rule\n' >"$repo/lint-rule.txt"
git -C "$repo" add failing-source.txt lint-rule.txt
git -C "$repo" commit -qm common
git -C "$repo" switch -qc feature
printf 'verified feature\n' >"$repo/feature.txt"
git -C "$repo" add feature.txt
git -C "$repo" commit -qm feature
git -C "$repo" switch -q main
printf 'target update\n' >"$repo/target.txt"
git -C "$repo" add target.txt
git -C "$repo" commit -qm target
git -C "$repo" switch -q feature
git -C "$repo" merge -q --no-commit --no-ff main

scoped="$WORKDIR/scoped.sh"
printf '#!/usr/bin/env bash\ntest "$(cat feature.txt)" = "verified feature"\n' >"$scoped"
chmod +x "$scoped"
broad="$WORKDIR/broad.sh"
printf '#!/usr/bin/env bash\nexit 31\n' >"$broad"
chmod +x "$broad"

if ! update_output="$(cd "$repo" && "$UPDATE_VERIFY" \
  --message 'chore: #389 merge target' \
  --target main \
  --scoped "$scoped" \
  --broad "$broad" \
  --evidence failing-source.txt \
  --evidence lint-rule.txt 2>&1)"; then
  echo "FAIL: develop classified a target-owned non-required failure as blocking: $update_output" >&2
  exit 1
fi
if ! grep -Fq 'outcome=target-owned' <<< "$update_output"; then
  echo "FAIL: target-owned disposition was not recorded: $update_output" >&2
  exit 1
fi

head="$(git -C "$repo" rev-parse HEAD)"
fake_bin="$WORKDIR/bin"
mkdir -p "$fake_bin"
cat >"$fake_bin/gh" <<'GH'
#!/usr/bin/env bash
set -euo pipefail
if [ "${1:-}" = pr ] && [ "${2:-}" = view ]; then
  printf '%s\n' "${EXPECTED_HEAD:?EXPECTED_HEAD must be set}"
elif [ "${1:-}" = pr ] && [ "${2:-}" = checks ]; then
  printf 'Test Gate\tfail\n'
  exit 1
else
  echo "unexpected gh command: $*" >&2
  exit 2
fi
GH
chmod +x "$fake_bin/gh"

if check_output="$(cd "$repo" && PATH="$fake_bin:$PATH" EXPECTED_HEAD="$head" \
  "$REQUIRED_CHECKS" --pr 389 --head "$head" 2>&1)"; then
  echo 'FAIL: failed required current-head checks were accepted as ready' >&2
  exit 1
elif ! grep -Fq 'outcome=required-checks-non-pass' <<< "$check_output"; then
  echo "FAIL: required current-head failure was not recorded: $check_output" >&2
  exit 1
fi

echo 'OK: develop continues target-owned local dispositions and blocks on required current-head checks'
