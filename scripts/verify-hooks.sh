#!/usr/bin/env bash
# Adapted from: creation-space (2026-03-24)
# Verifies that all hooks referenced in hooks.json exist and are executable.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

hooks_json=".claude/hooks.json"

echo "=== Hook System Verification ==="
echo ""

# 1. Check hooks.json exists
if [ ! -f "$hooks_json" ]; then
  echo "FAIL: $hooks_json not found."
  exit 1
fi
echo "PASS: $hooks_json exists."

# 2. Extract all hook commands from hooks.json
echo ""
echo "--- Hook Scripts ---"
hook_scripts="$(python3 - "$hooks_json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as fh:
    data = json.load(fh)

scripts = set()
for event_name, entries in data.get("hooks", {}).items():
    for entry in entries:
        for hook in entry.get("hooks", []):
            cmd = hook.get("command", "")
            if cmd:
                scripts.add(cmd)

for s in sorted(scripts):
    print(s)
PY
)"

pass_count=0
fail_count=0
warn_count=0

while IFS= read -r script; do
  [ -n "$script" ] || continue
  full_path="${REPO_ROOT}/${script}"

  if [ ! -f "$full_path" ]; then
    echo "FAIL: $script does not exist."
    ((fail_count++))
    continue
  fi

  if [ ! -x "$full_path" ]; then
    echo "WARN: $script exists but is not executable."
    ((warn_count++))
    continue
  fi

  echo "PASS: $script (exists, executable)"
  ((pass_count++))
done <<<"$hook_scripts"

# 3. Check _common exists
echo ""
echo "--- Common Library ---"
common_path="${REPO_ROOT}/.claude/hooks/_common"
if [ -f "$common_path" ]; then
  echo "PASS: .claude/hooks/_common exists."
  ((pass_count++))
else
  echo "FAIL: .claude/hooks/_common not found."
  ((fail_count++))
fi

# 4. Summary
echo ""
echo "=== Summary ==="
echo "PASS: ${pass_count}, WARN: ${warn_count}, FAIL: ${fail_count}"

if [ "$fail_count" -gt 0 ]; then
  exit 1
fi
