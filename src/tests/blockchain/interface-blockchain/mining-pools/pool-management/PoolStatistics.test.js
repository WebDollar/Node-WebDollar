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

    it('markBlockFound sets lastBlockFoundAt and lastBlockFoundHeight', () => {
        let stats = new PoolStatistics(fakePoolManagement);
        let before = Date.now();
        stats.markBlockFound(42);
        assert(stats.lastBlockFoundAt >= before);
        assert.strictEqual(stats.lastBlockFoundHeight, 42);
    });

    it('markPayout sets lastPayoutAt and lastPayoutTx from a string txId', () => {
        let stats = new PoolStatistics(fakePoolManagement);
        let before = Date.now();
        stats.markPayout('abc123txid');
        assert(stats.lastPayoutAt >= before);
        assert.strictEqual(stats.lastPayoutTx, 'abc123txid');
    });

    it('markPayout converts a Buffer txId to a hex string', () => {
        let stats = new PoolStatistics(fakePoolManagement);
        stats.markPayout(Buffer.from('abc123', 'hex'));
        assert.strictEqual(stats.lastPayoutTx, 'abc123');
    });

    it('persists and reloads last block / last payout fields across restart', async () => {
        let stats = new PoolStatistics(fakePoolManagement, 'test_pool_statistics_last_fields');
        stats.markBlockFound(99);
        stats.markPayout(Buffer.from('deadbeef', 'hex'));
        await stats._save();

        let reloaded = new PoolStatistics(fakePoolManagement, 'test_pool_statistics_last_fields');
        await reloaded._load();

        assert.strictEqual(reloaded.lastBlockFoundAt, stats.lastBlockFoundAt);
        assert.strictEqual(reloaded.lastBlockFoundHeight, 99);
        assert.strictEqual(reloaded.lastPayoutAt, stats.lastPayoutAt);
        assert.strictEqual(reloaded.lastPayoutTx, 'deadbeef');
    });

});
