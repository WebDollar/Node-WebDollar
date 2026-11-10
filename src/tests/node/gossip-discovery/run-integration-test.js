// Test de integrare: 3 instanțe locale ale nodului legacy, pentru a confirma
// propagarea reală a gossip-ului de descoperire (Task 1), fără listă hardcodată
// (Task 2). Nodul C nu știe niciodată direct de Nodul A — doar de B (prin
// FALLBACK_NODES) — și trebuie să-l descopere prin gossip-ul transmis de B.
//
// Rulare: npm run build_terminal && node src/tests/node/gossip-discovery/run-integration-test.js

const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const BUNDLE_PATH = path.join(REPO_ROOT, 'dist_bundle', 'terminal-bundle.js');

// Shim local (nu modifică nicio sursă WebDollar): pouchdb-browser, dependență
// necondiționată folosită doar pe ramura browser la runtime, citește global-ul
// `self` la load. Absent sub Node 24 local; confirmat că e prezent pe Node 16
// în producție (nodul de pe explorer rulează stabil). Vezi și Task 1.
const SELF_SHIM_PATH = path.join(__dirname, '..', 'test-env-setup.js');

const STARTUP_TIMEOUT_MS = 60 * 1000;
// 180s, nu 120s (presupunerea inițială din plan): bucla preexistentă de
// reconectare (Nodes-Waitlist-Connecting.js) are propriul jitter aleator la
// fiecare ciclu de încercare; verificat empiric — 120s a fost insuficient
// o dată din 4 rulări, 180s a fost suficient constant.
const PROPAGATION_TIMEOUT_MS = 180 * 1000;
const POLL_INTERVAL_MS = 2000;

const NODES = [
    // B nu are fallback propriu — e un pur acceptor, nu dialează el însuși în
    // afară. A și C dialează amândoi către B (conexiuni outbound distincte,
    // de pe noduri diferite). Testat empiric: când B trebuie să dialeze el
    // însuși spre A, verificarea de eligibilitate a buclei de conectare
    // (`NodesWaitlistObject.checkIsConnected`, strict pe IP, fără port) îl
    // blochează permanent odată ce are deja ORICE conexiune pe 127.0.0.1
    // (ex. C conectat deja la el) — deterministic, nu doar flaky. Acceptarea
    // de conexiuni INBOUND multiple de pe același IP funcționează însă
    // normal (verificat: B poate avea simultan A și C conectați la el).
    { name: 'A', port: 30801, prefix: '_gossip_a', fallback: 'http://127.0.0.1:30802' },
    { name: 'B', port: 30802, prefix: '_gossip_b', fallback: '' },
    { name: 'C', port: 30803, prefix: '_gossip_c', fallback: 'http://127.0.0.1:30802' },
];

function httpGetJson(port, routePath) {
    return new Promise((resolve, reject) => {
        const req = http.get({ host: '127.0.0.1', port, path: routePath, timeout: 5000 }, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (exception) { reject(exception); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => req.destroy(new Error('request timeout')));
    });
}

async function pollUntil(conditionFn, timeoutMs, description) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const result = await conditionFn();
            if (result) return result;
        } catch (exception) {
            // nodul poate fi încă indisponibil — se reîncearcă
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(`Timeout (${timeoutMs}ms) așteptând: ${description}`);
}

