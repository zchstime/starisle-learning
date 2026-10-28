#!/bin/bash
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if curl -fsS http://127.0.0.1:7456/ >/dev/null 2>&1; then
  open http://127.0.0.1:7456/
else
  node tools/serve.cjs &
  starisle_server_pid=$!
  trap 'kill "$starisle_server_pid" 2>/dev/null' INT TERM EXIT
  for i in {1..30}; do
    if curl -fsS http://127.0.0.1:7456/ >/dev/null 2>&1; then break; fi
    sleep 0.1
  done
  open http://127.0.0.1:7456/
  wait "$starisle_server_pid"
fi
