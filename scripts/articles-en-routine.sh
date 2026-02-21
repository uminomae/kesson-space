#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="${SCRIPT_DIR}/articles-en-semi-auto.mjs"

MODE="${1:-routine}"
if [[ "${MODE}" == "check" || "${MODE}" == "sync" || "${MODE}" == "routine" ]]; then
  shift || true
else
  MODE="routine"
fi

ARGS=(--mode "${MODE}")

if [[ "${MODE}" == "routine" ]]; then
  # Defaults for this repository. Additional CLI args can override these values.
  ARGS+=(--notify-issue --issue 107 --repo uminomae/kesson-space)
fi

exec node "${NODE_SCRIPT}" "${ARGS[@]}" "$@"
