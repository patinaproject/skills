#!/bin/bash
set -euo pipefail

if [ -e ".git" ]; then
  husky
fi

