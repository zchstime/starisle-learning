#!/bin/bash
set -eu
cd "$(dirname "$0")/.."
set +e
"/Applications/CocosCreator-3.8.8.app/Contents/MacOS/CocosCreator" --project "$PWD" --build "configPath=$PWD/build-config/web.json"
result=$?
set -e
# Cocos CLI uses 36 for a successful build; errors use other nonzero codes.
if [ "$result" -ne 0 ] && [ "$result" -ne 36 ]; then exit "$result"; fi
node tools/prepare-web.cjs
