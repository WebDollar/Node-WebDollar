import sinon from 'sinon';
import { expect, assert } from 'chai';

import TransactionRepository from '../../Utils/TransactionRepository';
import BlockRepository from '../../Utils/BlockRepository';

describe('TransactionRepositoryTest', () => {
    const Blockchain = {
        blocksStartingPoint: 0,
        blocks: {
            0: {
                id: 'block_0'
            },
            10: {
                id: 'block_10',
                data: {
                    transactions: {
                        transactions: [
                            {
                                txId: 'firstTx'
                            }
                        ]
                    }
                }
            },
            11: {
                id: 'block_11',
                data: {
                    transactions: {
                        transactions: []
                    }
                }
            },
            12: {
                id: 'block_12'
            },
            100: {
                id: 'block_100'
            },
            last: {
                height: 100
            }
        },

        async getBlock(i) {
            return this.blocks[i];
        },

        async getBlockByHash(sHash) {
            if (sHash === 'hash_10')
            {
                return this.blocks[10];
            }

            if (sHash === 'hash_11')
            {
                return this.blocks[11];
            }

            return null;
        }
    };

    const oPendingQueueTransactionsManager = {
        listArray: [
            {
                txId: 'pendingTx'
            }
        ]
    };

    const oBlockRepository       = new BlockRepository(Blockchain);
    const oTransactionRepository = new TransactionRepository(oBlockRepository, oPendingQueueTransactionsManager, Blockchain);

    it ('TransactionRepository::findByBlockNumberAndIndex should return null if block number is invalid', async () => {
        assert.isNull(await oTransactionRepository.findByBlockNumberAndIndex('invalid'));
        assert.isNull(await oTransactionRepository.findByBlockNumberAndIndex(-1));
        assert.isNull(await oTransactionRepository.findByBlockNumberAndIndex(1000));
    });

    it ('TransactionRepository::findByBlockNumberAndIndex should return the transaction', async () => {
        assert.isNotNull(await oTransactionRepository.findByBlockNumberAndIndex(10, 0));
        assert.equal((await oTransactionRepository.findByBlockNumberAndIndex(10, 0)).txId, 'firstTx');
        assert.isNull(await oTransactionRepository.findByBlockNumberAndIndex(10, 1));
    });

    it ('TransactionRepository::findByBlockNumberAndIndex should return the transaction from Pending Queue', async () => {
        assert.isNotNull(await oTransactionRepository.findByBlockNumberAndIndex('pending', 0));
        assert.equal((await oTransactionRepository.findByBlockNumberAndIndex('pending', 0)).txId, 'pendingTx');
        assert.isNull(await oTransactionRepository.findByBlockNumberAndIndex(10, 1));
    });

    it ('TransactionRepository::findByBlockHashAndIndex should return null', async () => {
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex('', 1));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex(null, 1));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex(null));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex(null, -1));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex({}, -1));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex(10, -1));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex(10, {}));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex(10, false));
        assert.isNull(await oTransactionRepository.findByBlockHashAndIndex(10, null));
    });

    it ('TransactionRepository::findByBlockHashAndIndex should return the transaction', async () => {
        assert.equal((await oTransactionRepository.findByBlockHashAndIndex('hash_10', 0)).txId, 'firstTx');
    });

    it ('TransactionRepository::countByBlockNumber should return 0 on invalid block', async () => {
        assert.equal(await oTransactionRepository.countByBlockNumber(-1), 0);
        assert.equal(await oTransactionRepository.countByBlockNumber(null), 0);
        assert.equal(await oTransactionRepository.countByBlockNumber(false), 0);
    });

    it ('TransactionRepository::countByBlockNumber should return for pending tag', async () => {
        assert.equal(await oTransactionRepository.countByBlockNumber('pending'), 1);
    });

    it ('TransactionRepository::countByBlockNumber should return for existing transactions in block', async () => {
        assert.equal(await oTransactionRepository.countByBlockNumber(10), 1);
        assert.equal(await oTransactionRepository.countByBlockNumber(11), 0);
    });

    it ('TransactionRepository::countByBlockHash should return 0 on invalid block', async () => {
        assert.equal(await oTransactionRepository.countByBlockHash(-1), 0);
        assert.equal(await oTransactionRepository.countByBlockHash(null), 0);
        assert.equal(await oTransactionRepository.countByBlockHash(false), 0);
    });

    it ('TransactionRepository::countByBlockHash should return 0 for pending tag', async () => {
        assert.equal(await oTransactionRepository.countByBlockHash('pending'), 0);
    });

    it ('TransactionRepository::countByBlockHash should return for existing transactions in block', async () => {
        assert.equal(await oTransactionRepository.countByBlockHash('hash_10'), 1);
        assert.equal(await oTransactionRepository.countByBlockHash('hash_11'), 0);
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
