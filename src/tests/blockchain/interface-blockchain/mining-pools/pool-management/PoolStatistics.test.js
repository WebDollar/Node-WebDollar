const assert = require('assert');
import PoolStatistics from 'common/mining-pools/pool/pool-management/pool-statistics/Pool-Statistics';

describe('PoolStatistics - last block / last payout', () => {

    const fakePoolManagement = { poolData: { connectedMinerInstances: { list: [] } } };

    it('starts with null last block / last payout fields', () => {
        let stats = new PoolStatistics(fakePoolManagement);
        assert.strictEqual(stats.lastBlockFoundAt, null);
        assert.strictEqual(stats.lastPayoutAt, null);
        assert.strictEqual(stats.lastPayoutTx, null);
    });

    it('markBlockFound sets lastBlockFoundAt to current time', () => {
        let stats = new PoolStatistics(fakePoolManagement);
        let before = Date.now();
        stats.markBlockFound();
        assert(stats.lastBlockFoundAt >= before);
    });

    it('markPayout sets lastPayoutAt and lastPayoutTx', () => {
        let stats = new PoolStatistics(fakePoolManagement);
        let before = Date.now();
        stats.markPayout('abc123txid');
        assert(stats.lastPayoutAt >= before);
        assert.strictEqual(stats.lastPayoutTx, 'abc123txid');
    });

});
