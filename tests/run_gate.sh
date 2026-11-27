#!/usr/bin/env bash
# Approved test gate: the whole pytest + Playwright suite, organised by screen under tests/.
# Extra arguments are passed to pytest (the CI passes -rfE).
set -euo pipefail
cd "$(dirname "$0")/.."
pytest -q tests "$@"
