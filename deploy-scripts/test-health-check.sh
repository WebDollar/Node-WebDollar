#!/usr/bin/env bash
# Test local pentru wait_for_health din switch-node-version.sh, fără VPS,
# nvm sau systemd. Rulează bundle-ul terminal local pe un port dedicat,
# verifică detecția corectă a stării sănătoase, apoi a celei nesănătoase.
#
# Usage (din rădăcina Node-WebDollar): ./deploy-scripts/test-health-check.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/switch-node-version.sh"

PORT=30903
HEALTH_URL="http://127.0.0.1:${PORT}/"
FAIL=0

echo "-- Test 1: niciun nod pornit -> trebuie detectat ca nesănătos --"
if wait_for_health "$HEALTH_URL" 4; then
    echo "EȘEC Test 1: a raportat sănătos fără niciun nod pornit."
    FAIL=1
else
    echo "OK Test 1: corect detectat ca nesănătos."
fi

echo "-- Test 2: nod real pornit -> trebuie detectat ca sănătos --"
cd "$SCRIPT_DIR/.." || exit 1
PORT="$PORT" SERVER_PORT="$PORT" INSTANCE_PREFIX="healthchecktest" FALLBACK_NODES_ONLY=1 \
    node dist_bundle/terminal-bundle.js > /tmp/health-check-test-node.log 2>&1 &
NODE_PID=$!

if wait_for_health "$HEALTH_URL" 40; then
    echo "OK Test 2: corect detectat ca sănătos."
else
    echo "EȘEC Test 2: nodul real nu a fost detectat ca sănătos în 40s."
    FAIL=1
fi

kill "$NODE_PID" 2>/dev/null
wait "$NODE_PID" 2>/dev/null
rm -f /tmp/health-check-test-node.log
rm -rf ./*healthchecktest* 2>/dev/null

if [ "$FAIL" -eq 0 ]; then
    echo "TOATE TESTELE AU TRECUT"
    exit 0
else
    echo "UNELE TESTE AU PICAT"
    exit 1
fi