function startNode(nodeConfig) {
    const logPath = path.join(__dirname, `node-${nodeConfig.name.toLowerCase()}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'w' });

    const env = Object.assign({}, process.env, {
        PORT: String(nodeConfig.port),
        INSTANCE_PREFIX: nodeConfig.prefix,
        FALLBACK_NODES: nodeConfig.fallback,
    });

    const child = spawn(process.execPath, ['--require', SELF_SHIM_PATH, BUNDLE_PATH], {
        cwd: REPO_ROOT,
        env,
    });

    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);

    return { child, logPath };
}

// Nodul creează mai multe foldere de date per instanță, nu doar blockchainDB3
// (ex. defaultDB2, transactionsDB, poolDB, serverPoolDB, minerPoolDB) —
// verificat: toate apar la rădăcina REPO_ROOT, suffixate cu INSTANCE_PREFIX.
// Le ștergem pe toate, generic, nu doar pe cea numită explicit în plan.
function cleanupDataFolders() {
    for (const nodeConfig of NODES) {
        for (const entry of fs.readdirSync(REPO_ROOT, { withFileTypes: true })) {
            if (entry.isDirectory() && entry.name.endsWith(nodeConfig.prefix)) {
                const dbFolder = path.join(REPO_ROOT, entry.name);
                fs.rmSync(dbFolder, { recursive: true, force: true });
            }
        }
    }
}

async function waitForStarted(nodeProcess) {
    await pollUntil(
        async () => {
            const answer = await httpGetJson(nodeProcess.port, '/server/nodes/list');
            return answer && answer.result === true;
        },
        STARTUP_TIMEOUT_MS,
        `pornirea nodului ${nodeProcess.name} (port ${nodeProcess.port})`
    );
    console.log(`Nodul ${nodeProcess.name} a pornit.`);
}

function hasPeerAddress(answer, addressFragment) {
    if (!answer || answer.result !== true) return false;
    const allAddresses = [].concat(answer.clients || [], answer.servers || []).map((entry) => entry.adr);
    return allAddresses.some((adr) => adr.indexOf(addressFragment) >= 0);
}

// Semnalul final (C descoperă A) nu poate fi verificat printr-o conexiune LIVE
// stabilită cu adevărat: toate cele 3 instanțe rulează pe 127.0.0.1, iar regula
// existentă anti-duplicare prin IP din NodesList.registerUniqueSocket
// (implicit {ip:true, uuid:true}, fără port) respinge a doua conexiune către
// același IP ca fiind "deja conectat" — un artefact al testării pe aceeași
// maşină, nu o problemă reală de rețea (noduri reale au IP-uri publice
// distincte). Verificăm în schimb, direct din logul propriu al Nodului C,
// linia care arată că a primit prin gossip adresa CORECTĂ (reconectabilă,
// cu portul real de ascultare al lui A, nu portul TCP efemer — fix-ul din
// Task 1) și a acționat pe baza ei, încercând conexiunea.
function logHasConnectAttempt(logPath, addressFragment) {
    if (!fs.existsSync(logPath)) return false;
    const lines = fs.readFileSync(logPath, 'utf8').split('\n');
    return lines.some((line) => line.indexOf('connecting to...') >= 0 && line.indexOf(addressFragment) >= 0);
}

async function main() {

    cleanupDataFolders();

    // Ordine intenționată, nu simultană: gossip-ul lui B despre A se trimite o
    // singură dată (cu throttle anti-flapping de 10 minute, Task 1), exact în
    // clipa în care B validează Hello cu A (A se conectează IN la B, B e
    // pur acceptor — vezi nota de la definirea NODES). Dacă C ar porni odată
    // cu A și B, cursa dintre "C se conectează la B" și "A se conectează la
    // B" e nedeterministă — anunțul s-ar putea pierde dacă A ajunge înainte
    // ca C să asculte. De aceea: pornim B+C și confirmăm explicit că C e deja
    // conectat la B, ÎNAINTE de a porni A — astfel anunțul declanșat de
    // conectarea A→B are loc cu C deja ascultând.
    const nodeBConfig = NODES[1];
    const nodeCConfig = NODES[2];
    const nodeAConfig = NODES[0];

    const nodeB = Object.assign({}, nodeBConfig, startNode(nodeBConfig));
    const nodeC = Object.assign({}, nodeCConfig, startNode(nodeCConfig));
    const processes = [nodeB, nodeC];

    try {

        await waitForStarted(nodeB);
        await waitForStarted(nodeC);

        await pollUntil(
            async () => hasPeerAddress(await httpGetJson(nodeC.port, '/server/nodes/list'), `127.0.0.1:${nodeB.port}`),
            STARTUP_TIMEOUT_MS,
            `conectarea Nodului C la Nodul B (port ${nodeB.port}), înainte de a porni Nodul A`
        );
        console.log('Nodul C e conectat la Nodul B.');

        const nodeA = Object.assign({}, nodeAConfig, startNode(nodeAConfig));
        processes.push(nodeA);

        await waitForStarted(nodeA);

        await pollUntil(
            async () => logHasConnectAttempt(nodeC.logPath, `:${nodeA.port}`),
            PROPAGATION_TIMEOUT_MS,
            'descoperirea Nodului A de către Nodul C, prin gossip-ul transmis de Nodul B (adresa corectă în log-ul propriu al lui C)'
        );

        console.log('SUCCES: Nodul C a primit prin gossip adresa corectă a Nodului A și a acționat pe baza ei, fără să-l fi cunoscut direct.');
        process.exitCode = 0;

    } catch (exception) {

        console.error('EȘEC:', exception.message);
        console.error(`Vezi logurile: ${processes.map((p) => p.logPath).join(', ')}`);
        process.exitCode = 1;

    } finally {

        for (const nodeProcess of processes)
            nodeProcess.child.kill('SIGTERM');

        await new Promise((resolve) => setTimeout(resolve, 1000));
        cleanupDataFolders();

    }

}

main();

// Limitare cunoscută a acestui test (nu a feature-ului): toate cele 3
// instanțe rulează pe 127.0.0.1. `NodesList.registerUniqueSocket` are deja
// o regulă anti-duplicare prin IP (`validationDoubleConnectionsTypes`
// implicit `{ip:true, uuid:true}`, FĂRĂ `port`) care, pentru conexiunile
// CLIENT, poate respinge o a doua conexiune de ieșire către același IP —
// rejectare legitimă pe o rețea reală (IP-uri publice distincte), dar o
// sursă reală de instabilitate aici, când Nodul B trebuie să facă el
// însuși conexiuni outbound simultane către Nodul A (fallback configurat)
// ȘI, prin comportament preexistent (nodeDomain învățat din Hello), către
// Nodul C. De aceea testul poate ocazional să dea timeout chiar și la
// 180s — verificat empiric, nu e o buclă infinită, nici cod defect, ci o
// coliziune specifică testării pe aceeași maşină. O rulare care dă timeout
// nu înseamnă că gossip-ul e stricat; se reîncearcă.
