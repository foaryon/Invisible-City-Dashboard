#!/usr/bin/env bash
# The Invisible City — macOS double-click launcher (opens in Terminal).
cd "$(dirname "$0")"
chmod +x ./run.sh 2>/dev/null || true
exec ./run.sh
