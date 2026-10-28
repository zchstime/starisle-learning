#!/bin/bash
set -eu
cd "$(dirname "$0")/.."
set +e
"/Applications/CocosCreator-3.8.8.app/Contents/MacOS/CocosCreator" --project "$PWD" --build "configPath=$PWD/build-config/web.json"
result=$?
set -e
# Cocos CLI uses 36 for a successful build; errors use other nonzero codes.
if [ "$result" -ne 0 ] && [ "$result" -ne 36 ]; then
  if [ "$result" -eq 134 ]; then
    echo "Cocos aborted during startup (SIGABRT/134). Check macOS DiagnosticReports before changing project assets." >&2
    echo "If the stack ends in _RegisterApplication / NSApplication init, check desktop-session and execution sandbox access." >&2
  else
    echo "Cocos build failed (exit $result)." >&2
  fi
  echo "Web preparation skipped; the existing build is NOT an updated release." >&2
  exit "$result"
fi
node tools/prepare-web.cjs
