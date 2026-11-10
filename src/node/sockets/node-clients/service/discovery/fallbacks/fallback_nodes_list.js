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

// Peeri de pornire adăugați la rulare (listă separată prin virgulă), ex. FALLBACK_NODES=http://host1:8081,https://host2:8443
if (typeof process !== "undefined" && process.env && process.env.FALLBACK_NODES) {
    const extra = process.env.FALLBACK_NODES.split(",").map((a) => a.trim()).filter((a) => a !== "").map((a) => ({addr: [a]}));
    fallbackNodesList.nodes = extra.concat(fallbackNodesList.nodes);
}

export default fallbackNodesList;
