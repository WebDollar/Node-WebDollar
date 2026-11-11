#!/usr/bin/env bash
# Comută nodul activ (prin symlink) la o altă versiune de Node și verifică
# sănătatea serviciului; rollback automat la symlink-ul anterior dacă
# verificarea eșuează în intervalul dat.
#
# Usage:
#   ./switch-node-version.sh VERSION SERVICE_NAME HEALTH_URL [NODE_ACTIVE_LINK] [TIMEOUT_SECONDS]
#
#   VERSION          - "16" sau "24" (versiunea majoră țintă, instalată via nvm)
#   SERVICE_NAME     - serviciul systemd de restartat (ex: webd-node.service)
#   HEALTH_URL       - URL local de verificat (ex: http://127.0.0.1:8081/)
#   NODE_ACTIVE_LINK - symlink-ul de comutat (implicit: $HOME/node-active)
#   TIMEOUT_SECONDS  - cât timp se așteaptă răspuns sănătos (implicit: 90)
#
# Verificarea de sănătate (wait_for_health) e separată într-o funcție ca să
# poată fi testată independent de systemd/nvm, sursând acest script fără
# argumente (vezi deploy-scripts/test-health-check.sh).

set -uo pipefail

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

# Așteaptă ca HEALTH_URL să răspundă cu JSON care conține "version" (rută
# publică GET / a nodului — vezi src/node/sockets/node-server/API/Node-API-Public.js).
# Returnează 0 dacă e sănătos în timpul dat, 1 altfel.
wait_for_health(){
    local health_url="$1"
    local timeout_seconds="$2"
    local waited=0

    while [ "$waited" -lt "$timeout_seconds" ]; do
        if curl -fsS --max-time 3 "$health_url" 2>/dev/null | grep -q '"version"'; then
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
    done

    return 1
}

main(){
    local version="$1"
    local service_name="$2"
    local health_url="$3"
    local node_active_link="${4:-$HOME/node-active}"
    local timeout_seconds="${5:-90}"

    echo "== switch-node-version.sh: trecere la Node $version =="

    if [ ! -L "$node_active_link" ]; then
        echo "EROARE: $node_active_link nu există sau nu e un symlink. Rulează întâi install-node24.sh."
        return 1
    fi

    local previous_target
    previous_target="$(readlink -f "$node_active_link")"
    echo "Țintă curentă (pentru rollback): $previous_target"

    # shellcheck disable=SC1091
    source "$NVM_DIR/nvm.sh"
    local new_target
    new_target="$(nvm which "$version")"
    if [ -z "$new_target" ]; then
        echo "EROARE: Node $version nu e instalat via nvm."
        return 1
    fi

    echo "Comut $node_active_link -> $new_target"
    ln -sfn "$new_target" "$node_active_link"

    echo "Restart $service_name..."
    sudo systemctl restart "$service_name"

    echo "Verificare sănătate ($health_url, timeout ${timeout_seconds}s)..."
    if wait_for_health "$health_url" "$timeout_seconds"; then
        echo "OK: $service_name sănătos pe Node $version."
        return 0
    fi

    echo "EȘEC: $service_name nu a răspuns sănătos în ${timeout_seconds}s. Rollback la $previous_target."
    ln -sfn "$previous_target" "$node_active_link"
    sudo systemctl restart "$service_name"

    if wait_for_health "$health_url" "$timeout_seconds"; then
        echo "Rollback confirmat: $service_name sănătos pe versiunea anterioară."
    else
        echo "ATENȚIE: nici după rollback $service_name nu răspunde sănătos — necesită intervenție manuală."
    fi

    return 1
}

# Rulează main() doar când scriptul e executat direct, nu când e sursat
# (sursarea e folosită de teste ca să acceseze wait_for_health izolat).
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
