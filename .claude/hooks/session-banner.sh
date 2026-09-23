#!/usr/bin/env bash
# .claude/hooks/session-banner.sh — SessionStart hook.
# Exit 0 always so it never blocks startup.

set -u

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 0

node_version=$(node --version 2>/dev/null || echo 'not installed')
branch=$(git branch --show-current 2>/dev/null || echo 'unknown')

echo "────────────────────────────────────────────────────────────────"
echo "  SPTE — session context"
echo "────────────────────────────────────────────────────────────────"
printf "  Node:         %s\n" "$node_version"
printf "  Branch:       %s\n" "$branch"
echo "  Recent commits:"
git log --oneline -3 2>/dev/null | sed 's/^/    /'
echo "────────────────────────────────────────────────────────────────"

exit 0
