#!/usr/bin/env bash
# Instalează Node 24 alături de Node 16 pe un VPS, fără să dezinstaleze nimic.
# Idempotent: poate fi rulat de mai multe ori fără efecte secundare.
#
# Creează/păstrează un symlink "node-active" care arată spre DIRECTORUL bin
# al versiunii Node active în acest moment (implicit Node 16, până la primul
# swap explicit cu switch-node-version.sh) — un director, nu un singur binar,
# ca symlink-ul să funcționeze și pentru `PATH=$LINK:$PATH; npm run ...`
# (noduri pornite manual/screen), nu doar pentru `ExecStart=$LINK/node`
# (servicii systemd). Rollback-ul la Node 16 devine apoi doar o schimbare a
# acestui symlink, nu o reinstalare.
#
# Usage: ./install-node24.sh [NODE_ACTIVE_LINK]
#   NODE_ACTIVE_LINK - calea symlink-ului (implicit: $HOME/node-active)

# Fără "-u": nvm.sh (third-party) nu e scris să fie "nounset"-safe — referă
# variabile neinițializate (ex. NVM_IOJS_ORG_MIRROR) la sursare.
set -eo pipefail

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

# IMPORTANT: capturăm directorul Node activ ÎNAINTE de `nvm install 24` —
# acel comandă face și un `nvm use 24` implicit pentru sesiunea curentă a
# shell-ului, așa că "current" nu mai înseamnă Node 16 după el (bug găsit
# la rularea reală pe explorer: symlink-ul inițial prinsese Node 24).
# Alias-ul `default` e persistent pe disc și nu e afectat de `nvm install`.
if [ -L "$NODE_ACTIVE_LINK" ] || [ -e "$NODE_ACTIVE_LINK" ]; then
    ORIGINAL_NODE_DIR=""
    echo "Symlink-ul $NODE_ACTIVE_LINK deja există — nu îl suprascriu. Țintă curentă:"
    readlink -f "$NODE_ACTIVE_LINK" || true
else
    ORIGINAL_NODE_DIR="$(nvm which default 2>/dev/null | xargs dirname 2>/dev/null || dirname "$(command -v node)")"
fi

if nvm ls 24 2>/dev/null | grep -q "v24\."; then
    echo "Node 24 deja instalat via nvm."
else
    echo "Instalez Node 24 LTS via nvm (Node 16 rămâne neschimbat)."
    nvm install 24
fi

NODE24_BIN="$(nvm which 24)"
echo "Node 24 binar: $NODE24_BIN"

if [ -n "$ORIGINAL_NODE_DIR" ]; then
    echo "Creez symlink inițial $NODE_ACTIVE_LINK -> $ORIGINAL_NODE_DIR (directorul bin al Node-ului activ ÎNAINTE de această instalare, presupus Node 16)."
    ln -s "$ORIGINAL_NODE_DIR" "$NODE_ACTIVE_LINK"
fi

echo "OK: Node 24 instalat alături de versiunea existentă. Node 16 nu a fost dezinstalat."
echo "Pentru swap, rulează: switch-node-version.sh 24 <service_name> <health_url> [node_active_link]"
