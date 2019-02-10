import {assert } from 'chai';

import BlockRepository from '../../Utils/BlockRepository';

describe('BlockRepositoryTest', () => {
    const Blockchain = {
        blocksStartingPoint: 0,
        blocks             : {
            0: {
                id: 'block_0'
            },
            10: {
                id: 'block_10'
            },
            11: {
                id: 'block_11'
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

    const oBlockRepository = new BlockRepository(Blockchain);

    it ('BlockRepository::findByNumberOrTag should return null if block number is invalid', () => {
        assert.isNull(oBlockRepository.findByNumberOrTag('invalid'));
        assert.isNull(oBlockRepository.findByNumberOrTag('pending'));
        assert.isNull(oBlockRepository.findByNumberOrTag(-1));
        assert.isNull(oBlockRepository.findByNumberOrTag(1000));
    });

    it ('BlockRepository::findByNumberOrTag should return the block at requested height', () => {
        assert.strictEqual(oBlockRepository.findByNumberOrTag(12).id, 'block_12');
    });

    it ('BlockRepository::findByNumberOrTag should return the first block when using "earliest"', () => {
        assert.strictEqual(oBlockRepository.findByNumberOrTag('earliest').id, 'block_0');
    });

    it ('BlockRepository::findByNumberOrTag should return the last block when using "latest"', () => {
        assert.strictEqual(oBlockRepository.findByNumberOrTag('latest').id, 'block_100');
    });

    it ('BlockRepository::findByRange should return null if starting block number is not numeric', () => {
        assert.isArray(oBlockRepository.findByRange('invalid'));
        assert.isEmpty(oBlockRepository.findByRange('invalid'));
    });

    it ('BlockRepository::findByRange should return null if ending block number is not valid', () => {
        assert.isArray(oBlockRepository.findByRange(100, 'invalid'));
        assert.isEmpty(oBlockRepository.findByRange(100, 'invalid'));
    });

    it ('BlockRepository::findByRange should return the blocks in range', () => {
        const aBLocks = oBlockRepository.findByRange(10, 12);
        assert.strictEqual(aBLocks.length, 3);
    });

    it ('BlockRepository::findByNumbers should return null if argument is not an Array', () => {
        assert.isArray(oBlockRepository.findByNumbers('invalid'));
        assert.isEmpty(oBlockRepository.findByNumbers('invalid'));
    });

    it ('BlockRepository::findByNumbers should return the requested blocks', () => {
        const aBLocks = oBlockRepository.findByNumbers([10, 12]);
        assert.strictEqual(aBLocks.length, 2);
    });
});
