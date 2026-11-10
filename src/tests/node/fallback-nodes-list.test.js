var assert = require('assert');
import { buildNodes } from 'node/sockets/node-clients/service/discovery/fallbacks/fallback_nodes_list';

const BASE_NODES = [
    { addr: ["https://webdollar.cloudns.nz:8081"] },
    { addr: ["http://daniuda.ddns.net:8080"] },
];

// `buildNodes` e testată direct, ca funcție pură — nu prin re-require-ul
// modulului singleton. Verificat la revizuirea finală: modulul e evaluat o
// singură dată per proces, deci testarea prin re-require depinde de ordinea
// în care alte fișiere de test (încărcate în același bundle) îl cer primele,
// cu `process.env.FALLBACK_NODES` setat sau nu la acel moment — fragil.
describe('fallback nodes list — buildNodes (funcție pură)', () => {

    it('returnează lista de bază neschimbată când nu e setat niciun env', () => {
        assert.deepStrictEqual(buildNodes(BASE_NODES, undefined, undefined), BASE_NODES);
    });

    it('adaugă FALLBACK_NODES în fața listei de bază', () => {
        const result = buildNodes(BASE_NODES, "http://example.org:8080", undefined);
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(result[0].addr, ["http://example.org:8080"]);
        assert.deepStrictEqual(result[1], BASE_NODES[0]);
        assert.deepStrictEqual(result[2], BASE_NODES[1]);
    });

    it('suportă mai multe adrese separate prin virgulă', () => {
        const result = buildNodes(BASE_NODES, "http://a:1,http://b:2", undefined);
        assert.deepStrictEqual(result.slice(0, 2), [{ addr: ["http://a:1"] }, { addr: ["http://b:2"] }]);
    });

    it('cu FALLBACK_NODES_ONLY, înlocuiește lista de bază în întregime (izolare de rețeaua reală, Task 3)', () => {
        const result = buildNodes(BASE_NODES, "http://127.0.0.1:30801", "1");
        assert.deepStrictEqual(result, [{ addr: ["http://127.0.0.1:30801"] }]);
    });

    it('FALLBACK_NODES_ONLY fără FALLBACK_NODES dă listă complet goală (niciun seed, inclusiv cele reale)', () => {
        assert.deepStrictEqual(buildNodes(BASE_NODES, undefined, "1"), []);
    });

});

describe('fallback nodes list — modulul exportat implicit', () => {

    it('conține exact cele 2 seed-uri confirmate, fără variabile de mediu setate', () => {
        const fallbackNodesList = require('node/sockets/node-clients/service/discovery/fallbacks/fallback_nodes_list').default;
        assert.strictEqual(fallbackNodesList.nodes.length, 2);
        assert.deepStrictEqual(fallbackNodesList.nodes[0].addr, ["https://webdollar.cloudns.nz:8081"]);
        assert.deepStrictEqual(fallbackNodesList.nodes[1].addr, ["http://daniuda.ddns.net:8080"]);
    });

});
