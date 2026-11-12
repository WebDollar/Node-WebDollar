const fallbackNodesList = {

    "protocol": "WebDollar",
    "name": "fallback nodes",

    "nodes": [
        {"addr": ["https://webdollar.cloudns.nz:8081"]}, // nodul propriu de pe explorer
        {"addr": ["http://daniuda.ddns.net:8080"]}, // pool propriu daniuda — doar adresă publică folosită ca seed
    ],

    "nodes_testnet": [
        {"addr": ["http://testnet1.hoste.ro:8000"]}, // Thanks to Hostero
        {"addr": ["http://testnet2.hoste.ro:8001"]}, // Thanks to Hostero
        {"addr": ["http://testnet2.hoste.ro:8002"]}, // Thanks to Hostero
        {"addr": ["http://86.126.138.61:2024"]}, // Thanks to Hostero
    ]
}

/**
 * Logica de prepend/replace, separată într-o funcție pură ca să fie testabilă
 * direct, fără să depindă de ordinea în care modulele singleton se încarcă
 * prima dată (vezi testul dedicat în fallback-nodes-list.test.js).
 *
 * - FALLBACK_NODES (listă separată prin virgulă, ex. http://host1:8081,https://host2:8443):
 *   adăugată ÎN FAȚA listei fixe — comportament neschimbat.
 * - FALLBACK_NODES_ONLY=1 (sau orice valoare truthy): ÎNLOCUIEȘTE lista fixă
 *   în întregime cu FALLBACK_NODES — inclusiv cu o listă GOALĂ, dacă
 *   FALLBACK_NODES nu e setat ("niciun seed" e un rezultat valid, nu o
 *   eroare). Fără cele 2 seed-uri reale în niciun caz. Folosit doar de
 *   testul de integrare local (Task 3), ca nodurile de test să nu
 *   contacteze niciodată rețeaua reală (pool-ul personal, explorerul) —
 *   inclusiv un nod care nu are el însuși niciun FALLBACK_NODES propriu.
 */
export function buildNodes(baseNodes, fallbackNodesEnv, fallbackNodesOnlyEnv){

    const extra = (fallbackNodesEnv || "").split(",").map((a) => a.trim()).filter((a) => a !== "").map((a) => ({addr: [a]}));

    if (fallbackNodesOnlyEnv) return extra;

    if (extra.length === 0) return baseNodes;

    return extra.concat(baseNodes);
}

if (typeof process !== "undefined" && process.env)
    fallbackNodesList.nodes = buildNodes(fallbackNodesList.nodes, process.env.FALLBACK_NODES, process.env.FALLBACK_NODES_ONLY);

export default fallbackNodesList;
