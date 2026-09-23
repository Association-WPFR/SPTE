#!/usr/bin/env bash
# .claude/hooks/lint-edited.sh — PostToolUse hook (Edit|Write).
# Runs ESLint on the edited file only. Non-blocking: exits 0 regardless
# of lint result so it never interrupts the agent's flow.

set -u

payload=$(cat)

if command -v jq >/dev/null 2>&1; then
    file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
else
    file=$(printf '%s' "$payload" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))' 2>/dev/null)
fi

[ -z "$file" ] && exit 0
[ ! -f "$file" ] && exit 0

case "$file" in
    *.js) ;;
    *) exit 0 ;;
esac

case "$file" in
    */node_modules/*|*/.output/*|*/.wxt/*) exit 0 ;;
esac

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 0

npx eslint --fix "$file" 2>&1 | head -20

exit 0
