const assert = require('assert');
import Blockchain from 'main-blockchain/Blockchain';
import NodeAPIPublicPools from 'node/sockets/node-server/API/public/Node-API-Public-Pools';

describe('NodeAPIPublicPools.stats - last block / last payout fields', () => {

    let originalPoolManagement;

    beforeEach(() => { originalPoolManagement = Blockchain.PoolManagement; });
    afterEach(() => { Blockchain.PoolManagement = originalPoolManagement; });

    it('returns null fields when pool has not started', () => {
        Blockchain.PoolManagement = undefined;
        let stats = NodeAPIPublicPools.stats({}, {});
        assert.strictEqual(stats.last_block_found_at, null);
        assert.strictEqual(stats.last_payout_at, null);
        assert.strictEqual(stats.last_payout_tx, null);
    });

    it('returns the values from poolStatistics when pool is running', () => {
        Blockchain.PoolManagement = {
            poolStarted: true,
            poolStatistics: {
                poolHashes: 0, poolHashesNow: 0, poolMinersOnline: [],
                poolBlocksConfirmedAndPaid: 0, poolBlocksUnconfirmed: 0,
                poolBlocksConfirmed: 0, poolBlocksBeingConfirmed: 0, poolTimeRemaining: 0,
                lastBlockFoundAt: 1000, lastPayoutAt: 2000, lastPayoutTx: 'txid-xyz',
            },
        };
        let stats = NodeAPIPublicPools.stats({}, {});
        assert.strictEqual(stats.last_block_found_at, 1000);
        assert.strictEqual(stats.last_payout_at, 2000);
        assert.strictEqual(stats.last_payout_tx, 'txid-xyz');
    });

});
