#!/usr/bin/env bash
# Adapted from: creation-space (2026-03-24)
# SessionStart: セッション開始時のブランチ記録・警告
set -euo pipefail

source "$(dirname "$0")/_common"
hook_init

if [ "$(hook_event_name)" != "SessionStart" ]; then
  exit 0
fi

session_state_path="${HOOK_CACHE_DIR}/session-start-state.json"
branch_name="$(git -C "$REPO_ROOT" branch --show-current)"

python3 - "$session_state_path" "$HOOK_SESSION_ID" "$branch_name" <<'PY'
import json
import os
import sys
from datetime import datetime, timezone

state_path, session_id, branch_name = sys.argv[1:4]
state = {"sessions": {}}
if os.path.exists(state_path):
    with open(state_path, encoding="utf-8") as fh:
        state = json.load(fh)

state["sessions"][session_id] = {
    "branch": branch_name,
    "started_at": datetime.now(timezone.utc).isoformat(),
}

with open(state_path, "w", encoding="utf-8") as fh:
    json.dump(state, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
PY

# kesson-space: main ワークツリーは main ブランチが正常
# 直接コミットは CLAUDE.md で禁止しているため、ここではブロックしない
if [ "$branch_name" = "main" ]; then
  hook_warn "session-start-guard: main ブランチ上で作業中です。直接コミットは禁止 — 実装は feature/* ブランチで行ってください。"
fi

exit 0
