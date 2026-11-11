#!/usr/bin/env bash
# Instalează Node 24 alături de Node 16 pe un VPS, fără să dezinstaleze nimic.
# Idempotent: poate fi rulat de mai multe ori fără efecte secundare.
#
# Creează/păstrează un symlink "node-active" care arată spre binarul Node
# activ în acest moment (implicit Node 16, până la primul swap explicit cu
# switch-node-version.sh). Rollback-ul la Node 16 devine apoi doar o
# schimbare a acestui symlink, nu o reinstalare.
#
# Usage: ./install-node24.sh [NODE_ACTIVE_LINK]
#   NODE_ACTIVE_LINK - calea symlink-ului (implicit: $HOME/node-active)

set -euo pipefail

NODE_ACTIVE_LINK="${1:-$HOME/node-active}"
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

echo "== install-node24.sh =="

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "nvm nu e instalat — instalez (fără să modific Node-ul curent)."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
else
    echo "nvm deja instalat la $NVM_DIR."
fi

# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"

if nvm ls 24 2>/dev/null | grep -q "v24\."; then
    echo "Node 24 deja instalat via nvm."
else
    echo "Instalez Node 24 LTS via nvm (Node 16 rămâne neschimbat)."
    nvm install 24
fi

NODE24_BIN="$(nvm which 24)"
echo "Node 24 binar: $NODE24_BIN"

if [ -L "$NODE_ACTIVE_LINK" ] || [ -e "$NODE_ACTIVE_LINK" ]; then
    echo "Symlink-ul $NODE_ACTIVE_LINK deja există — nu îl suprascriu. Țintă curentă:"
    readlink -f "$NODE_ACTIVE_LINK" || true
else
    CURRENT_NODE_BIN="$(command -v node)"
    echo "Creez symlink inițial $NODE_ACTIVE_LINK -> $CURRENT_NODE_BIN (Node activ curent, presupus Node 16)."
    ln -s "$CURRENT_NODE_BIN" "$NODE_ACTIVE_LINK"
fi

echo "OK: Node 24 instalat alături de versiunea existentă. Node 16 nu a fost dezinstalat."
echo "Pentru swap, rulează: switch-node-version.sh 24 <service_name> <health_url> [node_active_link]"
