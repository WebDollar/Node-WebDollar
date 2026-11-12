var assert = require('assert');

import { syncState } from 'node/sockets/node-server/API/Node-API-Public';
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis';

// Ruta publică `/` răspundea `{message:"lastBlock is undefined"}` când blocurile
// nu sunt în memorie (salvarea periodică le golește), ascunzând waitlist-ul,
// serviciile și versiunea — exact ce are nevoie harta rețelei (webd-network-map).
describe('Node-API-Public syncState', () => {

    it('reports unknown (null) sync state when no block is in memory', () => {
        assert.deepStrictEqual(syncState(undefined, 1000000), { is_synchronized: null, secondsBehind: null });
        assert.deepStrictEqual(syncState(null, 1000000), { is_synchronized: null, secondsBehind: null });
    });

    it('is synchronized when the last block is under 600 s old', () => {
        const nowMs = 2000000000000;
        const block = { timeStamp: Math.floor(nowMs / 1000) - 100 - BlockchainGenesis.timeStampOffset };
        const s = syncState(block, nowMs);
        assert.strictEqual(s.is_synchronized, true);
        assert.ok(s.secondsBehind >= 99 && s.secondsBehind <= 101, `secondsBehind=${s.secondsBehind}`);
    });

    it('is not synchronized when the last block is older than 600 s', () => {
        const nowMs = 2000000000000;
        const block = { timeStamp: Math.floor(nowMs / 1000) - 700 - BlockchainGenesis.timeStampOffset };
        assert.strictEqual(syncState(block, nowMs).is_synchronized, false);
    });

});

describe('Node-API-Public top payload', () => {
    const { topPayload } = require('node/sockets/node-server/API/Node-API-Public');

    it('does not throw and reports unknown sync state when no block is in memory', () => {
        assert.deepStrictEqual(topPayload(12, undefined, 1000000), { top: 12, is_synchronized: null, secondsBehind: null });
    });
});
