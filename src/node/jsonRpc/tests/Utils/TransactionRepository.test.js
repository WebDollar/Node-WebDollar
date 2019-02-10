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
    const oTransactionRepository = new TransactionRepository(oBlockRepository, oPendingQueueTransactionsManager);

    it ('TransactionRepository::findByBlockNumberAndIndex should return null if block number is invalid', () => {
        assert.isNull(oTransactionRepository.findByBlockNumberAndIndex('invalid'));
        assert.isNull(oTransactionRepository.findByBlockNumberAndIndex(-1));
        assert.isNull(oTransactionRepository.findByBlockNumberAndIndex(1000));
    });

    it ('TransactionRepository::findByBlockNumberAndIndex should return the transaction', () => {
        assert.isNotNull(oTransactionRepository.findByBlockNumberAndIndex(10, 0));
        assert.equal(oTransactionRepository.findByBlockNumberAndIndex(10, 0).txId, 'firstTx');
        assert.isNull(oTransactionRepository.findByBlockNumberAndIndex(10, 1));
    });

    it ('TransactionRepository::findByBlockNumberAndIndex should return the transaction from Pending Queue', () => {
        assert.isNotNull(oTransactionRepository.findByBlockNumberAndIndex('pending', 0));
        assert.equal(oTransactionRepository.findByBlockNumberAndIndex('pending', 0).txId, 'pendingTx');
        assert.isNull(oTransactionRepository.findByBlockNumberAndIndex(10, 1));
    });

    it ('TransactionRepository::findByBlockHashAndIndex should return null', () => {
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex('', 1));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex(null, 1));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex(null));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex(null, -1));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex({}, -1));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex(10, -1));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex(10, {}));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex(10, false));
        assert.isNull(oTransactionRepository.findByBlockHashAndIndex(10, null));
    });

    it ('TransactionRepository::findByBlockHashAndIndex should throw exception', () => {
        expect(() => {oTransactionRepository.findByBlockHashAndIndex('hash', 1);}).to.throw('Find By Hash is not supported. Block hash: hash');
    });

    it ('TransactionRepository::countByBlockNumber should return 0 on invalid block', () => {
        assert.equal(oTransactionRepository.countByBlockNumber(-1), 0);
        assert.equal(oTransactionRepository.countByBlockNumber(null), 0);
        assert.equal(oTransactionRepository.countByBlockNumber(false), 0);
    });

    it ('TransactionRepository::countByBlockNumber should return 0 on invalid block', () => {
        assert.equal(oTransactionRepository.countByBlockNumber(-1), 0);
        assert.equal(oTransactionRepository.countByBlockNumber(null), 0);
        assert.equal(oTransactionRepository.countByBlockNumber(false), 0);
    });

    it ('TransactionRepository::countByBlockNumber should return for pending tag', () => {
        assert.equal(oTransactionRepository.countByBlockNumber('pending'), 1);
    });

    it ('TransactionRepository::countByBlockNumber should return for existing transactions in block', () => {
        assert.equal(oTransactionRepository.countByBlockNumber(10), 1);
        assert.equal(oTransactionRepository.countByBlockNumber(11), 0);
    });

    it ('TransactionRepository::countByBlockHash should throw exception', () => {
        expect(() => {oTransactionRepository.countByBlockHash('hash');}).to.throw('Find By Hash is not supported. Block hash: hash');
    });

    // !!!Important Keep this
    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
});
