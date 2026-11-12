#!/usr/bin/env node
/*
 * Test de fum pentru bundle-ul de terminal, FĂRĂ niciun shim:
 * pornește `dist_bundle/terminal-bundle.js` exact cum îl pornește systemd pe
 * server și eșuează dacă procesul moare sau scrie o eroare de încărcare
 * (ReferenceError / Cannot find module / ...) înainte de a ajunge la
 * "Node Server Started".
 *
 * Motiv (2026-11-10): un bundle testat local doar cu shim-ul de teste
 * (`global.self`) a fost livrat pe nodul explorer și a crăpat la pornire cu
 * `ReferenceError: self is not defined` din `pouchdb-browser` — shim-ul
 * mascase exact acest bug. Acest script nu are voie să definească `self`.
 *
 * Rulare: node src/tests/node/check-terminal-bundle.js   (după npm run build_terminal)
 * Ieșire: 0 = OK, 1 = eșec (motivul e afișat).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const BUNDLE = path.join(ROOT, 'dist_bundle', 'terminal-bundle.js');
const PREFIX = 'bundlecheck';
const TIMEOUT_MS = 40 * 1000;
const FATAL = /ReferenceError|TypeError|Cannot find module|is not defined|SyntaxError/;
const READY = /Node Server Started/;

function cleanup() {
    for (const entry of fs.readdirSync(ROOT))
        if (entry.endsWith(PREFIX)) fs.rmSync(path.join(ROOT, entry), { recursive: true, force: true });
}

if (!fs.existsSync(BUNDLE)) {
    console.error(`EȘEC: lipsește ${BUNDLE} (rulează npm run build_terminal)`);
    process.exit(1);
}

cleanup();

const child = spawn(process.execPath, [BUNDLE], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: '30902', SERVER_PORT: '30902', INSTANCE_PREFIX: PREFIX, FALLBACK_NODES_ONLY: '1' }),
    stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
let finished = false;

function finish(ok, reason) {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    try { child.kill(); } catch (e) { /* deja oprit */ }
    setTimeout(() => {
        cleanup();
        console.log(ok ? `OK: ${reason}` : `EȘEC: ${reason}`);
        if (!ok) console.log('--- ultimele linii ---\n' + output.split('\n').slice(-25).join('\n'));
        process.exit(ok ? 0 : 1);
    }, 500);
}

function onData(chunk) {
    const text = chunk.toString();
    output += text;
    const fatal = text.match(FATAL);
    if (fatal) return finish(false, `eroare de încărcare: "${fatal[0]}"`);
    if (READY.test(output)) return finish(true, 'bundle-ul pornește și serverul se ridică fără erori de încărcare');
}

child.stdout.on('data', onData);
child.stderr.on('data', onData);
child.on('exit', (code) => finish(false, `procesul s-a oprit singur (cod ${code}) înainte de "Node Server Started"`));

const timer = setTimeout(() => finish(false, `nu a ajuns la "Node Server Started" în ${TIMEOUT_MS / 1000}s`), TIMEOUT_MS);
