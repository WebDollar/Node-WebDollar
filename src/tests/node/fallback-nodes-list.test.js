var assert = require('assert');

// Notă: `fallback_nodes_list.js` e un singleton evaluat o singură dată per proces
// (ca restul listelor din acest modul). Sub bundle-ul webpack folosit de
// mocha-webpack, `require.cache`/`require.resolve` nu corespund registrului
// intern de module al webpack, deci un re-require cu cache golit NU reîncarcă
// efectiv modulul (verificat). De aceea testăm ambele fapte — cele 2 seed-uri
// confirmate ȘI comportamentul de prepend din FALLBACK_NODES — dintr-un singur
// require, cu variabila de mediu setată înainte de el (singura ordine în care
// comportamentul de prepend e observabil într-un singur proces).
process.env.FALLBACK_NODES = "http://example.org:8080";
const fallbackNodesList = require('node/sockets/node-clients/service/discovery/fallbacks/fallback_nodes_list').default;

describe('fallback nodes list', () => {

    it('prepends FALLBACK_NODES from the environment in front of the 2 confirmed seeds', () => {
        assert.strictEqual(fallbackNodesList.nodes.length, 3);
        assert.deepStrictEqual(fallbackNodesList.nodes[0].addr, ["http://example.org:8080"]);
    });

    it('contains exactly the 2 confirmed seeds after the env entry, no more', () => {
        assert.deepStrictEqual(fallbackNodesList.nodes[1].addr, ["https://webdollar.cloudns.nz:8081"]);
        assert.deepStrictEqual(fallbackNodesList.nodes[2].addr, ["http://daniuda.ddns.net:8080"]);
    });

});
