#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/skills/superteam/"
PACKAGE_DIR="$ROOT_DIR/plugins/superteam/skills/superteam/"

mkdir -p "$PACKAGE_DIR"
rsync -a --delete "$SOURCE_DIR" "$PACKAGE_DIR"

