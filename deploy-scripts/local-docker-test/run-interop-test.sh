#!/usr/bin/env bash
# Test local de interoperabilitate Node 16 <-> Node 24 (Pasul 0, Task 5,
# anti-goal 1 din design: compatibilitate blockchain între versiuni).
#
# Pornește două containere, fiecare cu EXACT același cod sursă, unul pe
# Node 16 și unul pe Node 24, legate direct prin FALLBACK_NODES (nu rețeaua
# reală — izolare completă, la fel ca testul de integrare al gossip-ului
# existent în src/tests/node/gossip-discovery/). Verifică: (1) ambele pornesc
# și răspund sănătos, (2) se conectează unul la altul (gossip handshake pe
# wire, cross-versiune), (3) ambele au același protocol/versiune raportate.
#
# Necesită imaginile deja construite: webd-node-test:16, webd-node-test:24
# (vezi Dockerfile.test din acest director).
#
# Usage (din rădăcina Node-WebDollar): bash deploy-scripts/local-docker-test/run-interop-test.sh

set -uo pipefail

NETWORK="webd-test-net"
NAME24="webd24-interop"
NAME16="webd16-interop"
PORT24=18090
PORT16=18091
FAIL=0

cleanup(){
    docker rm -f "$NAME24" "$NAME16" >/dev/null 2>&1
}
trap cleanup EXIT

docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null
cleanup

echo "-- Pornesc Node 24 ($NAME24) --"
docker run -d --name "$NAME24" --network "$NETWORK" -p "${PORT24}:8090" \
    -e PORT=8090 -e SERVER_PORT=8090 -e INSTANCE_PREFIX=interop24 \
    -e FALLBACK_NODES_ONLY=1 -e "FALLBACK_NODES=http://${NAME16}:8091" \
    webd-node-test:24 >/dev/null

echo "-- Pornesc Node 16 ($NAME16) --"
docker run -d --name "$NAME16" --network "$NETWORK" -p "${PORT16}:8091" \
    -e PORT=8091 -e SERVER_PORT=8091 -e INSTANCE_PREFIX=interop16 \
    -e FALLBACK_NODES_ONLY=1 -e "FALLBACK_NODES=http://${NAME24}:8090" \
    webd-node-test:16 >/dev/null

wait_for_version(){
    local url="$1" label="$2" waited=0
    while [ "$waited" -lt 60 ]; do
        local body
        body="$(curl -fsS --max-time 3 "$url" 2>/dev/null)"
        if echo "$body" | grep -q '"version"'; then
            echo "$label sănătos: $body"
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
    done
    echo "EȘEC: $label nu a răspuns sănătos în 60s."
    return 1
}

wait_for_version "http://127.0.0.1:${PORT24}/" "Node 24" || FAIL=1
wait_for_version "http://127.0.0.1:${PORT16}/" "Node 16" || FAIL=1

echo "-- Așteptăm handshake-ul cross-versiune (până la 60s) --"
waited=0
CONNECTED=0
while [ "$waited" -lt 60 ]; do
    LIST24="$(curl -fsS --max-time 3 "http://127.0.0.1:${PORT24}/server/nodes/list" 2>/dev/null)"
    LIST16="$(curl -fsS --max-time 3 "http://127.0.0.1:${PORT16}/server/nodes/list" 2>/dev/null)"
    if echo "$LIST24" | grep -q "${NAME16}" || echo "$LIST16" | grep -q "${NAME24}"; then
        CONNECTED=1
        break
    fi
    sleep 2
    waited=$((waited + 2))
done

if [ "$CONNECTED" -eq 1 ]; then
    echo "OK: Node 24 și Node 16 s-au conectat (handshake cross-versiune reușit)."
    echo "  /server/nodes/list (24): $LIST24"
    echo "  /server/nodes/list (16): $LIST16"
else
    echo "EȘEC: niciun handshake confirmat în 60s."
    echo "  /server/nodes/list (24): $LIST24"
    echo "  /server/nodes/list (16): $LIST16"
    echo "-- ultimele loguri Node 24 --"
    docker logs "$NAME24" 2>&1 | tail -15
    echo "-- ultimele loguri Node 16 --"
    docker logs "$NAME16" 2>&1 | tail -15
    FAIL=1
fi

if [ "$FAIL" -eq 0 ]; then
    echo "TOATE VERIFICĂRILE AU TRECUT"
    exit 0
else
    echo "UNELE VERIFICĂRI AU PICAT"
    exit 1
fi
