#!/usr/bin/env bash
# Ported from: creation-space (2026-03-24)
# PreToolUse(Bash): 破壊的コマンドの検出・ブロック/警告
set -euo pipefail

source "$(dirname "$0")/_common"
hook_init

[ "$(hook_event_name)" = "PreToolUse" ] || exit 0
[ "$(hook_tool_name)" = "Bash" ] || exit 0

command_text="$(hook_tool_input_field command)"
[ -n "$command_text" ] || exit 0

result="$(python3 - "$command_text" <<'PY' || true
import re
import sys

cmd = sys.argv[1]

# --- block: force push to main/master ---
force_push_main = re.compile(
    r'git\s+push\s+'
    r'(?:(?:--force|-f|--force-with-lease)\s+)?'
    r'(?:\S+\s+)?'
    r'(?:(?:--force|-f|--force-with-lease)\s+)?'
    r'(?:\S+:)?(main|master)\b'
)
force_flag_after = re.compile(
    r'git\s+push\s+\S+\s+(main|master)\b.*(?:--force|-f|--force-with-lease)'
)
if force_push_main.search(cmd) or force_flag_after.search(cmd):
    print("block")
    print("main/master への force push は禁止されています。")
    sys.exit(0)

# --- warn patterns ---
patterns = []

rm_re = re.compile(r'\brm\s+(?:-[^\s]*r[^\s]*\s+)(.*)', re.DOTALL)
m = rm_re.search(cmd)
if m:
    target = m.group(1).strip().split()[0] if m.group(1).strip() else ""
    safe_prefixes = ("$TMPDIR", "${TMPDIR}")
    is_safe = any(target.startswith(p) for p in safe_prefixes)
    if not is_safe:
        patterns.append("rm -r[f]")

if re.search(r'\bgit\s+reset\s+--hard\b', cmd):
    patterns.append("git reset --hard")

if re.search(r'\bgit\s+push\s+.*(?:--force\b|-f\b|--force-with-lease\b)', cmd) or \
   re.search(r'\bgit\s+push\s+(?:--force|-f|--force-with-lease)\b', cmd):
    patterns.append("git push --force")

if re.search(r'\bgit\s+checkout\s+(?:--\s+)?\.(?:\s|$)', cmd):
    patterns.append("git checkout .")

if re.search(r'\bgit\s+clean\s+(?:-[^\s]*f)', cmd):
    patterns.append("git clean -f")

if re.search(r'\bgit\s+branch\s+(?:-[^\s]*D)', cmd):
    patterns.append("git branch -D")

if re.search(r'\bDROP\s+(TABLE|DATABASE)\b', cmd, re.IGNORECASE):
    patterns.append("DROP TABLE/DATABASE")

if patterns:
    print("warn")
    print(", ".join(patterns))
    sys.exit(0)

sys.exit(1)
PY
)"

[ -n "$result" ] || exit 0

action="$(echo "$result" | head -1)"
detail="$(echo "$result" | tail -1)"

case "$action" in
  block)
    hook_block "destructive-command-guard: $detail"
    ;;
  warn)
    hook_warn "destructive-command-guard: 破壊的コマンド検出: $detail"
    ;;
esac

exit 0
