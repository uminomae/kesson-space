#!/usr/bin/env bash
# Adapted from: creation-space (2026-03-24)
# Post-check script for agent task completion.
# Verifies: git status clean, tests pass, Issue comment exists.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== Agent Post-Check ==="
echo ""

# 1. Git status
echo "--- 1. Git Status ---"
git_status="$(git status --short)"
if [ -z "$git_status" ]; then
  echo "PASS: Working tree is clean."
else
  echo "WARN: Uncommitted changes detected:"
  echo "$git_status"
fi
echo ""

# 2. Config consistency test
echo "--- 2. Config Consistency Test ---"
if [ -f "tests/config-consistency.test.js" ]; then
  if node tests/config-consistency.test.js 2>&1; then
    echo "PASS: Config consistency test passed."
  else
    echo "FAIL: Config consistency test failed."
  fi
else
  echo "SKIP: tests/config-consistency.test.js not found."
fi
echo ""

# 3. Check for DONE file (if issue number provided)
echo "--- 3. DONE File Check ---"
issue_num="${1:-}"
if [ -n "$issue_num" ]; then
  done_files="$(find .cache/outbox -maxdepth 1 -name "DONE-${issue_num}-*.md" 2>/dev/null || true)"
  if [ -n "$done_files" ]; then
    echo "PASS: DONE file found:"
    echo "$done_files"
  else
    echo "WARN: No DONE file found for issue #${issue_num}."
  fi
else
  echo "SKIP: No issue number provided. Usage: $0 <issue-number>"
fi
echo ""

# 4. Check Issue comment (requires gh CLI)
echo "--- 4. Issue Comment Check ---"
if [ -n "$issue_num" ] && command -v gh >/dev/null 2>&1; then
  comment_count="$(gh issue view "$issue_num" --json comments --jq '.comments | length' 2>/dev/null || echo "error")"
  if [ "$comment_count" = "error" ]; then
    echo "WARN: Could not fetch Issue #${issue_num} comments."
  elif [ "$comment_count" -gt 0 ]; then
    echo "PASS: Issue #${issue_num} has ${comment_count} comment(s)."
  else
    echo "WARN: Issue #${issue_num} has no comments."
  fi
else
  echo "SKIP: gh CLI not available or no issue number provided."
fi
echo ""

echo "=== Post-Check Complete ==="
