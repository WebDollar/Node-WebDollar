import { expect, assert } from 'chai';

import BlockRepository from '../../Utils/BlockRepository';

describe('BlockRepositoryTest', () => {
    const Blockchain = {
        blocksStartingPoint: 0,
        blocks: {
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
        },

        async getBlock(i) {
            return this.blocks[i];
        }
    };

    const oBlockRepository = new BlockRepository(Blockchain);

    it ('BlockRepository::findByNumberOrTag should return null if block number is invalid', async () => {
        assert.isNull(await oBlockRepository.findByNumberOrTag('invalid'));
        assert.isNull(await oBlockRepository.findByNumberOrTag('pending'));
        assert.isNull(await oBlockRepository.findByNumberOrTag(-1));
        assert.isNull(await oBlockRepository.findByNumberOrTag(1000));
    });

    it ('BlockRepository::findByNumberOrTag should return the block at requested height', async () => {
        assert.strictEqual((await oBlockRepository.findByNumberOrTag(12)).id, 'block_12');
    });

    it ('BlockRepository::findByNumberOrTag should return the first block when using "earliest"', async () => {
        assert.strictEqual((await oBlockRepository.findByNumberOrTag('earliest')).id, 'block_0');
    });

    it ('BlockRepository::findByNumberOrTag should return the last block when using "latest"', async () => {
        assert.strictEqual((await oBlockRepository.findByNumberOrTag('latest')).id, 'block_100');
    });

    it ('BlockRepository::findByRange should return null if starting block number is not numeric', async () => {
        assert.isArray(await oBlockRepository.findByRange('invalid'));
        assert.isEmpty(await oBlockRepository.findByRange('invalid'));
    });

    it ('BlockRepository::findByRange should return null if ending block number is not valid', async () => {
        assert.isArray(await oBlockRepository.findByRange(100, 'invalid'));
        assert.isEmpty(await oBlockRepository.findByRange(100, 'invalid'));
    });

    it ('BlockRepository::findByRange should return the blocks in range', async () => {
        const aBLocks = await oBlockRepository.findByRange(10, 12);
        assert.strictEqual(aBLocks.length, 3);
    });

    it ('BlockRepository::findByNumbers should return null if argument is not an Array', async () => {
        assert.isArray(await oBlockRepository.findByNumbers('invalid'));
        assert.isEmpty(await oBlockRepository.findByNumbers('invalid'));
    });

    it ('BlockRepository::findByNumbers should return the requested blocks', async () => {
        const aBLocks = await oBlockRepository.findByNumbers([10, 12]);
        assert.strictEqual(aBLocks.length, 2);
    });
});
