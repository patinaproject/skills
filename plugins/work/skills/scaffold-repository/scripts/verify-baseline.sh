#!/usr/bin/env bash
# Assert that a repository carries the core baseline scaffold-repository claims
# to emit.
#
# The verification self-test used to check only that tooling runs, which passes
# on a repo missing every declared baseline file. This closes that gap: it reads
# the same `core-baseline.txt` the skill documents, so a partial emit fails
# loudly instead of surfacing later as a skill with no adapter to read.
#
# Usage:
#   bash verify-baseline.sh [--public|--private] [repo-root]
#
# Visibility defaults to public. Exits non-zero listing every gap.

set -euo pipefail

visibility="public"
repo_root=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --public) visibility="public" ;;
    --private) visibility="private" ;;
    -h|--help)
      cat <<'USAGE'
Assert that a repository carries the core baseline scaffold-repository emits.

Usage:
  bash verify-baseline.sh [--public|--private] [repo-root]

Reads core-baseline.txt next to this script and checks the target repository
against it. Visibility defaults to public; repo-root defaults to the current
git repository. Exits non-zero listing every gap.
USAGE
      exit 0
      ;;
    -*)
      echo "verify-baseline: unknown option: $1" >&2
      exit 2
      ;;
    *)
      if [ -n "$repo_root" ]; then
        echo "verify-baseline: unexpected argument: $1" >&2
        exit 2
      fi
      repo_root="$1"
      ;;
  esac
  shift
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
manifest="$script_dir/../core-baseline.txt"

if [ ! -f "$manifest" ]; then
  echo "verify-baseline: manifest not found next to the skill: $manifest" >&2
  exit 2
fi

if [ -z "$repo_root" ]; then
  repo_root="$(git rev-parse --show-toplevel)"
fi

if [ ! -d "$repo_root" ]; then
  echo "verify-baseline: not a directory: $repo_root" >&2
  exit 2
fi

gaps=()
checked=0

while IFS= read -r line || [ -n "$line" ]; do
  line="${line%%$'\r'}"
  case "$line" in
    ''|'#'*) continue ;;
  esac

  entry="$line"
  marker=""
  if [[ "$entry" == *" ["*"]" ]]; then
    marker="${entry#*[}"
    marker="${marker%]*}"
    entry="${entry%% [*}"

    # A marker the grammar does not define is a manifest typo. Reject it rather
    # than falling through: an unrecognised `[symlink->x]` would otherwise leave
    # the target unstripped and silently compare against the wrong path.
    case "$marker" in
      public|'symlink -> '?*) ;;
      *)
        echo "verify-baseline: unrecognised marker [$marker] on: $entry" >&2
        exit 2
        ;;
    esac
  fi

  if [ "$marker" = "public" ] && [ "$visibility" != "public" ]; then
    continue
  fi

  checked=$((checked + 1))
  target="$repo_root/$entry"

  case "$marker" in
    symlink*)
      expected="${marker#symlink -> }"
      if [ ! -L "$target" ]; then
        gaps+=("$entry - missing; expected a symlink to $expected")
      elif [ "$(readlink "$target")" != "$expected" ]; then
        gaps+=("$entry - divergent; symlink points at $(readlink "$target"), expected $expected")
      elif [ ! -e "$target" ]; then
        gaps+=("$entry - broken symlink; $expected does not resolve")
      fi
      ;;
    *)
      if [ ! -e "$target" ]; then
        gaps+=("$entry - missing")
      fi
      ;;
  esac
done < "$manifest"

if [ "$checked" -eq 0 ]; then
  echo "verify-baseline: manifest declared no paths; refusing to report success" >&2
  exit 2
fi

if [ "${#gaps[@]}" -gt 0 ]; then
  echo "verify-baseline: ${#gaps[@]} of $checked core baseline paths are not satisfied in $repo_root:" >&2
  for gap in "${gaps[@]}"; do
    echo "  $gap" >&2
  done
  exit 1
fi

echo "verify-baseline: all $checked core baseline paths present ($visibility repository)"
